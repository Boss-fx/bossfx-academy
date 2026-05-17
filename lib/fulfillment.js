// ================================================================
// Fulfillment Orchestrator
// Webhook → Product Detection → Email → Delivery → Admin Alert
// ================================================================

const { getProduct, getProductByAmount } = require('./products');
const { sendFulfillmentEmail, sendAdminNotification, addToContactList } = require('./email');

// In-memory duplicate guard (per cold-start instance)
// For production at scale, use Redis/KV store
const processedPayments = new Set();

/**
 * Main fulfillment pipeline
 * Called after a successful payment is verified
 */
async function fulfillOrder(paymentData) {
    const txRef = paymentData.tx_ref || paymentData.txRef || '';
    const flwId = paymentData.id || paymentData.flw_ref || '';

    // ---- 1. Duplicate check ----
    const dedupeKey = `${flwId}-${txRef}`;
    if (processedPayments.has(dedupeKey)) {
        console.log(`[Fulfillment] Duplicate skipped: ${dedupeKey}`);
        return { status: 'duplicate', txRef };
    }
    processedPayments.add(dedupeKey);

    // Keep set from growing unbounded (max 10k entries)
    if (processedPayments.size > 10000) {
        const first = processedPayments.values().next().value;
        processedPayments.delete(first);
    }

    // ---- 2. Detect product ----
    const product = detectProduct(paymentData);
    if (!product) {
        console.error(`[Fulfillment] Unknown product for tx_ref=${txRef}, amount=${paymentData.amount}`);
        // Still notify admin about unmatched payment
        await notifyAdminUnmatched(paymentData);
        return { status: 'unmatched', txRef };
    }

    // ---- 3. Extract customer info ----
    const customer = extractCustomer(paymentData);
    console.log(`[Fulfillment] Processing: ${product.name} for ${customer.email} (${txRef})`);

    // ---- 4. Parallel execution: email + contact list + admin ----
    const results = await Promise.allSettled([
        sendFulfillmentEmail(customer, product, txRef),
        addToContactList(customer, product),
        sendAdminNotification(customer, product, txRef, paymentData)
    ]);

    // Log results
    const [emailResult, contactResult, adminResult] = results;
    const summary = {
        status: 'fulfilled',
        txRef,
        product: product.name,
        customer: customer.email,
        email: emailResult.status,
        contact: contactResult.status,
        admin: adminResult.status
    };

    if (emailResult.status === 'rejected') {
        console.error(`[Fulfillment] Customer email FAILED:`, emailResult.reason?.message);
        summary.emailError = emailResult.reason?.message;
    }
    if (adminResult.status === 'rejected') {
        console.error(`[Fulfillment] Admin notification FAILED:`, adminResult.reason?.message);
    }

    console.log(`[Fulfillment] Complete:`, JSON.stringify(summary));
    return summary;
}

/**
 * Detect which product was purchased
 * Strategy: 1) Parse tx_ref prefix, 2) Match by amount
 */
function detectProduct(paymentData) {
    const txRef = (paymentData.tx_ref || paymentData.txRef || '').toLowerCase();

    // Strategy 1: tx_ref format is "BFX-{productId}-{timestamp}"
    const refMatch = txRef.match(/^bfx-(.+?)-\d+$/);
    if (refMatch) {
        const productId = refMatch[1];
        const product = getProduct(productId);
        if (product) {
            console.log(`[Fulfillment] Product matched by tx_ref: ${productId}`);
            return product;
        }
    }

    // Strategy 2: Match by meta.product field (sent from frontend)
    const metaProduct = paymentData.meta?.product;
    if (metaProduct) {
        const product = getProduct(metaProduct);
        if (product) {
            console.log(`[Fulfillment] Product matched by meta: ${metaProduct}`);
            return product;
        }
    }

    // Strategy 3: Match by amount
    const amount = parseFloat(paymentData.amount);
    if (amount) {
        const entry = getProductByAmount(amount);
        if (entry) {
            console.log(`[Fulfillment] Product matched by amount: ${amount} → ${entry[0]}`);
            return entry[1];
        }
    }

    return null;
}

/**
 * Extract customer info from payment data
 */
function extractCustomer(paymentData) {
    const customer = paymentData.customer || {};
    return {
        name: customer.name || customer.full_name || paymentData.customer_name || 'Valued Customer',
        email: customer.email || paymentData.customer_email || '',
        phone: customer.phone_number || customer.phone || paymentData.customer_phone || ''
    };
}

/**
 * Notify admin about an unmatched payment (no product detected)
 */
async function notifyAdminUnmatched(paymentData) {
    try {
        const customer = extractCustomer(paymentData);
        const fakeProduct = {
            name: `UNMATCHED PAYMENT (${paymentData.amount} ${paymentData.currency || 'NGN'})`,
            type: 'unknown',
            amountNGN: paymentData.amount
        };
        await sendAdminNotification(customer, fakeProduct, paymentData.tx_ref || 'N/A', paymentData);
    } catch (err) {
        console.error(`[Fulfillment] Admin unmatched notification failed:`, err.message);
    }
}

module.exports = { fulfillOrder, detectProduct, extractCustomer };
