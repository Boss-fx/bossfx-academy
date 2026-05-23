const { createClient } = require('@supabase/supabase-js');

let serviceClient = null;
let anonClient = null;

function getSupabaseClient() {
    if (serviceClient) return serviceClient;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        return null;
    }
    serviceClient = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    return serviceClient;
}

function getSupabaseAnon() {
    if (anonClient) return anonClient;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    anonClient = createClient(url, key);
    return anonClient;
}

module.exports = { getSupabaseClient, getSupabaseAnon };
