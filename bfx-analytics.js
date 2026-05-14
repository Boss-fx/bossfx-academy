// ================================================================
// BFX Advanced Analytics & Attribution Engine  v1.0
// ================================================================
// UTM attribution (first-touch + last-touch), traffic source
// detection, event standardization, Clarity enhancement,
// CRM/form passthrough, mobile intelligence, pricing/funnel views
// ================================================================
// Load order: AFTER tracking.js (needs BFX.analytics, BFX.tracking)
// ================================================================
var BFX = window.BFX || {};

// ================================================================
// 1. UTM ATTRIBUTION ENGINE
// ================================================================
BFX.attribution = (function () {
    'use strict';

    var STORAGE_FT  = 'bfx_first_touch';   // First-touch attribution (never overwritten)
    var STORAGE_LT  = 'bfx_last_touch';    // Last-touch attribution (overwritten each visit with params)
    var STORAGE_LP  = 'bfx_landing_page';  // Very first landing page URL
    var SESSION_KEY = 'bfx_session_utm';   // Current session UTM (sessionStorage)

    // --- Parse UTM params from URL ---
    function parseUTM() {
        var params = {};
        try {
            var sp = new URLSearchParams(window.location.search);
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'ref', 'via', 'fbclid', 'gclid', 'ttclid', 'li_fat_id'].forEach(function (key) {
                var val = sp.get(key);
                if (val) params[key] = val.substring(0, 200); // cap length
            });
        } catch (e) { /* old browsers */ }
        return params;
    }

    // --- Detect traffic source from referrer + UTM ---
    function detectSource(utm) {
        // 1) Paid click IDs
        if (utm.gclid)    return { source: 'google',    medium: 'cpc',     channel: 'paid_search' };
        if (utm.fbclid)   return { source: 'facebook',  medium: 'cpc',     channel: 'paid_social' };
        if (utm.ttclid)   return { source: 'tiktok',    medium: 'cpc',     channel: 'paid_social' };
        if (utm.li_fat_id)return { source: 'linkedin',  medium: 'cpc',     channel: 'paid_social' };

        // 2) UTM-tagged traffic
        if (utm.utm_source) {
            var src = utm.utm_source.toLowerCase();
            var med = (utm.utm_medium || '').toLowerCase();
            var channel = 'referral';
            if (med === 'cpc' || med === 'paid' || med === 'ad' || med === 'ppc') channel = 'paid';
            else if (med === 'email') channel = 'email';
            else if (med === 'social' || med === 'reel' || med === 'story' || med === 'post' || med === 'bio') channel = 'organic_social';
            else if (med === 'affiliate' || med === 'influencer') channel = 'affiliate';
            else if (med === 'referral') channel = 'referral';
            return { source: src, medium: med || 'referral', channel: channel };
        }

        // 3) Referrer-based detection
        var ref = document.referrer;
        if (!ref) return { source: '(direct)', medium: '(none)', channel: 'direct' };

        try {
            var host = new URL(ref).hostname.replace('www.', '').toLowerCase();
            // Search engines
            if (/google\./i.test(host))    return { source: 'google',    medium: 'organic', channel: 'organic_search' };
            if (/bing\./i.test(host))      return { source: 'bing',      medium: 'organic', channel: 'organic_search' };
            if (/yahoo\./i.test(host))     return { source: 'yahoo',     medium: 'organic', channel: 'organic_search' };
            if (/duckduckgo/i.test(host))  return { source: 'duckduckgo',medium: 'organic', channel: 'organic_search' };
            if (/baidu/i.test(host))       return { source: 'baidu',     medium: 'organic', channel: 'organic_search' };
            // Social platforms
            if (/instagram/i.test(host))   return { source: 'instagram', medium: 'social',  channel: 'organic_social' };
            if (/t\.co|twitter|x\.com/i.test(host)) return { source: 'x_twitter', medium: 'social', channel: 'organic_social' };
            if (/facebook|fb\.com/i.test(host))     return { source: 'facebook',  medium: 'social', channel: 'organic_social' };
            if (/tiktok/i.test(host))      return { source: 'tiktok',    medium: 'social',  channel: 'organic_social' };
            if (/youtube|youtu\.be/i.test(host))    return { source: 'youtube',   medium: 'social', channel: 'organic_social' };
            if (/linkedin/i.test(host))    return { source: 'linkedin',  medium: 'social',  channel: 'organic_social' };
            if (/t\.me|telegram/i.test(host))       return { source: 'telegram',  medium: 'social', channel: 'organic_social' };
            if (/wa\.me|whatsapp/i.test(host))      return { source: 'whatsapp',  medium: 'social', channel: 'organic_social' };
            if (/reddit/i.test(host))      return { source: 'reddit',    medium: 'social',  channel: 'organic_social' };
            // Same site
            if (host === window.location.hostname.replace('www.', '')) {
                return { source: '(internal)', medium: '(none)', channel: 'internal' };
            }
            // Generic referral
            return { source: host, medium: 'referral', channel: 'referral' };
        } catch (e) {
            return { source: '(direct)', medium: '(none)', channel: 'direct' };
        }
    }

    // --- Build attribution object ---
    function buildAttribution(utm, sourceInfo) {
        return {
            utm_source:   utm.utm_source   || sourceInfo.source  || '',
            utm_medium:   utm.utm_medium   || sourceInfo.medium  || '',
            utm_campaign: utm.utm_campaign || '',
            utm_term:     utm.utm_term     || '',
            utm_content:  utm.utm_content  || '',
            utm_id:       utm.utm_id       || '',
            source:       sourceInfo.source  || '(direct)',
            medium:       sourceInfo.medium  || '(none)',
            channel:      sourceInfo.channel || 'direct',
            referrer:     document.referrer  || '',
            landing_page: window.location.pathname + window.location.search,
            timestamp:    new Date().toISOString(),
            gclid:        utm.gclid  || '',
            fbclid:       utm.fbclid || '',
            ttclid:       utm.ttclid || ''
        };
    }

    // --- Persist ---
    function save(key, obj) {
        try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { /* quota */ }
    }
    function load(key) {
        try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; }
    }

    // --- Init ---
    var utmParams    = parseUTM();
    var sourceInfo   = detectSource(utmParams);
    var attribution  = buildAttribution(utmParams, sourceInfo);
    var hasUTM       = Object.keys(utmParams).length > 0;

    // First-touch: set only once ever
    var firstTouch = load(STORAGE_FT);
    if (!firstTouch) {
        firstTouch = attribution;
        save(STORAGE_FT, firstTouch);
    }

    // Landing page: set only once ever
    if (!localStorage.getItem(STORAGE_LP)) {
        localStorage.setItem(STORAGE_LP, window.location.href);
    }

    // Last-touch: update if there are UTM params or a new referrer (skip internal)
    if (hasUTM || (sourceInfo.channel !== 'internal' && sourceInfo.channel !== 'direct')) {
        save(STORAGE_LT, attribution);
    }
    var lastTouch = load(STORAGE_LT) || firstTouch;

    // Session: always store current session data
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(attribution)); } catch (e) {}

    // --- Set GA4 user properties ---
    if (typeof gtag === 'function') {
        gtag('set', 'user_properties', {
            traffic_source:     lastTouch.source,
            traffic_medium:     lastTouch.medium,
            traffic_channel:    lastTouch.channel,
            first_touch_source: firstTouch.source,
            first_touch_medium: firstTouch.medium,
            utm_source:         lastTouch.utm_source,
            utm_medium:         lastTouch.utm_medium,
            utm_campaign:       lastTouch.utm_campaign
        });
    }

    // --- Set Clarity custom tags ---
    if (typeof clarity === 'function') {
        clarity('set', 'traffic_source',  lastTouch.source);
        clarity('set', 'traffic_channel', lastTouch.channel);
        clarity('set', 'utm_source',      lastTouch.utm_source  || '(none)');
        clarity('set', 'utm_medium',      lastTouch.utm_medium  || '(none)');
        clarity('set', 'utm_campaign',    lastTouch.utm_campaign || '(none)');
        clarity('set', 'landing_page',    localStorage.getItem(STORAGE_LP) || '/');
    }

    // --- Fire attribution event if UTM present ---
    if (hasUTM && BFX.analytics && BFX.analytics.track) {
        BFX.analytics.track('campaign_landing', {
            utm_source:   utmParams.utm_source   || '',
            utm_medium:   utmParams.utm_medium   || '',
            utm_campaign: utmParams.utm_campaign || '',
            utm_content:  utmParams.utm_content  || '',
            channel:      sourceInfo.channel,
            landing_page: window.location.pathname
        });
    }

    // --- Public API ---
    return {
        utmParams:    utmParams,
        firstTouch:   firstTouch,
        lastTouch:    lastTouch,
        source:       sourceInfo,
        current:      attribution,
        hasUTM:       hasUTM,
        /** Get flat attribution data for form injection */
        getFormData: function () {
            return {
                _bfx_source:       lastTouch.source,
                _bfx_medium:       lastTouch.medium,
                _bfx_channel:      lastTouch.channel,
                _bfx_campaign:     lastTouch.utm_campaign,
                _bfx_utm_source:   lastTouch.utm_source,
                _bfx_utm_medium:   lastTouch.utm_medium,
                _bfx_utm_campaign: lastTouch.utm_campaign,
                _bfx_utm_content:  lastTouch.utm_content,
                _bfx_utm_term:     lastTouch.utm_term,
                _bfx_landing_page: localStorage.getItem(STORAGE_LP) || '/',
                _bfx_referrer:     lastTouch.referrer,
                _bfx_ft_source:    firstTouch.source,
                _bfx_ft_medium:    firstTouch.medium
            };
        }
    };
})();


