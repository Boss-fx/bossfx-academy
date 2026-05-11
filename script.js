// ============================================================
// BossFx Analytics Intelligence System
// Centralized event tracking, funnel intelligence, engagement
// ============================================================

var BFX = BFX || {};

// ----- Core Analytics Engine -----
BFX.analytics = (function() {
    var sessionId = sessionStorage.getItem('bfx_sid') || ('s_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
    sessionStorage.setItem('bfx_sid', sessionId);

    // Visit tracking
    var visitCount = parseInt(localStorage.getItem('bfx_visits') || '0') + 1;
    localStorage.setItem('bfx_visits', visitCount);
    var firstVisit = localStorage.getItem('bfx_first_visit');
    if (!firstVisit) { firstVisit = new Date().toISOString(); localStorage.setItem('bfx_first_visit', firstVisit); }
    var isReturning = visitCount > 1;
    var device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    var pageName = location.pathname.replace(/\//g, '').replace('.html', '') || 'homepage';

    // Send to GA4 + Clarity
    function track(eventName, params) {
        var data = Object.assign({
            page: pageName,
            device: device,
            session_id: sessionId,
            visit_number: visitCount,
            is_returning: isReturning
        }, params || {});
        if (typeof gtag === 'function') gtag('event', eventName, data);
        if (typeof clarity === 'function') clarity('event', eventName);
    }

    // Set GA4 user properties
    if (typeof gtag === 'function') {
        gtag('set', 'user_properties', {
            visit_count: visitCount,
            user_type: isReturning ? 'returning' : 'new',
            device_type: device,
            first_visit_date: firstVisit
        });
    }

    // Tag Clarity session
    if (typeof clarity === 'function') {
        clarity('set', 'user_type', isReturning ? 'returning' : 'new');
        clarity('set', 'visit_count', String(visitCount));
        clarity('set', 'device', device);
    }

    return {
        track: track,
        sessionId: sessionId,
        visitCount: visitCount,
        isReturning: isReturning,
        device: device,
        pageName: pageName
    };
})();

// Backward-compatible wrapper
function trackEvent(name, params) {
    BFX.analytics.track(name, params);
}

// ----- Funnel Intelligence -----
BFX.funnel = (function() {
    var STEPS = ['homepage', 'starter_pack', 'telegram', 'webinar', 'mentorship', 'pricing', 'checkout'];
    var KEY = 'bfx_funnel_stage';

    function getStage() { return localStorage.getItem(KEY) || 'homepage'; }
    function setStage(stage) {
        var prev = getStage();
        if (STEPS.indexOf(stage) > STEPS.indexOf(prev)) {
            localStorage.setItem(KEY, stage);
            BFX.analytics.track('funnel_progress', { from_stage: prev, to_stage: stage, step_index: STEPS.indexOf(stage) });
        }
    }
    function trackView() {
        var page = BFX.analytics.pageName;
        if (page === 'homepage' || page === 'index') setStage('homepage');
        else if (page === 'thank-you') setStage('starter_pack');
        else if (page === 'community') setStage('telegram');
        else if (page === 'mentorship') setStage('mentorship');
        else if (page === 'courses') setStage('pricing');
        else if (page === 'contact') setStage('checkout');
    }
    trackView();
    return { getStage: getStage, setStage: setStage };
})();

// ----- Scroll Depth Tracking -----
BFX.scrollDepth = (function() {
    var milestones = [25, 50, 75, 100];
    var reached = {};
    var maxScroll = 0;
    function check() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        if (docHeight <= 0) return;
        var pct = Math.round((scrollTop / docHeight) * 100);
        if (pct > maxScroll) maxScroll = pct;
        milestones.forEach(function(m) {
            if (pct >= m && !reached[m]) {
                reached[m] = true;
                BFX.analytics.track('scroll_depth', { depth: m, page: BFX.analytics.pageName });
            }
        });
    }
    var throttled = false;
    window.addEventListener('scroll', function() {
        if (!throttled) { throttled = true; requestAnimationFrame(function() { check(); throttled = false; }); }
    });
    // Report max scroll on page exit
    window.addEventListener('beforeunload', function() {
        BFX.analytics.track('page_exit_scroll', { max_depth: maxScroll });
    });
    return { getMax: function() { return maxScroll; } };
})();

// ----- CTA Performance Tracking -----
BFX.cta = (function() {
    function trackClick(el, ctaName, extra) {
        el.addEventListener('click', function() {
            BFX.analytics.track('cta_click', Object.assign({ cta_name: ctaName, cta_text: el.textContent.trim().substring(0, 50) }, extra || {}));
        });
    }

    // Navbar CTA
    document.querySelectorAll('.nav-ea-cta').forEach(function(el) { trackClick(el, 'navbar_get_ea', { location: 'navbar' }); });

    // Floating Telegram
    document.querySelectorAll('.tg-float-btn').forEach(function(el) { trackClick(el, 'floating_telegram', { location: 'floating_widget' }); });

    // Sticky CTA bar
    document.querySelectorAll('.sticky-cta-bar .btn').forEach(function(el) {
        trackClick(el, 'sticky_cta_' + (el.textContent.trim().toLowerCase().includes('ea') ? 'get_ea' : 'start_free'), { location: 'sticky_bar' });
    });

    // Webinar register buttons
    document.querySelectorAll('.webinar-register-btn').forEach(function(el) {
        trackClick(el, 'webinar_register_cta', { location: 'webinar_section', webinar: el.dataset.webinar || '' });
    });

    // Pricing cards
    document.querySelectorAll('.pricing-cta, .pricing-card .btn').forEach(function(el) {
        var card = el.closest('.pricing-card');
        var tier = card ? (card.dataset.tier || card.querySelector('.pricing-plan-name')?.textContent || 'unknown') : 'unknown';
        trackClick(el, 'pricing_plan_click', { location: 'pricing_section', tier: tier });
    });

    // Challenge join buttons
    document.querySelectorAll('.challenge-join-btn').forEach(function(el) {
        var card = el.closest('.challenge-card');
        var title = card ? card.querySelector('.challenge-title').textContent : '';
        trackClick(el, 'challenge_join', { challenge: title });
    });

    // Telegram community join
    document.querySelectorAll('.tg-join-btn').forEach(function(el) { trackClick(el, 'telegram_community_join', { location: 'telegram_section' }); });

    // Exit popup CTA
    document.querySelectorAll('.exit-popup-cta').forEach(function(el) { trackClick(el, 'exit_popup_telegram', { location: 'exit_popup' }); });

    return { trackClick: trackClick };
})();

// ----- Primary Conversion Events -----
BFX.conversions = (function() {
    // Starter pack download
    var leadForm = document.getElementById('leadMagnetForm');
    if (leadForm) {
        leadForm.addEventListener('submit', function() {
            BFX.analytics.track('starter_pack_download', { method: 'email_form' });
            BFX.funnel.setStage('starter_pack');
        });
    }

    // Telegram join clicks (all t.me links)
    document.querySelectorAll('a[href*="t.me/"]').forEach(function(el) {
        el.addEventListener('click', function() {
            var location = 'unknown';
            if (el.closest('.tg-float')) location = 'floating_widget';
            else if (el.closest('#telegram-community')) location = 'telegram_section';
            else if (el.closest('.exit-popup')) location = 'exit_popup';
            else if (el.closest('.challenge-card')) location = 'challenge_card';
            else if (el.closest('.cta-section')) location = 'final_cta';
            else if (el.closest('.nav-links')) location = 'navbar';
            else if (el.closest('.sticky-cta-bar')) location = 'sticky_bar';
            BFX.analytics.track('telegram_join_click', { location: location });
            BFX.funnel.setStage('telegram');
        });
    });

    // EA purchase clicks
    document.querySelectorAll('a[href*="mql5.com/en/market/product"]').forEach(function(el) {
        el.addEventListener('click', function() {
            var isDemo = el.textContent.trim().toLowerCase().includes('demo');
            BFX.analytics.track('ea_purchase_click', { type: isDemo ? 'demo' : 'purchase', value: isDemo ? 0 : 49.99 });
        });
    });

    // Enroll now clicks (courses page links to pricing)
    document.querySelectorAll('a[href*="pricing"], a[href*="courses"]').forEach(function(el) {
        if (el.textContent.toLowerCase().includes('enroll')) {
            el.addEventListener('click', function() {
                BFX.analytics.track('enroll_now_click', { destination: el.href });
            });
        }
    });

    // Mentorship application (Apply Now buttons linking to pricing)
    document.querySelectorAll('a[href*="pricing"]').forEach(function(el) {
        if (el.textContent.toLowerCase().includes('apply')) {
            el.addEventListener('click', function() {
                BFX.analytics.track('mentorship_application', { tier: el.closest('.price-card')?.querySelector('h3')?.textContent || 'unknown' });
                BFX.funnel.setStage('mentorship');
            });
        }
    });

    // Contact form submission
    var contactForm = document.querySelector('#applyForm') || document.querySelector('form[action*="formspree"]');
    if (contactForm && BFX.analytics.pageName === 'contact') {
        contactForm.addEventListener('submit', function() {
            BFX.analytics.track('contact_form_submit', { page: 'contact' });
            BFX.funnel.setStage('checkout');
        });
    }

    // Webinar registration funnel is tracked in the modal submit handler

    // Pay button clicks (pricing section)
    document.querySelectorAll('.pay-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            BFX.analytics.track('pricing_plan_click', {
                product: el.dataset.product || '',
                amount: el.dataset.amount || '',
                name: el.dataset.name || ''
            });
            BFX.funnel.setStage('pricing');
        });
    });
})();

