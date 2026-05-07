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
    var contactForm = document.querySelector('form[action*="formspree"]');
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
            await fetch('https://formspree.io/f/xykoeneg', {
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
            await fetch('https://formspree.io/f/xykoeneg', {
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

// ===== Paystack Checkout =====
const PAYSTACK_PUBLIC_KEY = 'pk_test_67e628afd5934dd30993c076afb8cf9313796861';
const ORDER_BUMP_AMOUNT = 1500000;

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

        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: email,
            amount: totalAmount,
            currency: 'NGN',
            ref: 'BFX-' + currentPayment.product + '-' + Date.now(),
            metadata: {
                custom_fields: [
                    { display_name: 'Full Name', variable_name: 'full_name', value: fullName },
                    { display_name: 'Phone', variable_name: 'phone', value: phone },
                    { display_name: 'Product', variable_name: 'product', value: productLabel },
                    { display_name: 'EA Bundle', variable_name: 'ea_bundle', value: includesEA ? 'Yes' : 'No' }
                ]
            },
            onClose: function() {
                trackEvent('payment_cancelled', { product: currentPayment.product });
            },
            callback: function(response) {
                trackEvent('payment_success', { product: currentPayment.product, reference: response.reference, ea_bundle: includesEA });
                payModal.classList.remove('show');
                payModalForm.reset();
                window.location.href = 'contact.html?paid=' + currentPayment.product + '&ref=' + response.reference;
            }
        });
        handler.openIframe();
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

// ===== Market Session Indicator =====
(function() {
    var sessions = document.querySelectorAll('.session-item');
    var note = document.getElementById('sessionNote');
    if (!sessions.length) return;
    function updateSessions() {
        var now = new Date();
        var utcH = now.getUTCHours();
        var ranges = {
            sydney: [21, 6],
            tokyo: [0, 9],
            london: [7, 16],
            newyork: [12, 21]
        };
        var activeNames = [];
        sessions.forEach(function(s) {
            var key = s.dataset.session;
            var r = ranges[key];
            var active = false;
            if (r[0] < r[1]) active = utcH >= r[0] && utcH < r[1];
            else active = utcH >= r[0] || utcH < r[1];
            s.classList.toggle('active', active);
            if (active) activeNames.push(s.textContent.trim());
        });
        if (note) note.textContent = activeNames.length ? activeNames.join(' & ') + ' session open' : 'Markets closed — opens Sunday 9PM WAT';
    }
    updateSessions();
    setInterval(updateSessions, 60000);
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
            var submitBtn = form.querySelector('button[type="submit"]');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = 'Registering...';
            submitBtn.disabled = true;

            fetch('https://formspree.io/f/xykoeneg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    telegram: telegram,
                    experience_level: level,
                    webinar: webinar,
                    source: 'webinar_registration',
                    registered_at: new Date().toISOString()
                })
            }).then(function(res) {
                if (res.ok) {
                    trackEvent('webinar_register', { name: name, email: email, webinar: webinar, level: level });
                    BFX.analytics.track('webinar_registration', { webinar: webinar, experience: level });
                    BFX.funnel.setStage('webinar');
                    form.innerHTML = '<div style="text-align:center;padding:20px 0;">' +
                        '<div style="font-size:48px;margin-bottom:12px;">✅</div>' +
                        '<h3 style="color:#00e676;margin-bottom:8px;">You\'re Registered!</h3>' +
                        '<p style="color:#ccc;">Check your email for confirmation.<br>Join our <a href="https://t.me/qD_fBeaziqE5YzU8" target="_blank" style="color:#00e676;">Telegram group</a> for session reminders.</p>' +
                        '</div>';
                    setTimeout(function() { modal.classList.remove('active'); }, 4000);
                } else {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    alert('Something went wrong. Please try again.');
                }
            }).catch(function() {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                alert('Network error. Please check your connection and try again.');
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