// ================================================================
// 2. FORM ATTRIBUTION INJECTION
// ================================================================
BFX.formInject = (function () {
    'use strict';

    function injectHiddenFields(form) {
        if (!form || form.dataset.bfxInjected) return;
        form.dataset.bfxInjected = 'true';

        var data = BFX.attribution.getFormData();
        Object.keys(data).forEach(function (key) {
            if (!data[key]) return;
            var input = document.createElement('input');
            input.type  = 'hidden';
            input.name  = key;
            input.value = data[key];
            form.appendChild(input);
        });
    }

    // Inject into all forms on page
    function injectAll() {
        document.querySelectorAll('form').forEach(injectHiddenFields);
    }

    // Also inject on dynamic form appearance (modals, etc.)
    var formObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.tagName === 'FORM') injectHiddenFields(node);
                if (node.querySelectorAll) {
                    node.querySelectorAll('form').forEach(injectHiddenFields);
                }
            });
        });
    });

    injectAll();
    formObserver.observe(document.body, { childList: true, subtree: true });

    // Enhance BFX.formEngine.collect if it exists
    if (BFX.formEngine && BFX.formEngine.collect) {
        var origCollect = BFX.formEngine.collect;
        BFX.formEngine.collect = function (form) {
            var data = origCollect(form);
            // Append attribution data
            var attrData = BFX.attribution.getFormData();
            Object.keys(attrData).forEach(function (key) {
                if (attrData[key]) data.append(key, attrData[key]);
            });
            return data;
        };
    }

    return { inject: injectAll, injectForm: injectHiddenFields };
})();


