#!/usr/bin/env node
// ================================================================
// Upload a product file to Supabase Storage + register in product_files
// Usage: node scripts/upload-product-file.js <product-id> <local-file-path> [display-name]
// Example: node scripts/upload-product-file.js forex-101 ./downloads/Forex_101.pdf "Forex 101 Starter Pack"
// ================================================================

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const [,, productId, filePath, displayName] = process.argv;

if (!productId || !filePath) {
    console.log('Usage: node scripts/upload-product-file.js <product-id> <file-path> [display-name]');
    console.log('Products: forex-101, ea-bundle, mentorship-group, mentorship-1on1, vip');
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function upload() {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = displayName || path.basename(filePath, path.extname(filePath)).replace(/[_-]/g, ' ');
    const ext = path.extname(filePath).replace('.', '').toLowerCase();
    const storageKey = `${productId}/${path.basename(filePath)}`;

    console.log(`Uploading ${filePath} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);
    console.log(`  Storage key: ${storageKey}`);
    console.log(`  Display name: ${fileName}`);

    const { data, error } = await sb.storage
        .from('product-files')
        .upload(storageKey, fileBuffer, {
            contentType: getMimeType(ext),
            upsert: true
        });

    if (error) {
        console.error('Upload failed:', error.message);
        process.exit(1);
    }

    console.log('Uploaded to storage:', data.path);

    const { data: existing } = await sb.from('product_files')
        .select('id')
        .eq('product_id', productId)
        .eq('file_key', storageKey)
        .single();

    if (existing) {
        await sb.from('product_files')
            .update({ file_name: fileName, file_type: ext, file_size: fileBuffer.length, active: true })
            .eq('id', existing.id);
        console.log('Updated existing product_files record:', existing.id);
    } else {
        const { data: maxOrder } = await sb.from('product_files')
            .select('sort_order')
            .eq('product_id', productId)
            .order('sort_order', { ascending: false })
            .limit(1)
            .single();

        const { data: record, error: insErr } = await sb.from('product_files').insert({
            product_id: productId,
            file_key: storageKey,
            file_name: fileName,
            file_type: ext,
            file_size: fileBuffer.length,
            sort_order: (maxOrder?.sort_order || 0) + 1,
            active: true
        }).select().single();

        if (insErr) {
            console.error('DB insert failed:', insErr.message);
            process.exit(1);
        }
        console.log('Created product_files record:', record.id);
    }

    const { data: urlData } = await sb.storage
        .from('product-files')
        .createSignedUrl(storageKey, 60);

    console.log('\nDone! Test download URL (1 min):');
    console.log(urlData?.signedUrl || '(could not generate)');
}

function getMimeType(ext) {
    const types = { pdf: 'application/pdf', zip: 'application/zip', ex5: 'application/octet-stream', mq5: 'text/plain' };
    return types[ext] || 'application/octet-stream';
}

upload().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