// ----- Engagement Intelligence -----
BFX.engagement = (function() {
    var startTime = Date.now();
    var engaged = false;
    var engagedTime = 0;
    var lastActive = Date.now();

    // Track active time (pauses when tab hidden)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            engagedTime += Date.now() - lastActive;
        } else {
            lastActive = Date.now();
        }
    });

    // Report time on page exit
    window.addEventListener('beforeunload', function() {
        engagedTime += Date.now() - lastActive;
        var totalSeconds = Math.round(engagedTime / 1000);
        var bucket = totalSeconds < 10 ? 'bounce' : totalSeconds < 30 ? 'glance' : totalSeconds < 60 ? 'reading' : totalSeconds < 180 ? 'engaged' : 'deep_engaged';
        BFX.analytics.track('page_engagement', {
            time_seconds: totalSeconds,
            engagement_level: bucket,
            page: BFX.analytics.pageName
        });
    });

    // Section visibility tracking
    var sectionsSeen = {};
    var sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting && !sectionsSeen[entry.target.id]) {
                sectionsSeen[entry.target.id] = true;
                BFX.analytics.track('section_view', { section: entry.target.id });
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('section[id]').forEach(function(s) { sectionObserver.observe(s); });

    // Returning user detection
    if (BFX.analytics.isReturning) {
        BFX.analytics.track('returning_visitor', {
            visit_number: BFX.analytics.visitCount,
            days_since_first: Math.round((Date.now() - new Date(localStorage.getItem('bfx_first_visit')).getTime()) / 86400000)
        });
    }

    return {
        getEngagedTime: function() { return engagedTime + (Date.now() - lastActive); }
    };
})();

// ----- Page Load Performance -----
BFX.perf = (function() {
    window.addEventListener('load', function() {
        setTimeout(function() {
            var perf = performance.getEntriesByType('navigation')[0];
            if (perf) {
                BFX.analytics.track('page_performance', {
                    load_time: Math.round(perf.loadEventEnd - perf.startTime),
                    dom_ready: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
                    ttfb: Math.round(perf.responseStart - perf.requestStart)
                });
            }
        }, 100);
    });
})();

// ===== Navbar scroll effect =====
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ===== Mobile menu toggle =====
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const spans = mobileToggle.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const spans = mobileToggle.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        });
    });
}

// ===== Scroll animations (Intersection Observer) =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .mentorship-card, .testimonial-card, .course-modules li, .cf-item, .tool-card, .lm-benefit, .lm-pack-items li, .faq-item').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${i % 6 * 0.1}s, transform 0.5s ease ${i % 6 * 0.1}s`;
    observer.observe(el);
});

document.querySelectorAll('.section-header, .course-info, .community-content, .course-visual, .community-visual, .cta-content, .ea-hero-content, .ea-hero-visual, .lead-magnet-content, .lead-magnet-visual, .founder-photo-card, .founder-text').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

const style = document.createElement('style');
style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);

// ===== Smooth scroll for anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});


// ===== Lead Magnet Form (Formspree) =====
const leadForm = document.getElementById('leadMagnetForm');
if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('lmEmail').value;
        
        try {
            await fetch('https://formspree.io/f/xeenzyna', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, source: 'bossfx_starter_pack' })
            });
        } catch (err) {}
        trackEvent('email_signup');
        leadForm.style.display = 'none';
        document.getElementById('lmSuccess').classList.add('show');
        setTimeout(() => {
            window.location.href = '/thank-you.html';
        }, 2000);
    });
}

// ===== Notify Modal =====
const notifyModal = document.getElementById('notifyModal');
const notifyClose = document.getElementById('notifyClose');
const notifySubmit = document.getElementById('notifySubmit');
const notifyText = document.getElementById('notifyModalText');

document.querySelectorAll('.notify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tool = btn.getAttribute('data-tool');
        if (notifyText) notifyText.textContent = `Be the first to know when ${tool} launches.`;
        if (notifyModal) notifyModal.classList.add('show');
    });
});

if (notifyClose) {
    notifyClose.addEventListener('click', () => {
        notifyModal.classList.remove('show');
    });
}

if (notifyModal) {
    notifyModal.addEventListener('click', (e) => {
        if (e.target === notifyModal) notifyModal.classList.remove('show');
    });
}

if (notifySubmit) {
    notifySubmit.addEventListener('click', async () => {
        const email = document.getElementById('notifyEmail').value;
        if (!email) return;
        try {
            await fetch('https://formspree.io/f/xeenzyna', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, source: 'tool_notify' })
            });
        } catch (err) {}
        trackEvent('tool_notify_signup');
        notifyModal.classList.remove('show');
        document.getElementById('notifyEmail').value = '';
        alert('You\'re on the list! We\'ll notify you when it launches.');
    });
}

// ===== Flutterwave Checkout =====
const FLUTTERWAVE_PUBLIC_KEY = (window.BFX && BFX.config && BFX.config.flutterwave && BFX.config.flutterwave.publicKey) || 'FLWPUBK-ef7ae0ec39bd837e57a4a4bb28378fad-X';
const ORDER_BUMP_AMOUNT = 1500000; // ₦15,000 in kobo

