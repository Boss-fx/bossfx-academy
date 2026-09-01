// ================================================================
// Market Data API — Consolidated market intelligence endpoint
// GET /api/market-data?type=all|prices|calendar|sentiment|news
// Aggregates forex, crypto, metals, indices, economic calendar
// ================================================================
var https = require('https');
var http = require('http');

// ── In-memory warm cache (persists across warm Vercel invocations) ──
var _cache = {};
var _cacheTTL = {
    prices: 300000,    // 5 min
    calendar: 1800000, // 30 min
    news: 900000,      // 15 min
    sentiment: 300000,  // 5 min
    all: 300000         // 5 min
};

// ── Fallback data when APIs are unreachable ──
var FALLBACK_PRICES = {
    EURUSD: { price: 1.1180, change: 0, changePct: 0, direction: 'flat' },
    GBPUSD: { price: 1.3300, change: 0, changePct: 0, direction: 'flat' },
    USDJPY: { price: 145.50, change: 0, changePct: 0, direction: 'flat' },
    XAUUSD: { price: 3220.00, change: 0, changePct: 0, direction: 'flat' },
    US30:   { price: 42200, change: 0, changePct: 0, direction: 'flat' },
    NAS100: { price: 21400, change: 0, changePct: 0, direction: 'flat' },
    BTCUSD: { price: 103500, change: 0, changePct: 0, direction: 'flat' },
    ETHUSD: { price: 2500, change: 0, changePct: 0, direction: 'flat' }
};

// ── HTTP fetch helper ──
function fetchJSON(url, timeout) {
    return new Promise(function (resolve, reject) {
        var proto = url.indexOf('https') === 0 ? https : http;
        var timer = setTimeout(function () { req.destroy(); reject(new Error('timeout')); }, timeout || 6000);
        var req = proto.get(url, function (res) {
            var body = '';
            res.on('data', function (c) { body += c; });
            res.on('end', function () {
                clearTimeout(timer);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
                } else {
                    reject(new Error('HTTP ' + res.statusCode));
                }
            });
        });
        req.on('error', function (e) { clearTimeout(timer); reject(e); });
    });
}

// ── Cache helper ──
function getCached(key) {
    var entry = _cache[key];
    if (entry && (Date.now() - entry.ts) < (_cacheTTL[key] || 300000)) {
        return entry.data;
    }
    return null;
}
function setCache(key, data) {
    _cache[key] = { data: data, ts: Date.now() };
}

// ================================================================
// DATA FETCHERS
// ================================================================

// Forex prices from Frankfurter API (open, unlimited, no key)
// Fetches latest rate AND previous business day's rate for accurate change
function fetchForexPrices() {
    var today = new Date();
    var dayOfWeek = today.getUTCDay();

    // Determine the "previous" date for comparison
    // On weekdays: compare latest vs yesterday (skip weekends)
    // On weekends: compare Friday vs Thursday (show last trading day change)
    var prevDate = new Date(today);
    if (dayOfWeek === 0) { // Sunday: compare Friday vs Thursday
        prevDate.setDate(prevDate.getDate() - 3); // Thursday
    } else if (dayOfWeek === 6) { // Saturday: compare Friday vs Thursday
        prevDate.setDate(prevDate.getDate() - 2); // Thursday
    } else if (dayOfWeek === 1) { // Monday: compare today vs Friday
        prevDate.setDate(prevDate.getDate() - 3); // Friday
    } else {
        prevDate.setDate(prevDate.getDate() - 1); // Previous day
    }
    var prevStr = prevDate.toISOString().split('T')[0];

    var latestUrl = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,JPY';
    var prevUrl = 'https://api.frankfurter.dev/v1/' + prevStr + '?base=USD&symbols=EUR,GBP,JPY';

    return Promise.all([fetchJSON(latestUrl, 5000), fetchJSON(prevUrl, 5000)])
        .then(function (results) {
            var latest = results[0].rates || {};
            var prev = results[1].rates || {};
            var result = {};

            if (latest.EUR) {
                var euNow = parseFloat((1 / latest.EUR).toFixed(5));
                var euPrev = prev.EUR ? parseFloat((1 / prev.EUR).toFixed(5)) : euNow;
                result.EURUSD = buildPriceFromPrev(euNow, euPrev);
            }
            if (latest.GBP) {
                var gbNow = parseFloat((1 / latest.GBP).toFixed(5));
                var gbPrev = prev.GBP ? parseFloat((1 / prev.GBP).toFixed(5)) : gbNow;
                result.GBPUSD = buildPriceFromPrev(gbNow, gbPrev);
            }
            if (latest.JPY) {
                var jpNow = parseFloat(latest.JPY.toFixed(3));
                var jpPrev = prev.JPY ? parseFloat(prev.JPY.toFixed(3)) : jpNow;
                result.USDJPY = buildPriceFromPrev(jpNow, jpPrev);
            }
            return result;
        }).catch(function () { return {}; });
}

