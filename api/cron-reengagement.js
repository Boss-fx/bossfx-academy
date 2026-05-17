// ================================================================
// /api/cron-reengagement — Daily Re-engagement Cron Job
// ================================================================
// Runs daily via Vercel Cron. Finds contacts who haven't opened
// emails in 30+ days and triggers the re-engagement sequence.
// Protected by CRON_SECRET to prevent unauthorized execution.
// ================================================================

const brevo = require('@getbrevo/brevo');
const { triggerSequence } = require('../lib/drip');
const { TEMPLATES } = require('../lib/templates');

// Config
const INACTIVITY_DAYS = 30;          // Days without activity before re-engagement
const MAX_CONTACTS_PER_RUN = 10;     // Safety: process max N contacts per execution
const REENGAGEMENT_COOLDOWN = 60;    // Days before re-engaging same contact again

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verify cron authorization (Vercel sends this header for cron jobs)
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Allow GET without auth for manual triggering in dev
        if (req.method !== 'GET' || process.env.VERCEL_ENV === 'production') {
            console.warn('[cron-reengagement] Unauthorized cron attempt');
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'BREVO_API_KEY not set' });
    }

    const results = {
        timestamp: new Date().toISOString(),
        contacts_found: 0,
        contacts_processed: 0,
        contacts_skipped: 0,
        errors: [],
        details: []
    };

    try {
        const contactsApi = new brevo.ContactsApi();
        contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

        // Find contacts in general list (ID 2) who signed up > 30 days ago
        // Brevo's contact search doesn't support "last open date" directly,
        // so we use AUTOMATION_FLOW attribute to check if already re-engaged
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);

        // Get contacts from main list
        let contacts = [];
        try {
            const listContacts = await contactsApi.getContactsFromList(2, {
                limit: 50,
                offset: 0,
                modifiedSince: undefined
            });
            contacts = listContacts.contacts || listContacts.body?.contacts || [];
        } catch (err) {
            console.error('[cron-reengagement] Failed to fetch contacts:', err.body?.message || err.message);
            results.errors.push('Failed to fetch contacts: ' + (err.body?.message || err.message));
            return res.status(200).json(results);
        }

        results.contacts_found = contacts.length;
        let processed = 0;

        for (const contact of contacts) {
            if (processed >= MAX_CONTACTS_PER_RUN) break;

            const attrs = contact.attributes || {};
            const signupDate = attrs.SIGNUP_DATE ? new Date(attrs.SIGNUP_DATE) : null;
            const automationFlow = attrs.AUTOMATION_FLOW || '';
            const automationStart = attrs.AUTOMATION_START ? new Date(attrs.AUTOMATION_START) : null;

            // Skip: signed up less than 30 days ago
            if (signupDate && signupDate > cutoffDate) {
                results.contacts_skipped++;
                continue;
            }

            // Skip: already in re-engagement sequence
            if (automationFlow === 'reengagement') {
                // Check cooldown: don't re-engage again within 60 days
                if (automationStart) {
                    const cooldownEnd = new Date(automationStart.getTime() + (REENGAGEMENT_COOLDOWN * 24 * 60 * 60 * 1000));
                    if (new Date() < cooldownEnd) {
                        results.contacts_skipped++;
                        continue;
                    }
                } else {
                    results.contacts_skipped++;
                    continue;
                }
            }

            // Skip: contact is in mentorship (high-value, don't re-engage)
            if (automationFlow === 'mentorship') {
                results.contacts_skipped++;
                continue;
            }

            // Trigger re-engagement
            try {
                const email = contact.email;
                const seqResult = await triggerSequence(email, 'reengagement', attrs, apiKey);

                // Update their automation state
                await contactsApi.updateContact(email, {
                    attributes: {
                        AUTOMATION_FLOW: 'reengagement',
                        AUTOMATION_START: new Date().toISOString()
                    }
                });

                results.details.push({
                    email: email.substring(0, 3) + '***',  // Privacy: don't log full emails
                    status: 'triggered',
                    steps: seqResult.steps_scheduled
                });
                processed++;
            } catch (err) {
                results.errors.push(`Failed for contact: ${err.message}`);
            }
        }

        results.contacts_processed = processed;
        results.success = true;

    } catch (err) {
        results.success = false;
        results.errors.push(err.body?.message || err.message);
        console.error('[cron-reengagement] Fatal error:', err.message);
    }

    console.log(`[cron-reengagement] Complete: ${results.contacts_processed} processed, ${results.contacts_skipped} skipped`);
    return res.status(200).json(results);
};