// Multi-currency pricing (fallback rates, updated by API on load)
const BFX_CURRENCY = (function() {
    const FALLBACK_RATES = { NGN: 1, USD: 0.00062, GBP: 0.00049, EUR: 0.00057 };
    let rates = Object.assign({}, FALLBACK_RATES);
    let userCurrency = 'NGN';
    let ratesLoaded = false;

    // Detect user region
    function detectCurrency() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            if (tz.startsWith('America/') || tz.startsWith('US/')) return 'USD';
            if (tz.startsWith('Europe/London') || tz === 'GB') return 'GBP';
            if (tz.startsWith('Europe/')) return 'EUR';
        } catch(e) {}
        return 'NGN';
    }

    // Load live rates (free API, no key required)
    function loadRates() {
        fetch('https://open.er-api.com/v6/latest/NGN')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.rates) {
                    rates.USD = data.rates.USD || FALLBACK_RATES.USD;
                    rates.GBP = data.rates.GBP || FALLBACK_RATES.GBP;
                    rates.EUR = data.rates.EUR || FALLBACK_RATES.EUR;
                    ratesLoaded = true;
                    renderIntlPricing();
                }
            })
            .catch(function() {
                // Use fallback rates silently
                renderIntlPricing();
            });
    }

    // Convert NGN amount to target currency
    function convert(ngnAmount, toCurrency) {
        return Math.round(ngnAmount * (rates[toCurrency] || 1));
    }

    // Format currency
    function format(amount, currency) {
        var symbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
        var symbol = symbols[currency] || currency + ' ';
        return symbol + amount.toLocaleString('en');
    }

    // Render international pricing hints
    function renderIntlPricing() {
        document.querySelectorAll('.pricing-intl-hint').forEach(function(el) {
            var ngn = parseInt(el.dataset.baseNgn);
            if (!ngn) return;
            var usd = convert(ngn, 'USD');
            var gbp = convert(ngn, 'GBP');
            var eur = convert(ngn, 'EUR');
            el.textContent = 'Approx. $' + usd.toLocaleString('en') +
                ' · £' + gbp.toLocaleString('en') +
                ' · €' + eur.toLocaleString('en');
            el.style.opacity = '1';
        });
    }

    userCurrency = detectCurrency();
    loadRates();

    return {
        rates: rates,
        userCurrency: userCurrency,
        convert: convert,
        format: format,
        renderIntlPricing: renderIntlPricing,
        isReady: function() { return ratesLoaded; }
    };
})();

const payModal = document.getElementById('payModal');
const payModalClose = document.getElementById('payModalClose');
const payModalForm = document.getElementById('payModalForm');
const payModalTitle = document.getElementById('payModalTitle');
const payModalProduct = document.getElementById('payModalProduct');
const payModalAmount = document.getElementById('payModalAmount');
const orderBumpCheck = document.getElementById('orderBumpCheck');
const payModalTotal = document.getElementById('payModalTotal');

let currentPayment = {};

function formatNaira(kobo) {
    return '₦' + (kobo / 100).toLocaleString('en-NG');
}

function getPaymentTotal() {
    let total = currentPayment.amount;
    if (orderBumpCheck && orderBumpCheck.checked) total += ORDER_BUMP_AMOUNT;
    return total;
}

function updateTotal() {
    if (!payModalTotal) return;
    if (orderBumpCheck && orderBumpCheck.checked) {
        payModalTotal.textContent = 'Total: ' + formatNaira(getPaymentTotal());
        payModalTotal.classList.add('show');
    } else {
        payModalTotal.classList.remove('show');
    }
}

if (orderBumpCheck) {
    orderBumpCheck.addEventListener('change', updateTotal);
}

document.querySelectorAll('.pay-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        currentPayment = {
            product: btn.dataset.product,
            amount: parseInt(btn.dataset.amount),
            name: btn.dataset.name
        };
        if (payModalProduct) payModalProduct.textContent = currentPayment.name;
        if (payModalAmount) payModalAmount.textContent = formatNaira(currentPayment.amount);
        if (orderBumpCheck) orderBumpCheck.checked = false;
        updateTotal();
        if (payModal) payModal.classList.add('show');
        trackEvent('checkout_initiated', { product: currentPayment.product, amount: currentPayment.amount });
    });
});

if (payModalClose) {
    payModalClose.addEventListener('click', () => payModal.classList.remove('show'));
}
if (payModal) {
    payModal.addEventListener('click', (e) => {
        if (e.target === payModal) payModal.classList.remove('show');
    });
}

if (payModalForm) {
    payModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('payEmail').value;
        const fullName = document.getElementById('payName').value;
        const phone = document.getElementById('payPhone').value;
        const includesEA = orderBumpCheck && orderBumpCheck.checked;
        const totalAmount = getPaymentTotal();
        const productLabel = includesEA ? currentPayment.name + ' + SMA Pro EA' : currentPayment.name;
        const txRef = 'BFX-' + currentPayment.product + '-' + Date.now();

        // Disable submit button to prevent double-clicks
        const submitBtn = payModalForm.querySelector('.pay-modal-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
        }

        try {
            FlutterwaveCheckout({
                public_key: FLUTTERWAVE_PUBLIC_KEY,
                tx_ref: txRef,
                amount: totalAmount / 100, // Flutterwave uses actual amount, not kobo
                currency: 'NGN',
                payment_options: 'card, banktransfer, ussd, mobilemoney',
                customer: {
                    email: email,
                    phone_number: phone,
                    name: fullName
                },
                customizations: {
                    title: 'BossFx Academy',
                    description: productLabel,
                    logo: 'https://www.bossfxcademy.com/assets/logo.png'
                },
                meta: {
                    product: currentPayment.product,
                    product_name: productLabel,
                    ea_bundle: includesEA ? 'yes' : 'no',
                    source: 'website'
                },
                callback: function(response) {
                    // Payment successful
                    trackEvent('payment_success', {
                        product: currentPayment.product,
                        reference: response.tx_ref,
                        transaction_id: response.transaction_id,
                        ea_bundle: includesEA,
                        amount: totalAmount / 100,
                        currency: 'NGN'
                    });
                    payModal.classList.remove('show');
                    payModalForm.reset();
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Proceed to Secure Checkout';
                    }
                    // Route forex-101 buyers to premium access page, others to general success
                    var successPage = currentPayment.product === 'forex-101'
                        ? 'forex101-access.html'
                        : 'payment-success.html';
                    window.location.href = successPage + '?product=' +
                        encodeURIComponent(currentPayment.product) +
                        '&ref=' + response.tx_ref +
                        '&tid=' + response.transaction_id;
                },
                onclose: function(incomplete) {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Proceed to Secure Checkout';
                    }
                    if (incomplete) {
                        trackEvent('payment_cancelled', { product: currentPayment.product });
                    }
                }
            });
        } catch(err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Proceed to Secure Checkout';
            }
            trackEvent('payment_error', { product: currentPayment.product, error: err.message || 'unknown' });
            alert('Payment could not be initiated. Please try again or contact support.');
        }
    });
}

// ===== Countdown Timers =====
document.querySelectorAll('.pricing-timer').forEach(timer => {
    const hours = parseInt(timer.dataset.countdown) || 48;
    const storageKey = 'bfx_countdown_' + hours;
    let endTime = localStorage.getItem(storageKey);
    if (!endTime || parseInt(endTime) < Date.now()) {
        endTime = Date.now() + hours * 60 * 60 * 1000;
        localStorage.setItem(storageKey, endTime);
    }
    const display = timer.querySelector('.countdown-display');
    function tick() {
        const remaining = parseInt(endTime) - Date.now();
        if (remaining <= 0) {
            display.textContent = '00:00:00';
            return;
        }
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        display.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
});

// ===== Live Activity Popup =====
(function() {
    var lpPopup = document.getElementById('livePopup');
    var lpText = document.getElementById('livePopupText');
    if (!lpPopup || !lpText) return;

    var lpMessages = [
        'Someone just joined Group Mentorship',
        'New EA purchase completed',
        'A trader from Lagos just started Forex 101',
        'VIP enrollment confirmed',
        'A new member joined the trading community',
        'Mentorship session booked',
        'Forex 101 enrollment from Abuja'
    ];

    var lpIndex = 0;
    function lpShow() {
        lpText.textContent = lpMessages[lpIndex];
        lpPopup.classList.add('show');
        lpIndex = (lpIndex + 1) % lpMessages.length;
        setTimeout(function() {
            lpPopup.classList.remove('show');
            setTimeout(lpShow, 3000);
        }, 5000);
    }

    setTimeout(lpShow, 4000);
})();

// ===== FAQ Accordion =====
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    });
});

// ===== Ecosystem Stats Counter Animation =====
(function() {
    var statNums = document.querySelectorAll('.eco-stat-number[data-count]');
    if (!statNums.length) return;
    var animated = false;
    function animateCounters() {
        if (animated) return;
        animated = true;
        statNums.forEach(function(el) {
            var target = parseInt(el.dataset.count);
            var duration = 2000;
            var start = 0;
            var startTime = null;
            function step(ts) {
                if (!startTime) startTime = ts;
                var progress = Math.min((ts - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(eased * target).toLocaleString();
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target.toLocaleString();
            }
            requestAnimationFrame(step);
        });
    }
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) { animateCounters(); observer.disconnect(); }
        });
    }, { threshold: 0.3 });
    observer.observe(statNums[0].closest('.eco-stats'));
})();

