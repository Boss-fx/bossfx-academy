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

    // Environment configuration (buildless / static-site pattern).
    // Priority: <meta name="ai-platform-url"> (per-deployment override, same
    // mechanism admin.js uses for Supabase) → BFX.config.aiPlatform.url (default).
    // Lets ops point at a custom domain by editing one meta tag — no app-code
    // change, no bundler, no build step. There is no NEXT_PUBLIC_* here because
    // this is a no-build static site (see CLAUDE.md); the meta tag is its
    // buildless equivalent of an environment variable.
    function resolveBaseUrl() {
        if (typeof document !== 'undefined') {
            var meta = document.querySelector('meta[name="ai-platform-url"]');
            if (meta && meta.content) return meta.content.replace(/\/+$/, '');
        }
        var cfg = (BFX.config && BFX.config.aiPlatform) || {};
        return cfg.url || '';
    }

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
        var baseUrl = resolveBaseUrl();
        if (!window.BossFxSDK || !baseUrl) return null;
        client = new window.BossFxSDK.BossFxClient({
            baseUrl: baseUrl,
            tokenProvider: tokenProvider()
        });
        return client;
    }

    return {
        get: get,
        baseUrl: resolveBaseUrl, // exposed for diagnostics/validation only
        isEnabled: function () {
            var cfg = (BFX.config && BFX.config.aiPlatform) || {};
            return Boolean(cfg.enabled && window.BossFxSDK && resolveBaseUrl());
        }
    };
})();
