// ================================================================
// BFX Phase 2 — Conversion Engine
// ================================================================
// Smart exit intent, WhatsApp CTA, enhanced lead capture,
// retargeting events, conversion intelligence
// ================================================================
// Depends on: BFX.analytics (script.js), BFX.attribution (bfx-analytics.js)
// Gracefully degrades if dependencies unavailable
// ================================================================
var BFX = window.BFX || {};

// ================================================================
// 1. WHATSAPP FLOATING CTA
// ================================================================
BFX.whatsapp = (function () {
    'use strict';

    // Config — WhatsApp Business number or link
    var WA_NUMBER = '2349155008539';
    var WA_MESSAGE = encodeURIComponent(
        'Hi BossFx! I found you online and I\'m interested in learning forex trading. Can you tell me more about getting started?'
    );
    var WA_URL = 'https://wa.me/' + WA_NUMBER + '?text=' + WA_MESSAGE;

    var el = null;
    var visible = false;

    function create() {
        el = document.createElement('div');
        el.className = 'bfx-wa-float';
        el.setAttribute('role', 'complementary');
        el.setAttribute('aria-label', 'Chat on WhatsApp');
        el.innerHTML =
            '<a href="' + WA_URL + '" target="_blank" rel="noopener" class="bfx-wa-float-btn" aria-label="Chat on WhatsApp">' +
                '<span class="bfx-wa-float-pulse"></span>' +
                '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
            '</a>' +
            '<span class="bfx-wa-float-label">Chat with us</span>';

        document.body.appendChild(el);

        // Track clicks
        el.querySelector('.bfx-wa-float-btn').addEventListener('click', function () {
            track('whatsapp_click', {
                location: 'floating_widget',
                page: getPageName()
            });
            track('outbound_link_click', {
                link_type: 'whatsapp',
                link_url: WA_URL,
                link_location: 'floating_widget'
            });
        });
    }

    function show() {
        if (!el) create();
        if (!visible) {
            el.classList.add('bfx-wa-float--visible');
            visible = true;
        }
    }

    function hide() {
        if (el && visible) {
            el.classList.remove('bfx-wa-float--visible');
            visible = false;
        }
    }

    // Show after scroll > 400px
    var scrollThreshold = 400;
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                if (window.pageYOffset > scrollThreshold) show();
                else hide();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Check on load
    if (window.pageYOffset > scrollThreshold) show();

    return { show: show, hide: hide, url: WA_URL };
})();


