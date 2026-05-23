const { verifyAdmin } = require('../../lib/admin-auth');
const { getSupabaseClient } = require('../../lib/supabase');
const { generateAccessToken, storeAccessToken } = require('../../lib/files');
const { getProduct } = require('../../lib/products');
const { applyRateLimit } = require('../../lib/rate-limit');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (applyRateLimit(req, res, { windowMs: 60000, max: 10 })) return;

    const admin = await verifyAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        const { data: order, error } = await sb.from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error || !order) return res.status(404).json({ error: 'Order not found' });

        const product = getProduct(order.product_id);
        if (!product) return res.status(400).json({ error: 'Unknown product' });

        const token = generateAccessToken(
            order.customer_email,
            order.product_id,
            product.type,
            order.id
        );

        const expiryMs = { course: 72, ea: 72, mentorship: 72, vip: 720 };
        const expiresAt = Date.now() + ((expiryMs[product.type] || 72) * 60 * 60 * 1000);

        await storeAccessToken(order.id, token, order.customer_email, order.product_id, product.type, expiresAt);

        const downloadUrl = '/api/download?token=' + encodeURIComponent(token);

        return res.status(200).json({
            success: true,
            token,
            downloadUrl,
            expiresAt: new Date(expiresAt).toISOString()
        });
    } catch (err) {
        console.error('[Admin Token] Error:', err.message);
        return res.status(500).json({ error: 'Failed to generate token' });
    }
};