// ================================================================
// 3. STANDARDIZED EVENT TAXONOMY
// ================================================================
// Maps canonical event names to the required GA4 Key Events.
// Listens for existing events and fires the standardized alias.
// ================================================================
BFX.eventStandard = (function () {
    'use strict';

    // Attach attribution data to every tracked event
    if (BFX.analytics && BFX.analytics.track && !BFX.analytics._attrEnhanced) {
        BFX.analytics._attrEnhanced = true;
        var _origTrack = BFX.analytics.track;
        BFX.analytics.track = function (name, params) {
            var p = Object.assign({}, params || {});
            // Attach lightweight attribution context to every event
            if (BFX.attribution && BFX.attribution.lastTouch) {
                p._src     = BFX.attribution.lastTouch.source;
                p._channel = BFX.attribution.lastTouch.channel;
                p._campaign = BFX.attribution.lastTouch.utm_campaign || '';
            }
            _origTrack(name, p);
        };
    }

    // --- Event aliasing ---
    // Maps existing event names to the canonical names required
    var ALIASES = {
        'webinar_register':      'webinar_signup',
        'webinar_registration':  'webinar_signup',
        'mentorship_application':'mentorship_apply',
        'starter_pack_download': 'toolkit_download',
        'resource_download_click':'strategy_download',
        'email_subscribe':       'email_signup',
        'newsletter_signup':     'email_signup',
        'lead_bar_signup':       'email_signup',
        'chatbot_opened':        'chatbot_interaction',
        'chatbot_message_sent':  'chatbot_interaction'
    };

    // Intercept dataLayer pushes to fire aliases
    var _origDLPush = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function () {
        var result = _origDLPush.apply(this, arguments);
        for (var i = 0; i < arguments.length; i++) {
            var entry = arguments[i];
            if (entry && entry.event && ALIASES[entry.event]) {
                var aliasName = ALIASES[entry.event];
                // Avoid infinite loop: don't re-alias
                if (!entry._bfx_alias) {
                    var aliasData = Object.assign({}, entry, {
                        event: aliasName,
                        _bfx_alias: true,
                        original_event: entry.event
                    });
                    _origDLPush.call(window.dataLayer, aliasData);
                    // Also fire to GA4 directly for Key Event eligibility
                    if (typeof gtag === 'function') {
                        gtag('event', aliasName, {
                            original_event: entry.event,
                            page: window.location.pathname
                        });
                    }
                }
            }
        }
        return result;
    };

    return { ALIASES: ALIASES };
})();


