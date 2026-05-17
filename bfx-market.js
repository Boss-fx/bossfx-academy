// ================================================================
// BFX.market — Live Market Intelligence Module v1.0
// Real-time market data · Sentiment · Economic Calendar
// ================================================================
var BFX = window.BFX || {};

BFX.market = (function () {
    'use strict';

    var CFG = {
        endpoint: '/api/market-data?type=all',
        refreshInterval: 300000,  // 5 min
        cacheKey: 'bfx_market_v1',
        cacheTTL: 300000,
        animDuration: 600,
        retryDelay: 15000
    };

    var state = {
        data: null,
        lastFetch: 0,
        loading: false,
        error: false,
        refreshTimer: null
    };

    var ASSET_META = {
        EURUSD: { name: 'EUR/USD', icon: '🇪🇺', type: 'Forex',  decimals: 5 },
        GBPUSD: { name: 'GBP/USD', icon: '🇬🇧', type: 'Forex',  decimals: 5 },
        USDJPY: { name: 'USD/JPY', icon: '🇯🇵', type: 'Forex',  decimals: 3 },
        XAUUSD: { name: 'XAU/USD', icon: '🥇', type: 'Metal',  decimals: 2 },
        US30:   { name: 'US30',    icon: '🏛️', type: 'Index',  decimals: 0 },
        NAS100: { name: 'NAS100',  icon: '💻', type: 'Index',  decimals: 0 },
        BTCUSD: { name: 'BTC/USD', icon: '₿',  type: 'Crypto', decimals: 0 },
        ETHUSD: { name: 'ETH/USD', icon: 'Ξ',  type: 'Crypto', decimals: 2 }
    };

    var ASSET_ORDER = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'NAS100', 'BTCUSD', 'ETHUSD'];

    // ============================================================
    // DATA LAYER
    // ============================================================
    function fetchData(callback) {
        if (state.loading) return;
        state.loading = true;

        // Try localStorage first
        var cached = loadCache();
        if (cached && (Date.now() - cached._ts) < CFG.cacheTTL) {
            state.data = cached;
            state.lastFetch = cached._ts;
            state.loading = false;
            if (callback) callback(null, cached);
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', CFG.endpoint, true);
        xhr.timeout = 8000;
        xhr.onload = function () {
            state.loading = false;
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    data._ts = Date.now();
                    state.data = data;
                    state.lastFetch = data._ts;
                    state.error = false;
                    saveCache(data);
                    if (callback) callback(null, data);
                } catch (e) {
                    state.error = true;
                    if (callback) callback(e, cached || null);
                }
            } else {
                state.error = true;
                if (callback) callback(new Error('HTTP ' + xhr.status), cached || null);
            }
        };
        xhr.onerror = function () {
            state.loading = false;
            state.error = true;
            if (callback) callback(new Error('Network error'), cached || null);
        };
        xhr.ontimeout = function () {
            state.loading = false;
            state.error = true;
            if (callback) callback(new Error('Timeout'), cached || null);
        };
        xhr.send();
    }

    function loadCache() {
        try {
            var stored = localStorage.getItem(CFG.cacheKey);
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    }

    function saveCache(data) {
        try { localStorage.setItem(CFG.cacheKey, JSON.stringify(data)); } catch (e) {}
    }

    // ============================================================
    // RENDERING — Price Ticker Grid
    // ============================================================
    function renderPriceGrid(container, prices) {
        if (!container || !prices) return;
        var html = '';
        for (var i = 0; i < ASSET_ORDER.length; i++) {
            var sym = ASSET_ORDER[i];
            var p = prices[sym];
            var meta = ASSET_META[sym];
            if (!p || !meta) continue;

            var isUp = p.changePct >= 0;
            var dirClass = isUp ? 'mkt-up' : 'mkt-down';
            var arrow = isUp ? '▲' : '▼';
            var sign = isUp ? '+' : '';
            var priceStr = formatPrice(p.price, meta.decimals);

            html += '<div class="mkt-price-card ' + dirClass + '" data-symbol="' + sym + '">' +
                '<div class="mkt-price-header">' +
                    '<span class="mkt-price-icon">' + meta.icon + '</span>' +
                    '<div class="mkt-price-label">' +
                        '<span class="mkt-price-name">' + meta.name + '</span>' +
                        '<span class="mkt-price-type">' + meta.type + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="mkt-price-value">' + priceStr + '</div>' +
                '<div class="mkt-price-change ' + dirClass + '">' +
                    '<span class="mkt-arrow">' + arrow + '</span> ' +
                    sign + p.changePct + '%' +
                    '<span class="mkt-change-abs"> (' + sign + p.change + ')</span>' +
                '</div>' +
            '</div>';
        }
        container.innerHTML = html;

        // Bind clicks for analytics
        var cards = container.querySelectorAll('.mkt-price-card');
        for (var c = 0; c < cards.length; c++) {
            cards[c].addEventListener('click', function () {
                var sym = this.getAttribute('data-symbol');
                trackEvent('market_asset_click', { asset: sym });
                // Open Mirror with asset query
                if (BFX.mirror && BFX.mirror.open) {
                    BFX.mirror.open();
                    // Small delay to let panel open
                    var s = sym;
                    setTimeout(function () {
                        if (BFX.mirror.switchView) BFX.mirror.switchView('chat');
                    }, 400);
                }
            });
        }
    }

    // ============================================================
    // RENDERING — Sentiment Heatmap
    // ============================================================
    function renderSentiment(container, sentiment) {
        if (!container || !sentiment) return;
        var html = '';
        for (var i = 0; i < ASSET_ORDER.length; i++) {
            var sym = ASSET_ORDER[i];
            var s = sentiment[sym];
            var meta = ASSET_META[sym];
            if (!s || !meta) continue;

            var biasClass = 'mkt-bias-' + s.bias;
            var biasLabel = s.bias.charAt(0).toUpperCase() + s.bias.slice(1);
            var barWidth = Math.max(20, Math.min(95, s.confidence));
            var barColor = s.bias === 'bullish' ? 'var(--green-400, #10b981)' :
                          s.bias === 'bearish' ? '#ef4444' : '#f59e0b';

            html += '<div class="mkt-sentiment-row">' +
                '<div class="mkt-sentiment-pair">' +
                    '<span>' + meta.name + '</span>' +
                    '<span class="mkt-sentiment-badge ' + biasClass + '">' + biasLabel + '</span>' +
                '</div>' +
                '<div class="mkt-sentiment-bar-wrap">' +
                    '<div class="mkt-sentiment-bar" style="width:' + barWidth + '%;background:' + barColor + '"></div>' +
                '</div>' +
                '<span class="mkt-sentiment-pct">' + s.confidence + '%</span>' +
            '</div>';
        }
        container.innerHTML = html;
    }

    // ============================================================
    // RENDERING — Economic Calendar
    // ============================================================
    function renderCalendar(container, events) {
        if (!container || !events || events.length === 0) {
            if (container) container.innerHTML = '<p class="mkt-empty">No major events scheduled this week.</p>';
            return;
        }
        var html = '';
        for (var i = 0; i < events.length; i++) {
            var evt = events[i];
            var impactClass = evt.impact === 'high' ? 'mkt-impact-high' : 'mkt-impact-medium';
            var statusClass = evt.status === 'past' ? 'mkt-event-past' : (evt.status === 'today' ? 'mkt-event-today' : '');
            var statusBadge = evt.status === 'today' ? '<span class="mkt-event-today-badge">TODAY</span>' : '';

            html += '<div class="mkt-event-row ' + statusClass + '">' +
                '<div class="mkt-event-impact ' + impactClass + '"></div>' +
                '<div class="mkt-event-info">' +
                    '<span class="mkt-event-title">' + evt.title + ' ' + statusBadge + '</span>' +
                    '<span class="mkt-event-meta">' + evt.currency + ' · ' + evt.day + ' · ' + evt.time + '</span>' +
                '</div>' +
            '</div>';
        }
        container.innerHTML = html;
    }

    // ============================================================
    // RENDERING — News Headlines
    // ============================================================
    function renderNews(container, news) {
        if (!container || !news || news.length === 0) {
            if (container) container.innerHTML = '<p class="mkt-empty">Market news updating...</p>';
            return;
        }
        var html = '';
        for (var i = 0; i < news.length; i++) {
            var n = news[i];
            html += '<div class="mkt-news-item">' +
                '<div class="mkt-news-dot"></div>' +
                '<div class="mkt-news-content">' +
                    '<span class="mkt-news-title">' + n.title + '</span>' +
                    '<span class="mkt-news-meta">' + n.source + ' · ' + n.time + '</span>' +
                '</div>' +
            '</div>';
        }
        container.innerHTML = html;
    }

    // ============================================================
    // RENDERING — Volatility Meter
    // ============================================================
    function renderVolatility(container, prices) {
        if (!container || !prices) return;

        // Calculate average volatility from price changes
        var totalVol = 0;
        var count = 0;
        for (var sym in prices) {
            if (prices.hasOwnProperty(sym)) {
                totalVol += Math.abs(prices[sym].changePct || 0);
                count++;
            }
        }
        var avgVol = count > 0 ? totalVol / count : 0;

        var level, levelClass, width;
        if (avgVol > 1.5) { level = 'HIGH'; levelClass = 'mkt-vol-high'; width = 90; }
        else if (avgVol > 0.5) { level = 'MODERATE'; levelClass = 'mkt-vol-moderate'; width = 55; }
        else { level = 'LOW'; levelClass = 'mkt-vol-low'; width = 25; }

        container.innerHTML =
            '<div class="mkt-vol-display">' +
                '<div class="mkt-vol-gauge">' +
                    '<div class="mkt-vol-fill ' + levelClass + '" style="width:' + width + '%"></div>' +
                '</div>' +
                '<div class="mkt-vol-label">' +
                    '<span class="mkt-vol-level ' + levelClass + '">' + level + '</span>' +
                    '<span class="mkt-vol-desc">Avg. movement: ' + avgVol.toFixed(2) + '%</span>' +
                '</div>' +
            '</div>';
    }

    // ============================================================
    // RENDERING — Market Status & Timestamp
    // ============================================================
    function renderMarketMeta(data) {
        var tsEl = document.getElementById('mktLastUpdated');
        if (tsEl && data._ts) {
            var ago = Math.floor((Date.now() - data._ts) / 60000);
            tsEl.textContent = ago < 1 ? 'Just now' : ago + ' min ago';
        }

        var statusEl = document.getElementById('mktMarketSession');
        if (statusEl && data.market) {
            statusEl.textContent = data.market.open
                ? 'Active: ' + data.market.session
                : 'Markets Closed (' + data.market.session + ')';
            statusEl.className = data.market.open ? 'mkt-session-active' : 'mkt-session-closed';
        }
    }

    // ============================================================
    // FULL RENDER
    // ============================================================
    function render(data) {
        if (!data) return;

        renderPriceGrid(document.getElementById('mktPriceGrid'), data.prices);
        renderSentiment(document.getElementById('mktSentimentGrid'), data.sentiment);
        renderCalendar(document.getElementById('mktCalendar'), data.calendar);
        renderNews(document.getElementById('mktNewsFeed'), data.news);
        renderVolatility(document.getElementById('mktVolatility'), data.prices);
        renderMarketMeta(data);

        // Remove loading skeletons
        var skeletons = document.querySelectorAll('.mkt-skeleton');
        for (var i = 0; i < skeletons.length; i++) {
            skeletons[i].classList.add('mkt-loaded');
        }

        trackEvent('market_data_viewed', { assets_loaded: ASSET_ORDER.length, source: data._stale ? 'fallback' : 'api' });
    }

    // ============================================================
    // AUTO-REFRESH
    // ============================================================
    function startRefresh() {
        if (state.refreshTimer) clearInterval(state.refreshTimer);
        state.refreshTimer = setInterval(function () {
            fetchData(function (err, data) {
                if (data) {
                    render(data);
                    trackEvent('market_refresh', { stale: !!data._stale, cache_age: Math.floor((Date.now() - (data._ts || 0)) / 1000) });
                }
            });
        }, CFG.refreshInterval);

        // Also refresh on tab visibility change
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden && state.lastFetch && (Date.now() - state.lastFetch) > CFG.cacheTTL) {
                fetchData(function (err, data) { if (data) render(data); });
            }
        });
    }

    // ============================================================
    // UTILITIES
    // ============================================================
    function formatPrice(price, decimals) {
        if (typeof price !== 'number') return '--';
        return price.toFixed(decimals !== undefined ? decimals : 2);
    }

    function trackEvent(name, data) {
        if (BFX.analytics && BFX.analytics.track) {
            BFX.analytics.track(name, data || {});
        }
        if (window.dataLayer) {
            var evt = { event: name };
            if (data) { for (var k in data) { if (data.hasOwnProperty(k)) evt[k] = data[k]; } }
            window.dataLayer.push(evt);
        }
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        // Only init if market containers exist on this page
        if (!document.getElementById('mktPriceGrid')) return;

        // Show skeletons immediately
        var skeletons = document.querySelectorAll('.mkt-skeleton');
        for (var i = 0; i < skeletons.length; i++) {
            skeletons[i].style.display = 'block';
        }

        // Fetch and render
        fetchData(function (err, data) {
            if (data) {
                render(data);
            } else {
                // Show error state
                var grid = document.getElementById('mktPriceGrid');
                if (grid) grid.innerHTML = '<p class="mkt-empty">Market data loading... <a href="javascript:BFX.market.refresh()">Retry</a></p>';
            }
        });

        startRefresh();
    }

    // ============================================================
    // PUBLIC API
    // ============================================================
    return {
        init: init,
        refresh: function () {
            state.lastFetch = 0; // Force refresh
            fetchData(function (err, data) { if (data) render(data); });
        },
        getData: function () { return state.data; },
        getState: function () { return state; }
    };
})();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { BFX.market.init(); });
} else {
    BFX.market.init();
}