// Crypto prices from CoinGecko (free, 30 calls/min)
function fetchCryptoPrices() {
    var url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true';
    return fetchJSON(url, 5000).then(function (data) {
        var result = {};
        if (data.bitcoin) {
            result.BTCUSD = {
                price: data.bitcoin.usd,
                change: parseFloat((data.bitcoin.usd * data.bitcoin.usd_24h_change / 100).toFixed(2)),
                changePct: parseFloat(data.bitcoin.usd_24h_change.toFixed(2)),
                direction: data.bitcoin.usd_24h_change >= 0 ? 'up' : 'down'
            };
        }
        if (data.ethereum) {
            result.ETHUSD = {
                price: data.ethereum.usd,
                change: parseFloat((data.ethereum.usd * data.ethereum.usd_24h_change / 100).toFixed(2)),
                changePct: parseFloat(data.ethereum.usd_24h_change.toFixed(2)),
                direction: data.ethereum.usd_24h_change >= 0 ? 'up' : 'down'
            };
        }
        return result;
    }).catch(function () { return {}; });
}

// Gold price from metals.dev (free tier)
function fetchGoldPrice() {
    // Use open metals API
    var url = 'https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU';
    return fetchJSON(url, 5000).then(function (data) {
        if (data.rates && data.rates.XAU) {
            var goldPrice = parseFloat((1 / data.rates.XAU).toFixed(2));
            return { XAUUSD: buildPrice(goldPrice, FALLBACK_PRICES.XAUUSD.price) };
        }
        return {};
    }).catch(function () {
        // Fallback: derive gold from a secondary source
        return fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd&include_24hr_change=true', 4000)
            .then(function (data) {
                if (data['tether-gold'] && data['tether-gold'].usd) {
                    var gp = data['tether-gold'].usd;
                    var gc = data['tether-gold'].usd_24h_change || 0;
                    return {
                        XAUUSD: {
                            price: parseFloat(gp.toFixed(2)),
                            change: parseFloat((gp * gc / 100).toFixed(2)),
                            changePct: parseFloat(gc.toFixed(2)),
                            direction: gc >= 0 ? 'up' : 'down'
                        }
                    };
                }
                return {};
            }).catch(function () { return {}; });
    });
}

// Indices — Yahoo Finance v8 chart endpoint (no key). ^DJI = Dow (US30),
// ^NDX = Nasdaq 100 (NAS100). The v7 quote endpoint is blocked by Yahoo, but
// the v8 chart endpoint still works server-side with a browser User-Agent.
function fetchIndices() {
    function chart(sym) {
        return new Promise(function (resolve) {
            var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + sym + '?interval=1d&range=5d';
            var settled = false;
            function done(v) { if (settled) return; settled = true; clearTimeout(t); resolve(v); }
            var t = setTimeout(function () { try { req.destroy(); } catch (e) {} done(null); }, 5000);
            var req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', 'Accept': 'application/json' } }, function (res) {
                if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); return done(null); }
                var b = '';
                res.on('data', function (c) { b += c; });
                res.on('end', function () {
                    try {
                        var m = JSON.parse(b).chart.result[0].meta;
                        var price = m.regularMarketPrice;
                        var pc = (m.chartPreviousClose != null ? m.chartPreviousClose : (m.previousClose != null ? m.previousClose : price));
                        if (price == null) return done(null);
                        done({ price: price, prev: pc });
                    } catch (e) { done(null); }
                });
            });
            req.on('error', function () { done(null); });
        });
    }
    function build(o) {
        var pct = o.prev ? (o.price - o.prev) / o.prev * 100 : 0;
        return {
            price: parseFloat(o.price.toFixed(0)),
            change: parseFloat((o.price - o.prev).toFixed(0)),
            changePct: parseFloat(pct.toFixed(2)),
            direction: pct >= 0 ? 'up' : 'down'
        };
    }
    return Promise.all([chart('%5EDJI'), chart('%5ENDX')]).then(function (r) {
        var out = {};
        if (r[0]) out.US30 = build(r[0]);
        if (r[1]) out.NAS100 = build(r[1]);
        return out;
    }).catch(function () { return {}; });
}