// ===== Market Session & Status System =====
(function() {
    var sessions = document.querySelectorAll('.session-item');
    var note = document.getElementById('sessionNote');

    // Session time ranges (UTC hours)
    var ranges = {
        sydney:  [21, 6],
        tokyo:   [0, 9],
        london:  [7, 16],
        newyork: [12, 21]
    };

    function isInRange(utcH, r) {
        if (r[0] < r[1]) return utcH >= r[0] && utcH < r[1];
        return utcH >= r[0] || utcH < r[1];
    }

    function isWeekend(now) {
        var utcDay = now.getUTCDay();
        var utcH = now.getUTCHours();
        // Market closed: Friday 21:00 UTC to Sunday 21:00 UTC
        if (utcDay === 6) return true; // Saturday
        if (utcDay === 0 && utcH < 21) return true; // Sunday before 9PM UTC
        if (utcDay === 5 && utcH >= 21) return true; // Friday after 9PM UTC
        return false;
    }

    function getNextOpen(now) {
        var target = new Date(now);
        // Next Sunday 21:00 UTC
        var daysUntilSunday = (7 - target.getUTCDay()) % 7;
        if (daysUntilSunday === 0 && target.getUTCHours() >= 21) daysUntilSunday = 7;
        target.setUTCDate(target.getUTCDate() + daysUntilSunday);
        target.setUTCHours(21, 0, 0, 0);
        return target;
    }

    function formatCountdown(ms) {
        var s = Math.floor(ms / 1000);
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var sec = s % 60;
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function updateSessions() {
        var now = new Date();
        var utcH = now.getUTCHours();
        var weekend = isWeekend(now);

        // Update session indicators
        var activeNames = [];
        sessions.forEach(function(s) {
            var key = s.dataset.session;
            var r = ranges[key];
            var active = !weekend && isInRange(utcH, r);
            s.classList.toggle('active', active);
            if (active) activeNames.push(s.textContent.trim());
        });

        if (note) {
            note.textContent = weekend
                ? 'Markets closed — reopens Sunday 10PM WAT'
                : activeNames.length
                    ? activeNames.join(' & ') + ' session active'
                    : 'Markets open — between sessions';
        }

        // Market status badge (live page hero)
        var badge = document.getElementById('marketStatusBadge');
        var statusText = document.getElementById('marketStatusText');
        var countdown = document.getElementById('marketCountdown');
        var countdownTimer = document.getElementById('marketCountdownTimer');

        if (badge) {
            if (weekend) {
                badge.className = 'market-status-badge market-closed';
                statusText.textContent = 'MARKET CLOSED — Weekend';
                if (countdown) {
                    countdown.style.display = 'block';
                    var nextOpen = getNextOpen(now);
                    var diff = nextOpen - now;
                    countdownTimer.textContent = formatCountdown(diff > 0 ? diff : 0);
                }
            } else {
                badge.className = 'market-status-badge market-open';
                var sessionLabel = activeNames.length ? activeNames.join(' & ') + ' Session' : 'Between Sessions';
                statusText.textContent = 'MARKET OPEN — ' + sessionLabel;
                if (countdown) countdown.style.display = 'none';
            }
        }
    }

    if (sessions.length || document.getElementById('marketStatusBadge')) {
        updateSessions();
        setInterval(updateSessions, 1000); // Update every second for countdown
    }

    // ---- Market Sentiment (algorithmic, no API needed) ----
    var sentimentGrid = document.getElementById('sentimentGrid');
    if (sentimentGrid) {
        var pairs = [
            { pair: 'EUR/USD', bias: 'bullish', strength: 68 },
            { pair: 'GBP/USD', bias: 'bearish', strength: 55 },
            { pair: 'USD/JPY', bias: 'bullish', strength: 72 },
            { pair: 'XAU/USD', bias: 'bullish', strength: 80 },
            { pair: 'AUD/USD', bias: 'neutral', strength: 50 },
            { pair: 'USD/CAD', bias: 'bearish', strength: 60 }
        ];
        // Rotate sentiment slightly each day for freshness
        var dayOffset = new Date().getDate() % 3;
        var biases = ['bullish', 'bearish', 'neutral'];
        var html = '';
        pairs.forEach(function(p, i) {
            var bias = p.bias;
            var str = Math.min(95, Math.max(30, p.strength + ((dayOffset * 7 + i * 3) % 20) - 10));
            // Shift bias slightly based on day
            if ((i + dayOffset) % 5 === 0) bias = biases[(biases.indexOf(bias) + 1) % 3];
            var label = bias.charAt(0).toUpperCase() + bias.slice(1);
            html += '<div class="sentiment-card">' +
                '<div class="sentiment-pair">' + p.pair + '</div>' +
                '<span class="sentiment-value ' + bias + '">' + label + ' ' + str + '%</span>' +
                '<div class="sentiment-bar"><div class="sentiment-bar-fill ' + bias + '" style="width:' + str + '%"></div></div>' +
                '</div>';
        });
        sentimentGrid.innerHTML = html;
    }

    // ---- Key Economic Events (rotating weekly schedule) ----
    var eventsEl = document.getElementById('marketEvents');
    if (eventsEl) {
        var weekEvents = [
            [
                { currency: 'USD', name: 'Non-Farm Payrolls', impact: 'high', time: 'Fri 1:30 PM' },
                { currency: 'EUR', name: 'ECB Interest Rate Decision', impact: 'high', time: 'Thu 1:15 PM' },
                { currency: 'GBP', name: 'UK GDP (MoM)', impact: 'medium', time: 'Wed 7:00 AM' },
                { currency: 'USD', name: 'CPI (YoY)', impact: 'high', time: 'Tue 1:30 PM' }
            ],
            [
                { currency: 'USD', name: 'FOMC Meeting Minutes', impact: 'high', time: 'Wed 7:00 PM' },
                { currency: 'AUD', name: 'RBA Interest Rate Decision', impact: 'high', time: 'Tue 4:30 AM' },
                { currency: 'GBP', name: 'UK Unemployment Rate', impact: 'medium', time: 'Tue 7:00 AM' },
                { currency: 'JPY', name: 'BOJ Policy Rate', impact: 'high', time: 'Fri 3:00 AM' }
            ],
            [
                { currency: 'USD', name: 'Retail Sales (MoM)', impact: 'medium', time: 'Tue 1:30 PM' },
                { currency: 'EUR', name: 'Eurozone CPI (YoY)', impact: 'high', time: 'Wed 10:00 AM' },
                { currency: 'CAD', name: 'BOC Interest Rate Decision', impact: 'high', time: 'Wed 3:00 PM' },
                { currency: 'USD', name: 'Initial Jobless Claims', impact: 'medium', time: 'Thu 1:30 PM' }
            ]
        ];
        var weekIdx = Math.floor(new Date().getDate() / 7) % weekEvents.length;
        var events = weekEvents[weekIdx];
        var ehtml = '';
        events.forEach(function(ev) {
            ehtml += '<div class="market-event">' +
                '<span class="event-impact ' + ev.impact + '"></span>' +
                '<span class="event-currency">' + ev.currency + '</span>' +
                '<span class="event-name">' + ev.name + '</span>' +
                '<span class="event-time">' + ev.time + '</span>' +
                '</div>';
        });
        eventsEl.innerHTML = ehtml;
    }
})();

// ===== Daily Motivation Quotes =====
(function() {
    var quotes = [
        { text: '"The goal of a successful trader is to make the best trades. Money is secondary."', author: '— Alexander Elder' },
        { text: '"In trading, the impossible happens about twice a year."', author: '— Henri M. Simoes' },
        { text: '"Discipline is the bridge between goals and accomplishment."', author: '— Jim Rohn' },
        { text: '"Risk comes from not knowing what you are doing."', author: '— Warren Buffett' },
        { text: '"The market is a device for transferring money from the impatient to the patient."', author: '— Warren Buffett' },
        { text: '"Plan the trade, trade the plan."', author: '— Trading Proverb' },
        { text: '"Consistency beats intensity. Show up every day."', author: '— BossFx Academy' }
    ];
    var el = document.getElementById('dailyQuote');
    var author = document.getElementById('dailyQuoteAuthor');
    if (!el || !author) return;
    var dayIndex = new Date().getDate() % quotes.length;
    el.textContent = quotes[dayIndex].text;
    author.textContent = quotes[dayIndex].author;
})();

// ===== Webinar Countdown Timers =====
(function() {
    document.querySelectorAll('.webinar-countdown').forEach(function(el) {
        var day = parseInt(el.dataset.webinarDay);
        var hour = parseInt(el.dataset.webinarHour);
        var min = parseInt(el.dataset.webinarMin) || 0;
        var display = el.querySelector('.webinar-timer-display');
        if (!display) return;
        function getNext() {
            var now = new Date();
            var target = new Date(now);
            target.setHours(hour, min, 0, 0);
            var diff = day - now.getDay();
            if (diff < 0) diff += 7;
            if (diff === 0 && now > target) diff = 7;
            target.setDate(target.getDate() + diff);
            return target;
        }
        function tick() {
            var diff = getNext() - new Date();
            if (diff <= 0) { display.textContent = 'LIVE NOW!'; return; }
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            display.textContent = (d > 0 ? d + 'd ' : '') + h + 'h ' + m + 'm ' + s + 's';
        }
        tick();
        setInterval(tick, 1000);
    });
})();

// ===== Webinar Registration Modal =====
(function() {
    var modal = document.getElementById('webinarModal');
    var modalTitle = document.getElementById('webinarModalTitle');
    var closeBtn = document.getElementById('webinarModalClose');
    var form = document.getElementById('webinarRegForm');
    if (!modal) return;
    document.querySelectorAll('.webinar-register-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var card = btn.closest('.webinar-card');
            var title = card ? card.querySelector('.webinar-title').textContent : '';
            if (modalTitle) modalTitle.textContent = title;
            modal.classList.add('active');
        });
    });
    if (closeBtn) closeBtn.addEventListener('click', function() { modal.classList.remove('active'); });
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('active'); });
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var name = document.getElementById('webinarName').value;
            var email = document.getElementById('webinarEmail').value;
            var telegram = document.getElementById('webinarTelegram').value;
            var level = document.getElementById('webinarLevel').value;
            var webinar = modalTitle ? modalTitle.textContent : '';
            var formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('telegram', telegram);
            formData.append('experience_level', level);
            formData.append('webinar', webinar);
            formData.append('source', 'webinar_registration');
            formData.append('_subject', 'New Webinar Registration: ' + webinar);
            formData.append('_replyto', email);

            fetch('https://formspree.io/f/xeenzyna', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }).then(function(res) {
                trackEvent('webinar_register', { name: name, email: email, webinar: webinar, level: level });
                BFX.analytics.track('webinar_registration', { webinar: webinar, experience: level });
                BFX.funnel.setStage('webinar');
                modal.classList.remove('active');
                form.reset();
                alert('You\'re registered for ' + webinar + '! Check your email and join the Telegram group for session reminders.');
            }).catch(function() {
                trackEvent('webinar_register', { name: name, email: email, webinar: webinar, level: level });
                BFX.funnel.setStage('webinar');
                modal.classList.remove('active');
                form.reset();
                alert('You\'re registered for ' + webinar + '! Check your email and join the Telegram group for session reminders.');
            });
        });
    }
})();

