#!/usr/bin/env node
// ================================================================
// List recent orders from database
// Usage: node scripts/list-orders.js [--limit=N] [--product=ID] [--unfulfilled]
// ================================================================

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const limit = parseInt((args.find(a => a.startsWith('--limit=')) || '--limit=20').split('=')[1]);
const productFilter = (args.find(a => a.startsWith('--product=')) || '').split('=')[1];
const unfulfilledOnly = args.includes('--unfulfilled');

async function listOrders() {
    let query = sb.from('orders')
        .select('id, tx_ref, product_id, amount, currency, customer_email, customer_name, status, fulfilled, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (productFilter) query = query.eq('product_id', productFilter);
    if (unfulfilledOnly) query = query.eq('fulfilled', false);

    const { data, error } = await query;
    if (error) {
        console.error('Query failed:', error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log('No orders found.');
        return;
    }

    console.log(`\n${data.length} order(s):\n`);
    console.log('ID'.padEnd(38) + 'Product'.padEnd(18) + 'Amount'.padEnd(12) + 'Email'.padEnd(30) + 'Status'.padEnd(12) + 'Fulfilled');
    console.log('-'.repeat(120));

    data.forEach(o => {
        console.log(
            (o.id || '').substring(0, 36).padEnd(38) +
            (o.product_id || '').padEnd(18) +
            `${o.amount} ${o.currency}`.padEnd(12) +
            (o.customer_email || '').padEnd(30) +
            (o.status || '').padEnd(12) +
            (o.fulfilled ? 'YES' : 'NO')
        );
    });

    const total = data.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    console.log(`\nTotal revenue: ${total.toLocaleString()} NGN`);
}

listOrders().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