// Real-time prices across ALL asset classes in ONE call — Twelve Data
// (free API key). Covers forex, gold, indices and crypto with intraday price
// and % change. Requires env var TWELVEDATA_API_KEY; returns {} without it so
// the other (fallback) fetchers still supply data.
function fetchTwelveData() {
    var key = process.env.TWELVEDATA_API_KEY;
    if (!key) return Promise.resolve({});
    var cfg = {
        'EUR/USD': { k: 'EURUSD', dp: 5 },
        'GBP/USD': { k: 'GBPUSD', dp: 5 },
        'USD/JPY': { k: 'USDJPY', dp: 3 },
        'XAU/USD': { k: 'XAUUSD', dp: 2 },
        'BTC/USD': { k: 'BTCUSD', dp: 2 },
        'ETH/USD': { k: 'ETHUSD', dp: 2 },
        // Index ETFs (free tier covers ETFs; raw indices are gated). DIA≈Dow/100
        // gives an accurate US30; QQQ tracks the Nasdaq-100 (scaled to index level).
        'DIA':     { k: 'US30',   dp: 0, m: 100 },
        'QQQ':     { k: 'NAS100', dp: 0, m: 41.088 } // calibrated to NDX/QQQ (Sep 2026); retune if it drifts
    };
    var syms = Object.keys(cfg);
    var url = 'https://api.twelvedata.com/quote?symbol=' + encodeURIComponent(syms.join(',')) + '&apikey=' + encodeURIComponent(key);
    return fetchJSON(url, 6000).then(function (data) {
        var out = {};
        syms.forEach(function (s) {
            var q = (syms.length === 1) ? data : (data && data[s]);
            if (!q || q.status === 'error' || q.close == null) return;
            var price = parseFloat(q.close);
            if (isNaN(price)) return;
            var pc = (q.previous_close != null && q.previous_close !== '') ? parseFloat(q.previous_close) : price;
            var changePct = (q.percent_change != null && q.percent_change !== '') ? parseFloat(q.percent_change) : (pc ? (price - pc) / pc * 100 : 0);
            var change = (q.change != null && q.change !== '') ? parseFloat(q.change) : (price - pc);
            var dp = cfg[s].dp;
            var mult = cfg[s].m || 1; // scale ETF proxy → index level
            out[cfg[s].k] = {
                price: parseFloat((price * mult).toFixed(dp)),
                change: parseFloat((change * mult).toFixed(dp === 0 ? 0 : 2)),
                changePct: parseFloat((isNaN(changePct) ? 0 : changePct).toFixed(2)),
                direction: changePct >= 0 ? 'up' : 'down'
            };
        });
        return out;
    }).catch(function () { return {}; });
}

// Economic calendar — REAL high/medium/low-impact events from the free
// ForexFactory weekly JSON feed (no API key), with a graceful fallback to a
// computed schedule if the feed is unreachable.
function fetchCalendar() {
    return new Promise(function (resolve) {
        var url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
        var settled = false;
        function done(list) {
            if (settled) return; settled = true;
            clearTimeout(timer);
            if (list && list.length) resolve(list);
            else fallbackCalendar().then(resolve);
        }
        var timer = setTimeout(function () { try { req.destroy(); } catch (e) {} done(null); }, 6000);
        var req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BossFxAcademy/1.0)' } }, function (res) {
            if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); return done(null); }
            var body = '';
            res.on('data', function (c) { body += c; });
            res.on('end', function () {
                try { done(mapCalendar(JSON.parse(body))); } catch (e) { done(null); }
            });
        });
        req.on('error', function () { done(null); });
    });
}

