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

    // Sync the buyer into Brevo as an enrolled student + start the
    // onboarding→mentorship journey (P4). Non-fatal — never blocks a grant.
    if (granted.length) {
        try { await syncEnrolledToBrevo(normEmail, granted, txRef); }
        catch (e) { console.warn('[Enrollment] Brevo student sync failed (non-fatal):', e.message); }
    }

    return { granted };
}

// Upsert the buyer as an enrolled Brevo student and fire the onboarding
// sequence. Creates the contact first so the sequence has a live target.
async function syncEnrolledToBrevo(email, courses, txRef) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) { console.warn('[Enrollment] No BREVO_API_KEY — skipping student sync'); return; }
    const brevo = require('@getbrevo/brevo');
    const contactsApi = new brevo.ContactsApi();
    contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

    const attrs = {
        IS_STUDENT: 'true',
        ENROLL_DATE: new Date().toISOString(),
        ENROLL_TX: txRef || '',
        CHECKOUT_RECOVERED: 'true'   // completed purchase — suppress abandoned-checkout (P5)
    };
    if (courses.indexOf('forex-101') > -1) attrs.ENROLLED_FOREX101 = 'true';

    // Create-or-update the contact in the general list (id 2)
    try {
        const c = new brevo.CreateContact();
        c.email = email; c.attributes = attrs; c.listIds = [2]; c.updateEnabled = true;
        await contactsApi.createContact(c);
    } catch (e) {
        try { await contactsApi.updateContact(email, { attributes: attrs, listIds: [2] }); }
        catch (e2) { console.warn('[Enrollment] Brevo contact upsert failed:', e2.body?.message || e2.message); }
    }

    // Kick off the onboarding sequence (source 'enrolled_forex101' → 'onboarding')
    try {
        const { processNewLead } = require('./drip');
        await processNewLead(email, 'enrolled_forex101', attrs, apiKey);
        console.log(`[Enrollment] Onboarding journey started for ${email}`);
    } catch (e) {
        console.warn('[Enrollment] Onboarding trigger failed:', e.body?.message || e.message);
    }
}

module.exports = { grantEnrollmentsForProduct, coursesForProduct };