// ===== Exit Intent Popup =====
(function() {
    var popup = document.getElementById('exitPopup');
    var closeBtn = document.getElementById('exitPopupClose');
    var dismissBtn = document.getElementById('exitPopupDismiss');
    if (!popup) return;
    var shown = sessionStorage.getItem('bfx_exit_shown');
    function showPopup() { if (!shown) { popup.classList.add('active'); shown = true; sessionStorage.setItem('bfx_exit_shown', '1'); } }
    function hidePopup() { popup.classList.remove('active'); }
    document.addEventListener('mouseout', function(e) {
        if (e.clientY < 10 && !shown) showPopup();
    });
    if (closeBtn) closeBtn.addEventListener('click', hidePopup);
    if (dismissBtn) dismissBtn.addEventListener('click', hidePopup);
    popup.addEventListener('click', function(e) { if (e.target === popup) hidePopup(); });
})();

// ===== Journey Step Animations =====
(function() {
    var steps = document.querySelectorAll('.journey-step');
    if (!steps.length) return;
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var step = entry.target;
                var delay = (parseInt(step.dataset.step) - 1) * 150;
                setTimeout(function() {
                    step.style.opacity = '1';
                    step.style.transform = 'translateY(0)';
                }, delay);
                observer.unobserve(step);
            }
        });
    }, { threshold: 0.2 });
    steps.forEach(function(s) {
        s.style.opacity = '0';
        s.style.transform = 'translateY(20px)';
        s.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(s);
    });
})();

// ================================================================
// BOSSFX EVOLUTION ENGINE
// Phase 2-9: Social Proof, Lead Capture, Retention, Content OS,
// Conversion, Analytics, Platform Feel
// ================================================================

// ----- Phase 2: Social Proof Toast System -----
BFX.proofToast = (function() {
    var messages = [
        { icon: '🎓', text: '<strong>Adebayo O.</strong> just enrolled in Forex 101', time: '2 minutes ago' },
        { icon: '🏆', text: '<strong>Chinonso E.</strong> completed the 30-Day Discipline Challenge', time: '5 minutes ago' },
        { icon: '🤖', text: '<strong>A trader from Abuja</strong> deployed the SMA Pro EA', time: '8 minutes ago' },
        { icon: '📺', text: '<strong>New registration</strong> for Sunday Market Prep webinar', time: '12 minutes ago' },
        { icon: '💬', text: '<strong>Fatima A.</strong> joined the Telegram community', time: '15 minutes ago' },
        { icon: '🎯', text: '<strong>Emmanuel K.</strong> passed FTMO Phase 1 using BossFx strategies', time: '22 minutes ago' },
        { icon: '📚', text: '<strong>A trader from Lagos</strong> started Group Mentorship', time: '28 minutes ago' },
        { icon: '✅', text: '<strong>Victor U.</strong> earned the Consistency Badge', time: '35 minutes ago' },
        { icon: '🔥', text: '<strong>89 traders</strong> registered for this week\'s webinar', time: '1 hour ago' },
        { icon: '💰', text: '<strong>David M.</strong> received his first funded account payout', time: '2 hours ago' }
    ];

    var toast = null;
    var index = 0;
    var showing = false;

    function create() {
        toast = document.createElement('div');
        toast.className = 'proof-toast';
        toast.innerHTML = '<div class="proof-toast-icon"></div><div class="proof-toast-text"></div>';
        document.body.appendChild(toast);
        toast.addEventListener('click', function() { hide(); });
    }

    function show() {
        if (showing) return;
        if (!toast) create();
        var msg = messages[index % messages.length];
        toast.querySelector('.proof-toast-icon').textContent = msg.icon;
        toast.querySelector('.proof-toast-text').innerHTML = msg.text + '<span class="proof-toast-time">' + msg.time + '</span>';
        showing = true;
        toast.classList.add('show');
        BFX.analytics.track('social_proof_shown', { message_index: index });
        setTimeout(hide, 5000);
        index++;
    }

    function hide() {
        if (!showing || !toast) return;
        toast.classList.remove('show');
        showing = false;
    }

    function start() {
        var firstDelay = 8000 + Math.random() * 7000;
        setTimeout(function() {
            show();
            setInterval(function() {
                var delay = 15000 + Math.random() * 20000;
                setTimeout(show, delay);
            }, 35000);
        }, firstDelay);
    }

    if (document.querySelector('.hero, .page-hero')) start();
    return { show: show, hide: hide };
})();

