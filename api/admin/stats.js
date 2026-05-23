const { verifyAdmin } = require('../../lib/admin-auth');
const { getSupabaseClient } = require('../../lib/supabase');
const { applyRateLimit } = require('../../lib/rate-limit');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (applyRateLimit(req, res, { windowMs: 60000, max: 30 })) return;

    const admin = await verifyAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

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
};
