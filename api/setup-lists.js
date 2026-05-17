// ================================================================
// /api/setup-lists — One-time Brevo list creation endpoint
// ================================================================
// Creates missing Brevo lists and contact attributes automatically.
// Safe to call multiple times (idempotent).
// ================================================================

const brevo = require('@getbrevo/brevo');

const REQUIRED_LISTS = [
    { key: 'general',    name: 'BFX ACADEMY STARTER PACK' },
    { key: 'webinar',    name: 'Enthusiat Traders' },
    { key: 'mentorship', name: 'Mentorship Inquiries' },
    { key: 'resource',   name: 'Resource Downloaders' }
];

const REQUIRED_ATTRIBUTES = [
    { name: 'SOURCE',              type: 'text' },
    { name: 'PROGRAM',             type: 'text' },
    { name: 'SIGNUP_PAGE',         type: 'text' },
    { name: 'SIGNUP_DATE',         type: 'text' },
    { name: 'PAGE_URL',            type: 'text' },
    { name: 'DEVICE_TYPE',         type: 'text' },
    { name: 'UTM_SOURCE',          type: 'text' },
    { name: 'UTM_MEDIUM',          type: 'text' },
    { name: 'UTM_CAMPAIGN',        type: 'text' },
    { name: 'UTM_CONTENT',         type: 'text' },
    { name: 'TRAFFIC_SOURCE',      type: 'text' },
    { name: 'TRAFFIC_CHANNEL',     type: 'text' },
    { name: 'LANDING_PAGE',        type: 'text' },
    { name: 'REFERRER',            type: 'text' },
    { name: 'FIRST_TOUCH_SOURCE',  type: 'text' },
    { name: 'FIRST_TOUCH_MEDIUM',  type: 'text' },
    { name: 'WEBINAR_NAME',        type: 'text' },
    { name: 'EXPERIENCE_LEVEL',    type: 'text' },
    { name: 'TELEGRAM_HANDLE',     type: 'text' },
    { name: 'EXIT_INTENT_OFFER',   type: 'text' },
    { name: 'FIRSTNAME',           type: 'text' },
    { name: 'LASTNAME',            type: 'text' }
];

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'BREVO_API_KEY not set', env: process.env.VERCEL_ENV });
    }

    const results = { lists: {}, attributes: {}, errors: [] };

    try {
        // ---- LISTS ----
        const contactsApi = new brevo.ContactsApi();
        contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

        console.log('[setup-lists] Fetching existing lists...');
        const existing = await contactsApi.getLists();
        const existingLists = existing.lists || existing.body?.lists || [];
        const existingNames = existingLists.map(l => l.name.toLowerCase());

        for (const reqList of REQUIRED_LISTS) {
            const found = existingLists.find(l => l.name.toLowerCase() === reqList.name.toLowerCase());
            if (found) {
                results.lists[reqList.key] = { id: found.id, name: found.name, status: 'exists', subscribers: found.totalSubscribers || 0 };
                console.log(`[setup-lists] List "${reqList.name}" exists: ID ${found.id}`);
            } else {
                try {
                    const cl = new brevo.CreateList();
                    cl.name = reqList.name;
                    cl.folderId = existingLists[0]?.folderId || 1;
                    const r = await contactsApi.createList(cl);
                    const newId = r.id || r.body?.id;
                    results.lists[reqList.key] = { id: newId, name: reqList.name, status: 'created' };
                    console.log(`[setup-lists] Created "${reqList.name}": ID ${newId}`);
                } catch (err) {
                    const msg = err.body?.message || err.message;
                    results.lists[reqList.key] = { name: reqList.name, status: 'error', error: msg };
                    results.errors.push(`List ${reqList.name}: ${msg}`);
                    console.error(`[setup-lists] Failed to create "${reqList.name}": ${msg}`);
                }
            }
        }

        // ---- ATTRIBUTES ----
        console.log('[setup-lists] Checking contact attributes...');
        let existingAttrs = [];
        try {
            const attrResult = await contactsApi.getAttributes();
            existingAttrs = (attrResult.attributes || attrResult.body?.attributes || [])
                .filter(a => a.category === 'normal')
                .map(a => a.name.toUpperCase());
        } catch (err) {
            console.warn('[setup-lists] Could not fetch attributes:', err.message);
        }

        for (const attr of REQUIRED_ATTRIBUTES) {
            if (existingAttrs.includes(attr.name.toUpperCase())) {
                results.attributes[attr.name] = 'exists';
            } else {
                try {
                    const createAttr = new brevo.CreateAttribute();
                    await contactsApi.createAttribute('normal', attr.name, { type: attr.type });
                    results.attributes[attr.name] = 'created';
                    console.log(`[setup-lists] Created attribute: ${attr.name}`);
                } catch (err) {
                    const msg = err.body?.message || err.message;
                    if (msg.includes('already exist') || msg.includes('must be unique')) {
                        results.attributes[attr.name] = 'exists';
                    } else {
                        results.attributes[attr.name] = 'error: ' + msg;
                        results.errors.push(`Attr ${attr.name}: ${msg}`);
                    }
                }
            }
        }

        // ---- FINAL VERIFICATION ----
        const finalLists = await contactsApi.getLists();
        results.verified_lists = (finalLists.lists || finalLists.body?.lists || []).map(l => ({
            id: l.id, name: l.name, subscribers: l.totalSubscribers || 0
        }));

        results.list_id_map = {};
        for (const reqList of REQUIRED_LISTS) {
            const entry = results.lists[reqList.key];
            if (entry && entry.id) results.list_id_map[reqList.key] = entry.id;
        }
        results.list_id_map.exit_intent = results.list_id_map.general || 2;

        results.success = results.errors.length === 0;
        results.env = process.env.VERCEL_ENV || 'unknown';

    } catch (err) {
        results.success = false;
        results.errors.push(err.body?.message || err.message);
        console.error('[setup-lists] Fatal error:', err.body || err.message);
    }

    return res.status(200).json(results);
};