// ================================================================
// 4. MISSING EVENT TRACKERS
// ================================================================
BFX.extraEvents = (function () {
    'use strict';

    var track = (BFX.analytics && BFX.analytics.track) || function () {};

    // --- 4a. Pricing Section View ---
    (function () {
        var pricingSections = document.querySelectorAll('.pricing-section, #pricing, .pricing-cards, .price-cards-grid');
        if (!pricingSections.length) return;
        var fired = false;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting && !fired) {
                    fired = true;
                    track('pricing_view', {
                        page: window.location.pathname,
                        section: e.target.id || 'pricing'
                    });
                    obs.disconnect();
                }
            });
        }, { threshold: 0.2 });
        pricingSections.forEach(function (s) { obs.observe(s); });
    })();

    // --- 4b. Broker Signup Clicks ---
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = (link.getAttribute('href') || '').toLowerCase();
        // Detect broker-related links
        if (/deriv\.|exness\.|icmarkets\.|fpmarkets\.|xm\.|fbs\.|octafx\.|hotforex\.|fxtm\.|pepperstone\.|oanda\.|broker/i.test(href)) {
            track('broker_signup_click', {
                broker_url: link.href,
                broker_text: (link.textContent || '').trim().substring(0, 50),
                location: getClickLocation(link),
                page: window.location.pathname
            });
        }
    }, true);

    // --- 4c. Funded/Prop Firm Interest ---
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href], button, .btn');
        if (!link) return;
        var text = (link.textContent || '').toLowerCase();
        var href = (link.getAttribute('href') || '').toLowerCase();
        if (/(funded|ftmo|prop.firm|challenge|evaluation|topstep|the5ers|myfundedfx)/i.test(text + ' ' + href)) {
            track('funded_interest', {
                element_text: (link.textContent || '').trim().substring(0, 50),
                href: href,
                location: getClickLocation(link),
                page: window.location.pathname
            });
        }
    }, true);

    // --- 4d. Video Watch Tracking ---
    // YouTube iframe API integration
    (function () {
        var iframes = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]');
        if (!iframes.length) return;

        // Load YouTube iframe API
        if (!window.YT) {
            var tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            var first = document.getElementsByTagName('script')[0];
            first.parentNode.insertBefore(tag, first);
        }

        window.onYouTubeIframeAPIReady = function () {
            iframes.forEach(function (iframe, idx) {
                // Ensure enablejsapi=1
                var src = iframe.src;
                if (src.indexOf('enablejsapi') === -1) {
                    iframe.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'enablejsapi=1';
                }
                if (!iframe.id) iframe.id = 'bfx-yt-' + idx;

                try {
                    new YT.Player(iframe.id, {
                        events: {
                            'onStateChange': function (event) {
                                var states = { 1: 'play', 2: 'pause', 0: 'complete' };
                                var state = states[event.data];
                                if (state) {
                                    track('video_watch', {
                                        action: state,
                                        video_title: event.target.getVideoData ? event.target.getVideoData().title : '',
                                        video_id: iframe.id,
                                        page: window.location.pathname
                                    });
                                }
                            }
                        }
                    });
                } catch (err) { /* iframe might be cross-origin restricted */ }
            });
        };
    })();

    // --- 4e. CTA Button Click (generic fallback) ---
    // Track any .btn or button click not already tracked
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.btn, button[class*="cta"], a[class*="cta"]');
        if (!btn) return;
        // Skip if already tracked by other specific handlers
        if (btn.classList.contains('pay-btn') || btn.classList.contains('webinar-register-btn') ||
            btn.classList.contains('magnet-btn') || btn.classList.contains('notify-btn') ||
            btn.closest('.bfx-pnav') || btn.closest('.bfx-chat-panel') ||
            btn.closest('.mobile-toggle') || btn.tagName === 'BUTTON' && btn.type === 'submit') return;

        track('cta_button_click', {
            text: (btn.textContent || '').trim().substring(0, 50),
            href: btn.getAttribute('href') || '',
            classes: btn.className.substring(0, 80),
            location: getClickLocation(btn),
            page: window.location.pathname
        });
    }, true);

    // --- 4f. Contact Form Submit (re-fire as standard event) ---
    var contactForm = document.querySelector('#applyForm, form[action*="formspree"]');
    if (contactForm && (BFX.analytics && BFX.analytics.pageName === 'contact')) {
        contactForm.addEventListener('submit', function () {
            track('contact_form_submit', {
                page: 'contact',
                source: BFX.attribution ? BFX.attribution.lastTouch.source : '',
                channel: BFX.attribution ? BFX.attribution.lastTouch.channel : ''
            });
        });
    }

    // --- Helper: determine click location ---
    function getClickLocation(el) {
        if (el.closest('.navbar, nav, .nav-links')) return 'navbar';
        if (el.closest('.footer'))          return 'footer';
        if (el.closest('.sticky-cta-bar'))  return 'sticky_cta';
        if (el.closest('.hero, .page-hero, .ea-hero')) return 'hero';
        if (el.closest('.cta-section'))     return 'cta_section';
        if (el.closest('.pricing-section, .pricing-cards, .price-cards-grid')) return 'pricing';
        if (el.closest('.exit-popup'))      return 'exit_popup';
        if (el.closest('.tg-float'))        return 'floating_widget';
        if (el.closest('.lead-bar'))        return 'lead_bar';
        if (el.closest('article'))          return 'article';
        var section = el.closest('section[id]');
        return section ? section.id : 'page_body';
    }

    return {};
})();