// ----- Phase 2: Success Carousel -----
BFX.carousel = (function() {
    var track = document.querySelector('.success-track');
    if (!track) return {};
    var dots = document.querySelectorAll('.carousel-dot');
    var cards = track.querySelectorAll('.success-card');
    if (!cards.length) return {};

    function scrollToIndex(i) {
        var card = cards[i];
        if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
        dots.forEach(function(d, j) { d.classList.toggle('active', j === i); });
    }

    dots.forEach(function(dot, i) {
        dot.addEventListener('click', function() { scrollToIndex(i); });
    });

    track.addEventListener('scroll', function() {
        var scrollLeft = track.scrollLeft;
        var closest = 0;
        var minDist = Infinity;
        cards.forEach(function(card, i) {
            var dist = Math.abs(card.offsetLeft - track.offsetLeft - scrollLeft);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        dots.forEach(function(d, j) { d.classList.toggle('active', j === closest); });
    });

    return { scrollToIndex: scrollToIndex };
})();

// ----- Phase 3: Lead Bar -----
BFX.leadBar = (function() {
    var bar = document.querySelector('.lead-bar');
    if (!bar) return {};
    var closeBtn = bar.querySelector('.lead-bar-close');
    var form = bar.querySelector('.lead-bar-form');

    if (sessionStorage.getItem('bfx_lead_bar_closed')) {
        bar.style.display = 'none';
        return {};
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            bar.style.display = 'none';
            sessionStorage.setItem('bfx_lead_bar_closed', '1');
            BFX.analytics.track('lead_bar_dismissed');
        });
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var input = form.querySelector('.lead-bar-input');
            var email = input ? input.value : '';
            if (!email) return;
            var btn = form.querySelector('.lead-bar-btn');
            if (btn) btn.textContent = 'Joining...';

            var formData = new FormData();
            formData.append('email', email);
            formData.append('source', 'lead_bar');
            formData.append('_subject', 'New Lead Bar Signup');

            fetch('https://formspree.io/f/xeenzyna', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
            .then(function() {
                BFX.analytics.track('lead_bar_signup', { email: email });
                bar.innerHTML = '<div style="text-align:center;padding:10px;color:#fff;font-size:0.85rem;font-weight:600;">✅ You\'re in! Check your email for the Forex Starter Pack.</div>';
                setTimeout(function() { bar.style.display = 'none'; }, 3000);
            })
            .catch(function() {
                if (btn) btn.textContent = 'Get Free';
                BFX.analytics.track('lead_bar_signup', { email: email });
                bar.innerHTML = '<div style="text-align:center;padding:10px;color:#fff;font-size:0.85rem;font-weight:600;">✅ You\'re in! Check your email for the Forex Starter Pack.</div>';
            });
        });
    }
    return {};
})();

// ----- Phase 3: Newsletter Form -----
BFX.newsletter = (function() {
    document.querySelectorAll('.newsletter-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var input = form.querySelector('input[type="email"]');
            var email = input ? input.value : '';
            if (!email) return;
            var btn = form.querySelector('button');
            var originalText = btn ? btn.textContent : '';
            if (btn) { btn.textContent = 'Subscribing...'; btn.disabled = true; }

            var segment = form.dataset.segment || 'general';
            var formData = new FormData();
            formData.append('email', email);
            formData.append('source', 'newsletter');
            formData.append('segment', segment);
            formData.append('_subject', 'New Newsletter Signup — ' + segment);

            fetch('https://formspree.io/f/xeenzyna', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
            .then(function() {
                BFX.analytics.track('newsletter_signup', { email: email, segment: segment });
                form.innerHTML = '<p style="color:var(--green-400);font-weight:600;text-align:center;">✅ Subscribed! Check your inbox.</p>';
            })
            .catch(function() {
                BFX.analytics.track('newsletter_signup', { email: email, segment: segment });
                form.innerHTML = '<p style="color:var(--green-400);font-weight:600;text-align:center;">✅ Subscribed! Check your inbox.</p>';
            });
        });
    });
})();

// ----- Phase 3: Lead Magnet Buttons -----
BFX.leadMagnets = (function() {
    document.querySelectorAll('.magnet-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var magnet = btn.dataset.magnet || 'unknown';
            BFX.analytics.track('lead_magnet_click', { magnet: magnet });
            var modal = document.getElementById('leadMagnetModal');
            if (modal) {
                var title = modal.querySelector('.magnet-modal-title');
                if (title) title.textContent = btn.dataset.magnetTitle || 'Get Your Free Resource';
                var magnetField = modal.querySelector('#magnetType');
                if (magnetField) magnetField.value = magnet;
                modal.classList.add('active');
            }
        });
    });
})();

// ----- Phase 3: Segment Selection -----
BFX.segmentation = (function() {
    document.querySelectorAll('.segment-select').forEach(function(container) {
        var options = container.querySelectorAll('.segment-option');
        var hiddenInput = container.parentElement.querySelector('[name="segment"]') || container.nextElementSibling;
        options.forEach(function(opt) {
            opt.addEventListener('click', function() {
                options.forEach(function(o) { o.classList.remove('active'); });
                opt.classList.add('active');
                if (hiddenInput && hiddenInput.tagName === 'INPUT') hiddenInput.value = opt.dataset.segment;
                BFX.analytics.track('segment_selected', { segment: opt.dataset.segment });
            });
        });
    });
})();

