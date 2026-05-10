// ================================================================
// BFX.tracking — Production Analytics & Conversion Tracking Layer
// GTM dataLayer, Meta Pixel, generate_lead, outbound links,
// WhatsApp tracking, newsletter signups, consent management
// ================================================================
// CONFIGURATION REQUIRED:
//   GTM Container ID  → replace 'GTM-XXXXXXX' with your real container ID
//   Meta Pixel ID     → replace 'PIXEL_ID_HERE' with your real pixel ID
//   Both are optional — the system gracefully degrades without them
// ================================================================
var BFX = window.BFX || {};

BFX.tracking = (function() {
    'use strict';

    // ----- Configuration -----
    var CONFIG = {
        gtmId:       'GTM-T3R88HZB',
        metaPixelId: 'PIXEL_ID_HERE',       // Replace with real Meta Pixel ID
        ga4Id:       (BFX.config && BFX.config.ga4Id) || 'G-ZFQ9P5KFSJ',
        debug:       location.search.indexOf('debug_tracking=1') > -1
    };

    var initialized = false;

    // ----- DataLayer Foundation -----
    window.dataLayer = window.dataLayer || [];

    function pushDataLayer(event, params) {
        var data = Object.assign({ event: event }, params || {});
        window.dataLayer.push(data);
        if (CONFIG.debug) {
            console.log('[BFX.tracking] dataLayer →', event, data);
        }
    }

    // ----- GTM Container -----
    // GTM snippets are injected directly into HTML <head> and <body> for earliest loading.
    // This function only verifies the container is present — it does NOT load GTM again.
    function loadGTM() {
        if (CONFIG.gtmId === 'GTM-XXXXXXX' || !CONFIG.gtmId) {
            if (CONFIG.debug) console.log('[BFX.tracking] GTM skipped — no container ID configured');
            return;
        }
        // GTM is already loaded via inline <script> in <head> of every HTML page
        if (CONFIG.debug) console.log('[BFX.tracking] GTM verified:', CONFIG.gtmId);
    }

    // ----- Meta Pixel Loader -----
    function loadMetaPixel() {
        if (CONFIG.metaPixelId === 'PIXEL_ID_HERE' || !CONFIG.metaPixelId) {
            if (CONFIG.debug) console.log('[BFX.tracking] Meta Pixel skipped — no pixel ID configured');
            return;
        }

        // Standard Meta Pixel base code
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', CONFIG.metaPixelId);
        fbq('track', 'PageView');

        if (CONFIG.debug) console.log('[BFX.tracking] Meta Pixel loaded:', CONFIG.metaPixelId);
    }

    // Safe fbq wrapper — never throws if pixel not loaded
    function firePixel(eventName, params) {
        if (typeof fbq === 'function') {
            fbq('track', eventName, params || {});
        }
    }

    // ----- Enhanced BFX.analytics.track() -----
    // Monkey-patch the existing track() to also push to dataLayer + Meta Pixel
    function enhanceAnalyticsTrack() {
        if (!BFX.analytics || !BFX.analytics.track) return;
        if (BFX.analytics._trackEnhanced) return; // Prevent double-patching
        BFX.analytics._trackEnhanced = true;

        var originalTrack = BFX.analytics.track;

        BFX.analytics.track = function(eventName, params) {
            // 1. Call original (sends to GA4 gtag + Clarity)
            originalTrack(eventName, params);

            // 2. Push to dataLayer for GTM
            pushDataLayer(eventName, params);

            // 3. Fire Meta Pixel for mapped events
            var pixelMap = {
                'contact_form_submit':       { pixel: 'Lead',              params: { content_name: 'contact_form' } },
                'mentorship_application':    { pixel: 'Lead',              params: { content_name: 'mentorship' } },
                'starter_pack_download':     { pixel: 'Lead',              params: { content_name: 'starter_pack' } },
                'email_subscribe':           { pixel: 'Lead',              params: { content_name: 'newsletter' } },
                'ea_purchase_click':         { pixel: 'InitiateCheckout',  params: { content_name: 'SMA Pro Trend EA', value: 49.99, currency: 'USD' } },
                'enroll_now_click':          { pixel: 'ViewContent',       params: { content_name: 'courses' } },
                'pricing_plan_click':        { pixel: 'InitiateCheckout',  params: { content_name: params && params.product || 'plan' } },
                'webinar_register':          { pixel: 'CompleteRegistration', params: { content_name: 'webinar' } }
            };

            if (pixelMap[eventName]) {
                firePixel(pixelMap[eventName].pixel, pixelMap[eventName].params);
            }
        };

        if (CONFIG.debug) console.log('[BFX.tracking] BFX.analytics.track enhanced with dataLayer + Meta Pixel');
    }

    // ----- generate_lead Events -----
    // GA4 recommended event for all lead capture moments
    function setupGenerateLead() {
        // Map existing conversion events to GA4 generate_lead
        var leadSources = {
            'contact_form_submit':    { source: 'contact_form',    value: 0 },
            'mentorship_application': { source: 'mentorship_form', value: 50 },
            'starter_pack_download':  { source: 'starter_pack',    value: 5 },
            'email_subscribe':        { source: 'newsletter',      value: 3 },
            'webinar_register':       { source: 'webinar',         value: 10 }
        };

        // Listen for dataLayer events that should trigger generate_lead
        var origPush = Array.prototype.push;
        var dlRef = window.dataLayer;

        // Use MutationObserver-style pattern on dataLayer
        var _origPush = dlRef.push.bind(dlRef);
        dlRef.push = function() {
            var result = _origPush.apply(this, arguments);
            for (var i = 0; i < arguments.length; i++) {
                var entry = arguments[i];
                if (entry && entry.event && leadSources[entry.event]) {
                    var src = leadSources[entry.event];
                    // Fire GA4 generate_lead (recommended event)
                    if (typeof gtag === 'function') {
                        gtag('event', 'generate_lead', {
                            currency: 'USD',
                            value: src.value,
                            lead_source: src.source,
                            page: window.location.pathname
                        });
                    }
                    // Also push to dataLayer for GTM
                    _origPush.call(dlRef, {
                        event: 'generate_lead',
                        currency: 'USD',
                        value: src.value,
                        lead_source: src.source,
                        page: window.location.pathname
                    });
                    // Meta Pixel Lead
                    firePixel('Lead', {
                        content_name: src.source,
                        value: src.value,
                        currency: 'USD'
                    });

                    if (CONFIG.debug) console.log('[BFX.tracking] generate_lead fired for:', src.source);
                }
            }
            return result;
        };
    }

    // ----- Outbound Link Tracking -----
    function setupOutboundLinks() {
        document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href]');
            if (!link) return;

            var href = link.getAttribute('href') || '';
            if (!href.startsWith('http')) return;

            // Check if it's outbound
            try {
                var linkHost = new URL(href).hostname;
                var siteHost = window.location.hostname;
                if (linkHost === siteHost) return;
            } catch(err) {
                return;
            }

            // Classify the outbound link
            var linkType = 'other';
            if (href.indexOf('t.me/') > -1 || href.indexOf('telegram') > -1) linkType = 'telegram';
            else if (href.indexOf('wa.me/') > -1 || href.indexOf('whatsapp') > -1 || href.indexOf('api.whatsapp.com') > -1) linkType = 'whatsapp';
            else if (href.indexOf('instagram.com') > -1) linkType = 'instagram';
            else if (href.indexOf('youtube.com') > -1 || href.indexOf('youtu.be') > -1) linkType = 'youtube';
            else if (href.indexOf('x.com') > -1 || href.indexOf('twitter.com') > -1) linkType = 'x_twitter';
            else if (href.indexOf('tiktok.com') > -1) linkType = 'tiktok';
            else if (href.indexOf('mql5.com') > -1) linkType = 'mql5';
            else if (href.indexOf('facebook.com') > -1) linkType = 'facebook';
            else if (href.indexOf('deriv.') > -1) linkType = 'broker_referral';

            // Determine click location
            var location = 'body';
            if (link.closest('.navbar, nav')) location = 'navbar';
            else if (link.closest('.footer')) location = 'footer';
            else if (link.closest('.sticky-cta-bar')) location = 'sticky_cta';
            else if (link.closest('.tg-float')) location = 'floating_widget';
            else if (link.closest('.bfx-chat-panel')) location = 'chatbot';
            else if (link.closest('.bfx-share-bar, .bfx-share-buttons')) location = 'share_bar';
            else if (link.closest('.exit-popup')) location = 'exit_popup';
            else if (link.closest('article')) location = 'article_body';
            else if (link.closest('.hero-section, .page-hero')) location = 'hero';
            else if (link.closest('.cta-section')) location = 'cta_section';

            var eventData = {
                outbound: true,
                link_url: href,
                link_type: linkType,
                link_text: (link.textContent || '').trim().substring(0, 60),
                link_location: location
            };

            // GA4 click event (outbound)
            BFX.analytics.track('outbound_link_click', eventData);

            // GA4 recommended event
            if (typeof gtag === 'function') {
                gtag('event', 'click', {
                    event_category: 'outbound',
                    event_label: href,
                    link_type: linkType,
                    transport_type: 'beacon'
                });
            }

            if (CONFIG.debug) console.log('[BFX.tracking] outbound_link_click →', linkType, href);
        }, true);
    }

    // ----- WhatsApp Click Tracking -----
    function setupWhatsAppTracking() {
        document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="api.whatsapp"]');
            if (!link) return;

            var location = 'unknown';
            if (link.closest('.bfx-share-bar, .bfx-share-buttons')) location = 'share_bar';
            else if (link.closest('.bfx-chat-panel')) location = 'chatbot';
            else if (link.closest('.footer')) location = 'footer';
            else if (link.closest('article')) location = 'article';

            BFX.analytics.track('whatsapp_click', {
                location: location,
                url: link.href,
                page: window.location.pathname
            });

            // Meta Pixel
            firePixel('Contact', { content_name: 'whatsapp', content_category: location });

            if (CONFIG.debug) console.log('[BFX.tracking] whatsapp_click →', location);
        }, true);
    }

    // ----- Newsletter Signup Tracking -----
    function setupNewsletterTracking() {
        // Track all newsletter form submissions distinctly
        document.addEventListener('submit', function(e) {
            var form = e.target;
            if (!form.matches('.newsletter-form, [data-bfx-subscribe], .lm-form')) return;

            var source = form.dataset.source || 'newsletter';
            var emailInput = form.querySelector('input[type="email"]');
            var hasEmail = emailInput && emailInput.value.trim();

            if (!hasEmail) return;

            BFX.analytics.track('newsletter_signup', {
                source: source,
                location: getFormLocation(form),
                page: window.location.pathname
            });

            // GA4 sign_up recommended event
            if (typeof gtag === 'function') {
                gtag('event', 'sign_up', {
                    method: 'email',
                    source: source
                });
            }

            // Meta Pixel
            firePixel('CompleteRegistration', {
                content_name: 'newsletter_' + source,
                status: true
            });

            if (CONFIG.debug) console.log('[BFX.tracking] newsletter_signup →', source);
        }, true);
    }

    function getFormLocation(form) {
        if (form.closest('.lm-section')) return 'lead_magnet';
        if (form.closest('.footer')) return 'footer';
        if (form.closest('.exit-popup')) return 'exit_popup';
        if (form.closest('.sticky-cta-bar')) return 'sticky_cta';
        if (form.closest('article')) return 'blog_post';
        return 'page_body';
    }

    // ----- Checkout / Payment Tracking -----
    function setupCheckoutTracking() {
        // Payment button clicks
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.pay-btn, [data-pay], .pay-modal-submit');
            if (!btn) return;

            var product = btn.dataset.product || btn.dataset.name || 'unknown';
            var amount = parseFloat(btn.dataset.amount) || 0;

            BFX.analytics.track('begin_checkout', {
                currency: 'USD',
                value: amount,
                product: product,
                page: window.location.pathname
            });

            // GA4 begin_checkout recommended event
            if (typeof gtag === 'function') {
                gtag('event', 'begin_checkout', {
                    currency: 'USD',
                    value: amount,
                    items: [{
                        item_name: product,
                        price: amount,
                        quantity: 1
                    }]
                });
            }

            // Meta Pixel
            firePixel('InitiateCheckout', {
                content_name: product,
                value: amount,
                currency: 'USD',
                num_items: 1
            });

            if (CONFIG.debug) console.log('[BFX.tracking] begin_checkout →', product, amount);
        }, true);
    }

    // ----- Page Context DataLayer -----
    function pushPageContext() {
        var pageName = BFX.analytics ? BFX.analytics.pageName : location.pathname;
        var pageType = 'page';
        if (pageName === 'homepage' || pageName === 'index' || pageName === '') pageType = 'homepage';
        else if (location.pathname.indexOf('/blog/') > -1 && pageName !== 'blogindex') pageType = 'blog_post';
        else if (pageName === 'courses') pageType = 'product_listing';
        else if (pageName === 'mentorship') pageType = 'product_listing';
        else if (pageName === 'contact') pageType = 'contact';
        else if (pageName === 'community') pageType = 'community';
        else if (pageName === 'live') pageType = 'events';
        else if (pageName === 'about') pageType = 'about';
        else if (pageName === 'thank-you') pageType = 'conversion';

        pushDataLayer('page_context', {
            page_name: pageName,
            page_type: pageType,
            page_path: location.pathname,
            page_title: document.title,
            site_name: 'BossFx Academy',
            user_type: (BFX.analytics && BFX.analytics.isReturning) ? 'returning' : 'new',
            visit_count: (BFX.analytics && BFX.analytics.visitCount) || 1,
            device: (BFX.analytics && BFX.analytics.device) || 'unknown'
        });
    }

    // ----- Thank You Page Conversion -----
    function setupThankYouConversion() {
        if (location.pathname.indexOf('thank-you') === -1) return;

        // Fire conversion events for the thank-you page
        if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
                currency: 'USD',
                value: 5,
                lead_source: 'email_signup',
                page: '/thank-you.html'
            });
        }

        firePixel('Lead', {
            content_name: 'email_signup_complete',
            value: 5,
            currency: 'USD'
        });

        pushDataLayer('conversion_complete', {
            conversion_type: 'email_signup',
            page: '/thank-you.html'
        });

        if (CONFIG.debug) console.log('[BFX.tracking] Thank-you page conversion fired');
    }

    // ----- Social Gate Resource Download Tracking -----
    function setupResourceTracking() {
        // Listen for social gate opens via magnet buttons
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.magnet-btn, [data-magnet]');
            if (!btn) return;

            var magnet = btn.dataset.magnet || btn.getAttribute('href') || 'unknown';
            var resourceName = btn.textContent.trim().substring(0, 60);

            BFX.analytics.track('resource_download_intent', {
                resource: magnet,
                resource_name: resourceName,
                page: window.location.pathname
            });

            firePixel('ViewContent', {
                content_name: magnet,
                content_category: 'free_resource'
            });

            if (CONFIG.debug) console.log('[BFX.tracking] resource_download_intent →', magnet);
        }, true);
    }

    // ----- Debug Mode Panel -----
    function setupDebugPanel() {
        if (!CONFIG.debug) return;

        var panel = document.createElement('div');
        panel.id = 'bfx-debug-panel';
        panel.style.cssText = 'position:fixed;bottom:0;right:0;width:360px;max-height:300px;overflow-y:auto;' +
            'background:rgba(0,0,0,0.92);color:#10b981;font-family:monospace;font-size:11px;padding:12px;' +
            'z-index:99999;border-top-left-radius:8px;border:1px solid rgba(16,185,129,0.3);';
        panel.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;color:#fff;">BFX Tracking Debug</div>' +
            '<div id="bfx-debug-log"></div>';
        document.body.appendChild(panel);

        var log = document.getElementById('bfx-debug-log');
        var origPush = window.dataLayer.push.bind(window.dataLayer);
        window.dataLayer.push = function() {
            var result = origPush.apply(this, arguments);
            for (var i = 0; i < arguments.length; i++) {
                var entry = arguments[i];
                if (entry && entry.event) {
                    var div = document.createElement('div');
                    div.style.cssText = 'padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);';
                    div.textContent = new Date().toLocaleTimeString() + ' → ' + entry.event;
                    log.insertBefore(div, log.firstChild);
                    // Keep max 50 entries
                    while (log.children.length > 50) log.removeChild(log.lastChild);
                }
            }
            return result;
        };

        console.log('%c[BFX.tracking] Debug mode ON — add ?debug_tracking=1 to any page URL', 'color: #10b981; font-weight: bold;');
        console.log('%c  GA4 ID: ' + CONFIG.ga4Id, 'color: #94a3b8;');
        console.log('%c  GTM ID: ' + CONFIG.gtmId + (CONFIG.gtmId === 'GTM-XXXXXXX' ? ' (not configured)' : ''), 'color: #94a3b8;');
        console.log('%c  Meta Pixel: ' + CONFIG.metaPixelId + (CONFIG.metaPixelId === 'PIXEL_ID_HERE' ? ' (not configured)' : ''), 'color: #94a3b8;');
    }

    // ----- Initialize Everything -----
    function init() {
        if (initialized) return;
        initialized = true;

        // Load tag managers
        loadGTM();
        loadMetaPixel();

        // Enhance existing analytics
        enhanceAnalyticsTrack();

        // Push page context
        pushPageContext();

        // Setup all tracking
        setupGenerateLead();
        setupOutboundLinks();
        setupWhatsAppTracking();
        setupNewsletterTracking();
        setupCheckoutTracking();
        setupThankYouConversion();
        setupResourceTracking();

        // Debug
        setupDebugPanel();

        if (CONFIG.debug) console.log('[BFX.tracking] All tracking modules initialized');
    }

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ----- Public API -----
    return {
        init: init,
        pushDataLayer: pushDataLayer,
        firePixel: firePixel,
        CONFIG: CONFIG
    };
})();
