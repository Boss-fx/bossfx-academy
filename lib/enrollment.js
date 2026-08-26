// ================================================================
// Course enrollment grants (server-side, service role → bypasses RLS)
// Called from fulfillment when a paid order unlocks course access.
// Students READ their own rows via RLS; only this path WRITES them,
// so paid access can never be self-granted from the browser.
// ================================================================
const { getSupabaseClient } = require('./supabase');

// Which course(s) a purchased product unlocks. VIP unlocks everything
// we currently ship as a gated course.
const PRODUCT_COURSES = {
    'forex-101': ['forex-101'],
    'vip': ['forex-101']
};

function coursesForProduct(productId) {
    return PRODUCT_COURSES[productId] || [];
}

// Grant every course a product unlocks to the buyer's email.
// Idempotent (unique on email+course_id) and non-fatal: a failure here
// never blocks the rest of fulfillment (email, download, etc.).
async function grantEnrollmentsForProduct(email, productId, txRef, source) {
    const courses = coursesForProduct(productId);
    if (!courses.length) return { granted: [], skipped: true };

    const sb = getSupabaseClient();
    if (!sb) {
        console.warn('[Enrollment] No Supabase service client — cannot grant', productId);
        return { granted: [], error: 'no-client' };
    }

    const normEmail = String(email || '').trim().toLowerCase();
    if (!normEmail) return { granted: [], error: 'no-email' };

    const granted = [];
    for (const courseId of courses) {
        const { error } = await sb.from('enrollments').upsert({
            email: normEmail,
            course_id: courseId,
            status: 'active',
            source: source || 'flutterwave',
            tx_ref: txRef || null,
            granted_at: new Date().toISOString()
        }, { onConflict: 'email,course_id' });
        if (error) {
            console.error(`[Enrollment] Grant failed for ${normEmail} / ${courseId}:`, error.message);
        } else {
            console.log(`[Enrollment] Granted ${courseId} to ${normEmail}`);
            granted.push(courseId);
        }
    }
    return { granted };
}

module.exports = { grantEnrollmentsForProduct, coursesForProduct };
