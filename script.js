// ===== Analytics helper =====
function trackEvent(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
    if (typeof clarity === 'function') clarity('event', name);
}

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

// ===== CTA Event Tracking =====
document.querySelectorAll('a[href*="mql5.com/en/market/product"]').forEach(link => {
    link.addEventListener('click', () => {
        const text = link.textContent.trim().toLowerCase();
        if (text.includes('demo')) {
            trackEvent('ea_demo_click');
        } else {
            trackEvent('ea_buy_click', { value: 49.99 });
        }
    });
});

document.querySelectorAll('a[href*="contact"]').forEach(link => {
    link.addEventListener('click', () => {
        trackEvent('course_enroll_click');
    });
});

document.querySelectorAll('a[href*="t.me/"]').forEach(link => {
    link.addEventListener('click', () => {
        trackEvent('telegram_join');
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
            trackEvent('webinar_register', { name: name, email: email, webinar: modalTitle ? modalTitle.textContent : '' });
            modal.classList.remove('active');
            alert('You\'re registered! Check your email and join the Telegram group for session reminders.');
            form.reset();
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