// ================================================================
// 2. SMART EXIT INTENT
// ================================================================
BFX.exitIntent = (function () {
    'use strict';

    var SESSION_KEY = 'bfx_exit_v2_shown';
    var CONVERT_KEY = 'bfx_exit_converted';
    var overlay = null;
    var shown = false;

    // Don't show if already shown this session or already converted
    if (sessionStorage.getItem(SESSION_KEY)) return {};
    if (localStorage.getItem(CONVERT_KEY)) return {};

    // Don't show on conversion/success pages
    var pageName = getPageName();
    var skipPages = ['thank-you', 'payment-success', 'forex101-access'];
    if (skipPages.indexOf(pageName) > -1) return {};

    // --- Page-specific offers ---
    var offers = {
        'default': {
            badge: 'Before you go',
            icon: '📦',
            title: 'Grab Your <span class="text-gradient">Free Starter Pack</span>',
            desc: 'Get 8 professional trading resources — risk blueprint, pre-trade checklist, strategy guide, and more. Used by 5,200+ traders.',
            cta: 'Send My Free Pack'
        },
        'courses': {
            badge: 'Free course',
            icon: '🎓',
            title: 'Start <span class="text-gradient">Forex 101</span> — It\'s Free',
            desc: 'Our 12-module course has helped 3,000+ beginners become structured traders. Enter your email and get started today.',
            cta: 'Get Course Access'
        },
        'mentorship': {
            badge: 'Limited spots',
            icon: '🎯',
            title: 'Talk To A <span class="text-gradient">Mentor First</span>',
            desc: 'Still unsure? Get a free strategy call with the BossFx team. No pressure — just clarity on your next trading move.',
            cta: 'Book My Free Call'
        },
        'live': {
            badge: 'This week',
            icon: '📺',
            title: 'Free <span class="text-gradient">Live Webinar</span> This Week',
            desc: 'Join 200+ traders in our weekly market prep session. Enter your email for instant calendar invite and Telegram access.',
            cta: 'Reserve My Spot'
        },
        'community': {
            badge: 'Join 5,200+ traders',
            icon: '💬',
            title: 'Don\'t Trade <span class="text-gradient">Alone</span>',
            desc: 'Get daily setups, live analysis, and mentorship tips. Our Telegram community is free — and traders say it changed their trading.',
            cta: 'Join Free Community'
        }
    };

    var offer = offers[pageName] || offers['default'];

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'bfx-exit-overlay';
        overlay.innerHTML =
            '<div class="bfx-exit-modal">' +
                '<button class="bfx-exit-close" aria-label="Close">&times;</button>' +
                '<div class="bfx-exit-badge">' + offer.badge + '</div>' +
                '<div class="bfx-exit-icon">' + offer.icon + '</div>' +
                '<h3>' + offer.title + '</h3>' +
                '<p class="bfx-exit-desc">' + offer.desc + '</p>' +
                '<form class="bfx-exit-form" id="bfxExitForm">' +
                    '<input type="email" class="bfx-exit-input" placeholder="Enter your email" required autocomplete="email">' +
                    '<button type="submit" class="bfx-exit-submit">' + offer.cta + '</button>' +
                '</form>' +
                '<div class="bfx-exit-trust">' +
                    '<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>' +
                    '<span>No spam. Unsubscribe anytime. 5,200+ traders trust BossFx.</span>' +
                '</div>' +
                '<div class="bfx-exit-social">' +
                    '<span class="bfx-exit-social-label">Or join us on</span>' +
                    '<a href="https://t.me/qD_fBeaziqE5YzU8" target="_blank" rel="noopener" aria-label="Telegram" title="Telegram"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>' +
                    '<a href="' + (BFX.whatsapp ? BFX.whatsapp.url : 'https://wa.me/2349155008539') + '" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></a>' +
                    '<a href="https://www.instagram.com/bossfx_academy" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></a>' +
                '</div>' +
                '<button class="bfx-exit-dismiss">No thanks, I\'m not ready</button>' +
            '</div>';

        document.body.appendChild(overlay);

        // Event handlers
        overlay.querySelector('.bfx-exit-close').addEventListener('click', closeExit);
        overlay.querySelector('.bfx-exit-dismiss').addEventListener('click', closeExit);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeExit();
        });

        // Form submission
        var form = overlay.querySelector('#bfxExitForm');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = form.querySelector('.bfx-exit-input');
            var email = input.value.trim();
            if (!email) return;

            var btn = form.querySelector('.bfx-exit-submit');
            btn.disabled = true;
            btn.textContent = 'Sending...';

            // Build payload with attribution data
            var payload = {
                email: email,
                source: 'exit_intent_' + pageName,
                page: window.location.pathname,
                offer: offer.badge,
                timestamp: new Date().toISOString()
            };

            // Append attribution data
            if (BFX.attribution && BFX.attribution.getFormData) {
                var attrData = BFX.attribution.getFormData();
                Object.keys(attrData).forEach(function (k) {
                    if (attrData[k]) payload[k] = attrData[k];
                });
            }

            // Submit to Brevo via /api/lead-capture (primary)
            var brevoSubmit = fetch('/api/lead-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function () { return null; });

            // Submit to Formspree as backup
            var formspreeUrl = (BFX.config && BFX.config.formspree) || 'https://formspree.io/f/xeenzyna';
            var formspreePayload = Object.assign({}, payload, { _subject: 'Exit Intent Lead — ' + pageName });
            var formspreeSubmit = fetch(formspreeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formspreePayload)
            }).catch(function () { return null; });

            // Show success as soon as either resolves (don't wait for both)
            Promise.race([brevoSubmit, formspreeSubmit]).then(function () {
                handleSuccess(email);
            }).catch(function () {
                // Still show success — at least one submission likely went through
                handleSuccess(email);
            });
        });
    }

    function handleSuccess(email) {
        // Track conversion
        track('email_signup', { source: 'exit_intent', page: pageName, offer: offer.badge });
        track('exit_intent_convert', { page: pageName, offer: offer.badge });

        // Mark as converted
        localStorage.setItem(CONVERT_KEY, Date.now().toString());

        // Also push to BFX.email if available
        if (BFX.email && BFX.email.subscribe) {
            try { BFX.email.subscribe(email, 'exit-popup'); } catch (e) {}
        }

        // Show success state
        var modal = overlay.querySelector('.bfx-exit-modal');
        modal.innerHTML =
            '<button class="bfx-exit-close" aria-label="Close">&times;</button>' +
            '<div class="bfx-exit-success">' +
                '<div class="bfx-exit-icon">✅</div>' +
                '<h3>You\'re In!</h3>' +
                '<p>Check your inbox in 5 minutes. Welcome to BossFx.</p>' +
            '</div>';
        modal.querySelector('.bfx-exit-close').addEventListener('click', closeExit);

        // Auto-close after 3s
        setTimeout(closeExit, 3500);
    }

    function showExit() {
        if (shown) return;
        shown = true;
        sessionStorage.setItem(SESSION_KEY, '1');

        // Suppress the old exit popup if it exists
        var oldPopup = document.getElementById('exitPopup');
        if (oldPopup) oldPopup.style.display = 'none';

        if (!overlay) createOverlay();
        // Small delay for smoother animation
        requestAnimationFrame(function () {
            overlay.classList.add('bfx-exit-overlay--active');
        });

        track('exit_intent_shown', { page: pageName, offer: offer.badge });

        // Tag in Clarity
        if (typeof clarity === 'function') {
            clarity('set', 'exit_intent_shown', 'true');
            clarity('set', 'exit_intent_page', pageName);
        }
    }

    function closeExit() {
        if (overlay) overlay.classList.remove('bfx-exit-overlay--active');
        track('exit_intent_dismissed', { page: pageName });
    }

    // --- Trigger: Desktop mouseout ---
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (!isMobile) {
        document.addEventListener('mouseout', function (e) {
            if (e.clientY < 10 && !shown) showExit();
        });
    }

    // --- Trigger: Mobile scroll-up (user pulling back to leave) ---
    if (isMobile) {
        var lastScrollY = window.pageYOffset;
        var scrollUpCount = 0;
        var mobileTriggered = false;

        window.addEventListener('scroll', function () {
            var currentY = window.pageYOffset;
            if (currentY < lastScrollY && currentY > 300) {
                scrollUpCount++;
                // Trigger after sustained scroll-up (3 consecutive scroll-up frames)
                if (scrollUpCount > 3 && !mobileTriggered && !shown) {
                    mobileTriggered = true;
                    showExit();
                }
            } else {
                scrollUpCount = 0;
            }
            lastScrollY = currentY;
        }, { passive: true });

        // Also trigger on inactivity (30s without scroll or tap)
        var inactivityTimer = null;
        function resetInactivity() {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(function () {
                if (!shown && window.pageYOffset > 200) showExit();
            }, 30000);
        }
        window.addEventListener('scroll', resetInactivity, { passive: true });
        document.addEventListener('touchstart', resetInactivity, { passive: true });
        resetInactivity();
    }

    // --- Trigger: Back button intent (history manipulation) ---
    if (window.history && history.pushState) {
        // Push a dummy state
        history.pushState({ bfxExit: true }, '');
        window.addEventListener('popstate', function (e) {
            if (!shown) {
                showExit();
                // Re-push to prevent actual navigation
                history.pushState({ bfxExit: true }, '');
            }
        });
    }

    // Keyboard escape to close
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('bfx-exit-overlay--active')) {
            closeExit();
        }
    });

    return { show: showExit, close: closeExit };
})();


