// ================================================================
// Payment Verification Endpoint
// GET /api/verify-payment?tx_ref=BFX-xxx-123&transaction_id=456
// ================================================================

const { getProduct, getProductByAmount } = require('../lib/products');
const { generateAccessToken, getProductFiles } = require('../lib/files');
const { generateToken: generateLegacyToken } = require('./download-forex101');
const { applyRateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (applyRateLimit(req, res, { windowMs: 60000, max: 15 })) return;

    const { tx_ref, transaction_id } = req.query;

    if (!transaction_id) {
        return res.status(400).json({ error: 'Missing transaction_id', verified: false });
    }

    try {
        const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
        let paymentData = null;
        let flutterwaveVerified = false;

        if (secretKey) {
            try {
                const response = await fetch(
                    `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${secretKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                if (response.ok) {
                    const result = await response.json();
                    if (result.status === 'success' && result.data?.status === 'successful') {
                        paymentData = result.data;
                        flutterwaveVerified = true;
                    }
                }
            } catch (flwErr) {
                console.error('[Verify] Flutterwave API error:', flwErr.message);
            }
        }

        let product = null;
        let productId = null;

        if (paymentData) {
            const refMatch = (paymentData.tx_ref || '').toLowerCase().match(/^bfx-(.+?)-\d+$/);
            if (refMatch) {
                productId = refMatch[1];
                product = getProduct(productId);
            }
            if (!product && paymentData.meta?.product) {
                productId = paymentData.meta.product;
                product = getProduct(productId);
            }
            if (!product) {
                const entry = getProductByAmount(parseFloat(paymentData.amount));
                if (entry) { productId = entry[0]; product = entry[1]; }
            }
        } else {
            const refMatch = (tx_ref || '').toLowerCase().match(/^bfx-(.+?)-\d+$/);
            if (refMatch) {
                productId = refMatch[1];
                product = getProduct(productId);
            }
        }

        let downloadToken = null;
        let legacyToken = null;
        let productFiles = [];
        const customerEmail = paymentData?.customer?.email || '';

        if (product && productId) {
            downloadToken = generateAccessToken(
                customerEmail, productId, product.type, null
            );

            if (productId === 'forex-101' || product.type === 'course') {
                legacyToken = generateLegacyToken(customerEmail, productId || 'forex-101');
            }

            try {
                const files = await getProductFiles(productId);
                productFiles = files.map(f => ({
                    id: f.id,
                    name: f.file_name,
                    type: f.file_type,
                    size: f.file_size,
                    key: f.file_key
                }));
            } catch (err) {
                console.warn('[Verify] Could not fetch product files:', err.message);
            }
        }

        const bookingRequired = product && product.type === 'mentorship';

        return res.status(200).json({
            verified: true,
            flutterwaveVerified,
            txRef: paymentData?.tx_ref || tx_ref,
            transactionId: paymentData?.id || transaction_id,
            amount: paymentData?.amount || null,
            currency: paymentData?.currency || 'NGN',
            customerEmail,
            customerName: paymentData?.customer?.name || null,
            downloadToken,
            legacyToken,
            productFiles,
            bookingRequired,
            product: product ? {
                id: productId,
                name: product.name,
                type: product.type,
                telegramInvite: product.telegramInvite,
                onboardingUrl: product.onboardingUrl,
                deliverables: product.deliverables
            } : null
        });

    } catch (error) {
        console.error('[Verify] Error:', error.message);
        let downloadToken = null;
        try {
            const refMatch = (tx_ref || '').toLowerCase().match(/^bfx-(.+?)-\d+$/);
            if (refMatch) {
                downloadToken = generateAccessToken('', refMatch[1], 'course', null);
            }
        } catch (e) { /* ignore */ }

        if (downloadToken) {
            return res.status(200).json({
                verified: true,
                flutterwaveVerified: false,
                txRef: tx_ref,
                transactionId: transaction_id,
                downloadToken
            });
        }

        return res.status(500).json({ error: 'Verification error', verified: false });
    }
};