// Normalise the raw ForexFactory feed into the shape the dashboard + chatbot expect.
function mapCalendar(raw) {
    if (!Array.isArray(raw)) return null;
    var now = new Date();
    var todayUTC = now.toISOString().slice(0, 10);
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
        var e = raw[i];
        var impact = String(e.impact || '').toLowerCase();
        if (impact !== 'high' && impact !== 'medium' && impact !== 'low') continue;
        var d = new Date(e.date);
        if (isNaN(d.getTime())) continue;
        var evtUTC = d.toISOString().slice(0, 10);
        var status = evtUTC === todayUTC ? 'today' : (d.getTime() > now.getTime() ? 'upcoming' : 'past');
        var h = d.getUTCHours(), m = d.getUTCMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        var h12 = h % 12; if (h12 === 0) h12 = 12;
        out.push({
            title: e.title,
            impact: impact,
            currency: e.country || '',
            day: days[d.getUTCDay()],
            time: h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm + ' GMT',
            date: e.date,
            forecast: e.forecast || '',
            previous: e.previous || '',
            actual: e.actual || '',
            status: status,
            ts: d.getTime()
        });
    }
    if (!out.length) return null;
    var order = { today: 0, upcoming: 1, past: 2 };
    out.sort(function (a, b) {
        var o = (order[a.status] || 2) - (order[b.status] || 2);
        return o !== 0 ? o : a.ts - b.ts;
    });
    return out;
}

// Fallback economic calendar — computed schedule when the live feed is unreachable
function fallbackCalendar() {
    var now = new Date();
    var day = now.getUTCDay(); // 0=Sun
    var hour = now.getUTCHours();

    // High-impact events database (rotates by week)
    var weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    var eventSets = [
        [
            { title: 'US CPI (Inflation)', impact: 'high', day: 'Wednesday', time: '1:30 PM GMT', currency: 'USD' },
            { title: 'FOMC Meeting Minutes', impact: 'high', day: 'Wednesday', time: '7:00 PM GMT', currency: 'USD' },
            { title: 'UK Employment Data', impact: 'high', day: 'Tuesday', time: '7:00 AM GMT', currency: 'GBP' },
            { title: 'EU GDP Preliminary', impact: 'medium', day: 'Thursday', time: '10:00 AM GMT', currency: 'EUR' },
            { title: 'US Retail Sales', impact: 'high', day: 'Thursday', time: '1:30 PM GMT', currency: 'USD' }
        ],
        [
            { title: 'US Non-Farm Payrolls', impact: 'high', day: 'Friday', time: '1:30 PM GMT', currency: 'USD' },
            { title: 'US ISM Manufacturing PMI', impact: 'high', day: 'Monday', time: '3:00 PM GMT', currency: 'USD' },
            { title: 'ECB Interest Rate Decision', impact: 'high', day: 'Thursday', time: '1:15 PM GMT', currency: 'EUR' },
            { title: 'BoE Interest Rate Decision', impact: 'high', day: 'Thursday', time: '12:00 PM GMT', currency: 'GBP' },
            { title: 'US Unemployment Claims', impact: 'medium', day: 'Thursday', time: '1:30 PM GMT', currency: 'USD' }
        ],
        [
            { title: 'FOMC Interest Rate Decision', impact: 'high', day: 'Wednesday', time: '7:00 PM GMT', currency: 'USD' },
            { title: 'Fed Chair Press Conference', impact: 'high', day: 'Wednesday', time: '7:30 PM GMT', currency: 'USD' },
            { title: 'US PPI (Producer Prices)', impact: 'medium', day: 'Tuesday', time: '1:30 PM GMT', currency: 'USD' },
            { title: 'EU Industrial Production', impact: 'medium', day: 'Wednesday', time: '10:00 AM GMT', currency: 'EUR' },
            { title: 'UK CPI (Inflation)', impact: 'high', day: 'Wednesday', time: '7:00 AM GMT', currency: 'GBP' }
        ],
        [
            { title: 'US GDP (Quarterly)', impact: 'high', day: 'Thursday', time: '1:30 PM GMT', currency: 'USD' },
            { title: 'US Core PCE Price Index', impact: 'high', day: 'Friday', time: '1:30 PM GMT', currency: 'USD' },
            { title: 'US Consumer Confidence', impact: 'medium', day: 'Tuesday', time: '3:00 PM GMT', currency: 'USD' },
            { title: 'EU PMI Composite', impact: 'medium', day: 'Thursday', time: '9:00 AM GMT', currency: 'EUR' },
            { title: 'Japan BoJ Interest Rate', impact: 'high', day: 'Friday', time: '3:00 AM GMT', currency: 'JPY' }
        ]
    ];

    var events = eventSets[weekNum % eventSets.length];

    // Mark which are upcoming vs past based on day
    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    var result = events.map(function (evt) {
        var evtDay = dayMap[evt.day] || 0;
        var isPast = evtDay < day;
        return {
            title: evt.title,
            impact: evt.impact,
            day: evt.day,
            time: evt.time,
            currency: evt.currency,
            status: isPast ? 'past' : (evtDay === day ? 'today' : 'upcoming')
        };
    });

    // Sort: today first, then upcoming, then past
    result.sort(function (a, b) {
        var order = { today: 0, upcoming: 1, past: 2 };
        return (order[a.status] || 2) - (order[b.status] || 2);
    });

    return Promise.resolve(result);
}