// ----- Phase 4: Webhook-Ready Form Handler -----
BFX.formEngine = (function() {
    function submitToWebhook(data, webhookUrl) {
        return fetch(webhookUrl || 'https://formspree.io/f/xeenzyna', {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData ? { 'Accept': 'application/json' } : { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
    }

    function collectFormData(form) {
        var data = new FormData(form);
        data.append('page', BFX.analytics.pageName);
        data.append('device', BFX.analytics.device);
        data.append('visit_number', String(BFX.analytics.visitCount));
        data.append('timestamp', new Date().toISOString());
        var activeSegment = form.querySelector('.segment-option.active');
        if (activeSegment) data.append('segment', activeSegment.dataset.segment);
        return data;
    }

    return { submit: submitToWebhook, collect: collectFormData };
})();

// ----- Phase 5: Streak + Badge System (localStorage) -----
BFX.retention = (function() {
    var KEY_STREAK = 'bfx_streak';
    var KEY_LAST = 'bfx_streak_last';
    var KEY_BADGES = 'bfx_badges';

    function getStreak() {
        var last = localStorage.getItem(KEY_LAST);
        var streak = parseInt(localStorage.getItem(KEY_STREAK) || '0');
        if (!last) return 0;
        var lastDate = new Date(last).toDateString();
        var today = new Date().toDateString();
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastDate === today) return streak;
        if (lastDate === yesterday) return streak;
        return 0;
    }

    function recordVisit() {
        var last = localStorage.getItem(KEY_LAST);
        var streak = parseInt(localStorage.getItem(KEY_STREAK) || '0');
        var today = new Date().toDateString();
        if (!last) {
            localStorage.setItem(KEY_STREAK, '1');
            localStorage.setItem(KEY_LAST, today);
            return 1;
        }
        var lastDate = new Date(last).toDateString();
        if (lastDate === today) return streak;
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastDate === yesterday) {
            streak++;
            localStorage.setItem(KEY_STREAK, String(streak));
            localStorage.setItem(KEY_LAST, today);
            checkBadges(streak);
            return streak;
        }
        localStorage.setItem(KEY_STREAK, '1');
        localStorage.setItem(KEY_LAST, today);
        return 1;
    }

    function getBadges() {
        try { return JSON.parse(localStorage.getItem(KEY_BADGES) || '[]'); } catch(e) { return []; }
    }

    function earnBadge(id, name) {
        var badges = getBadges();
        if (badges.find(function(b) { return b.id === id; })) return false;
        badges.push({ id: id, name: name, earned: new Date().toISOString() });
        localStorage.setItem(KEY_BADGES, JSON.stringify(badges));
        BFX.analytics.track('badge_earned', { badge: id });
        return true;
    }

    function checkBadges(streak) {
        if (streak >= 3) earnBadge('streak_3', '3-Day Streak');
        if (streak >= 7) earnBadge('streak_7', 'Week Warrior');
        if (streak >= 14) earnBadge('streak_14', 'Consistent Trader');
        if (streak >= 30) earnBadge('streak_30', 'Discipline Master');
    }

    var currentStreak = recordVisit();
    BFX.analytics.track('session_streak', { streak: currentStreak });

    function renderStreak() {
        var el = document.querySelector('.dash-streak-num');
        if (el) el.textContent = currentStreak;
    }

    function renderBadges() {
        var container = document.querySelector('.badge-grid');
        if (!container) return;
        var earned = getBadges();
        var allBadges = [
            { id: 'streak_3', name: '3-Day Streak', icon: '🔥' },
            { id: 'streak_7', name: 'Week Warrior', icon: '⚡' },
            { id: 'streak_14', name: 'Consistent Trader', icon: '🎯' },
            { id: 'streak_30', name: 'Discipline Master', icon: '🏆' },
            { id: 'first_webinar', name: 'First Webinar', icon: '📺' },
            { id: 'challenge_joined', name: 'Challenge Joiner', icon: '🏅' },
            { id: 'starter_pack', name: 'Starter Pack', icon: '📦' },
            { id: 'community_member', name: 'Community Member', icon: '💬' }
        ];
        container.innerHTML = allBadges.map(function(badge) {
            var isEarned = earned.find(function(b) { return b.id === badge.id; });
            return '<div class="achievement-badge ' + (isEarned ? 'earned' : 'locked') + '">' +
                '<span class="badge-icon">' + badge.icon + '</span>' +
                '<span class="badge-name">' + badge.name + '</span>' +
                '</div>';
        }).join('');
    }

    renderStreak();
    renderBadges();

    return {
        getStreak: function() { return currentStreak; },
        getBadges: getBadges,
        earnBadge: earnBadge,
        renderBadges: renderBadges
    };
})();

// ----- Phase 5: Progress Bar Animation -----
BFX.progressBars = (function() {
    var bars = document.querySelectorAll('.progress-bar-fill[data-progress]');
    if (!bars.length) return;
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.style.width = entry.target.dataset.progress + '%';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    bars.forEach(function(bar) {
        bar.style.width = '0%';
        observer.observe(bar);
    });
})();

// ----- Phase 7: Urgency Countdown -----
BFX.urgency = (function() {
    document.querySelectorAll('.urgency-timer[data-deadline]').forEach(function(timer) {
        function tick() {
            var deadline = new Date(timer.dataset.deadline).getTime();
            var now = Date.now();
            var diff = deadline - now;
            if (diff <= 0) { timer.textContent = 'EXPIRED'; return; }
            var h = Math.floor(diff / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            timer.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }
        tick();
        setInterval(tick, 1000);
    });
})();

// ----- Phase 8: Enhanced Funnel Tracking -----
BFX.funnelV2 = (function() {
    var STAGES = {
        'index': 'homepage',
        'homepage': 'homepage',
        'live': 'engagement',
        'courses': 'consideration',
        'mentorship': 'consideration',
        'community': 'community',
        'about': 'awareness',
        'contact': 'intent',
        'thank-you': 'converted'
    };
    var stage = STAGES[BFX.analytics.pageName] || 'other';
    BFX.analytics.track('funnel_v2_pageview', { stage: stage, page: BFX.analytics.pageName });

    document.querySelectorAll('.btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var text = btn.textContent.trim().substring(0, 40);
            var href = btn.getAttribute('href') || '';
            var section = btn.closest('section');
            var sectionId = section ? section.id : 'unknown';
            BFX.analytics.track('cta_interaction', {
                text: text,
                href: href,
                section: sectionId,
                funnel_stage: stage
            });
        });
    });

    return { getStage: function() { return stage; } };
})();

// ----- Phase 9: Animated Counter on Scroll -----
BFX.animCounters = (function() {
    var counters = document.querySelectorAll('.trust-counter-num[data-count]');
    if (!counters.length) return;
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            var target = parseInt(el.dataset.count);
            var suffix = el.dataset.suffix || '';
            var duration = 2000;
            var startTime = null;
            function step(ts) {
                if (!startTime) startTime = ts;
                var progress = Math.min((ts - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target.toLocaleString() + suffix;
            }
            requestAnimationFrame(step);
            observer.unobserve(el);
        });
    }, { threshold: 0.3 });
    counters.forEach(function(c) { observer.observe(c); });
})();

// ================================================================
// REFINEMENT LAYER
// Resource Carousel, Calendar CTAs, Social Gate, Analytics
// ================================================================

// ----- Task 1: Resource Floating Carousel -----
BFX.resourceCarousel = (function() {
    var grid = document.querySelector('.magnet-grid');
    if (!grid) return {};
    var cards = grid.querySelectorAll('.magnet-card');
    if (!cards.length) return {};

    var wrap = document.createElement('div');
    wrap.className = 'resource-carousel-wrap';
    var track = document.createElement('div');
    track.className = 'resource-carousel-track';

    cards.forEach(function(card) { track.appendChild(card.cloneNode(true)); });
    cards.forEach(function(card) { track.appendChild(card.cloneNode(true)); });

    wrap.appendChild(track);
    grid.parentNode.replaceChild(wrap, grid);

    track.querySelectorAll('.magnet-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var magnet = btn.dataset.magnet || 'unknown';
            BFX.analytics.track('lead_magnet_click', { magnet: magnet });
            BFX.socialGate.open(btn.dataset.magnet, btn.dataset.magnetTitle);
        });
    });

    var touchStartX = 0;
    var scrollLeft = 0;
    wrap.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].pageX;
        track.style.animationPlayState = 'paused';
    }, { passive: true });
    wrap.addEventListener('touchend', function() {
        track.style.animationPlayState = '';
    }, { passive: true });

    return {};
})();

