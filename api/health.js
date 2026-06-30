// ================================================================
// /api/health — Diagnostic Health Check + First-Run Setup
// ================================================================
// GET: Tests Brevo/Supabase connectivity, env var presence
// POST ?action=setup: One-time founder account creation (self-disabling)
// POST ?action=check-setup: Check if setup is needed
// ================================================================

const brevo = require('@getbrevo/brevo');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        var action = req.query.action || '';
        if (action === 'setup') return handleSetup(req, res);
        if (action === 'check-setup') return handleCheckSetup(req, res);
        return res.status(400).json({ error: 'Unknown POST action' });
    }

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
            DOWNLOAD_SECRET: envStatus(process.env.DOWNLOAD_SECRET),
            SUPABASE_URL: envStatus(process.env.SUPABASE_URL),
            SUPABASE_SERVICE_ROLE_KEY: envStatus(process.env.SUPABASE_SERVICE_ROLE_KEY),
            SUPABASE_ANON_KEY: envStatus(process.env.SUPABASE_ANON_KEY)
        },
        supabase: { status: 'not_tested' },
        brevo: { status: 'not_tested' },
        routes: {
            lead_capture: '/api/lead-capture (POST)',
            health: '/api/health (GET)',
            market_data: '/api/market-data (GET)',
            verify_payment: '/api/verify-payment (GET)',
            download: '/api/download (GET)',
            booking: '/api/booking (POST)',
            vip_access: '/api/vip-access (GET)',
            admin: '/api/admin (GET/POST — ?action=stats|resend|token)',
            flutterwave_webhook: '/api/webhooks/flutterwave (POST)',
            cron_reengagement: '/api/cron-reengagement (GET — daily cron)'
        }
    };

    // Test Supabase connectivity
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { getSupabaseClient } = require('../lib/supabase');
            const sb = getSupabaseClient();
            if (sb) {
                const { count, error } = await sb.from('orders').select('*', { count: 'exact', head: true });
                if (error) throw error;
                const { data: files } = await sb.from('product_files').select('product_id', { count: 'exact', head: true });
                const { data: buckets } = await sb.storage.listBuckets();
                checks.supabase = {
                    status: 'connected',
                    orders: count || 0,
                    storageBuckets: (buckets || []).map(b => b.name)
                };
            }
        } catch (err) {
            checks.supabase = { status: 'error', message: err.message };
        }
    } else {
        checks.supabase = { status: 'missing_keys', hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' };
    }

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

// ================================================================
// Setup handlers — one-time founder account provisioning
// ================================================================

async function handleCheckSetup(req, res) {
    var url = process.env.SUPABASE_URL;
    var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    var anonKey = process.env.SUPABASE_ANON_KEY;
    var adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').split(',').map(function (e) { return e.trim().toLowerCase(); }).filter(Boolean);

    var result = {
        supabase: { url: !!url, serviceKey: !!serviceKey, anonKey: !!anonKey, connected: false },
        adminEmails: { configured: adminEmails.length > 0, count: adminEmails.length, emails: adminEmails.map(function (e) { return e.charAt(0) + '***@' + e.split('@')[1]; }) },
        founderExists: false,
        setupComplete: false,
        envVars: {
            SUPABASE_URL: !!url,
            SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
            SUPABASE_ANON_KEY: !!anonKey,
            FLUTTERWAVE_SECRET_KEY: !!process.env.FLUTTERWAVE_SECRET_KEY,
            BREVO_API_KEY: !!process.env.BREVO_API_KEY,
            DOWNLOAD_SECRET: !!process.env.DOWNLOAD_SECRET,
            ADMIN_EMAILS: !!(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL)
        }
    };

    if (!url || !serviceKey) {
        return res.status(200).json(result);
    }

    try {
        var { createClient } = require('@supabase/supabase-js');
        var sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

        var { count, error } = await sb.from('orders').select('*', { count: 'exact', head: true });
        if (error) throw error;
        result.supabase.connected = true;
        result.supabase.orderCount = count || 0;

        if (adminEmails.length > 0) {
            var { data: usersData, error: usersErr } = await sb.auth.admin.listUsers({ perPage: 100 });
            if (usersErr) throw usersErr;

            var existingAdmins = (usersData.users || []).filter(function (u) {
                return adminEmails.includes((u.email || '').toLowerCase());
            });

            result.founderExists = existingAdmins.length > 0;
            result.setupComplete = existingAdmins.length > 0;
            if (existingAdmins.length > 0) {
                result.existingAdmins = existingAdmins.map(function (u) {
                    return { email: u.email, confirmed: !!u.email_confirmed_at, createdAt: u.created_at };
                });
            }
        }
    } catch (err) {
        result.supabase.error = err.message;
    }

    return res.status(200).json(result);
}

async function handleSetup(req, res) {
    var { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    email = email.trim().toLowerCase();

    var adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').split(',').map(function (e) { return e.trim().toLowerCase(); }).filter(Boolean);

    if (adminEmails.length === 0) {
        return res.status(400).json({ error: 'ADMIN_EMAILS environment variable is not configured. Set it in Vercel before running setup.' });
    }

    if (!adminEmails.includes(email)) {
        return res.status(403).json({ error: 'This email is not in the ADMIN_EMAILS whitelist. Only whitelisted emails can be provisioned.' });
    }

    var url = process.env.SUPABASE_URL;
    var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
        return res.status(500).json({ error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set' });
    }

    try {
        var { createClient } = require('@supabase/supabase-js');
        var sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

        var { data: usersData, error: listErr } = await sb.auth.admin.listUsers({ perPage: 100 });
        if (listErr) throw listErr;

        var existingAdmin = (usersData.users || []).find(function (u) {
            return adminEmails.includes((u.email || '').toLowerCase());
        });

        if (existingAdmin) {
            return res.status(409).json({
                error: 'Setup already completed. A founder account already exists.',
                email: existingAdmin.email,
                createdAt: existingAdmin.created_at
            });
        }

        var { data: newUser, error: createErr } = await sb.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });

        if (createErr) throw createErr;

        return res.status(201).json({
            success: true,
            message: 'Founder account created successfully',
            email: newUser.user.email,
            id: newUser.user.id,
            createdAt: newUser.user.created_at
        });
    } catch (err) {
        console.error('[Setup] Error:', err.message);
        return res.status(500).json({ error: 'Failed to create account: ' + err.message });
    }
}

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