// ================================================================
// 5. ENHANCED CLARITY INTEGRATION
// ================================================================
BFX.clarityEnhance = (function () {
    'use strict';

    if (typeof clarity !== 'function') return {};

    // Page type classification
    var pageName = (BFX.analytics && BFX.analytics.pageName) || '';
    var pageType = 'page';
    if (pageName === 'homepage' || pageName === 'index' || pageName === '') pageType = 'homepage';
    else if (pageName === 'courses')     pageType = 'product_listing';
    else if (pageName === 'mentorship')  pageType = 'product_listing';
    else if (pageName === 'live')        pageType = 'events';
    else if (pageName === 'community')   pageType = 'community';
    else if (pageName === 'contact')     pageType = 'contact';
    else if (pageName === 'about')       pageType = 'about';
    else if (pageName === 'thank-you')   pageType = 'conversion';
    else if (pageName === 'payment-success') pageType = 'conversion';
    else if (pageName === 'forex101-access') pageType = 'product_access';
    else if (location.pathname.indexOf('/blog/') > -1) pageType = 'blog';

    clarity('set', 'page_type', pageType);

    // Funnel stage
    if (BFX.funnel && BFX.funnel.getStage) {
        clarity('set', 'funnel_stage', BFX.funnel.getStage());
    }

    // Engagement prediction: tag high-value sessions
    // (sessions with 3+ page views or returning visitors on key pages)
    var pvCount = parseInt(sessionStorage.getItem('bfx_pv_count') || '0') + 1;
    sessionStorage.setItem('bfx_pv_count', String(pvCount));
    clarity('set', 'session_pageviews', String(pvCount));

    if (pvCount >= 3) {
        clarity('set', 'engagement_level', 'high');
    } else if (pvCount >= 2) {
        clarity('set', 'engagement_level', 'medium');
    } else {
        clarity('set', 'engagement_level', 'low');
    }

    // Tag conversion pages
    if (pageType === 'conversion' || pageType === 'product_access') {
        clarity('set', 'is_converter', 'true');
    }

    // Tag mobile vs desktop for Clarity filtering
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);
    clarity('set', 'device_class', isMobile ? 'mobile' : 'desktop');

    // Screen size bucket
    var w = window.innerWidth;
    var screenBucket = w < 480 ? 'xs' : w < 768 ? 'sm' : w < 1024 ? 'md' : w < 1440 ? 'lg' : 'xl';
    clarity('set', 'screen_bucket', screenBucket);

    return {};
})();