// Sentiment — algorithmically derived from price changes
function deriveSentiment(prices) {
    var result = {};
    for (var sym in prices) {
        if (prices.hasOwnProperty(sym)) {
            var p = prices[sym];
            var pct = p.changePct || 0;
            var bias, confidence;
            if (pct > 0.5) { bias = 'bullish'; confidence = Math.min(85, 55 + Math.floor(pct * 15)); }
            else if (pct > 0.1) { bias = 'bullish'; confidence = 50 + Math.floor(pct * 20); }
            else if (pct > -0.1) { bias = 'neutral'; confidence = 45 + Math.floor(Math.abs(pct) * 30); }
            else if (pct > -0.5) { bias = 'bearish'; confidence = 50 + Math.floor(Math.abs(pct) * 20); }
            else { bias = 'bearish'; confidence = Math.min(85, 55 + Math.floor(Math.abs(pct) * 15)); }
            result[sym] = { bias: bias, confidence: confidence, source: 'price-action' };
        }
    }
    return result;
}

// Market news — curated headlines based on market conditions
function generateNewsHeadlines(prices, calendar) {
    var headlines = [];
    var now = new Date();

    // Generate contextual headlines from price data
    if (prices.XAUUSD && Math.abs(prices.XAUUSD.changePct) > 0.3) {
        var goldDir = prices.XAUUSD.changePct > 0 ? 'rises' : 'falls';
        headlines.push({
            title: 'Gold ' + goldDir + ' as traders eye upcoming economic data',
            source: 'BossFx Analysis',
            category: 'metals',
            time: formatTimeAgo(30)
        });
    }

    if (prices.BTCUSD && Math.abs(prices.BTCUSD.changePct) > 1) {
        var btcDir = prices.BTCUSD.changePct > 0 ? 'surges' : 'drops';
        headlines.push({
            title: 'Bitcoin ' + btcDir + ' ' + Math.abs(prices.BTCUSD.changePct).toFixed(1) + '% in 24 hours',
            source: 'BossFx Analysis',
            category: 'crypto',
            time: formatTimeAgo(15)
        });
    }

    if (prices.EURUSD) {
        var eurDir = prices.EURUSD.changePct >= 0 ? 'gains' : 'weakens';
        headlines.push({
            title: 'EUR/USD ' + eurDir + ' as dollar sentiment shifts',
            source: 'BossFx Analysis',
            category: 'forex',
            time: formatTimeAgo(45)
        });
    }

    // Calendar-based headlines
    var upcoming = (calendar || []).filter(function (e) { return e.status === 'today' || e.status === 'upcoming'; });
    if (upcoming.length > 0) {
        headlines.push({
            title: upcoming[0].title + ' (' + upcoming[0].day + ') — markets preparing for impact',
            source: 'Economic Calendar',
            category: 'events',
            time: formatTimeAgo(60)
        });
    }

    // Session-based headline
    var hour = now.getUTCHours();
    if (hour >= 7 && hour < 9) {
        headlines.push({ title: 'London session open — major pairs showing increased volatility', source: 'BossFx Analysis', category: 'session', time: formatTimeAgo(10) });
    } else if (hour >= 12 && hour < 17) {
        headlines.push({ title: 'London-NY overlap active — peak trading volume conditions', source: 'BossFx Analysis', category: 'session', time: formatTimeAgo(5) });
    } else if (hour >= 21 || hour < 1) {
        headlines.push({ title: 'Asian session underway — reduced volatility on major pairs', source: 'BossFx Analysis', category: 'session', time: formatTimeAgo(20) });
    }

    return headlines.slice(0, 5);
}

// ── Helpers ──
function buildPrice(current, baseline) {
    var change = parseFloat((current - baseline).toFixed(5));
    var pctBase = baseline !== 0 ? baseline : 1;
    var changePct = parseFloat(((change / pctBase) * 100).toFixed(2));
    return {
        price: current,
        change: change,
        changePct: changePct,
        direction: changePct >= 0 ? 'up' : 'down'
    };
}

