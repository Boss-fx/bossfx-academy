const REQUIRED = {
    FLUTTERWAVE_SECRET_KEY: 'Payment verification will fail',
    BREVO_API_KEY: 'Emails will not be sent',
    SUPABASE_URL: 'Database operations will fail',
    SUPABASE_SERVICE_ROLE_KEY: 'Database operations will fail'
};

const RECOMMENDED = {
    SENDER_EMAIL: 'Defaults to hello@bossfxcademy.com',
    ADMIN_EMAIL: 'Admin notifications will go to sender email',
    ADMIN_EMAILS: 'Admin whitelist not set — any authenticated user can access admin',
    DOWNLOAD_SECRET: 'Falls back to FLUTTERWAVE_SECRET_KEY (less secure)',
    FLUTTERWAVE_WEBHOOK_HASH: 'Webhook signature verification disabled',
    SUPABASE_ANON_KEY: 'Admin/founder dashboard login will not work'
};

function validateEnv() {
    const missing = [];
    const warnings = [];

    for (const [key, impact] of Object.entries(REQUIRED)) {
        if (!process.env[key]) missing.push({ key, impact });
    }
    for (const [key, note] of Object.entries(RECOMMENDED)) {
        if (!process.env[key]) warnings.push({ key, note });
    }

    return { missing, warnings, ok: missing.length === 0 };
}

function logEnvStatus() {
    const { missing, warnings, ok } = validateEnv();
    if (ok && warnings.length === 0) {
        console.log('[Env] All environment variables configured');
        return;
    }
    if (missing.length > 0) {
        console.error('[Env] MISSING REQUIRED:');
        missing.forEach(m => console.error(`  ${m.key} — ${m.impact}`));
    }
    if (warnings.length > 0) {
        console.warn('[Env] RECOMMENDED (not set):');
        warnings.forEach(w => console.warn(`  ${w.key} — ${w.note}`));
    }
}

module.exports = { validateEnv, logEnvStatus };
