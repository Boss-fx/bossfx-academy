const { verifyAdmin } = require('../../lib/admin-auth');
const { getSupabaseClient } = require('../../lib/supabase');
const { getProduct } = require('../../lib/products');
const { fulfillOrder } = require('../../lib/fulfillment');
const { applyRateLimit } = require('../../lib/rate-limit');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (applyRateLimit(req, res, { windowMs: 60000, max: 5 })) return;

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

        const paymentData = {
            id: order.flw_transaction_id,
            tx_ref: order.tx_ref,
            amount: order.amount,
            currency: order.currency,
            customer: {
                email: order.customer_email,
                name: order.customer_name,
                phone_number: order.customer_phone
            }
        };

        await fulfillOrder(paymentData);

        return res.status(200).json({ success: true, message: 'Email resent successfully' });
    } catch (err) {
        console.error('[Admin Resend] Error:', err.message);
        return res.status(500).json({ error: 'Failed to resend email' });
    }
};