// ================================================================
// 6. MOBILE INTELLIGENCE
// ================================================================
BFX.mobileTrack = (function () {
    'use strict';

    var track = (BFX.analytics && BFX.analytics.track) || function () {};
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (!isMobile) return {};

    // --- Orientation change ---
    var lastOrientation = screen.orientation ? screen.orientation.type : '';
    window.addEventListener('orientationchange', function () {
        var newOrientation = screen.orientation ? screen.orientation.type : '';
        track('mobile_orientation_change', {
            from: lastOrientation,
            to: newOrientation,
            page: window.location.pathname
        });
        lastOrientation = newOrientation;
    });

    // --- Tap heatmap data (aggregate, no PII) ---
    var tapZones = { top: 0, middle: 0, bottom: 0 };
    document.addEventListener('touchstart', function (e) {
        if (!e.touches.length) return;
        var y = e.touches[0].clientY;
        var vh = window.innerHeight;
        if (y < vh * 0.33) tapZones.top++;
        else if (y < vh * 0.66) tapZones.middle++;
        else tapZones.bottom++;
    }, { passive: true });

    // Report tap zones on page exit
    window.addEventListener('beforeunload', function () {
        var total = tapZones.top + tapZones.middle + tapZones.bottom;
        if (total < 3) return; // not enough data
        track('mobile_tap_zones', {
            top_pct:    Math.round((tapZones.top / total) * 100),
            middle_pct: Math.round((tapZones.middle / total) * 100),
            bottom_pct: Math.round((tapZones.bottom / total) * 100),
            total_taps: total
        });
    });

    // --- Detect thumb-zone usability ---
    // Track if sticky CTA and floating Telegram are reachable
    var stickyBar = document.querySelector('.sticky-cta-bar');
    var floatTg   = document.querySelector('.tg-float-btn');
    if (stickyBar || floatTg) {
        track('mobile_ux_elements', {
            has_sticky_cta: !!stickyBar,
            has_floating_tg: !!floatTg,
            viewport_height: window.innerHeight,
            viewport_width:  window.innerWidth
        });
    }

    return { tapZones: tapZones };
})();


// ================================================================
// 7. PAGE ENGAGEMENT SCORING
// ================================================================
BFX.engagementScore = (function () {
    'use strict';

    var track = (BFX.analytics && BFX.analytics.track) || function () {};
    var score = 0;
    var scored = {};

    function addScore(action, points) {
        if (scored[action]) return;
        scored[action] = true;
        score += points;
    }

    // Scroll milestones
    var scrollCheck = setInterval(function () {
        var maxScroll = (BFX.scrollDepth && BFX.scrollDepth.getMax) ? BFX.scrollDepth.getMax() : 0;
        if (maxScroll >= 25) addScore('scroll_25', 5);
        if (maxScroll >= 50) addScore('scroll_50', 10);
        if (maxScroll >= 75) addScore('scroll_75', 15);
        if (maxScroll >= 100) addScore('scroll_100', 20);
    }, 5000);

    // Time on page
    setTimeout(function () { addScore('time_30s', 10); }, 30000);
    setTimeout(function () { addScore('time_60s', 15); }, 60000);
    setTimeout(function () { addScore('time_180s', 25); }, 180000);

    // Page navigation usage
    var navObs = new MutationObserver(function () {
        if (document.querySelector('.bfx-pnav--open')) addScore('used_nav', 10);
    });
    var nav = document.querySelector('.bfx-pnav');
    if (nav) navObs.observe(nav, { attributes: true, attributeFilter: ['class'] });

    // Multiple section views
    var sectionCount = 0;
    var origSectionTrack = (BFX.analytics && BFX.analytics.track) || function(){};
    // Intercept section_view events via dataLayer
    var _dlPush2 = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function () {
        var result = _dlPush2.apply(this, arguments);
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] && arguments[i].event === 'section_view') {
                sectionCount++;
                if (sectionCount >= 3) addScore('sections_3', 10);
                if (sectionCount >= 5) addScore('sections_5', 15);
            }
        }
        return result;
    };

    // Report score on exit
    window.addEventListener('beforeunload', function () {
        clearInterval(scrollCheck);
        var level = score < 15 ? 'low' : score < 40 ? 'medium' : score < 70 ? 'high' : 'very_high';
        track('engagement_score', {
            score: score,
            level: level,
            page: (BFX.analytics && BFX.analytics.pageName) || ''
        });

        // Tag in Clarity
        if (typeof clarity === 'function') {
            clarity('set', 'engagement_score', String(score));
            clarity('set', 'engagement_tier', level);
        }
    });

    return { getScore: function () { return score; } };
})();


