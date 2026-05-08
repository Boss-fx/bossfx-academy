// ================================================================
// BFX.blog — Blog Engine Modules
// Reading progress, category filters, share bar, analytics
// ================================================================
var BFX = window.BFX || {};

// ----- Reading Progress Bar -----
BFX.readingProgress = (function() {
    'use strict';

    var bar = null;

    function init() {
        // Only on blog post pages (not blog index)
        if (!document.querySelector('.blog-post-header')) return;

        bar = document.createElement('div');
        bar.className = 'bfx-reading-progress';
        bar.innerHTML = '<div class="bfx-reading-progress-fill"></div>';
        document.body.appendChild(bar);

        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    function update() {
        if (!bar) return;
        var article = document.querySelector('.blog-post-body') || document.querySelector('article') || document.body;
        var rect = article.getBoundingClientRect();
        var articleTop = rect.top + window.pageYOffset;
        var articleHeight = article.offsetHeight;
        var windowHeight = window.innerHeight;
        var scrolled = window.pageYOffset - articleTop + windowHeight * 0.3;
        var progress = Math.min(Math.max(scrolled / articleHeight * 100, 0), 100);
        bar.querySelector('.bfx-reading-progress-fill').style.width = progress + '%';
    }

    return { init: init };
})();


// ----- Blog Category Filter -----
BFX.blogFilter = (function() {
    'use strict';

    function init() {
        var filterWrap = document.querySelector('.bfx-blog-filters');
        if (!filterWrap) return;

        var buttons = filterWrap.querySelectorAll('.bfx-filter-btn');
        var cards = document.querySelectorAll('.blog-card[data-category]');

        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cat = btn.getAttribute('data-filter');

                // Update active state
                buttons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');

                // Filter cards
                cards.forEach(function(card) {
                    if (cat === 'all' || card.getAttribute('data-category') === cat) {
                        card.style.display = '';
                        card.style.animation = 'msgSlideIn 0.3s ease';
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Track
                if (BFX.analytics && BFX.analytics.track) {
                    BFX.analytics.track('blog_filter', { category: cat });
                }
            });
        });
    }

    return { init: init };
})();


// ----- Blog Share Bar -----
BFX.blogShare = (function() {
    'use strict';

    function init() {
        var postBody = document.querySelector('.blog-post-body');
        if (!postBody) return;

        var url = encodeURIComponent(window.location.href);
        var title = encodeURIComponent(document.title);

        var shareBar = document.createElement('div');
        shareBar.className = 'bfx-share-bar';
        shareBar.innerHTML =
            '<span class="bfx-share-label">Share this article</span>' +
            '<div class="bfx-share-buttons">' +
                '<a href="https://twitter.com/intent/tweet?url=' + url + '&text=' + title + '" target="_blank" rel="noopener" class="bfx-share-btn" aria-label="Share on X">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
                '</a>' +
                '<a href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener" class="bfx-share-btn" aria-label="Share on Facebook">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
                '</a>' +
                '<a href="https://api.whatsapp.com/send?text=' + title + '%20' + url + '" target="_blank" rel="noopener" class="bfx-share-btn" aria-label="Share on WhatsApp">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
                '</a>' +
                '<button class="bfx-share-btn bfx-copy-link" aria-label="Copy link">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
                '</button>' +
            '</div>';

        postBody.appendChild(shareBar);

        // Copy link handler
        shareBar.querySelector('.bfx-copy-link').addEventListener('click', function() {
            navigator.clipboard.writeText(window.location.href).then(function() {
                var btn = shareBar.querySelector('.bfx-copy-link');
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(function() {
                    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
                }, 2000);
            });

            if (BFX.analytics && BFX.analytics.track) {
                BFX.analytics.track('blog_share', { method: 'copy_link', url: window.location.href });
            }
        });

        // Track social shares
        shareBar.querySelectorAll('a.bfx-share-btn').forEach(function(link) {
            link.addEventListener('click', function() {
                var platform = link.getAttribute('aria-label').replace('Share on ', '').toLowerCase();
                if (BFX.analytics && BFX.analytics.track) {
                    BFX.analytics.track('blog_share', { method: platform, url: window.location.href });
                }
            });
        });
    }

    return { init: init };
})();


// ----- Blog Analytics -----
BFX.blogAnalytics = (function() {
    'use strict';

    function init() {
        if (!document.querySelector('.blog-post-header')) return;

        // Track read time milestones
        var milestones = [25, 50, 75, 100];
        var fired = {};

        window.addEventListener('scroll', function() {
            var article = document.querySelector('.blog-post-body') || document.body;
            var rect = article.getBoundingClientRect();
            var articleTop = rect.top + window.pageYOffset;
            var articleHeight = article.offsetHeight;
            var scrolled = window.pageYOffset - articleTop + window.innerHeight * 0.5;
            var progress = Math.min(Math.max(scrolled / articleHeight * 100, 0), 100);

            milestones.forEach(function(m) {
                if (progress >= m && !fired[m]) {
                    fired[m] = true;
                    if (BFX.analytics && BFX.analytics.track) {
                        BFX.analytics.track('blog_read_milestone', {
                            milestone: m,
                            url: window.location.pathname,
                            title: document.title
                        });
                    }
                }
            });
        }, { passive: true });

        // Track time on page
        var startTime = Date.now();
        window.addEventListener('beforeunload', function() {
            var timeSpent = Math.round((Date.now() - startTime) / 1000);
            if (BFX.analytics && BFX.analytics.track) {
                BFX.analytics.track('blog_time_on_page', {
                    seconds: timeSpent,
                    url: window.location.pathname
                });
            }
        });
    }

    return { init: init };
})();


// ----- Auto-init all blog modules -----
(function() {
    function initAll() {
        BFX.readingProgress.init();
        BFX.blogFilter.init();
        BFX.blogShare.init();
        BFX.blogAnalytics.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
