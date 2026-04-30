// ===== Navbar scroll effect =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== Mobile menu toggle =====
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

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

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const spans = mobileToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    });
});

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

document.querySelectorAll('.feature-card, .mentorship-card, .testimonial-card, .course-modules li, .cf-item, .tool-card, .lm-benefit, .lm-pack-items li').forEach((el, i) => {
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

// ===== Lead Magnet Form =====
const leadForm = document.getElementById('leadMagnetForm');
if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('lmEmail').value;
        // TODO: Connect to MailerLite or ConvertKit API for production
        try {
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            }).catch(() => {});
        } catch (err) {}
        leadForm.style.display = 'none';
        document.getElementById('lmSuccess').classList.add('show');
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
        // TODO: Connect to MailerLite or ConvertKit API for production
        try {
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'notify' })
            }).catch(() => {});
        } catch (err) {}
        notifyModal.classList.remove('show');
        document.getElementById('notifyEmail').value = '';
        alert('You\'re on the list! We\'ll notify you when it launches.');
    });
}
