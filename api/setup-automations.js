// ================================================================
// /api/setup-automations — Push Templates & Automation Config to Brevo
// ================================================================
// Creates Brevo SMTP templates for all drip sequences, adds
// automation-tracking contact attributes, and verifies setup.
// Safe to call multiple times (idempotent).
// ================================================================

const brevo = require('@getbrevo/brevo');
const { TEMPLATES, BRAND } = require('./utils/templates');
const { SEQUENCES } = require('./utils/drip');

// Additional attributes needed for automation tracking
const AUTOMATION_ATTRIBUTES = [
    { name: 'AUTOMATION_FLOW',  type: 'text' },
    { name: 'AUTOMATION_STEP',  type: 'text' },
    { name: 'AUTOMATION_START', type: 'text' },
    { name: 'LEAD_SCORE',       type: 'text' },
    { name: 'CONTACT_TAGS',     type: 'text' }
];

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'BREVO_API_KEY not set' });
    }

    const results = {
        templates: {},
        attributes: {},
        sequences: {},
        errors: [],
        timestamp: new Date().toISOString()
    };

    try {
        // ---- PHASE 1: Create Automation Attributes ----
        console.log('[setup-automations] Phase 1: Creating automation attributes...');
        const contactsApi = new brevo.ContactsApi();
        contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

        let existingAttrs = [];
        try {
            const attrResult = await contactsApi.getAttributes();
            existingAttrs = (attrResult.attributes || attrResult.body?.attributes || [])
                .filter(a => a.category === 'normal')
                .map(a => a.name.toUpperCase());
        } catch (err) {
            console.warn('[setup-automations] Could not fetch attributes:', err.message);
        }

        for (const attr of AUTOMATION_ATTRIBUTES) {
            if (existingAttrs.includes(attr.name.toUpperCase())) {
                results.attributes[attr.name] = 'exists';
            } else {
                try {
                    await contactsApi.createAttribute('normal', attr.name, { type: attr.type });
                    results.attributes[attr.name] = 'created';
                    console.log(`[setup-automations] Created attribute: ${attr.name}`);
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

        // ---- PHASE 2: Create/Update Brevo SMTP Templates ----
        console.log('[setup-automations] Phase 2: Creating email templates...');
        const emailApi = new brevo.TransactionalEmailsApi();
        emailApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

        // Fetch existing templates to avoid duplicates
        let existingTemplates = [];
        try {
            const templatesResult = await emailApi.getSmtpTemplates({ limit: 100, offset: 0 });
            existingTemplates = templatesResult.templates || templatesResult.body?.templates || [];
            console.log(`[setup-automations] Found ${existingTemplates.length} existing templates`);
        } catch (err) {
            console.warn('[setup-automations] Could not fetch templates:', err.message);
            // Continue anyway — will try to create
        }

        const existingTemplateNames = existingTemplates.map(t => t.name.toLowerCase());

        for (const [key, template] of Object.entries(TEMPLATES)) {
            const existingMatch = existingTemplates.find(t =>
                t.name.toLowerCase() === template.name.toLowerCase()
            );

            if (existingMatch) {
                results.templates[key] = {
                    id: existingMatch.id,
                    name: template.name,
                    status: 'exists'
                };
                console.log(`[setup-automations] Template "${template.name}" exists: ID ${existingMatch.id}`);
            } else {
                try {
                    // Create new SMTP template in Brevo
                    const smtpTemplate = new brevo.CreateSmtpTemplate();
                    smtpTemplate.templateName = template.name;
                    smtpTemplate.subject = template.subject;
                    smtpTemplate.htmlContent = template.html();
                    smtpTemplate.sender = {
                        name: BRAND.sender.name,
                        email: BRAND.sender.email
                    };
                    smtpTemplate.replyTo = BRAND.email;
                    smtpTemplate.isActive = true;

                    const createResult = await emailApi.createSmtpTemplate(smtpTemplate);
                    const templateId = createResult.id || createResult.body?.id;

                    results.templates[key] = {
                        id: templateId,
                        name: template.name,
                        status: 'created'
                    };
                    console.log(`[setup-automations] Created template "${template.name}": ID ${templateId}`);
                } catch (err) {
                    const msg = err.body?.message || err.message;
                    results.templates[key] = {
                        name: template.name,
                        status: 'error',
                        error: msg
                    };
                    results.errors.push(`Template ${key}: ${msg}`);
                    console.error(`[setup-automations] Failed to create "${template.name}": ${msg}`);
                }
            }
        }

        // ---- PHASE 3: Report Sequence Configuration ----
        console.log('[setup-automations] Phase 3: Verifying sequence config...');
        for (const [key, seq] of Object.entries(SEQUENCES)) {
            const stepsValid = seq.steps.every(step => TEMPLATES[step.template]);
            results.sequences[key] = {
                name: seq.name,
                steps: seq.steps.length,
                templates_valid: stepsValid,
                max_delay_hours: Math.max(...seq.steps.map(s => s.delay)),
                templates: seq.steps.map(s => ({
                    key: s.template,
                    delay_hours: s.delay,
                    exists_in_brevo: !!results.templates[s.template]?.id
                }))
            };
        }

        // ---- PHASE 4: Summary ----
        const created = Object.values(results.templates).filter(t => t.status === 'created').length;
        const existing = Object.values(results.templates).filter(t => t.status === 'exists').length;
        const errors = Object.values(results.templates).filter(t => t.status === 'error').length;

        results.summary = {
            templates_created: created,
            templates_existing: existing,
            templates_errors: errors,
            templates_total: Object.keys(TEMPLATES).length,
            attributes_ready: Object.values(results.attributes).filter(v => v === 'exists' || v === 'created').length,
            sequences_configured: Object.keys(SEQUENCES).length,
            all_sequences_valid: Object.values(results.sequences).every(s => s.templates_valid)
        };

        results.success = results.errors.length === 0;

    } catch (err) {
        results.success = false;
        results.errors.push(err.body?.message || err.message);
        console.error('[setup-automations] Fatal error:', err.body || err.message);
    }

    return res.status(200).json(results);
};