// ================================================================
// 8. CONVERSION FLOW TRACKING
// ================================================================
BFX.conversionFlow = (function () {
    'use strict';

    var track = (BFX.analytics && BFX.analytics.track) || function () {};
    var FLOW_KEY = 'bfx_conv_flow';

    function getFlow() {
        try { return JSON.parse(sessionStorage.getItem(FLOW_KEY) || '[]'); } catch (e) { return []; }
    }

    function addStep(step, meta) {
        var flow = getFlow();
        flow.push({
            step: step,
            page: window.location.pathname,
            timestamp: Date.now(),
            meta: meta || {}
        });
        // Keep last 20 steps max
        if (flow.length > 20) flow = flow.slice(-20);
        try { sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow)); } catch (e) {}
    }

    // Auto-track page views in flow
    addStep('pageview', { title: document.title });

    // Track form interactions
    document.addEventListener('focusin', function (e) {
        if (e.target.matches('input, textarea, select')) {
            var form = e.target.closest('form');
            var formId = form ? (form.id || form.className.split(' ')[0]) : 'unknown';
            addStep('form_focus', { form: formId, field: e.target.name || e.target.type });
        }
    });

    // Track form abandonment
    document.addEventListener('submit', function (e) {
        var form = e.target;
        var formId = form.id || form.className.split(' ')[0];
        addStep('form_submit', { form: formId });
    });

    // Report flow on exit
    window.addEventListener('beforeunload', function () {
        var flow = getFlow();
        if (flow.length < 2) return; // Not enough data
        track('session_flow', {
            steps: flow.length,
            first_step: flow[0].step,
            last_step: flow[flow.length - 1].step,
            had_form_focus: flow.some(function (s) { return s.step === 'form_focus'; }),
            had_form_submit: flow.some(function (s) { return s.step === 'form_submit'; }),
            pages_visited: flow.filter(function (s) { return s.step === 'pageview'; }).length
        });
    });

    return { addStep: addStep, getFlow: getFlow };
})();


// ================================================================
// 9. OUTBOUND LINK ENHANCEMENT (Social Platform Specifics)
// ================================================================
BFX.socialOutbound = (function () {
    'use strict';

    var track = (BFX.analytics && BFX.analytics.track) || function () {};

    // Track specific social platform clicks with dedicated events
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href') || '';

        // Instagram clicks
        if (/instagram\.com/i.test(href)) {
            track('instagram_click', {
                url: href,
                location: getLocation(link),
                page: window.location.pathname
            });
        }

        // YouTube clicks
        if (/youtube\.com|youtu\.be/i.test(href)) {
            track('youtube_click', {
                url: href,
                location: getLocation(link),
                page: window.location.pathname
            });
        }

        // TikTok clicks
        if (/tiktok\.com/i.test(href)) {
            track('tiktok_click', {
                url: href,
                location: getLocation(link),
                page: window.location.pathname
            });
        }

        // X/Twitter clicks
        if (/x\.com|twitter\.com/i.test(href)) {
            track('x_twitter_click', {
                url: href,
                location: getLocation(link),
                page: window.location.pathname
            });
        }
    }, true);

    function getLocation(el) {
        if (el.closest('.footer'))         return 'footer';
        if (el.closest('.navbar, nav'))    return 'navbar';
        if (el.closest('.hero'))           return 'hero';
        if (el.closest('.social-gate'))    return 'social_gate';
        if (el.closest('.bfx-share-bar'))  return 'share_bar';
        if (el.closest('.bfx-chat-panel')) return 'chatbot';
        var section = el.closest('section[id]');
        return section ? section.id : 'page_body';
    }

    return {};
})();


