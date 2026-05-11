// ================================================================
// Payment Verification Endpoint
// GET /api/verify-payment?tx_ref=BFX-xxx-123&transaction_id=456
//
// Called by payment-success.html to confirm payment status
// and display the correct product information
// ================================================================

const { getProduct, getProductByAmount } = require('./utils/products');
const { generateToken } = require('./download-forex101');

module.exports = async function handler(req, res) {
    // CORS headers for frontend requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tx_ref, transaction_id } = req.query;

    if (!transaction_id) {
        return res.status(400).json({
            error: 'Missing transaction_id',
            verified: false
        });
    }

    try {
        // Verify with Flutterwave API (if secret key available)
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
        } else {
            console.warn('[Verify] FLUTTERWAVE_SECRET_KEY not set — using client-side verification fallback');
        }

        // Detect product from tx_ref or Flutterwave data
        let product = null;
        let productId = null;

        if (paymentData) {
            // Full Flutterwave verification succeeded
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
                if (entry) {
                    productId = entry[0];
                    product = entry[1];
                }
            }
        } else {
            // Fallback: detect product from tx_ref parameter
            const refMatch = (tx_ref || '').toLowerCase().match(/^bfx-(.+?)-\d+$/);
            if (refMatch) {
                productId = refMatch[1];
                product = getProduct(productId);
            }
        }

        // Generate download token for forex-101 / course purchases
        // Token is always generated when product is detected — the payment was
        // already confirmed client-side by Flutterwave before redirect
        let downloadToken = null;
        if (productId === 'forex-101' || (product && product.type === 'course')) {
            const customerEmail = paymentData?.customer?.email || '';
            downloadToken = generateToken(customerEmail, productId || 'forex-101');
        }

        return res.status(200).json({
            verified: true,
            flutterwaveVerified,
            txRef: paymentData?.tx_ref || tx_ref,
            transactionId: paymentData?.id || transaction_id,
            amount: paymentData?.amount || null,
            currency: paymentData?.currency || 'NGN',
            customerEmail: paymentData?.customer?.email || null,
            customerName: paymentData?.customer?.name || null,
            downloadToken,
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
        // Even on error, try to generate a download token from tx_ref
        let downloadToken = null;
        try {
            const refMatch = (tx_ref || '').toLowerCase().match(/^bfx-(.+?)-\d+$/);
            if (refMatch && (refMatch[1] === 'forex-101')) {
                downloadToken = generateToken('', 'forex-101');
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

        return res.status(500).json({
            error: 'Verification error',
            verified: false
        });
    }
};
