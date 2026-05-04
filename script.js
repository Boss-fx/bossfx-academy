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

// ===== FAQ Accordion =====
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    });
});
