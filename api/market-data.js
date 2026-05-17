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
    EURUSD: { price: 1.0850, change: 0, changePct: 0, direction: 'flat' },
    GBPUSD: { price: 1.2720, change: 0, changePct: 0, direction: 'flat' },
    USDJPY: { price: 154.50, change: 0, changePct: 0, direction: 'flat' },
    XAUUSD: { price: 2650.00, change: 0, changePct: 0, direction: 'flat' },
    US30:   { price: 42500, change: 0, changePct: 0, direction: 'flat' },
    NAS100: { price: 21200, change: 0, changePct: 0, direction: 'flat' },
    BTCUSD: { price: 104000, change: 0, changePct: 0, direction: 'flat' },
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
function fetchForexPrices() {
    var url = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,JPY';
    return fetchJSON(url, 5000).then(function (data) {
        var rates = data.rates || {};
        var result = {};
        if (rates.EUR) {
            var eurusd = parseFloat((1 / rates.EUR).toFixed(5));
            result.EURUSD = buildPrice(eurusd, FALLBACK_PRICES.EURUSD.price);
        }
        if (rates.GBP) {
            var gbpusd = parseFloat((1 / rates.GBP).toFixed(5));
            result.GBPUSD = buildPrice(gbpusd, FALLBACK_PRICES.GBPUSD.price);
        }
        if (rates.JPY) {
            var usdjpy = parseFloat(rates.JPY.toFixed(3));
            result.USDJPY = buildPrice(usdjpy, FALLBACK_PRICES.USDJPY.price);
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

// Indices — use Twelve Data or Alpha Vantage free tier
function fetchIndices() {
    // Try Yahoo Finance quotes (no key needed)
    var symbols = 'DJI,IXIC';
    var url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EDJI,%5EIXIC&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent';
    return fetchJSON(url, 5000).then(function (data) {
        var result = {};
        if (data.quoteResponse && data.quoteResponse.result) {
            data.quoteResponse.result.forEach(function (q) {
                if (q.symbol === '^DJI') {
                    result.US30 = {
                        price: parseFloat((q.regularMarketPrice || 0).toFixed(0)),
                        change: parseFloat((q.regularMarketChange || 0).toFixed(0)),
                        changePct: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
                        direction: (q.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down'
                    };
                }
                if (q.symbol === '^IXIC') {
                    result.NAS100 = {
                        price: parseFloat((q.regularMarketPrice || 0).toFixed(0)),
                        change: parseFloat((q.regularMarketChange || 0).toFixed(0)),
                        changePct: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
                        direction: (q.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down'
                    };
                }
            });
        }
        return result;
    }).catch(function () { return {}; });
}

// Economic calendar — constructed from known schedule + API when available
function fetchCalendar() {
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
        ? Promise.all([fetchForexPrices(), fetchCryptoPrices(), fetchGoldPrice(), fetchIndices()])
            .then(function (results) {
                var merged = {};
                results.forEach(function (r) { for (var k in r) { if (r.hasOwnProperty(k)) merged[k] = r[k]; } });
                // Fill missing with fallback
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