function buildPriceFromPrev(current, previous) {
    var change = parseFloat((current - previous).toFixed(5));
    var pctBase = previous !== 0 ? previous : 1;
    var changePct = parseFloat(((change / pctBase) * 100).toFixed(2));
    return {
        price: current,
        change: change,
        changePct: changePct,
        direction: changePct > 0 ? 'up' : (changePct < 0 ? 'down' : 'flat')
    };
}

function formatTimeAgo(minutes) {
    if (minutes < 60) return minutes + ' min ago';
    return Math.floor(minutes / 60) + 'h ago';
}

function getMarketStatus() {
    var now = new Date();
    var day = now.getUTCDay();
    var hour = now.getUTCHours();
    // Forex: closed from Friday 22:00 UTC to Sunday 22:00 UTC
    if (day === 6) return { open: false, session: 'Weekend' };
    if (day === 0 && hour < 22) return { open: false, session: 'Weekend' };
    if (day === 5 && hour >= 22) return { open: false, session: 'Weekend' };

    // Determine active session
    var session = 'Off-hours';
    if (hour >= 22 || hour < 7) session = 'Sydney/Tokyo';
    if (hour >= 0 && hour < 9) session = 'Tokyo';
    if (hour >= 7 && hour < 16) session = 'London';
    if (hour >= 12 && hour < 21) session = 'New York';
    if (hour >= 12 && hour < 16) session = 'London/NY Overlap';

    return { open: true, session: session };
}

// ================================================================
// MAIN HANDLER
// ================================================================
module.exports = function (req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    var type = (req.query && req.query.type) || 'all';
    var validTypes = ['all', 'prices', 'calendar', 'sentiment', 'news'];
    if (validTypes.indexOf(type) === -1) {
        return res.status(400).json({ error: 'Invalid type. Use: ' + validTypes.join(', ') });
    }

    // Check warm cache
    var cached = getCached(type);
    if (cached) {
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
    }

    // Fetch fresh data
    var pricesPromise = (type === 'all' || type === 'prices' || type === 'sentiment')
        ? Promise.all([fetchTwelveData(), fetchCryptoPrices(), fetchForexPrices(), fetchGoldPrice()])
            .then(function (results) {
                var merged = {};
                // Merge lowest-priority first; Twelve Data (real intraday) overrides last.
                // order: Frankfurter forex → old gold → CoinGecko crypto → Twelve Data
                [results[2], results[3], results[1], results[0]].forEach(function (r) {
                    for (var k in r) { if (r.hasOwnProperty(k)) merged[k] = r[k]; }
                });
                // Fill anything still missing with static fallback
                for (var sym in FALLBACK_PRICES) {
                    if (!merged[sym]) merged[sym] = FALLBACK_PRICES[sym];
                }
                return merged;
            })
        : Promise.resolve(null);

    var calendarPromise = (type === 'all' || type === 'calendar')
        ? fetchCalendar()
        : Promise.resolve(null);

    Promise.all([pricesPromise, calendarPromise])
        .then(function (results) {
            var prices = results[0];
            var calendar = results[1];
            var sentiment = prices ? deriveSentiment(prices) : null;
            var news = (type === 'all' || type === 'news') ? generateNewsHeadlines(prices || FALLBACK_PRICES, calendar) : null;
            var marketStatus = getMarketStatus();

            var response = {
                market: marketStatus,
                timestamp: new Date().toISOString()
            };

            if (type === 'all') {
                response.prices = prices;
                response.sentiment = sentiment;
                response.calendar = calendar;
                response.news = news;
            } else if (type === 'prices') {
                response.prices = prices;
            } else if (type === 'calendar') {
                response.calendar = calendar;
            } else if (type === 'sentiment') {
                response.prices = prices;
                response.sentiment = sentiment;
            } else if (type === 'news') {
                response.news = news || generateNewsHeadlines(FALLBACK_PRICES, []);
            }

            // Cache the response
            setCache(type, response);

            res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
            res.setHeader('X-Cache', 'MISS');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(response);
        })
        .catch(function (err) {
            console.error('[market-data] Error:', err.message);
            // Return fallback data on error
            var fallback = {
                market: getMarketStatus(),
                timestamp: new Date().toISOString(),
                prices: FALLBACK_PRICES,
                sentiment: deriveSentiment(FALLBACK_PRICES),
                calendar: [],
                news: generateNewsHeadlines(FALLBACK_PRICES, []),
                _stale: true
            };
            res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
            return res.status(200).json(fallback);
        });
};
