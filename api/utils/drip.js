// ================================================================
// Drip Automation Engine — BossFx Academy
// ================================================================
// Server-side email sequence engine. Uses Brevo's scheduledAt param
// to schedule future emails, and contact attributes to track state.
// No external cron required — sequences fire on contact creation.
// ================================================================

const brevo = require('@getbrevo/brevo');
const { TEMPLATES, BRAND } = require('./templates');

// ----------------------------------------------------------------
// SEQUENCE DEFINITIONS
// Delays are in hours from trigger time (contact creation / entry)
// ----------------------------------------------------------------
const SEQUENCES = {
    welcome: {
        name: 'Welcome Series',
        listKey: 'general',
        steps: [
            { template: 'welcome_1', delay: 0 },       // Immediate
            { template: 'welcome_2', delay: 24 },      // Day 1
            { template: 'welcome_3', delay: 72 },      // Day 3
            { template: 'welcome_4', delay: 120 }      // Day 5
        ]
    },
    webinar: {
        name: 'Webinar Registration',
        listKey: 'webinar',
        steps: [
            { template: 'webinar_1', delay: 0 },       // Immediate confirmation
            { template: 'webinar_4', delay: 48 }       // Post-webinar follow-up (2 days later)
        ]
    },
    resource: {
        name: 'Resource Download',
        listKey: 'resource',
        steps: [
            { template: 'resource_1', delay: 0 },      // Immediate delivery
            { template: 'resource_2', delay: 48 },     // Day 2 — bonus strategies
            { template: 'resource_3', delay: 96 }      // Day 4 — upsell path
        ]
    },
    mentorship: {
        name: 'Mentorship Inquiry',
        listKey: 'mentorship',
        steps: [
            { template: 'mentorship_1', delay: 0 },    // Immediate acknowledgment
            { template: 'mentorship_2', delay: 24 },   // Day 1 — social proof
            { template: 'mentorship_3', delay: 72 }    // Day 3 — conversion push
        ]
    },
    exit_intent: {
        name: 'Exit Intent Recovery',
        listKey: 'exit_intent',
        steps: [
            { template: 'exit_recovery_1', delay: 0 },  // Immediate
            { template: 'exit_recovery_2', delay: 24 }   // Day 1
        ]
    },
    reengagement: {
        name: 'Re-engagement',
        listKey: 'general',
        steps: [
            { template: 'reengagement_1', delay: 0 },   // Immediate
            { template: 'reengagement_2', delay: 72 },   // Day 3
            { template: 'reengagement_3', delay: 168 }   // Day 7
        ]
    }
};

// ----------------------------------------------------------------
// LEAD SCORING RULES
// ----------------------------------------------------------------
const SCORE_RULES = {
    signup: 10,              // Any list signup
    webinar_registration: 25,
    resource_download: 15,
    mentorship_inquiry: 40,
    exit_intent_capture: 5,
    webinar_attended: 30,
    email_opened: 2,
    email_clicked: 5,
    page_visit: 1
};

// ----------------------------------------------------------------
// TAG ASSIGNMENT RULES (based on source/list)
// ----------------------------------------------------------------
function assignTags(source, listKey, attributes) {
    const tags = [];

    // Source-based tags
    if (source.includes('webinar')) tags.push('webinar_lead');
    if (source.includes('mentorship') || source.includes('coaching')) tags.push('mentorship_interest');
    if (source.includes('exit_intent')) tags.push('exit_intent_capture');
    if (source.includes('resource') || source.includes('download')) tags.push('resource_downloader');
    if (source.includes('funded') || source.includes('vip')) tags.push('high_intent');

    // Experience-based tags
    const level = (attributes.EXPERIENCE_LEVEL || '').toLowerCase();
    if (level.includes('beginner') || level.includes('new')) tags.push('beginner_trader');
    if (level.includes('intermediate')) tags.push('intermediate_trader');
    if (level.includes('advanced') || level.includes('experienced')) tags.push('advanced_trader');

    // Device tags
    if (attributes.DEVICE_TYPE === 'mobile') tags.push('mobile_user');

    // Traffic tags
    if (attributes.UTM_SOURCE) tags.push('paid_traffic');
    if ((attributes.REFERRER || '').includes('instagram')) tags.push('instagram_lead');
    if ((attributes.REFERRER || '').includes('tiktok')) tags.push('tiktok_lead');

    return tags;
}

