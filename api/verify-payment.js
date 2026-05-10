// ================================================================
// Payment Verification Endpoint
// GET /api/verify-payment?tx_ref=BFX-xxx-123&transaction_id=456
//
// Called by payment-success.html to confirm payment status
// and display the correct product information
// ================================================================

const { getProduct, getProductByAmount } = require('./utils/products');

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
        // Verify with Flutterwave
        const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!secretKey) {
            return res.status(500).json({
                error: 'Server configuration error',
                verified: false
            });
        }

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

        if (!response.ok) {
            return res.status(400).json({
                error: 'Verification failed',
                verified: false
            });
        }

        const result = await response.json();
        const paymentData = result.data;

        if (result.status !== 'success' || paymentData?.status !== 'successful') {
            return res.status(400).json({
                error: 'Payment not successful',
                verified: false,
                paymentStatus: paymentData?.status
            });
        }

        // Detect product
        let product = null;
        let productId = null;

        // Try tx_ref first
        const refMatch = (paymentData.tx_ref || '').toLowerCase().match(/^bfx-(.+?)-\d+$/);
        if (refMatch) {
            productId = refMatch[1];
            product = getProduct(productId);
        }

        // Try meta
        if (!product && paymentData.meta?.product) {
            productId = paymentData.meta.product;
            product = getProduct(productId);
        }

        // Try amount
        if (!product) {
            const entry = getProductByAmount(parseFloat(paymentData.amount));
            if (entry) {
                productId = entry[0];
                product = entry[1];
            }
        }

        return res.status(200).json({
            verified: true,
            txRef: paymentData.tx_ref,
            transactionId: paymentData.id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            customerEmail: paymentData.customer?.email,
            customerName: paymentData.customer?.name,
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
        return res.status(500).json({
            error: 'Verification error',
            verified: false
        });
    }
};
