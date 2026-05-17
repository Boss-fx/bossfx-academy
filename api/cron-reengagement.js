// ================================================================
// /api/cron-reengagement — Daily Automation Cron Job
// ================================================================
// Runs daily via Vercel Cron. Two responsibilities:
// 1. Process pending drip steps for contacts in active sequences
// 2. Find inactive contacts and trigger re-engagement
// Protected by CRON_SECRET in production.
// ================================================================

const brevo = require('@getbrevo/brevo');
const { triggerSequence, processNextStep, SEQUENCES } = require('../lib/drip');

// Config
const INACTIVITY_DAYS = 30;          // Days without activity before re-engagement
const MAX_DRIP_PER_RUN = 20;        // Max drip emails to send per cron run
const MAX_REENGAGE_PER_RUN = 5;     // Max re-engagement triggers per run
const REENGAGEMENT_COOLDOWN = 60;    // Days before re-engaging same contact again

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verify cron authorization
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        if (process.env.VERCEL_ENV === 'production') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'BREVO_API_KEY not set' });
    }

    const results = {
        timestamp: new Date().toISOString(),
        drip: { processed: 0, skipped: 0, errors: [] },
        reengagement: { processed: 0, skipped: 0, errors: [] },
        total_contacts_checked: 0
    };

    try {
        const contactsApi = new brevo.ContactsApi();
        contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

        // Fetch contacts from ALL lists
        const listIds = [2, 3, 5, 6]; // general, webinar, mentorship, resource
        let allContacts = [];

        for (const listId of listIds) {
            try {
                const listContacts = await contactsApi.getContactsFromList(listId, {
                    limit: 50,
                    offset: 0
                });
                const contacts = listContacts.contacts || listContacts.body?.contacts || [];
                // Deduplicate by email
                for (const c of contacts) {
                    if (!allContacts.find(x => x.email === c.email)) {
                        allContacts.push(c);
                    }
                }
            } catch (err) {
                console.warn(`[cron] Failed to fetch list ${listId}:`, err.body?.message || err.message);
            }
        }

        results.total_contacts_checked = allContacts.length;
        console.log(`[cron] Checking ${allContacts.length} contacts`);

        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);

        // ---- PHASE 1: Process pending drip steps ----
        let dripCount = 0;
        for (const contact of allContacts) {
            if (dripCount >= MAX_DRIP_PER_RUN) break;

            const attrs = contact.attributes || {};
            const flow = attrs.AUTOMATION_FLOW || '';
            const step = parseInt(attrs.AUTOMATION_STEP) || 0;
            const startTime = attrs.AUTOMATION_START ? new Date(attrs.AUTOMATION_START) : null;

            // Skip if no active flow or no start time
            if (!flow || !startTime || !SEQUENCES[flow]) continue;

            // Skip if flow is complete
            const sequence = SEQUENCES[flow];
            if (step + 1 >= sequence.steps.length) continue;

            // Skip re-engagement flows (handled separately)
            if (flow === 'reengagement') continue;

            // Check if next step is due
            const nextStep = sequence.steps[step + 1];
            const elapsedHours = (now - startTime) / (1000 * 60 * 60);

            if (elapsedHours >= nextStep.delay) {
                try {
                    const stepResult = await processNextStep(contact.email, attrs, apiKey);
                    if (stepResult && stepResult.success) {
                        dripCount++;
                        console.log(`[cron] Drip: sent ${stepResult.template} to ${contact.email.substring(0,3)}***`);
                    }
                } catch (err) {
                    results.drip.errors.push(err.message);
                }
            } else {
                results.drip.skipped++;
            }
        }
        results.drip.processed = dripCount;

        // ---- PHASE 2: Re-engagement for inactive contacts ----
        let reengageCount = 0;
        for (const contact of allContacts) {
            if (reengageCount >= MAX_REENGAGE_PER_RUN) break;

            const attrs = contact.attributes || {};
            const signupDate = attrs.SIGNUP_DATE ? new Date(attrs.SIGNUP_DATE) : null;
            const automationFlow = attrs.AUTOMATION_FLOW || '';
            const automationStart = attrs.AUTOMATION_START ? new Date(attrs.AUTOMATION_START) : null;

            // Only re-engage contacts who signed up > 30 days ago
            if (!signupDate || signupDate > cutoffDate) {
                results.reengagement.skipped++;
                continue;
            }

            // Skip: already in active sequence (not complete)
            if (automationFlow && automationFlow !== 'reengagement') {
                const seq = SEQUENCES[automationFlow];
                const currentStep = parseInt(attrs.AUTOMATION_STEP) || 0;
                if (seq && currentStep + 1 < seq.steps.length) {
                    results.reengagement.skipped++;
                    continue;
                }
            }

            // Skip: recently re-engaged (cooldown period)
            if (automationFlow === 'reengagement' && automationStart) {
                const cooldownEnd = new Date(automationStart.getTime() + (REENGAGEMENT_COOLDOWN * 24 * 60 * 60 * 1000));
                if (now < cooldownEnd) {
                    results.reengagement.skipped++;
                    continue;
                }
            }

            // Skip: high-value contacts (mentorship)
            if (automationFlow === 'mentorship') {
                results.reengagement.skipped++;
                continue;
            }

            // Trigger re-engagement
            try {
                const seqResult = await triggerSequence(contact.email, 'reengagement', attrs, apiKey);

                await contactsApi.updateContact(contact.email, {
                    attributes: {
                        AUTOMATION_FLOW: 'reengagement',
                        AUTOMATION_STEP: '0',
                        AUTOMATION_START: now.toISOString()
                    }
                });

                reengageCount++;
                console.log(`[cron] Re-engagement triggered for ${contact.email.substring(0,3)}***`);
            } catch (err) {
                results.reengagement.errors.push(err.message);
            }
        }
        results.reengagement.processed = reengageCount;
        results.success = true;

    } catch (err) {
        results.success = false;
        results.drip.errors.push(err.body?.message || err.message);
        console.error('[cron] Fatal error:', err.message);
    }

    console.log(`[cron] Complete: drip=${results.drip.processed}, reengage=${results.reengagement.processed}`);
    return res.status(200).json(results);
};
