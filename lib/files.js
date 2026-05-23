const crypto = require('crypto');
const { getSupabaseClient } = require('./supabase');

const SECRET = process.env.DOWNLOAD_SECRET || process.env.FLUTTERWAVE_SECRET_KEY || 'bfx-download-fallback-key';

const EXPIRY_HOURS = {
    course: 72,
    ea: 72,
    mentorship: 72,
    vip: 720
};

function generateAccessToken(email, productId, productType, orderId) {
    const payload = {
        email: email || 'customer',
        product: productId,
        type: productType,
        orderId: orderId || null,
        exp: Date.now() + ((EXPIRY_HOURS[productType] || 72) * 60 * 60 * 1000)
    };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    return `${data}.${sig}`;
}

function verifyAccessToken(token) {
    if (!token || !token.includes('.')) return null;
    const [data, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
        if (payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

async function getProductFiles(productId) {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data } = await sb.from('product_files')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)
        .order('sort_order');
    return data || [];
}

async function getSignedDownloadUrl(fileKey, expiresIn = 300) {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data, error } = await sb.storage
        .from('product-files')
        .createSignedUrl(fileKey, expiresIn);
    if (error) {
        console.error(`[Files] Signed URL error for ${fileKey}:`, error.message);
        return null;
    }
    return data.signedUrl;
}

async function recordDownload(orderId, tokenId, email, productId, fileKey, fileName, ip, ua) {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from('downloads').insert({
        order_id: orderId || null,
        token_id: tokenId || null,
        customer_email: email,
        product_id: productId,
        file_key: fileKey,
        file_name: fileName,
        ip_address: ip || null,
        user_agent: ua || null
    });
}

async function getDownloadCount(orderId) {
    const sb = getSupabaseClient();
    if (!sb) return 0;
    const { count } = await sb.from('downloads')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', orderId);
    return count || 0;
}

async function storeAccessToken(orderId, token, email, productId, productType, expiresAt) {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data, error } = await sb.from('access_tokens').insert({
        order_id: orderId,
        token,
        customer_email: email,
        product_id: productId,
        product_type: productType,
        expires_at: new Date(expiresAt).toISOString()
    }).select().single();
    if (error) {
        console.error(`[Files] Token storage error:`, error.message);
        return null;
    }
    return data;
}

module.exports = {
    generateAccessToken,
    verifyAccessToken,
    getProductFiles,
    getSignedDownloadUrl,
    recordDownload,
    getDownloadCount,
    storeAccessToken
};