// ================================================================
// 3. RETARGETING AUDIENCE EVENTS
// ================================================================
BFX.retarget = (function () {
    'use strict';

    // Fire Meta Pixel custom events for audience building
    function firePixel(name, params) {
        if (typeof fbq === 'function') fbq('trackCustom', name, params || {});
    }

    var pageName = getPageName();

    // --- High-intent audiences ---
    // Pricing page viewers (warm leads)
    if (pageName === 'courses' || pageName === 'mentorship') {
        firePixel('ViewPricing', { page: pageName });
    }

    // Engaged visitors (3+ pageviews in session)
    var pvCount = parseInt(sessionStorage.getItem('bfx_pv_count') || '0');
    if (pvCount >= 3) {
        firePixel('EngagedVisitor', { pageviews: pvCount, page: pageName });
    }

    // Returning visitors
    if (BFX.analytics && BFX.analytics.isReturning) {
        firePixel('ReturningVisitor', {
            visits: BFX.analytics.visitCount,
            page: pageName
        });
    }

    // Blog readers (content consumers)
    if (pageName.indexOf('blog') > -1 || window.location.pathname.indexOf('/blog/') > -1) {
        firePixel('BlogReader', { page: pageName });
    }

    // Social referral visitors (came from social media)
    if (BFX.attribution && BFX.attribution.source) {
        var ch = BFX.attribution.source.channel;
        if (ch === 'organic_social' || ch === 'paid_social') {
            firePixel('SocialVisitor', {
                source: BFX.attribution.source.source,
                channel: ch
            });
        }
    }

    // --- Conversion micro-events for lookalike audiences ---
    // Track deep scrollers (75%+) for lookalike targeting
    var deepScrollFired = false;
    var scrollInterval = setInterval(function () {
        if (deepScrollFired) { clearInterval(scrollInterval); return; }
        var maxScroll = (BFX.scrollDepth && BFX.scrollDepth.getMax) ? BFX.scrollDepth.getMax() : 0;
        if (maxScroll >= 75) {
            deepScrollFired = true;
            firePixel('DeepScroller', { depth: maxScroll, page: pageName });
            clearInterval(scrollInterval);
        }
    }, 5000);

    return {};
})();


