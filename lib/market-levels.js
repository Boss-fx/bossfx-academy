// ================================================================
// lib/market-levels.js — "Key Levels to Watch" for the Telegram bot.
// Pulls hourly OHLC from TwelveData (TWELVEDATA_API_KEY, already used by
// api/market-data.js) and computes the reference levels the BossFx method
// reads before a session: prior-day High/Low + Asia-session High/Low/Mid.
// These are LEVELS, not signals — the founder's signals follow on confirmation.
// ================================================================
'use strict';

// Asia session window in UTC hours (matches the chart's
// AsiaSessionHighLowMidLines 18:00–02:00 indicator). [startHour, endHour)
// where the window wraps midnight.
const ASIA_START = 18;
const ASIA_END = 2;

function ymd(d) { return d.toISOString().slice(0, 10); }

// Hourly candles, oldest-first: [{t: Date, o, h, l, c}] (null on failure).
async function getBars(symbol) {
    const key = process.env.TWELVEDATA_API_KEY;
    if (!key) return null;
    const url = 'https://api.twelvedata.com/time_series?symbol=' + encodeURIComponent(symbol) +
        '&interval=1h&outputsize=80&timezone=UTC&apikey=' + encodeURIComponent(key);
    let data;
    try {
        const r = await fetch(url);
        data = await r.json();
    } catch (e) { console.warn('[levels] fetch failed:', e.message); return null; }
    if (!data || !Array.isArray(data.values) || !data.values.length) {
        console.warn('[levels] no values:', data && (data.message || data.status));
        return null;
    }
    // TwelveData returns most-recent-first; normalise to oldest-first.
    const bars = data.values.map(function (v) {
        return { t: new Date(v.datetime.replace(' ', 'T') + 'Z'), o: +v.open, h: +v.high, l: +v.low, c: +v.close };
    }).filter(function (b) { return !isNaN(b.t.getTime()) && !isNaN(b.h); }).reverse();
    return bars.length ? bars : null;
}

async function getLevels(symbol) {
    symbol = symbol || 'XAU/USD';
    const bars = await getBars(symbol);
    if (!bars) return null;

    const now = bars[bars.length - 1];
    const priceNow = now.c;

    // --- Prior trading day High/Low (most recent UTC date before today that has
    // bars — so Monday reads Friday, not the near-empty Sunday) ---
    const todayStr = ymd(new Date());
    const prevDays = bars.map(function (b) { return ymd(b.t); }).filter(function (x) { return x < todayStr; });
    const yStr = prevDays.length ? prevDays[prevDays.length - 1] : ymd(new Date(Date.now() - 86400000));
    const pd = bars.filter(function (b) { return ymd(b.t) === yStr; });
    const pdh = pd.length ? Math.max.apply(null, pd.map(function (b) { return b.h; })) : null;
    const pdl = pd.length ? Math.min.apply(null, pd.map(function (b) { return b.l; })) : null;

    // --- Most recent completed Asia session (18:00 → 02:00 UTC) ---
    // End anchor = today 02:00 if we're past it, else yesterday 02:00.
    const windowHrs = ASIA_START > ASIA_END ? (24 - ASIA_START + ASIA_END) : (ASIA_END - ASIA_START);
    const d = new Date();
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), ASIA_END, 0, 0));
    if (d.getTime() < end.getTime()) end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end.getTime() - windowHrs * 3600000);
    const asia = bars.filter(function (b) { return b.t >= start && b.t < end; });
    let asiaH = null, asiaL = null, asiaM = null;
    if (asia.length) {
        asiaH = Math.max.apply(null, asia.map(function (b) { return b.h; }));
        asiaL = Math.min.apply(null, asia.map(function (b) { return b.l; }));
        asiaM = (asiaH + asiaL) / 2;
    }

    // --- Simple context vs the prior-day range ---
    let context = 'inside the prior-day range';
    if (pdh != null && priceNow > pdh) context = 'breaking above the prior-day high';
    else if (pdl != null && priceNow < pdl) context = 'breaking below the prior-day low';

    // --- Today so far (UTC day) — used by the Daily Review ---
    const td = bars.filter(function (b) { return ymd(b.t) === todayStr; });
    const todayO = td.length ? td[0].o : null;
    const todayH = td.length ? Math.max.apply(null, td.map(function (b) { return b.h; })) : null;
    const todayL = td.length ? Math.min.apply(null, td.map(function (b) { return b.l; })) : null;

    // Candles + Asia window for the chart snapshot (plain JSON-safe values).
    const chartBars = bars.slice(-60).map(function (b) { return { t: b.t.toISOString(), o: b.o, h: b.h, l: b.l, c: b.c }; });

    return { symbol: symbol, bars: chartBars, asia: { start: start.toISOString(), end: end.toISOString() }, priceNow: priceNow, todayO: todayO, todayH: todayH, todayL: todayL, pdh: pdh, pdl: pdl, asiaH: asiaH, asiaL: asiaL, asiaM: asiaM, context: context, asiaWindow: ASIA_START + ':00–0' + ASIA_END + ':00 UTC' };
}

module.exports = { getLevels, getBars };
