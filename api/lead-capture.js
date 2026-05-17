// ================================================================
// /api/lead-capture — Lead Capture & Brevo Contact Webhook
// ================================================================
// Receives form submissions from exit intent, lead bar, newsletter,
// and webinar forms. Creates/updates Brevo contact with attribution
// data and triggers appropriate welcome automation.
// ================================================================

const brevo = require('@getbrevo/brevo');

// Brevo list IDs — verified via /api/setup-lists
const LISTS = {
    general:     2,  // BFX ACADEMY STARTER PACK
    webinar:     3,  // Enthusiat Traders
    mentorship:  5,  // Mentorship Inquiries
    resource:    6,  // Resource Downloaders
    exit_intent: 2   // Exit intent captures → general list
};

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

        // --- Send welcome email for certain sources ---
        let welcomeSent = false;
        if (shouldSendWelcome(source)) {
            try {
                await sendWelcomeEmail(email, attributes, source, apiKey);
                welcomeSent = true;
                console.log(`[lead-capture] Welcome email sent to ${email}`);
            } catch (welcomeErr) {
                console.error(`[lead-capture] Welcome email failed:`, JSON.stringify({
                    message: welcomeErr.message,
                    status: welcomeErr.statusCode || welcomeErr.response?.statusCode || 'unknown',
                    body: welcomeErr.body || welcomeErr.response?.body || null
                }));
            }
        }

        return res.status(200).json({
            success: true,
            brevo: true,
            list: listKey,
            welcome_sent: welcomeSent,
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
// Welcome Email (for exit intent and lead bar captures)
// ----------------------------------------------------------------
async function sendWelcomeEmail(email, attributes, source, apiKey) {
    const emailApi = new brevo.TransactionalEmailsApi();
    emailApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const firstName = attributes.FIRSTNAME || 'Trader';
    const isExitIntent = source.startsWith('exit_intent');

    const subject = isExitIntent
        ? `Your free trading resources are ready, ${firstName}`
        : `Welcome to BossFx, ${firstName} — here's what's next`;

    const htmlContent = buildWelcomeHTML(firstName, source);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
        name: 'BossFx Academy',
        email: process.env.SENDER_EMAIL || 'hello@bossfxcademy.com'
    };
    sendSmtpEmail.to = [{ email: email, name: firstName }];
    sendSmtpEmail.replyTo = {
        email: 'hello@bossfxcademy.com',
        name: 'BossFx Academy'
    };
    sendSmtpEmail.tags = ['welcome', source, 'automated'];

    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log(`[lead-capture] Welcome email API response:`, JSON.stringify({
        messageId: result.messageId || result.body?.messageId || 'unknown',
        email: email,
        source: source
    }));
    return result;
}

function buildWelcomeHTML(firstName, source) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f0c;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f0c;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#111816;border-radius:16px;overflow:hidden;border:1px solid rgba(16,185,129,0.15);">
  <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 36px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Welcome to BossFx Academy</h1>
  </td></tr>
  <tr><td style="padding:36px;">
    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">
      Hey ${firstName},
    </p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">
      You just joined <strong style="color:#10b981;">5,200+ traders</strong> who are building real skills in the forex market. No hype, no shortcuts — just structured education that works.
    </p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Here's how to get the most out of BossFx:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:14px 16px;background:#0a0f0c;border-radius:10px;border:1px solid rgba(16,185,129,0.1);margin-bottom:8px;">
        <table><tr>
          <td style="width:36px;vertical-align:top;font-size:20px;">1.</td>
          <td>
            <p style="margin:0;color:#f1f5f9;font-weight:600;font-size:14px;">Start Forex 101 (Free)</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Our 12-module course takes you from zero to structured trader.</p>
          </td>
        </tr></table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:14px 16px;background:#0a0f0c;border-radius:10px;border:1px solid rgba(16,185,129,0.1);">
        <table><tr>
          <td style="width:36px;vertical-align:top;font-size:20px;">2.</td>
          <td>
            <p style="margin:0;color:#f1f5f9;font-weight:600;font-size:14px;">Join the Telegram Community</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Daily setups, live analysis, and real trader conversations.</p>
          </td>
        </tr></table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="padding:14px 16px;background:#0a0f0c;border-radius:10px;border:1px solid rgba(16,185,129,0.1);">
        <table><tr>
          <td style="width:36px;vertical-align:top;font-size:20px;">3.</td>
          <td>
            <p style="margin:0;color:#f1f5f9;font-weight:600;font-size:14px;">Download Your Free Resources</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">8 professional trading tools — checklists, blueprints, templates.</p>
          </td>
        </tr></table>
      </td></tr>
    </table>

    <div style="text-align:center;margin:0 0 16px;">
      <a href="https://www.bossfxcademy.com/courses.html?utm_source=email&utm_medium=welcome&utm_campaign=lead_nurture" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
        Start Forex 101 — Free
      </a>
    </div>
    <div style="text-align:center;margin:0 0 8px;">
      <a href="https://t.me/qD_fBeaziqE5YzU8" style="display:inline-block;background:transparent;border:2px solid #10b981;color:#10b981;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
        Join Telegram Community
      </a>
    </div>

    <p style="color:#64748b;font-size:12px;line-height:1.6;margin:28px 0 0;text-align:center;">
      Questions? Reply to this email or reach out at hello@bossfxcademy.com
    </p>
  </td></tr>
  <tr><td style="padding:16px 36px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="margin:0;color:#475569;font-size:11px;">
      BossFx Academy &bull;
      <a href="https://www.bossfxcademy.com?utm_source=email&utm_medium=welcome" style="color:#10b981;text-decoration:none;">Website</a> &bull;
      <a href="https://www.instagram.com/bossfx_academy" style="color:#10b981;text-decoration:none;">Instagram</a> &bull;
      <a href="https://www.tiktok.com/@bossfx1" style="color:#10b981;text-decoration:none;">TikTok</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

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

function shouldSendWelcome(source) {
    // Send welcome email for direct lead captures
    var triggers = ['exit_intent', 'lead_bar', 'newsletter', 'footer', 'blog'];
    return triggers.some(function (t) { return (source || '').toLowerCase().includes(t); });
}

function cleanAttributes(attrs) {
    // Remove empty values to avoid Brevo errors
    var clean = {};
    Object.keys(attrs).forEach(function (key) {
        if (attrs[key] && attrs[key] !== '') clean[key] = attrs[key];
    });
    return clean;
}
