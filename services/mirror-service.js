// ================================================================
// BFX.mirrorService — Mirror's ASL orchestration (ADR-012, Session C-ready)
// The Mirror widget calls THIS; this calls the SDK; the SDK calls the
// platform. All AI logic (RAG, prompts, providers, grounding) lives in
// the AI Platform — never here, never in the widget.
// ================================================================
var BFX = window.BFX || {};

BFX.mirrorService = (function () {
    'use strict';

    var conversationId = null;

    function track(event, data) {
        if (typeof window.trackEvent === 'function') window.trackEvent(event, data || {});
    }

    /**
     * Ask the platform's learning assistant. Resolves the SDK ChatResult:
     * { kind: "answer"|"no_answer", answer?, citations[], requestId }.
     * The widget renders it; no_answer → mentor-routing CTA (a success, not an error).
     */
    function ask(message, ctx) {
        var client = BFX.aiClient && BFX.aiClient.get();
        if (!client) {
            return Promise.reject(new Error('AI is not enabled'));
        }
        var started = Date.now();
        track('mirror_sdk_ask', { page: (ctx && ctx.page) || '' });
        return client
            .chat({
                message: message,
                conversationId: conversationId || undefined,
                context: { page: (ctx && ctx.page) || '' }
            })
            .then(function (res) {
                conversationId = res.conversationId || conversationId;
                track(res.kind === 'no_answer' ? 'mirror_no_answer' : 'mirror_answer', {
                    ms: Date.now() - started,
                    requestId: res.requestId
                });
                return res;
            })
            .catch(function (err) {
                track('mirror_sdk_error', { code: err && err.code, requestId: err && err.requestId });
                throw err;
            });
    }

    return { ask: ask };
})();
