// ================================================================
// /api/health — Diagnostic Health Check
// ================================================================
// Tests Brevo API connectivity, env var presence, and reports
// runtime environment details for debugging deployment issues.
// ================================================================

const brevo = require('@getbrevo/brevo');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const checks = {
        timestamp: new Date().toISOString(),
        environment: {
            vercel_env: process.env.VERCEL_ENV || 'NOT_SET',
            node_env: process.env.NODE_ENV || 'NOT_SET',
            region: process.env.VERCEL_REGION || 'NOT_SET'
        },
        env_vars: {
            BREVO_API_KEY: envStatus(process.env.BREVO_API_KEY),
            SENDER_EMAIL: envStatus(process.env.SENDER_EMAIL),
            ADMIN_EMAIL: envStatus(process.env.ADMIN_EMAIL),
            FLUTTERWAVE_SECRET_KEY: envStatus(process.env.FLUTTERWAVE_SECRET_KEY),
            FLUTTERWAVE_WEBHOOK_HASH: envStatus(process.env.FLUTTERWAVE_WEBHOOK_HASH || process.env.FLUTTERWAVE_WEBHOOK_SECRET),
            DOWNLOAD_SECRET: envStatus(process.env.DOWNLOAD_SECRET)
        },
        brevo: { status: 'not_tested' },
        routes: {
            lead_capture: '/api/lead-capture (POST)',
            health: '/api/health (GET)',
            market_data: '/api/market-data (GET — ?type=all|prices|calendar|sentiment|news)',
            setup_lists: '/api/setup-lists (GET/POST)',
            setup_automations: '/api/setup-automations (GET/POST)',
            cron_reengagement: '/api/cron-reengagement (GET — daily cron)',
            verify_payment: '/api/verify-payment (POST)',
            flutterwave_webhook: '/api/webhooks/flutterwave (POST)'
        }
    };

    // Test Brevo connectivity if API key exists
    if (process.env.BREVO_API_KEY) {
        try {
            const accountApi = new brevo.AccountApi();
            accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);
            const account = await accountApi.getAccount();

            checks.brevo = {
                status: 'connected',
                company: account.companyName || account.body?.companyName || 'unknown',
                plan: account.plan ? account.plan[0]?.type : (account.body?.plan?.[0]?.type || 'unknown'),
                credits: account.plan ? account.plan[0]?.credits : (account.body?.plan?.[0]?.credits || 'unknown'),
                email: account.email || account.body?.email || 'unknown'
            };
        } catch (err) {
            const errBody = err.body || err.response?.body || {};
            checks.brevo = {
                status: 'error',
                message: errBody.message || err.message,
                code: errBody.code || err.statusCode || 'unknown',
                hint: getBrevoErrorHint(err)
            };
        }
    } else {
        checks.brevo = {
            status: 'missing_key',
            hint: 'BREVO_API_KEY environment variable is not set. Add it in Vercel Dashboard → Settings → Environment Variables → check ALL environments (Production, Preview, Development).'
        };
    }

    // Test Brevo contacts list access
    if (process.env.BREVO_API_KEY && checks.brevo.status === 'connected') {
        try {
            const contactsApi = new brevo.ContactsApi();
            contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
            const lists = await contactsApi.getLists();
            const listData = lists.lists || lists.body?.lists || [];
            checks.brevo.lists = listData.map(l => ({
                id: l.id,
                name: l.name,
                subscribers: l.totalSubscribers || l.uniqueSubscribers || 0
            }));
        } catch (err) {
            checks.brevo.lists_error = err.message;
        }
    }

    return res.status(200).json(checks);
};

function envStatus(value) {
    if (!value) return { set: false, value: 'NOT_SET' };
    return {
        set: true,
        length: value.length,
        preview: value.substring(0, 6) + '...' + value.substring(value.length - 4)
    };
}

function getBrevoErrorHint(err) {
    const status = err.statusCode || err.response?.statusCode;
    const msg = (err.body?.message || err.message || '').toLowerCase();

    if (status === 401 || msg.includes('unauthorized') || msg.includes('invalid')) {
        return 'API key is invalid or expired. Generate a new key at https://app.brevo.com/settings/keys/api';
    }
    if (status === 403 || msg.includes('forbidden')) {
        return 'API key lacks required permissions. Check key scope in Brevo settings.';
    }
    if (status === 429 || msg.includes('rate')) {
        return 'Rate limit hit. Wait and retry, or upgrade Brevo plan.';
    }
    return 'Check Brevo dashboard for API status: https://status.brevo.com';
}
