// ================================================================
// BFX.auth — client-side Supabase session source (Session E)
// Completes the ASL's pluggable token hook: BFX.aiClient calls
// BFX.auth.getAccessToken() to attach the user's JWT to AI requests.
// Uses the vendored supabase-js UMD (lib/vendor/supabase.umd.js).
// The anon key is public by design; NO service keys ever ship here.
// Gracefully inert until config.supabase is filled in — AI requests
// then correctly refuse locally (no anonymous access).
// ================================================================
var BFX = window.BFX || {};

BFX.auth = (function () {
    'use strict';

    var client = null;

    function getClient() {
        if (client) return client;
        var cfg = (BFX.config && BFX.config.supabase) || {};
        if (!cfg.url || !cfg.anonKey || !window.supabase) return null;
        client = window.supabase.createClient(cfg.url, cfg.anonKey);
        return client;
    }

    return {
        /** The ASL token hook: current session's access token, or null. */
        getAccessToken: function () {
            var sb = getClient();
            if (!sb) return Promise.resolve(null);
            return sb.auth.getSession().then(function (res) {
                return (res.data.session && res.data.session.access_token) || null;
            });
        },

        signInWithPassword: function (email, password) {
            var sb = getClient();
            if (!sb) return Promise.reject(new Error('Auth is not configured'));
            return sb.auth.signInWithPassword({ email: email, password: password });
        },

        signOut: function () {
            var sb = getClient();
            if (!sb) return Promise.resolve();
            return sb.auth.signOut();
        },

        isConfigured: function () {
            return Boolean(getClient());
        }
    };
})();