// ================================================================
// 10. GA4 ENHANCED ECOMMERCE (Payment Success Page)
// ================================================================
BFX.ecommerce = (function () {
    'use strict';

    // Fire purchase event on payment-success or forex101-access pages
    var pageName = (BFX.analytics && BFX.analytics.pageName) || '';
    if (pageName !== 'payment-success' && pageName !== 'forex101-access') return {};

    var params = new URLSearchParams(window.location.search);
    var product = params.get('product') || '';
    var ref     = params.get('ref') || '';
    var tid     = params.get('tid') || '';

    if (!product && !ref) return {};

    // GA4 purchase event (recommended ecommerce event)
    if (typeof gtag === 'function') {
        gtag('event', 'purchase', {
            transaction_id: tid || ref,
            value: product === 'forex-101' ? 5000 : 0,
            currency: 'NGN',
            items: [{
                item_id: product,
                item_name: product.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
                quantity: 1,
                price: product === 'forex-101' ? 5000 : 0,
                currency: 'NGN'
            }]
        });
    }

    // Meta Pixel Purchase
    if (typeof fbq === 'function') {
        fbq('track', 'Purchase', {
            content_name: product,
            content_ids: [product],
            value: product === 'forex-101' ? 5000 : 0,
            currency: 'NGN'
        });
    }

    // Clarity tag
    if (typeof clarity === 'function') {
        clarity('set', 'purchased_product', product);
        clarity('set', 'is_buyer', 'true');
    }

    return {};
})();


// ================================================================
// 11. ANALYTICS HEALTH CHECK (Debug Mode)
// ================================================================
BFX.analyticsHealth = (function () {
    'use strict';

    if (location.search.indexOf('debug_tracking=1') === -1) return {};

    var checks = {
        'GA4 gtag':        typeof gtag === 'function',
        'GTM dataLayer':   Array.isArray(window.dataLayer) && window.dataLayer.length > 0,
        'Clarity':         typeof clarity === 'function',
        'Meta Pixel':      typeof fbq === 'function',
        'BFX.analytics':   !!(BFX.analytics && BFX.analytics.track),
        'BFX.tracking':    !!(BFX.tracking && BFX.tracking.pushDataLayer),
        'BFX.attribution': !!(BFX.attribution && BFX.attribution.lastTouch),
        'BFX.funnel':      !!(BFX.funnel && BFX.funnel.getStage),
        'BFX.scrollDepth': !!(BFX.scrollDepth && BFX.scrollDepth.getMax),
        'UTM captured':    !!(BFX.attribution && BFX.attribution.hasUTM),
        'First touch':     !!(BFX.attribution && BFX.attribution.firstTouch && BFX.attribution.firstTouch.source),
        'Forms injected':  document.querySelectorAll('form[data-bfx-injected]').length > 0
    };

    console.group('%c[BFX Analytics Health Check]', 'color: #10b981; font-weight: bold; font-size: 14px;');
    Object.keys(checks).forEach(function (key) {
        var icon = checks[key] ? '✅' : '❌';
        console.log(icon + ' ' + key + ': ' + checks[key]);
    });
    console.log('\n📊 Attribution Data:');
    console.log('  First Touch:', BFX.attribution ? BFX.attribution.firstTouch : 'N/A');
    console.log('  Last Touch:',  BFX.attribution ? BFX.attribution.lastTouch  : 'N/A');
    console.log('  Current UTM:', BFX.attribution ? BFX.attribution.utmParams  : 'N/A');
    console.log('\n🔄 Funnel Stage:', BFX.funnel ? BFX.funnel.getStage() : 'N/A');
    console.log('📱 Device:', BFX.analytics ? BFX.analytics.device : 'N/A');
    console.groupEnd();

    return { checks: checks };
})();
