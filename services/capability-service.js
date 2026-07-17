// ================================================================
// BFX.capabilityService — cached capability discovery (ASL, ADR-012 Rec 1)
// UI reads platform capabilities dynamically instead of assuming them.
// Orchestration only — no AI logic, no raw fetch.
// ================================================================
var BFX = window.BFX || {};

BFX.capabilityService = (function () {
    'use strict';

    var TTL_MS = 60000;
    var cache = null;
    var fetchedAt = 0;

    function list() {
        var client = BFX.aiClient && BFX.aiClient.get();
        if (!client) return Promise.resolve([]); // AI disabled → nothing advertised
        var now = Date.now();
        if (cache && now - fetchedAt < TTL_MS) return Promise.resolve(cache);
        return client.capabilities().then(function (caps) {
            cache = caps;
            fetchedAt = Date.now();
            return caps;
        });
    }

    function isEnabled(id) {
        return list().then(function (caps) {
            for (var i = 0; i < caps.length; i++) {
                if (caps[i].id === id) return Boolean(caps[i].enabled);
            }
            return false;
        });
    }

    return { list: list, isEnabled: isEnabled };
})();
