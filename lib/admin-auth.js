const { createClient } = require('@supabase/supabase-js');

async function verifyAdmin(req) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return null;

    const sb = createClient(url, anonKey);
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return null;

    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.length > 0 && !adminEmails.includes(user.email.toLowerCase())) {
        return null;
    }

    return user;
}

module.exports = { verifyAdmin };
