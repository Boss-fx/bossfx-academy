// ================================================================
// BFX.email — Newsletter & Email Automation Module
// Provider-agnostic: supports Brevo, ConvertKit, Mailchimp
// ================================================================
var BFX = window.BFX || {};

BFX.email = (function() {
    'use strict';

    // ----- Source-to-list mapping -----
    var listMap = {
        'newsletter':   'general',
        'footer':       'general',
        'blog':         'general',
        'webinar':      'webinar',
        'mentorship':   'mentorship',
        'resource':     'resource',
        'exit-popup':   'general',
        'sticky-cta':   'general'
    };

    // ----- Subscribe -----
    function subscribe(email, source, meta) {
        var config = BFX.config && BFX.config.email;
        if (!config || config.provider === 'none') {
            return fallbackSubscribe(email, source, meta);
        }

        var listKey = listMap[source] || 'general';
        var listId = config.lists[listKey] || config.lists.general;

        var payload = {
            email: email,
            source: source,
            list: listKey,
            listId: listId,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            meta: meta || {}
        };

        // Route to provider
        switch (config.provider) {
            case 'brevo':
                return brevoSubscribe(payload, config);
            case 'convertkit':
                return convertkitSubscribe(payload, config);
            case 'mailchimp':
                return mailchimpSubscribe(payload, config);
            default:
                return fallbackSubscribe(email, source, meta);
        }
    }

    // ----- Brevo (Sendinblue) -----
    function brevoSubscribe(payload, config) {
        return fetch(config.apiEndpoint || 'https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.publicKey
            },
            body: JSON.stringify({
                email: payload.email,
                listIds: [parseInt(payload.listId)],
                attributes: {
                    SOURCE: payload.source,
                    SIGNUP_PAGE: payload.page,
                    SIGNUP_DATE: payload.timestamp
                },
                updateEnabled: true
            })
        }).then(handleResponse);
    }

    // ----- ConvertKit -----
    function convertkitSubscribe(payload, config) {
        var formId = payload.listId || config.lists.general;
        return fetch('https://api.convertkit.com/v3/forms/' + formId + '/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: config.publicKey,
                email: payload.email,
                tags: [payload.source],
                fields: {
                    source: payload.source,
                    signup_page: payload.page
                }
            })
        }).then(handleResponse);
    }

    // ----- Mailchimp (via server proxy) -----
    function mailchimpSubscribe(payload, config) {
        return fetch(config.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: payload.email,
                list_id: payload.listId,
                tags: [payload.source],
                merge_fields: {
                    SOURCE: payload.source,
                    PAGE: payload.page
                }
            })
        }).then(handleResponse);
    }

    // ----- Fallback (Formspree) -----
    function fallbackSubscribe(email, source, meta) {
        var endpoint = (BFX.config && BFX.config.formspree) || 'https://formspree.io/f/xeenzyna';
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                _subject: 'New subscriber from ' + (source || 'website'),
                source: source || 'unknown',
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                meta: meta || {}
            })
        }).then(handleResponse);
    }

    // ----- Response handler -----
    function handleResponse(res) {
        if (res.ok) {
            if (BFX.analytics && BFX.analytics.track) {
                BFX.analytics.track('email_subscribe', {
                    source: arguments[1] || 'unknown',
                    page: window.location.pathname
                });
            }
            return { success: true };
        }
        return res.json().then(function(data) {
            return { success: false, error: data.message || 'Subscription failed' };
        });
    }

    // ----- Bind existing newsletter forms -----
    function bindForms() {
        var forms = document.querySelectorAll('.newsletter-form, [data-bfx-subscribe]');
        forms.forEach(function(form) {
            // Skip already bound
            if (form.dataset.bfxBound) return;
            form.dataset.bfxBound = 'true';

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var emailInput = form.querySelector('input[type="email"]');
                if (!emailInput || !emailInput.value.trim()) return;

                var source = form.dataset.source || 'newsletter';
                var btn = form.querySelector('button[type="submit"], button');
                var origText = btn ? btn.textContent : '';

                if (btn) {
                    btn.textContent = 'Subscribing...';
                    btn.disabled = true;
                }

                subscribe(emailInput.value.trim(), source).then(function(result) {
                    if (result && result.success) {
                        emailInput.value = '';
                        if (btn) btn.textContent = 'Subscribed!';
                        setTimeout(function() {
                            if (btn) {
                                btn.textContent = origText;
                                btn.disabled = false;
                            }
                        }, 3000);
                    } else {
                        if (btn) {
                            btn.textContent = 'Try again';
                            btn.disabled = false;
                        }
                    }
                }).catch(function() {
                    if (btn) {
                        btn.textContent = 'Try again';
                        btn.disabled = false;
                    }
                });
            });
        });
    }

    // ----- Init -----
    function init() {
        bindForms();
    }

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        subscribe: subscribe,
        bindForms: bindForms
    };
})();
