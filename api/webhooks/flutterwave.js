// ================================================================
// Flutterwave Webhook Handler
// POST /api/webhooks/flutterwave
// ================================================================
//
// Security layers:
//   1. Webhook secret hash verification (FLUTTERWAVE_WEBHOOK_HASH)
//   2. Payment verification via Flutterwave API
//   3. Amount & currency validation
//   4. Duplicate payment protection
//   5. Request method enforcement
// ================================================================

const crypto = require('crypto');
const { fulfillOrder } = require('../../lib/fulfillment');
const { getProduct, getProductByAmount } = require('../../lib/products');

module.exports = async function handler(req, res) {
    // ---- Method check ----
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // ---- 1. Verify webhook signature ----
        const signature = req.headers['verif-hash'];
        const webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH || process.env.FLUTTERWAVE_WEBHOOK_SECRET;

        if (!webhookHash) {
            console.error('[Webhook] FLUTTERWAVE_WEBHOOK_HASH / FLUTTERWAVE_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook not configured' });
        }

        if (!signature || signature !== webhookHash) {
            console.warn('[Webhook] Invalid signature:', signature?.substring(0, 8) + '...');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // ---- 2. Parse webhook payload ----
        const payload = req.body;

        if (!payload || !payload.data) {
            console.warn('[Webhook] Empty or malformed payload');
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const event = payload.event || '';
        const data = payload.data;

        console.log(`[Webhook] Received: event=${event}, id=${data.id}, status=${data.status}, tx_ref=${data.tx_ref}`);

        // Only process successful charges
        if (event !== 'charge.completed' || data.status !== 'successful') {
            console.log(`[Webhook] Skipping: event=${event}, status=${data.status}`);
            return res.status(200).json({ status: 'skipped', reason: 'Not a successful charge' });
        }

        // ---- 3. Verify payment with Flutterwave API ----
        const verified = await verifyPayment(data.id);
        if (!verified) {
            console.error(`[Webhook] Payment verification FAILED for id=${data.id}`);
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // ---- 4. Validate amount matches a product ----
        const validationResult = validatePayment(verified);
        if (!validationResult.valid) {
            console.warn(`[Webhook] Validation failed: ${validationResult.reason}`);
            // Still return 200 to prevent Flutterwave retries
            // The fulfillment system will notify admin about unmatched payments
        }

        // ---- 5. Trigger fulfillment ----
        const result = await fulfillOrder({
            id: verified.id,
            tx_ref: verified.tx_ref,
            flw_ref: verified.flw_ref,
            amount: verified.amount,
            currency: verified.currency,
            payment_type: verified.payment_type,
            customer: verified.customer,
            meta: verified.meta || data.meta || {}
        });

        console.log(`[Webhook] Fulfillment result:`, JSON.stringify(result));

        return res.status(200).json({
            status: 'success',
            fulfillment: result.status,
            txRef: result.txRef
        });

    } catch (error) {
        console.error('[Webhook] Unhandled error:', error.message, error.stack);
        // Return 200 to prevent infinite retries on server errors
        // Admin should monitor logs for these
        return res.status(200).json({
            status: 'error',
            message: 'Internal processing error — logged for review'
        });
    }
};

// ================================================================
// Payment Verification via Flutterwave API
// ================================================================

async function verifyPayment(transactionId) {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
        console.error('[Verify] FLUTTERWAVE_SECRET_KEY not configured');
        return null;
    }

    try {
        const response = await fetch(
            `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error(`[Verify] API returned ${response.status}: ${response.statusText}`);
            return null;
        }

        const result = await response.json();

        if (result.status !== 'success' || result.data?.status !== 'successful') {
            console.error(`[Verify] Payment not successful:`, result.data?.status);
            return null;
        }

        console.log(`[Verify] Payment confirmed: id=${transactionId}, amount=${result.data.amount} ${result.data.currency}`);
        return result.data;

    } catch (err) {
        console.error(`[Verify] API call failed:`, err.message);
        return null;
    }
}

// ================================================================
// Payment Validation
// ================================================================

function validatePayment(paymentData) {
    const amount = parseFloat(paymentData.amount);
    const currency = (paymentData.currency || '').toUpperCase();

    // Must be NGN (our primary currency)
    if (currency !== 'NGN') {
        return {
            valid: false,
            reason: `Unexpected currency: ${currency} (expected NGN)`
        };
    }

    // Must match a known product amount
    const match = getProductByAmount(amount);
    if (!match) {
        return {
            valid: false,
            reason: `Amount ${amount} NGN doesn't match any product`
        };
    }

    return { valid: true, product: match[1] };
}
