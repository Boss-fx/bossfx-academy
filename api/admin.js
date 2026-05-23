// ================================================================
// Admin API Router — /api/admin?action=stats|resend|token
// Consolidates admin endpoints into single function (Vercel Hobby limit)
// ================================================================

const { verifyAdmin } = require('../lib/admin-auth');
const { getSupabaseClient } = require('../lib/supabase');
const { getProduct } = require('../lib/products');
const { fulfillOrder } = require('../lib/fulfillment');
const { generateAccessToken, storeAccessToken } = require('../lib/files');
const { applyRateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (applyRateLimit(req, res, { windowMs: 60000, max: 30 })) return;

    const admin = await verifyAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const action = req.query.action || (req.method === 'GET' ? 'stats' : '');

    switch (action) {
        case 'stats': return handleStats(req, res);
        case 'resend': return handleResend(req, res);
        case 'token': return handleToken(req, res);
        default: return res.status(400).json({ error: 'Unknown action. Use: stats, resend, token' });
    }
};

async function handleStats(req, res) {
    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        const [ordersRes, downloadsRes, bookingsRes, recentRes] = await Promise.all([
            sb.from('orders').select('product_id, amount, currency, status, fulfilled, created_at'),
            sb.from('downloads').select('id', { count: 'exact', head: true }),
            sb.from('mentorship_bookings').select('id, status', { count: 'exact' }),
            sb.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
        ]);

        const orders = ordersRes.data || [];
        const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
        const productBreakdown = {};
        orders.forEach(function(o) {
            var pid = o.product_id || 'unknown';
            if (!productBreakdown[pid]) productBreakdown[pid] = { count: 0, revenue: 0 };
            productBreakdown[pid].count++;
            productBreakdown[pid].revenue += parseFloat(o.amount) || 0;
        });

        return res.status(200).json({
            totalOrders: orders.length,
            totalRevenue,
            totalDownloads: downloadsRes.count || 0,
            totalBookings: bookingsRes.count || 0,
            productBreakdown,
            recentOrders: (recentRes.data || []).map(o => ({
                id: o.id,
                txRef: o.tx_ref,
                productId: o.product_id,
                amount: o.amount,
                currency: o.currency,
                customerEmail: o.customer_email,
                customerName: o.customer_name,
                status: o.status,
                fulfilled: o.fulfilled,
                createdAt: o.created_at
            }))
        });
    } catch (err) {
        console.error('[Admin Stats] Error:', err.message);
        return res.status(500).json({ error: 'Failed to load stats' });
    }
}

async function handleResend(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        const { data: order, error } = await sb.from('orders')
            .select('*').eq('id', orderId).single();
        if (error || !order) return res.status(404).json({ error: 'Order not found' });

        const product = getProduct(order.product_id);
        if (!product) return res.status(400).json({ error: 'Unknown product' });

        await fulfillOrder({
            id: order.flw_transaction_id,
            tx_ref: order.tx_ref,
            amount: order.amount,
            currency: order.currency,
            customer: {
                email: order.customer_email,
                name: order.customer_name,
                phone_number: order.customer_phone
            }
        });

        return res.status(200).json({ success: true, message: 'Email resent successfully' });
    } catch (err) {
        console.error('[Admin Resend] Error:', err.message);
        return res.status(500).json({ error: 'Failed to resend email' });
    }
}

async function handleToken(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        const { data: order, error } = await sb.from('orders')
            .select('*').eq('id', orderId).single();
        if (error || !order) return res.status(404).json({ error: 'Order not found' });

        const product = getProduct(order.product_id);
        if (!product) return res.status(400).json({ error: 'Unknown product' });

        const token = generateAccessToken(order.customer_email, order.product_id, product.type, order.id);
        const expiryMs = { course: 72, ea: 72, mentorship: 72, vip: 720 };
        const expiresAt = Date.now() + ((expiryMs[product.type] || 72) * 60 * 60 * 1000);

        await storeAccessToken(order.id, token, order.customer_email, order.product_id, product.type, expiresAt);

        return res.status(200).json({
            success: true,
            token,
            downloadUrl: '/api/download?token=' + encodeURIComponent(token),
            expiresAt: new Date(expiresAt).toISOString()
        });
    } catch (err) {
        console.error('[Admin Token] Error:', err.message);
        return res.status(500).json({ error: 'Failed to generate token' });
    }
}