// ----------------------------------------------------------------
// Calculate lead score
// ----------------------------------------------------------------
function calculateScore(source, existingScore) {
    let score = parseInt(existingScore) || 0;
    const s = (source || '').toLowerCase();

    if (s.includes('webinar')) score += SCORE_RULES.webinar_registration;
    else if (s.includes('mentorship') || s.includes('coaching')) score += SCORE_RULES.mentorship_inquiry;
    else if (s.includes('resource') || s.includes('download')) score += SCORE_RULES.resource_download;
    else if (s.includes('exit_intent')) score += SCORE_RULES.exit_intent_capture;
    else score += SCORE_RULES.signup;

    return score;
}

// ----------------------------------------------------------------
// Determine which sequence to trigger
// ----------------------------------------------------------------
function getSequenceForSource(source) {
    const s = (source || '').toLowerCase();

    if (s.includes('webinar')) return 'webinar';
    if (s.includes('mentorship') || s.includes('coaching') || s.includes('funded') ||
        s.includes('vip') || s.includes('strategy_call')) return 'mentorship';
    if (s.includes('resource') || s.includes('magnet') || s.includes('starter') ||
        s.includes('ebook') || s.includes('guide') || s.includes('pdf') ||
        s.includes('download') || s.includes('toolkit')) return 'resource';
    if (s.includes('exit_intent')) return 'exit_intent';

    // Default: welcome sequence for general signups
    return 'welcome';
}

// ----------------------------------------------------------------
// Schedule a full drip sequence for a contact
// ----------------------------------------------------------------
async function triggerSequence(email, sequenceKey, attributes, apiKey) {
    const sequence = SEQUENCES[sequenceKey];
    if (!sequence) {
        console.error(`[drip] Unknown sequence: ${sequenceKey}`);
        return { success: false, error: `Unknown sequence: ${sequenceKey}` };
    }

    const emailApi = new brevo.TransactionalEmailsApi();
    emailApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const results = [];
    const now = new Date();
    const firstName = attributes.FIRSTNAME || 'Trader';

    // Safety: max 50 emails per hour per contact (loop prevention)
    // Each sequence has max 4 steps, so this is just defensive
    if (sequence.steps.length > 10) {
        console.error(`[drip] Sequence ${sequenceKey} has too many steps (${sequence.steps.length})`);
        return { success: false, error: 'Too many steps in sequence' };
    }

    for (let i = 0; i < sequence.steps.length; i++) {
        const step = sequence.steps[i];
        const template = TEMPLATES[step.template];

        if (!template) {
            console.warn(`[drip] Template not found: ${step.template}`);
            results.push({ step: i, template: step.template, status: 'template_not_found' });
            continue;
        }

        try {
            const sendSmtpEmail = new brevo.SendSmtpEmail();

            // Personalize subject line
            let subject = template.subject
                .replace(/\{\{\s*contact\.FIRSTNAME\s*\|\s*default:\s*"Trader"\s*\}\}/g, firstName);

            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = template.html();
            sendSmtpEmail.sender = BRAND.sender;
            sendSmtpEmail.to = [{ email: email, name: firstName }];
            sendSmtpEmail.replyTo = { email: BRAND.email, name: BRAND.name };
            sendSmtpEmail.tags = [...template.tags, sequenceKey, `step_${i}`];

            // Schedule future emails using scheduledAt
            if (step.delay > 0) {
                const scheduledAt = new Date(now.getTime() + (step.delay * 60 * 60 * 1000));

                // Brevo scheduledAt limit: max ~69 days in the future
                const maxFuture = new Date(now.getTime() + (69 * 24 * 60 * 60 * 1000));
                if (scheduledAt > maxFuture) {
                    console.warn(`[drip] Step ${i} schedule too far in future, skipping`);
                    results.push({ step: i, template: step.template, status: 'skipped_too_far' });
                    continue;
                }

                sendSmtpEmail.scheduledAt = scheduledAt.toISOString();
            }

            // Add UTM tracking params to all links in HTML
            // (Already baked into templates via BRAND.url references)

            const result = await emailApi.sendTransacEmail(sendSmtpEmail);
            const messageId = result.messageId || result.body?.messageId || 'sent';

            results.push({
                step: i,
                template: step.template,
                status: 'scheduled',
                delay_hours: step.delay,
                scheduled_at: step.delay > 0 ? sendSmtpEmail.scheduledAt : 'immediate',
                messageId: messageId
            });

            console.log(`[drip] Scheduled ${step.template} for ${email} (delay: ${step.delay}h, msgId: ${messageId})`);

        } catch (err) {
            const errMsg = err.body?.message || err.message || 'unknown';
            console.error(`[drip] Failed to schedule ${step.template}: ${errMsg}`);
            results.push({
                step: i,
                template: step.template,
                status: 'error',
                error: errMsg
            });
        }
    }

    return {
        success: results.some(r => r.status === 'scheduled'),
        sequence: sequenceKey,
        steps_scheduled: results.filter(r => r.status === 'scheduled').length,
        steps_total: sequence.steps.length,
        results: results
    };
}

