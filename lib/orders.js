const { getSupabaseClient } = require('./supabase');

async function createOrder(paymentData, product, customer) {
    const sb = getSupabaseClient();
    if (!sb) return null;

    const txRef = paymentData.tx_ref || paymentData.txRef || '';
    const flwId = paymentData.id ? String(paymentData.id) : null;

    // Detect EA addon from Flutterwave meta
    const rawMeta = paymentData.meta || {};
    const hasEaAddon = rawMeta.ea_bundle === 'yes' || rawMeta.has_ea_addon === true;
    const meta = {
        ...rawMeta,
        has_ea_addon: hasEaAddon,
        ea_addon_price: hasEaAddon ? 15000 : 0
    };

    const row = {
        flw_transaction_id: flwId,
        flw_ref: paymentData.flw_ref || null,
        tx_ref: txRef,
        product_id: product.id || detectProductId(txRef),
        product_name: product.name,
        product_type: product.type,
        amount: parseFloat(paymentData.amount) || 0,
        currency: paymentData.currency || 'NGN',
        status: 'completed',
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone || null,
        payment_method: paymentData.payment_type || null,
        meta,
        fulfilled: false
    };

    const { data, error } = await sb.from('orders').insert(row).select().single();
    if (error) {
        if (error.code === '23505') {
            console.log(`[Orders] Duplicate order for flw_id=${flwId}`);
            return null;
        }
        throw error;
    }
    console.log(`[Orders] Created order ${data.id} for ${customer.email}`);
    return data;
}

async function getOrderByFlwId(flwTransactionId) {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from('orders')
        .select('*')
        .eq('flw_transaction_id', String(flwTransactionId))
        .single();
    return data || null;
}

async function getOrderByTxRef(txRef) {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from('orders')
        .select('*')
        .eq('tx_ref', txRef)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    return data || null;
}

async function getOrdersByEmail(email, limit = 50) {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data } = await sb.from('orders')
        .select('*')
        .eq('customer_email', email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(limit);
    return data || [];
}

async function markFulfilled(orderId, emailSent, emailError) {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from('orders').update({
        fulfilled: true,
        fulfilled_at: new Date().toISOString(),
        email_sent: emailSent,
        email_error: emailError || null
    }).eq('id', orderId);
}

async function updateOrderStatus(orderId, status) {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from('orders').update({ status }).eq('id', orderId);
}

function detectProductId(txRef) {
    const match = (txRef || '').toLowerCase().match(/^bfx-(.+?)-\d+$/);
    return match ? match[1] : 'unknown';
}

module.exports = {
    createOrder,
    getOrderByFlwId,
    getOrderByTxRef,
    getOrdersByEmail,
    markFulfilled,
    updateOrderStatus
};
