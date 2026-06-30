// ================================================================
// Fulfillment Orchestrator
// Webhook → Product Detection → DB Persist → Email → Delivery → Admin Alert
// ================================================================

const { getProduct, getProductByAmount } = require('./products');
const { sendFulfillmentEmail, sendAdminNotification, addToContactList } = require('./email');
const { createOrder, getOrderByFlwId, markFulfilled } = require('./orders');
const { generateAccessToken, storeAccessToken } = require('./files');

async function fulfillOrder(paymentData) {
    const txRef = paymentData.tx_ref || paymentData.txRef || '';
    const flwId = paymentData.id || paymentData.flw_ref || '';

    // ---- 1. Database-backed duplicate check ----
    let existingOrder = null;
    try {
        if (flwId) {
            existingOrder = await getOrderByFlwId(String(flwId));
        }
    } catch (err) {
        console.warn(`[Fulfillment] DB duplicate check failed, proceeding:`, err.message);
    }

    if (existingOrder && existingOrder.fulfilled) {
        console.log(`[Fulfillment] Duplicate skipped (DB): flw_id=${flwId}`);
        return { status: 'duplicate', txRef, orderId: existingOrder.id };
    }

    // ---- 2. Detect product ----
    const product = detectProduct(paymentData);
    if (!product) {
        console.error(`[Fulfillment] Unknown product for tx_ref=${txRef}, amount=${paymentData.amount}`);
        await notifyAdminUnmatched(paymentData);
        return { status: 'unmatched', txRef };
    }

    // ---- 3. Extract customer info ----
    const customer = extractCustomer(paymentData);
    console.log(`[Fulfillment] Processing: ${product.name} for ${customer.email} (${txRef})`);

    // ---- 4. Persist order to database ----
    let order = existingOrder;
    if (!order) {
        try {
            order = await createOrder(paymentData, product, customer);
            if (!order) {
                console.log(`[Fulfillment] Duplicate caught by DB constraint: flw_id=${flwId}`);
                return { status: 'duplicate', txRef };
            }
        } catch (err) {
            console.error(`[Fulfillment] DB write failed, continuing with email:`, err.message);
        }
    }

    // ---- 5. Detect EA addon ----
    const meta = paymentData.meta || {};
    const hasEaAddon = meta.ea_bundle === 'yes' || meta.has_ea_addon === true;
    if (hasEaAddon) {
        console.log(`[Fulfillment] EA addon detected for ${product.id}`);
    }

    // ---- 6. Generate download token ----
    let downloadToken = null;
    if (product.type !== 'mentorship') {
        try {
            downloadToken = generateAccessToken(
                customer.email, product.id, product.type, order ? order.id : null
            );
            if (order) {
                const expiryHours = product.type === 'vip' ? 720 : 72;
                await storeAccessToken(
                    order.id, downloadToken, customer.email,
                    product.id, product.type,
                    Date.now() + expiryHours * 60 * 60 * 1000
                ).catch(err => console.warn('[Fulfillment] Token storage failed:', err.message));
            }
        } catch (err) {
            console.warn('[Fulfillment] Token generation failed:', err.message);
        }
    }

    // ---- 6b. Generate separate EA addon token ----
    let eaDownloadToken = null;
    if (hasEaAddon && product.id !== 'ea-bundle') {
        try {
            eaDownloadToken = generateAccessToken(
                customer.email, 'ea-bundle', 'ea', order ? order.id : null
            );
            if (order) {
                await storeAccessToken(
                    order.id, eaDownloadToken, customer.email,
                    'ea-bundle', 'ea',
                    Date.now() + 72 * 60 * 60 * 1000
                ).catch(err => console.warn('[Fulfillment] EA token storage failed:', err.message));
            }
            console.log(`[Fulfillment] EA addon token generated for ${customer.email}`);
        } catch (err) {
            console.warn('[Fulfillment] EA token generation failed:', err.message);
        }
    }

    // ---- 7. Parallel execution: email + contact list + admin ----
    const results = await Promise.allSettled([
        sendFulfillmentEmail(customer, product, txRef, downloadToken, { hasEaAddon, eaDownloadToken }),
        addToContactList(customer, product),
        sendAdminNotification(customer, product, txRef, paymentData)
    ]);

    const [emailResult, contactResult, adminResult] = results;
    const emailSent = emailResult.status === 'fulfilled';
    const emailError = emailResult.status === 'rejected' ? emailResult.reason?.message : null;

    // ---- 8. Mark order as fulfilled in database ----
    if (order) {
        try {
            await markFulfilled(order.id, emailSent, emailError);
        } catch (err) {
            console.error(`[Fulfillment] DB fulfillment update failed:`, err.message);
        }
    }

    const summary = {
        status: 'fulfilled',
        txRef,
        orderId: order ? order.id : null,
        product: product.name,
        customer: customer.email,
        email: emailResult.status,
        contact: contactResult.status,
        admin: adminResult.status
    };

    if (emailError) {
        console.error(`[Fulfillment] Customer email FAILED:`, emailError);
        summary.emailError = emailError;
    }
    if (adminResult.status === 'rejected') {
        console.error(`[Fulfillment] Admin notification FAILED:`, adminResult.reason?.message);
    }

    console.log(`[Fulfillment] Complete:`, JSON.stringify(summary));
    return summary;
}

function detectProduct(paymentData) {
    const txRef = (paymentData.tx_ref || paymentData.txRef || '').toLowerCase();

    const refMatch = txRef.match(/^bfx-(.+?)-\d+$/);
    if (refMatch) {
        const productId = refMatch[1];
        const product = getProduct(productId);
        if (product) {
            product.id = productId;
            console.log(`[Fulfillment] Product matched by tx_ref: ${productId}`);
            return product;
        }
    }

    const metaProduct = paymentData.meta?.product;
    if (metaProduct) {
        const product = getProduct(metaProduct);
        if (product) {
            product.id = metaProduct;
            console.log(`[Fulfillment] Product matched by meta: ${metaProduct}`);
            return product;
        }
    }

    const amount = parseFloat(paymentData.amount);
    if (amount) {
        const entry = getProductByAmount(amount);
        if (entry) {
            const product = entry[1];
            product.id = entry[0];
            console.log(`[Fulfillment] Product matched by amount: ${amount} → ${entry[0]}`);
            return product;
        }
    }

    return null;
}

function extractCustomer(paymentData) {
    const customer = paymentData.customer || {};
    return {
        name: customer.name || customer.full_name || paymentData.customer_name || 'Valued Customer',
        email: customer.email || paymentData.customer_email || '',
        phone: customer.phone_number || customer.phone || paymentData.customer_phone || ''
    };
}

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