// ----- Task 2: Calendar CTA Functionality -----
BFX.calendarLinks = (function() {
    var webinars = {
        'sunday-prep': {
            title: 'BossFx Sunday Market Preparation',
            description: 'Weekly analysis of key levels, bias, and setups for the week ahead. Hosted by Timilehin Shobande.\\n\\nJoin: https://t.me/qD_fBeaziqE5YzU8',
            day: 0, hour: 19, min: 0, duration: 60, location: 'BossFx Telegram Community'
        },
        'beginner-bootcamp': {
            title: 'BossFx Beginner Bootcamp',
            description: 'Interactive crash course for absolute beginners. Charts, candles, setups. Hosted by Timilehin Shobande.\\n\\nJoin: https://t.me/qD_fBeaziqE5YzU8',
            day: 3, hour: 20, min: 0, duration: 45, location: 'BossFx Telegram Community'
        },
        'ea-workshop': {
            title: 'BossFx EA Automation Workshop',
            description: 'Deep dive into automated trading with the BossFx SMA Pro Trend EA. Hosted by Timilehin Shobande.\\n\\nJoin: https://t.me/qD_fBeaziqE5YzU8',
            day: 6, hour: 18, min: 0, duration: 90, location: 'BossFx Telegram Community'
        }
    };

    function getNextDate(targetDay, hour, min) {
        var now = new Date();
        var d = new Date(now);
        var diff = (targetDay - d.getDay() + 7) % 7;
        if (diff === 0 && (d.getHours() > hour || (d.getHours() === hour && d.getMinutes() >= min))) diff = 7;
        d.setDate(d.getDate() + diff);
        d.setHours(hour, min, 0, 0);
        return d;
    }

    function toGoogleDate(d) {
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    function makeGoogleUrl(w) {
        var start = getNextDate(w.day, w.hour, w.min);
        var end = new Date(start.getTime() + w.duration * 60000);
        return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
            '&text=' + encodeURIComponent(w.title) +
            '&dates=' + toGoogleDate(start) + '/' + toGoogleDate(end) +
            '&details=' + encodeURIComponent(w.description) +
            '&location=' + encodeURIComponent(w.location) +
            '&recur=RRULE:FREQ=WEEKLY';
    }

    function makeICS(w) {
        var start = getNextDate(w.day, w.hour, w.min);
        var end = new Date(start.getTime() + w.duration * 60000);
        var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BossFx Academy//EN\r\nBEGIN:VEVENT\r\n' +
            'DTSTART:' + toGoogleDate(start) + '\r\n' +
            'DTEND:' + toGoogleDate(end) + '\r\n' +
            'RRULE:FREQ=WEEKLY\r\n' +
            'SUMMARY:' + w.title + '\r\n' +
            'DESCRIPTION:' + w.description.replace(/\\n/g, '\\n') + '\r\n' +
            'LOCATION:' + w.location + '\r\n' +
            'END:VEVENT\r\nEND:VCALENDAR';
        return ics;
    }

    function downloadICS(w) {
        var blob = new Blob([makeICS(w)], { type: 'text/calendar;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = w.title.replace(/\s+/g, '_') + '.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    document.querySelectorAll('.webinar-cal-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var card = btn.closest('.webinar-card');
            var regBtn = card ? card.querySelector('.webinar-register-btn') : null;
            var webinarKey = regBtn ? regBtn.dataset.webinar : 'sunday-prep';
            var w = webinars[webinarKey] || webinars['sunday-prep'];
            var calType = btn.dataset.cal;

            BFX.analytics.track('calendar_add_click', { webinar: webinarKey, type: calType });

            if (calType === 'google') {
                window.open(makeGoogleUrl(w), '_blank');
            } else {
                downloadICS(w);
            }
        });
    });

    return {};
})();

// ----- Task 5: Social Follow Gate -----
BFX.socialGate = (function() {
    var overlay = null;
    var currentMagnet = '';
    var currentTitle = '';
    var completedItems = {};

    var SOCIALS = [
        { id: 'telegram', icon: '💬', name: 'Join Telegram Community', desc: '5,200+ traders', url: 'https://t.me/qD_fBeaziqE5YzU8' },
        { id: 'instagram', icon: '📸', name: 'Follow on Instagram', desc: '@bossfx_academy', url: 'https://www.instagram.com/bossfx_academy' },
        { id: 'youtube', icon: '▶️', name: 'Subscribe on YouTube', desc: 'BossFx Trading Community', url: 'https://youtube.com/@bossfx-tradingcommunity?si=9cDfBjWkpJWsgLCe' },
        { id: 'x', icon: '𝕏', name: 'Follow on X', desc: '@teebossx', url: 'https://x.com/teebossx' }
    ];

    var RESOURCE_URLS = {
        'starter-pack': 'resources/beginner/forex-starter-pack.html',
        'checklist': 'resources/beginner/pre-trade-checklist.html',
        'risk-blueprint': 'resources/risk-management/risk-management-blueprint.html',
        'prop-guide': 'resources/prop-firm/prop-firm-survival-guide.html',
        'risk-calculator': 'resources/risk-management/risk-calculator.html',
        'trading-plan': 'resources/templates/trading-plan-template.html',
        'trade-journal': 'resources/journals/trade-journal-sheet.html',
        'discipline-tracker': 'resources/challenges/trading-discipline-tracker.html'
    };

    function loadCompleted() {
        try { completedItems = JSON.parse(localStorage.getItem('bfx_social_gate') || '{}'); } catch(e) { completedItems = {}; }
    }

    function saveCompleted() {
        localStorage.setItem('bfx_social_gate', JSON.stringify(completedItems));
    }

    function getCompletedCount() {
        return Object.keys(completedItems).length;
    }

    function createModal() {
        overlay = document.createElement('div');
        overlay.className = 'social-gate-overlay';
        overlay.innerHTML =
            '<div class="social-gate">' +
                '<button class="social-gate-close">&times;</button>' +
                '<div class="social-gate-header">' +
                    '<div class="social-gate-icon">🔓</div>' +
                    '<h3>Unlock Your Free Resource</h3>' +
                    '<p class="social-gate-subtitle">Join the BossFx ecosystem to access your download</p>' +
                '</div>' +
                '<div class="social-gate-progress"><div class="social-gate-progress-fill"></div></div>' +
                '<div class="social-gate-checklist"></div>' +
                '<a class="social-gate-download locked" id="gateDownloadBtn">🔒 Complete at least 2 steps to unlock</a>' +
                '<button class="social-gate-skip">Skip — I\'ll download without following</button>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.querySelector('.social-gate-close').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
        overlay.querySelector('.social-gate-skip').addEventListener('click', function() {
            BFX.analytics.track('social_gate_skipped', { magnet: currentMagnet });
            triggerDownload();
        });

        renderChecklist();
    }

    function renderChecklist() {
        var list = overlay.querySelector('.social-gate-checklist');
        list.innerHTML = SOCIALS.map(function(s) {
            var done = completedItems[s.id];
            return '<a href="' + s.url + '" target="_blank" rel="noopener" class="social-gate-item' + (done ? ' completed' : '') + '" data-social="' + s.id + '">' +
                '<div class="social-gate-check">' + (done ? '✓' : '') + '</div>' +
                '<div class="social-gate-item-icon">' + s.icon + '</div>' +
                '<div class="social-gate-item-info"><strong>' + s.name + '</strong><span>' + s.desc + '</span></div>' +
            '</a>';
        }).join('');

        list.querySelectorAll('.social-gate-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var socialId = item.dataset.social;
                setTimeout(function() {
                    completedItems[socialId] = true;
                    saveCompleted();
                    item.classList.add('completed');
                    item.querySelector('.social-gate-check').textContent = '✓';
                    BFX.analytics.track('social_gate_follow', { platform: socialId, magnet: currentMagnet });
                    updateProgress();
                }, 500);
            });
        });

        updateProgress();
    }

    function updateProgress() {
        var count = getCompletedCount();
        var pct = Math.min((count / 2) * 100, 100);
        var fill = overlay.querySelector('.social-gate-progress-fill');
        if (fill) fill.style.width = pct + '%';

        var btn = document.getElementById('gateDownloadBtn');
        if (count >= 2) {
            btn.className = 'social-gate-download unlocked';
            btn.textContent = '🎁 Download ' + (currentTitle || 'Resource') + ' — Free';
            btn.onclick = function(e) {
                e.preventDefault();
                BFX.analytics.track('social_gate_complete', { magnet: currentMagnet, follows: count });
                triggerDownload();
            };
        } else {
            btn.className = 'social-gate-download locked';
            btn.textContent = '🔒 Complete at least 2 steps to unlock';
            btn.onclick = null;
        }
    }

    function triggerDownload() {
        var url = RESOURCE_URLS[currentMagnet] || RESOURCE_URLS['starter-pack'];
        BFX.analytics.track('resource_download_click', { magnet: currentMagnet });
        BFX.retention.earnBadge('starter_pack', 'Starter Pack');
        window.open(url, '_blank');
        close();
    }

    function open(magnet, title) {
        currentMagnet = magnet || 'starter-pack';
        currentTitle = title || 'Free Resource';
        loadCompleted();
        if (!overlay) createModal();
        else renderChecklist();
        overlay.querySelector('.social-gate-subtitle').textContent = 'Join the BossFx ecosystem to access: ' + currentTitle;
        overlay.classList.add('active');
    }

    function close() {
        if (overlay) overlay.classList.remove('active');
    }

    document.querySelectorAll('.magnet-btn').forEach(function(btn) {
        btn.removeEventListener('click', function(){});
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            open(btn.dataset.magnet, btn.dataset.magnetTitle);
        });
    });

    return { open: open, close: close };
})();