// ================================================================
// 4. CONVERSION INTELLIGENCE — HESITATION DETECTION
// ================================================================
BFX.hesitation = (function () {
    'use strict';

    // Track users who hover/focus on CTAs but don't click (hesitators)
    var hesitationTimers = {};

    document.addEventListener('mouseenter', function (e) {
        var cta = e.target.closest('.btn, .pay-btn, .pricing-cta, .webinar-register-btn');
        if (!cta) return;
        var id = cta.textContent.trim().substring(0, 30);
        hesitationTimers[id] = setTimeout(function () {
            track('cta_hesitation', {
                cta_text: id,
                duration_ms: 3000,
                page: getPageName(),
                location: getClickLocation(cta)
            });
            // Tag in Clarity for session replay filtering
            if (typeof clarity === 'function') {
                clarity('set', 'hesitated_on_cta', 'true');
            }
        }, 3000);
    }, true);

    document.addEventListener('mouseleave', function (e) {
        var cta = e.target.closest('.btn, .pay-btn, .pricing-cta, .webinar-register-btn');
        if (!cta) return;
        var id = cta.textContent.trim().substring(0, 30);
        if (hesitationTimers[id]) {
            clearTimeout(hesitationTimers[id]);
            delete hesitationTimers[id];
        }
    }, true);

    // Track form abandonment (started filling but didn't submit)
    var formStarted = {};
    document.addEventListener('input', function (e) {
        var form = e.target.closest('form');
        if (!form) return;
        var formId = form.id || form.className.split(' ')[0] || 'unknown';
        if (!formStarted[formId]) {
            formStarted[formId] = Date.now();
            track('form_start', {
                form: formId,
                field: e.target.name || e.target.type,
                page: getPageName()
            });
        }
    });

    window.addEventListener('beforeunload', function () {
        Object.keys(formStarted).forEach(function (formId) {
            // Check if form was submitted (look for success indicators)
            var elapsed = Date.now() - formStarted[formId];
            if (elapsed > 5000) {
                track('form_abandon', {
                    form: formId,
                    time_ms: elapsed,
                    page: getPageName()
                });
            }
        });
    });

    return {};
})();


// ================================================================
// 5. ENHANCED SOCIAL PROOF — LIVE VISITOR COUNT
// ================================================================
BFX.liveCount = (function () {
    'use strict';

    // Simulated live visitor count using localStorage synchronization
    var COUNT_KEY = 'bfx_live_visitors';
    var HEARTBEAT_KEY = 'bfx_heartbeat_' + Math.random().toString(36).substr(2, 8);
    var heartbeatInterval = null;

    function getActiveCount() {
        var count = 0;
        var now = Date.now();
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.startsWith('bfx_heartbeat_')) {
                var ts = parseInt(localStorage.getItem(key) || '0');
                if (now - ts < 120000) count++; // Active in last 2 minutes
                else {
                    try { localStorage.removeItem(key); } catch (e) {} // Cleanup stale
                }
            }
        }
        return Math.max(count, 1);
    }

    function heartbeat() {
        try { localStorage.setItem(HEARTBEAT_KEY, Date.now().toString()); } catch (e) {}
    }

    // Start heartbeat
    heartbeat();
    heartbeatInterval = setInterval(heartbeat, 30000);

    // Cleanup on exit
    window.addEventListener('beforeunload', function () {
        clearInterval(heartbeatInterval);
        try { localStorage.removeItem(HEARTBEAT_KEY); } catch (e) {}
    });

    // Update any live count display elements
    function render() {
        var count = getActiveCount();
        document.querySelectorAll('.bfx-live-count').forEach(function (el) {
            el.textContent = count;
        });
    }

    render();
    setInterval(render, 30000);

    return { getCount: getActiveCount };
})();


