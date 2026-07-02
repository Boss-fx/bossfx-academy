// ================================================================
// /api/lead-capture — Lead Capture & Brevo Contact Webhook
// ================================================================
// Receives form submissions from exit intent, lead bar, newsletter,
// and webinar forms. Creates/updates Brevo contact with attribution
// data and triggers appropriate welcome automation.
// ================================================================

const brevo = require('@getbrevo/brevo');
const { processNewLead } = require('../lib/drip');
const { setCors } = require('../lib/cors');

// Brevo list IDs — verified via /api/setup-lists
const LISTS = {
    general:     2,  // BFX ACADEMY STARTER PACK
    webinar:     3,  // Enthusiat Traders
    mentorship:  5,  // Mentorship Inquiries
    resource:    6,  // Resource Downloaders
    exit_intent: 2   // Exit intent captures → general list
};

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // --- Environment validation ---
    const apiKey = process.env.BREVO_API_KEY;
    const envInfo = {
        has_api_key: !!apiKey,
        key_length: apiKey ? apiKey.length : 0,
        key_prefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NOT_SET',
        node_env: process.env.NODE_ENV || 'unknown',
        vercel_env: process.env.VERCEL_ENV || 'unknown'
    };

    console.log('[lead-capture] Environment check:', JSON.stringify(envInfo));

    if (!apiKey) {
        console.warn('[lead-capture] BREVO_API_KEY not set — skipping Brevo, returning success');
        console.warn('[lead-capture] VERCEL_ENV:', process.env.VERCEL_ENV, '| NODE_ENV:', process.env.NODE_ENV);
        return res.status(200).json({
            success: true,
            brevo: false,
            reason: 'no_api_key',
            env: process.env.VERCEL_ENV || 'unknown'
        });
    }

    try {
        const body = req.body || {};
        const email = (body.email || '').trim().toLowerCase();

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email required' });
        }

        // Determine source and list
        const source = body.source || 'unknown';
        const listKey = mapSourceToList(source);
        const listId = LISTS[listKey] || LISTS.general;

        console.log(`[lead-capture] Processing: ${email} | source: ${source} | list: ${listKey} (${listId})`);

        // Build contact attributes from form + attribution data
        const attributes = {
            SOURCE:             source,
            PROGRAM:            body.program || listKey,
            SIGNUP_PAGE:        body.page || body._bfx_landing_page || '',
            SIGNUP_DATE:        body.timestamp || new Date().toISOString(),
            PAGE_URL:           body.page || '',
            DEVICE_TYPE:        body.device || body._bfx_device || '',
            UTM_SOURCE:         body._bfx_utm_source || '',
            UTM_MEDIUM:         body._bfx_utm_medium || '',
            UTM_CAMPAIGN:       body._bfx_utm_campaign || '',
            UTM_CONTENT:        body._bfx_utm_content || '',
            TRAFFIC_SOURCE:     body._bfx_source || '',
            TRAFFIC_CHANNEL:    body._bfx_channel || '',
            LANDING_PAGE:       body._bfx_landing_page || '',
            REFERRER:           body._bfx_referrer || '',
            FIRST_TOUCH_SOURCE: body._bfx_ft_source || '',
            FIRST_TOUCH_MEDIUM: body._bfx_ft_medium || ''
        };

        // Add name if provided
        if (body.name) {
            const nameParts = body.name.trim().split(' ');
            attributes.FIRSTNAME = nameParts[0] || '';
            attributes.LASTNAME = nameParts.slice(1).join(' ') || '';
        }

        // Add webinar-specific fields
        if (source === 'webinar_registration' || source === 'webinar') {
            attributes.WEBINAR_NAME = body.webinar || '';
            attributes.EXPERIENCE_LEVEL = body.experience_level || body.level || '';
            attributes.TELEGRAM_HANDLE = body.telegram || '';
        }

        // Add mentorship-specific fields
        if (listKey === 'mentorship') {
            attributes.EXPERIENCE_LEVEL = body.experience || body.experience_level || body.level || '';
            attributes.PROGRAM = body.program || source;
        }

        // Add offer context for exit intent
        if (source.startsWith('exit_intent')) {
            attributes.EXIT_INTENT_OFFER = body.offer || '';
        }

        // --- Create/update contact in Brevo ---
        const contactsApi = new brevo.ContactsApi();
        contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

        const createContact = new brevo.CreateContact();
        createContact.email = email;
        createContact.attributes = cleanAttributes(attributes);
        createContact.listIds = [listId];
        createContact.updateEnabled = true; // Update existing contacts instead of failing

        let contactResult;
        try {
            contactResult = await contactsApi.createContact(createContact);
            console.log(`[lead-capture] Brevo contact created/updated: ${email} → list ${listId} (${listKey})`, JSON.stringify(contactResult));
        } catch (brevoErr) {
            // Extract detailed Brevo error information
            const errBody = brevoErr.body || brevoErr.response?.body || {};
            const errStatus = brevoErr.statusCode || brevoErr.response?.statusCode || 'unknown';
            const errCode = errBody.code || 'unknown';
            const errMessage = errBody.message || brevoErr.message || 'Unknown error';

            console.error(`[lead-capture] Brevo contact creation failed:`, JSON.stringify({
                status: errStatus,
                code: errCode,
                message: errMessage,
                email: email,
                listId: listId
            }));

            // Handle specific Brevo errors
            if (errCode === 'duplicate_parameter' || errMessage.includes('already exist')) {
                // Contact already exists — this is OK, updateEnabled should handle it
                // but some versions of the SDK throw anyway
                console.log(`[lead-capture] Contact ${email} already exists — attempting update via getContactInfo`);
                try {
                    await contactsApi.updateContact(email, {
                        attributes: cleanAttributes(attributes),
                        listIds: [listId]
                    });
                    console.log(`[lead-capture] Contact ${email} updated successfully via updateContact`);
                } catch (updateErr) {
                    console.error(`[lead-capture] Update also failed: ${updateErr.message}`);
                }
            } else {
                // Non-duplicate error — log but continue (don't break UX)
                console.error(`[lead-capture] Non-recoverable Brevo error (continuing anyway): ${errMessage}`);
            }
        }

        // --- Trigger drip automation sequence ---
        let automationResult = null;
        try {
            automationResult = await processNewLead(email, source, attributes, apiKey);
            console.log(`[lead-capture] Automation triggered: ${automationResult.sequence} (${automationResult.drip.steps_scheduled}/${automationResult.drip.steps_total} steps)`);
        } catch (automationErr) {
            console.error(`[lead-capture] Automation engine error (non-blocking):`, JSON.stringify({
                message: automationErr.message,
                stack: automationErr.stack ? automationErr.stack.split('\n').slice(0, 2).join(' | ') : 'no stack'
            }));
        }

        return res.status(200).json({
            success: true,
            brevo: true,
            list: listKey,
            automation: automationResult ? {
                sequence: automationResult.sequence,
                steps_scheduled: automationResult.drip.steps_scheduled,
                score: automationResult.score,
                tags: automationResult.tags
            } : null,
            env: process.env.VERCEL_ENV || 'unknown'
        });

    } catch (err) {
        // Top-level catch — unexpected errors
        console.error('[lead-capture] Unexpected error:', JSON.stringify({
            message: err.message,
            stack: err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : 'no stack',
            name: err.name
        }));

        // Return success even on error — don't break the UX
        return res.status(200).json({
            success: true,
            brevo: false,
            reason: err.message,
            env: process.env.VERCEL_ENV || 'unknown'
        });
    }
};

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function mapSourceToList(source) {
    if (!source) return 'general';
    var s = source.toLowerCase();

    // Webinar registrations
    if (s.includes('webinar')) return 'webinar';

    // Mentorship / high-intent inquiries
    if (s.includes('mentorship') || s.includes('coaching') || s.includes('funded') ||
        s.includes('vip') || s.includes('strategy_call') || s.includes('strategy call')) {
        return 'mentorship';
    }

    // Resource downloaders
    if (s.includes('resource') || s.includes('magnet') || s.includes('starter') ||
        s.includes('ebook') || s.includes('guide') || s.includes('pdf') ||
        s.includes('download') || s.includes('toolkit')) {
        return 'resource';
    }

    // Exit intent → general list
    if (s.includes('exit_intent')) return 'exit_intent';

    // Everything else → general
    return 'general';
}

function cleanAttributes(attrs) {
    // Remove empty values to avoid Brevo errors
    var clean = {};
    Object.keys(attrs).forEach(function (key) {
        if (attrs[key] && attrs[key] !== '') clean[key] = attrs[key];
    });
    return clean;
}
