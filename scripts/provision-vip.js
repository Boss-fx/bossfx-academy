#!/usr/bin/env node
// ================================================================
// Provision VIP access for a customer
// Usage: node scripts/provision-vip.js <email> [tx-ref]
// Creates: order record, access token, sends VIP welcome email
// ================================================================

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { generateAccessToken, storeAccessToken } = require('../lib/files');
const { getProduct } = require('../lib/products');

const [,, email, txRef] = process.argv;

if (!email) {
    console.log('Usage: node scripts/provision-vip.js <email> [tx-ref]');
    console.log('Example: node scripts/provision-vip.js john@example.com BFX-vip-manual-001');
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function provision() {
    const product = getProduct('vip');
    const ref = txRef || `BFX-vip-manual-${Date.now()}`;

    console.log(`Provisioning VIP access for: ${email}`);
    console.log(`  tx_ref: ${ref}`);

    const { data: existing } = await sb.from('orders')
        .select('id')
        .eq('customer_email', email.toLowerCase())
        .eq('product_id', 'vip')
        .single();

    let orderId;
    if (existing) {
        orderId = existing.id;
        console.log(`  Existing VIP order found: ${orderId}`);
    } else {
        const { data: order, error } = await sb.from('orders').insert({
            tx_ref: ref,
            flw_transaction_id: 'manual',
            product_id: 'vip',
            amount: product.amountNGN,
            currency: 'NGN',
            customer_email: email.toLowerCase(),
            customer_name: email.split('@')[0],
            status: 'successful',
            fulfilled: true,
            fulfilled_at: new Date().toISOString()
        }).select().single();

        if (error) {
            console.error('Order creation failed:', error.message);
            process.exit(1);
        }
        orderId = order.id;
        console.log(`  Created order: ${orderId}`);
    }

    const token = generateAccessToken(email.toLowerCase(), 'vip', 'vip', orderId);
    const expiresAt = Date.now() + 720 * 60 * 60 * 1000; // 30 days

    await storeAccessToken(orderId, token, email.toLowerCase(), 'vip', 'vip', expiresAt);
    console.log(`  Access token generated (expires: ${new Date(expiresAt).toISOString()})`);

    const baseUrl = process.env.VERCEL_URL || 'https://www.bossfxcademy.com';
    const portalUrl = `${baseUrl}/vip/welcome.html?token=${encodeURIComponent(token)}`;
    const downloadUrl = `${baseUrl}/api/download?token=${encodeURIComponent(token)}`;

    console.log('\n--- VIP Access Details ---');
    console.log(`Portal URL: ${portalUrl}`);
    console.log(`Download URL: ${downloadUrl}`);
    console.log(`Token: ${token.substring(0, 20)}...`);
    console.log('\nSend the Portal URL to the customer.');
}

provision().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
