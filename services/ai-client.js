// ================================================================
// BFX.aiClient — Application Service Layer seam (ADR-012)
// The ONLY place the PWA touches the AI Platform. Uses the vendored
// @bossfx/sdk browser bundle (lib/vendor/bossfx-sdk.browser.js).
// NO AI business logic here — orchestration only. No raw fetch()
// to the platform anywhere else in this codebase.
// ================================================================
var BFX = window.BFX || {};

BFX.aiClient = (function () {
    'use strict';

    var client = null;

    function tokenProvider() {
        return {
            getToken: function () {
                // Pluggable session source: when the PWA gains client-side
                // Supabase auth, BFX.auth.getAccessToken() supplies the JWT.
                // Null → the SDK refuses locally (no anonymous AI access).
                if (BFX.auth && typeof BFX.auth.getAccessToken === 'function') {
                    return Promise.resolve(BFX.auth.getAccessToken());
                }
                return Promise.resolve(null);
            }
        };
    }

    function get() {
        if (client) return client;
        var cfg = (BFX.config && BFX.config.aiPlatform) || {};
        if (!cfg.enabled) return null; // feature flag: AI off → no client
        if (!window.BossFxSDK || !cfg.url) return null;
        client = new window.BossFxSDK.BossFxClient({
            baseUrl: cfg.url,
            tokenProvider: tokenProvider()
        });
        return client;
    }

    return {
        get: get,
        isEnabled: function () {
            var cfg = (BFX.config && BFX.config.aiPlatform) || {};
            return Boolean(cfg.enabled && window.BossFxSDK && cfg.url);
        }
    };
})();