// ----------------------------------------------------------------
// Update contact with automation metadata (state tracking)
// ----------------------------------------------------------------
async function updateAutomationState(email, sequenceKey, tags, score, apiKey) {
    const contactsApi = new brevo.ContactsApi();
    contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

    const updatePayload = {
        attributes: {
            AUTOMATION_FLOW: sequenceKey,
            AUTOMATION_STEP: '0',
            AUTOMATION_START: new Date().toISOString(),
            LEAD_SCORE: String(score),
            CONTACT_TAGS: tags.join(',')
        }
    };

    try {
        await contactsApi.updateContact(email, updatePayload);
        console.log(`[drip] Updated automation state for ${email}: flow=${sequenceKey}, score=${score}, tags=${tags.join(',')}`);
        return true;
    } catch (err) {
        console.error(`[drip] Failed to update automation state for ${email}: ${err.body?.message || err.message}`);
        return false;
    }
}

// ----------------------------------------------------------------
// MAIN ENTRY POINT: Process a new lead through the automation system
// ----------------------------------------------------------------
async function processNewLead(email, source, attributes, apiKey) {
    const startTime = Date.now();

    console.log(`[drip] Processing new lead: ${email} | source: ${source}`);

    // 1. Determine sequence
    const sequenceKey = getSequenceForSource(source);

    // 2. Calculate lead score
    const score = calculateScore(source, attributes.LEAD_SCORE);

    // 3. Assign tags
    const tags = assignTags(source, sequenceKey, attributes);

    // 4. Trigger the email sequence
    const sequenceResult = await triggerSequence(email, sequenceKey, attributes, apiKey);

    // 5. Update contact with automation metadata
    await updateAutomationState(email, sequenceKey, tags, score, apiKey);

    const duration = Date.now() - startTime;
    console.log(`[drip] Completed processing ${email} in ${duration}ms: sequence=${sequenceKey}, score=${score}`);

    return {
        email: email,
        sequence: sequenceKey,
        score: score,
        tags: tags,
        drip: sequenceResult,
        duration_ms: duration
    };
}

// ----------------------------------------------------------------
// PACING & SAFETY
// ----------------------------------------------------------------
// - Max 4 emails per sequence (built into SEQUENCES definitions)
// - scheduledAt ensures Brevo handles timing server-side
// - Deduplication handled at lead-capture level (same email + same source within session)
// - Unsubscribe link in every template via {{ unsubscribe }} Brevo variable
// - Re-engagement only triggered manually or via cron, never on signup

module.exports = {
    SEQUENCES,
    SCORE_RULES,
    processNewLead,
    triggerSequence,
    getSequenceForSource,
    calculateScore,
    assignTags,
    updateAutomationState
};
