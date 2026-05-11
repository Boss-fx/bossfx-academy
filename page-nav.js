// ================================================================
// BossFx Smart Page Navigator
// ================================================================
// Auto-detects page sections, builds a floating dropdown TOC,
// highlights the active section on scroll, smooth-scrolls on tap.
// Tracks scroll depth + section views for analytics.
// ================================================================

(function () {
    'use strict';

    // --- Config ---
    var SCROLL_OFFSET = 80;       // px above section to trigger "active"
    var PROGRESS_THROTTLE = 50;   // ms throttle for scroll handler
    var LABEL_MAP = {             // Override auto-detected labels
        'products': 'What We Offer',
        'journey': 'Your Journey',
        'ea': 'Trading EA',
        'daily': 'Live Updates',
        'success': 'Student Results',
        'webinars': 'Live Sessions',
        'pricing': 'Pricing',
        'challenges': 'Challenges',
        'starter-pack': 'Free Starter Pack',
        'telegram-community': 'Telegram',
        'forex101': 'Forex 101',
        'resources': 'Free Resources',
        'faq': 'FAQ'
    };

    // --- Detect sections ---
    var sections = [];
    var allSections = document.querySelectorAll('section[id], .ea-hero[id]');
    allSections.forEach(function (el) {
        var id = el.id;
        if (!id) return;

        // Get label: LABEL_MAP > section-tag > section-title > id
        var label = LABEL_MAP[id];
        if (!label) {
            var tag = el.querySelector('.section-tag');
            if (tag) {
                label = tag.textContent.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\s]+/u, '').trim();
            }
        }
        if (!label) {
            var title = el.querySelector('.section-title, h1, h2');
            if (title) label = title.textContent.replace(/\n/g, ' ').trim().substring(0, 30);
        }
        if (!label) label = id.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });

        sections.push({ id: id, label: label, el: el });
    });

    if (sections.length < 2) return; // Not enough sections to show nav

    // --- Build DOM ---
    var nav = document.createElement('div');
    nav.className = 'bfx-pnav';
    nav.innerHTML =
        '<div class="bfx-pnav-progress"><div class="bfx-pnav-progress-fill"></div></div>' +
        '<button class="bfx-pnav-toggle" aria-label="Page sections" aria-expanded="false">' +
        '  <svg class="bfx-pnav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
        '  <span class="bfx-pnav-current">Sections</span>' +
        '  <svg class="bfx-pnav-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
        '</button>' +
        '<div class="bfx-pnav-dropdown"></div>';

    var dropdown = nav.querySelector('.bfx-pnav-dropdown');
    var currentLabel = nav.querySelector('.bfx-pnav-current');
    var toggle = nav.querySelector('.bfx-pnav-toggle');
    var progressFill = nav.querySelector('.bfx-pnav-progress-fill');

    sections.forEach(function (s, i) {
        var item = document.createElement('a');
        item.href = '#' + s.id;
        item.className = 'bfx-pnav-item';
        item.dataset.index = i;
        item.innerHTML =
            '<span class="bfx-pnav-dot"></span>' +
            '<span class="bfx-pnav-label">' + s.label + '</span>';

        item.addEventListener('click', function (e) {
            e.preventDefault();
            closeDropdown();
            smoothScrollTo(s.el);
            trackEvent('page_nav_click', { section: s.id, label: s.label });
        });

        dropdown.appendChild(item);
    });

    // Insert after navbar
    var navbar = document.getElementById('navbar');
    if (navbar && navbar.nextElementSibling) {
        navbar.parentNode.insertBefore(nav, navbar.nextElementSibling);
    } else {
        document.body.insertBefore(nav, document.body.firstChild);
    }

    // --- Toggle dropdown ---
    var isOpen = false;

    function openDropdown() {
        isOpen = true;
        nav.classList.add('bfx-pnav--open');
        toggle.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
        isOpen = false;
        nav.classList.remove('bfx-pnav--open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        isOpen ? closeDropdown() : openDropdown();
    });

    document.addEventListener('click', function (e) {
        if (isOpen && !nav.contains(e.target)) closeDropdown();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) closeDropdown();
    });

    // --- Smooth scroll ---
    function smoothScrollTo(el) {
        var y = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    // --- Scroll tracking ---
    var activeIndex = -1;
    var maxScrollDepth = 0;
    var viewedSections = new Set();
    var lastScrollTime = 0;

    function onScroll() {
        var now = Date.now();
        if (now - lastScrollTime < PROGRESS_THROTTLE) return;
        lastScrollTime = now;

        var scrollTop = window.pageYOffset;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

        // Update progress bar
        progressFill.style.width = (progress * 100) + '%';

        // Track max scroll depth (fire at milestones)
        var depthPct = Math.floor(progress * 100);
        if (depthPct > maxScrollDepth) {
            maxScrollDepth = depthPct;
            if (depthPct === 25 || depthPct === 50 || depthPct === 75 || depthPct === 90) {
                trackEvent('scroll_depth', { depth: depthPct });
            }
        }

        // Find active section
        var newActive = -1;
        for (var i = sections.length - 1; i >= 0; i--) {
            var rect = sections[i].el.getBoundingClientRect();
            if (rect.top <= SCROLL_OFFSET + 60) {
                newActive = i;
                break;
            }
        }

        if (newActive !== activeIndex) {
            activeIndex = newActive;
            var items = dropdown.querySelectorAll('.bfx-pnav-item');
            items.forEach(function (item, idx) {
                item.classList.toggle('bfx-pnav-item--active', idx === activeIndex);
            });

            if (activeIndex >= 0) {
                currentLabel.textContent = sections[activeIndex].label;
                if (!viewedSections.has(activeIndex)) {
                    viewedSections.add(activeIndex);
                    trackEvent('section_view', { section: sections[activeIndex].id });
                }
            } else {
                currentLabel.textContent = 'Sections';
            }
        }

        // Show/hide nav based on scroll position
        if (scrollTop > 300) {
            nav.classList.add('bfx-pnav--visible');
        } else {
            nav.classList.remove('bfx-pnav--visible');
            closeDropdown();
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Init

    // --- Analytics helper ---
    function trackEvent(name, params) {
        if (window.dataLayer) {
            dataLayer.push(Object.assign({ event: name }, params || {}));
        }
    }
})();