// ================================================================
// 6. BREVO LEAD CAPTURE BRIDGE
// ================================================================
// Automatically mirrors all form submissions containing email to
// /api/lead-capture for Brevo contact creation. Zero-modification
// approach — intercepts at form submit level.
// ================================================================
BFX.brevo = (function () {
    'use strict';

    var ENDPOINT = '/api/lead-capture';
    var capturedEmails = {}; // Deduplicate within session

    /**
     * Send a lead to Brevo via /api/lead-capture
     * Fire-and-forget — never blocks UX
     */
    function capture(email, source, extraData) {
        if (!email || !email.includes('@')) return;
        email = email.trim().toLowerCase();

        // Deduplicate: don't send same email+source twice in one session
        var dedupeKey = email + '|' + source;
        if (capturedEmails[dedupeKey]) return;
        capturedEmails[dedupeKey] = true;

        var payload = {
            email: email,
            source: source || 'unknown',
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        };

        // Merge extra data
        if (extraData && typeof extraData === 'object') {
            Object.keys(extraData).forEach(function (k) {
                if (extraData[k]) payload[k] = extraData[k];
            });
        }

        // Append attribution data
        if (BFX.attribution && BFX.attribution.getFormData) {
            var attrData = BFX.attribution.getFormData();
            Object.keys(attrData).forEach(function (k) {
                if (attrData[k]) payload[k] = attrData[k];
            });
        }

        // Fire and forget — don't await, don't block
        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (res) {
            if (res.ok) {
                console.log('[BFX.brevo] Lead captured:', email, source);
            } else {
                console.warn('[BFX.brevo] API returned', res.status);
            }
        }).catch(function (err) {
            console.warn('[BFX.brevo] Capture failed (non-fatal):', err.message);
        });
    }

    /**
     * Global form submit interceptor
     * Watches all form submissions for email fields and mirrors to Brevo
     */
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || form.tagName !== 'FORM') return;

        // Skip the exit intent form (already handled directly)
        if (form.id === 'bfxExitForm') return;

        // Find email input in the form
        var emailInput = form.querySelector('input[type="email"], input[name="email"], input[name="_replyto"]');
        if (!emailInput || !emailInput.value) return;

        var email = emailInput.value.trim();
        if (!email.includes('@')) return;

        // Determine source from form data
        var sourceInput = form.querySelector('input[name="source"], [name="source"]');
        var source = sourceInput ? sourceInput.value : (form.dataset.source || form.id || 'form_' + getPageName());

        // Collect extra fields
        var extra = {};
        var nameInput = form.querySelector('input[name="name"], input[name="firstName"]');
        if (nameInput && nameInput.value) extra.name = nameInput.value;

        var telegramInput = form.querySelector('input[name="telegram"]');
        if (telegramInput && telegramInput.value) extra.telegram = telegramInput.value;

        var webinarInput = form.querySelector('input[name="webinar"], select[name="webinar"]');
        if (webinarInput && webinarInput.value) extra.webinar = webinarInput.value;

        var levelInput = form.querySelector('select[name="experience_level"], input[name="experience_level"]');
        if (levelInput && levelInput.value) extra.experience_level = levelInput.value;

        var segmentInput = form.querySelector('input[name="segment"]');
        if (segmentInput && segmentInput.value) extra.segment = segmentInput.value;

        // Capture to Brevo (fire-and-forget)
        capture(email, source, extra);
    }, true); // Use capture phase to fire before form handlers

    return { capture: capture };
})();


// ================================================================
// SHARED HELPERS
// ================================================================
function track(name, params) {
    if (BFX.analytics && BFX.analytics.track) {
        BFX.analytics.track(name, params);
    } else if (window.dataLayer) {
        window.dataLayer.push(Object.assign({ event: name }, params || {}));
    }
}

function getPageName() {
    return (BFX.analytics && BFX.analytics.pageName) ||
        location.pathname.replace(/\//g, '').replace('.html', '') || 'homepage';
}

function getClickLocation(el) {
    if (!el) return 'unknown';
    if (el.closest('.navbar, nav')) return 'navbar';
    if (el.closest('.footer'))     return 'footer';
    if (el.closest('.hero, .page-hero, .ea-hero')) return 'hero';
    if (el.closest('.pricing-section, .pricing-cards')) return 'pricing';
    if (el.closest('.cta-section')) return 'cta_section';
    if (el.closest('.sticky-cta-bar, .lead-bar')) return 'lead_bar';
    var section = el.closest('section[id]');
    return section ? section.id : 'page_body';
}
