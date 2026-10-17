// ================================================================
// lib/telegram-content.js — BossFx Telegram copy & campaign logic
// All message copy lives here so it can be edited without touching
// the bot plumbing. HTML parse mode (<b>, <i>, <a href>).
// ================================================================
'use strict';

const tg = require('./telegram');

const FREE = () => tg.link('/learn/', 'tg_free');          // free Forex 101
const COURSE = () => tg.link('/courses.html#forex101', 'tg_course');
const START = () => tg.link('/start-here.html', 'tg_start');

// ---- Welcome (new members + /start) ----
function welcome(name) {
    return {
        text:
`👋 Welcome${name ? ' ' + name : ''} to <b>BossFx Academy</b>!

You're in the right place to learn forex the structured way — no hype, no guesswork.

🎓 <b>Modules 1 &amp; 2 of Forex 101 are FREE.</b> Start right now, no payment needed.

Tap below to begin 👇`,
        reply_markup: tg.keyboard([
            [{ text: '🎓 Start Forex 101 (Free)', url: FREE() }],
            [{ text: '🧭 Where do I start?', data: 'cmd_start' }, { text: '💬 Help', data: 'cmd_help' }]
        ])
    };
}

// ---- Command responses ----
const COMMANDS = {
    start: () => welcome(''),
    free: () => ({
        text: `🎓 <b>Forex 101 — Modules 1 &amp; 2 are free.</b>\nWhat the market is, how it moves, and how to read a chart. ~20 minutes. No card needed.`,
        reply_markup: tg.keyboard([[{ text: 'Start free →', url: FREE() }]])
    }),
    course: () => ({
        text: `📈 <b>Forex 101 — The Trader's Bible</b>\n12 modules from absolute beginner to a repeatable trading plan. Lifetime access, community included, 7-day guarantee.`,
        reply_markup: tg.keyboard([[{ text: 'See the full course →', url: COURSE() }]])
    }),
    help: () => ({
        text: `💬 <b>BossFx Bot — commands</b>\n/free — start Forex 101 free\n/course — the full course\n/start — where to begin\n\nQuestions? Reply here or message us on WhatsApp.`,
        reply_markup: tg.keyboard([[{ text: '🧭 Start Here', url: START() }]])
    })
};

// ---- Daily channel post rotation ----
// Rotates by day-of-year. Mix of value (tips) + periodic soft CTA.
const DAILY_POSTS = [
    { text: `📊 <b>Tip:</b> Trade the <b>London–New York overlap</b> (≈1–5 PM WAT). It's the most liquid window of the day — cleaner moves, tighter spreads.`,
      cta: { text: 'Learn sessions →', url: FREE } },
    { text: `🛡️ <b>Risk first.</b> Never risk more than <b>1–2% per trade</b>. Ten losses in a row still leaves most of your account intact. Survival is the strategy.`,
      cta: { text: 'Risk management →', url: FREE } },
    { text: `🧠 <b>Discipline &gt; strategy.</b> A average plan followed with discipline beats a brilliant plan you break. Write your rules down.`,
      cta: { text: 'Build your plan →', url: COURSE } },
    { text: `🔀 <b>Read structure:</b> Higher Highs + Higher Lows = uptrend. A Break of Structure = the trend may be shifting. Know direction <i>before</i> you enter.`,
      cta: { text: 'Market structure →', url: FREE } },
    { text: `🕯️ Gold (XAU/USD) respects levels beautifully. Mark the zones price reacted to before — and let price come to you. No chasing.`,
      cta: { text: 'Start Forex 101 free →', url: FREE } },
    { text: `🎯 <b>Entries are easy. Exits make the money.</b> Decide your stop and target <i>before</i> you enter — not while you're in the trade.`,
      cta: { text: 'Entry &amp; exit →', url: FREE } },
    { text: `🚀 <b>Weekend reset:</b> review your week's trades, journal what worked, and mark your levels for Monday. Preparation is an edge.`,
      cta: { text: 'Get the free journal →', url: START } }
];
function dailyPost() {
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const p = DAILY_POSTS[doy % DAILY_POSTS.length];
    const cta = typeof p.cta.url === 'function' ? p.cta.url() : p.cta.url;
    return { text: p.text, reply_markup: tg.keyboard([[{ text: p.cta.text, url: cta }]]) };
}

// ---- Unsubscribe confirmation (DM funnel /stop) ----
const STOPPED = {
    text: `✅ You're unsubscribed — no more messages from the bot. Your free Forex 101 stays open anytime: ${tg.SITE}/learn/\n\nChanged your mind? Just send /start.`
};

// ---- Promo drip step (for DM funnel — Phase 2) ----
const PROMO = [
    { text: `🎓 Your free <b>Forex 101</b> is waiting — Modules 1 &amp; 2, no payment. Start Module 1 (~10 min).`, btn: { text: 'Start Module 1 →', url: FREE } },
    { text: `📈 Finished the free modules? The full 12-module system (risk, psychology, strategy, your trading plan) is where traders are made.`, btn: { text: 'Unlock Forex 101 →', url: COURSE } }
];
function promoStep(i) {
    const p = PROMO[i]; if (!p) return null;
    return { text: p.text, reply_markup: tg.keyboard([[{ text: p.btn.text, url: (typeof p.btn.url === 'function' ? p.btn.url() : p.btn.url) }]]) };
}

// ---- Session brief (scheduled market post, pulled from /api/market-data) ----
const PAIR_LABELS = {
    EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', USDJPY: 'USD/JPY', XAUUSD: 'Gold (XAU/USD)',
    US30: 'US30 (Dow)', NAS100: 'NAS100', BTCUSD: 'BTC/USD', ETHUSD: 'ETH/USD'
};
const BRIEF_MOVERS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'NAS100', 'BTCUSD'];

function moverLine(sym, prices, sentiment) {
    const p = prices && prices[sym];
    if (!p) return null;
    const arrow = p.direction === 'up' ? '🟢▲' : '🔴▼';
    const pct = (p.changePct >= 0 ? '+' : '') + p.changePct + '%';
    const s = sentiment && sentiment[sym];
    const bias = s ? ` · <i>${s.bias}</i>` : '';
    return `${arrow} <b>${PAIR_LABELS[sym] || sym}</b>  ${p.price}  (${pct})${bias}`;
}

// which = 'london' | 'ny'. data = the /api/market-data?type=all response (or null).
function sessionBrief(which, data) {
    const ny = which === 'ny';
    const title = ny ? '🗽 <b>London–New York Overlap</b>' : '🇬🇧 <b>London Session — Open</b>';
    const tag = ny
        ? 'Peak liquidity window (≈1–5 PM WAT) — the cleanest moves of the day.'
        : 'European session is live (≈8 AM–12 PM WAT). Majors are waking up.';
    const prices = data && data.prices;
    const sentiment = data && data.sentiment;
    const lines = [];
    for (const sym of BRIEF_MOVERS) {
        const l = moverLine(sym, prices, sentiment);
        if (l) lines.push(l);
    }
    const movers = lines.length ? lines.join('\n') : '<i>Live prices are catching up — check back shortly.</i>';
    const cal = (data && data.calendar) || [];
    const events = cal.filter(e => e.status === 'today' && e.impact === 'high').slice(0, 3)
        .map(e => `🔴 ${e.time} · <b>${e.currency}</b> ${e.title}`);
    const evBlock = events.length ? `\n\n📅 <b>High-impact today:</b>\n${events.join('\n')}` : '';
    return {
        text: `${title}\n<i>${tag}</i>\n\n${movers}${evBlock}\n\n<i>Plan the trade, trade the plan. Risk 1–2% max.</i>`,
        reply_markup: tg.keyboard([[{ text: '🎓 Learn to read this — Forex 101', url: FREE() }]])
    };
}

// ---- Weekend mindset recharge (markets closed Sat/Sun — no signals) ----
// BossFx voice: harden the winning mentality, process over profit.
const WEEKEND = [
    { t: `🧠 <b>Weekend Reset</b>\n\nThe market is closed — your edge isn't. Review the week honestly: which trades followed your plan, and which were your emotions trading your account? Growth lives in that answer.\n\n— BossFx`, c: '🎓 Trading psychology', u: () => FREE() },
    { t: `🔁 <b>Process &gt; Profit</b>\n\nAmateurs chase the money. Pros chase the <i>process</i> — and the money follows. Judge this week by how well you followed your rules, not by your P&amp;L.\n\n— BossFx`, c: '📈 Build your plan', u: () => COURSE() },
    { t: `🛡️ <b>Survival is the strategy</b>\n\nYou don't have to be right often — you have to protect your capital when you're wrong. The trader still standing after the losing streak is the one who wins long-term.\n\nRest well. Come back sharp. — BossFx`, c: '🎓 Risk management', u: () => FREE() },
    { t: `📓 <b>The weekend edge</b>\n\nWhile others scroll, you review. Pull up your journal: your 3 best trades and your 3 worst. Find the one habit costing you the most — and kill it this week.\n\n— BossFx`, c: '🎓 Start Forex 101 free', u: () => FREE() },
    { t: `⏳ <b>Patience is a position</b>\n\nNot trading <i>is</i> trading. The discipline to wait for YOUR setup — and sit on your hands otherwise — is the single most profitable skill most traders never build.\n\nRecharge this weekend. — BossFx`, c: '📈 Master the system', u: () => COURSE() },
    { t: `💚 <b>You are not your last trade</b>\n\nOne loss doesn't define you. One win doesn't either. Consistency does. Reset your mind this weekend, trust your process, and show up Monday like a professional.\n\n— BossFx`, c: '🎓 Trader mindset', u: () => FREE() },
    { t: `🎯 <b>Plan the week, win the week</b>\n\nThe pros don't react — they prepare. Mark your levels, note the high-impact news, decide what you WON'T trade. A calm, prepared mind is an edge no indicator can give you.\n\n— BossFx`, c: '📈 Get the full course', u: () => COURSE() }
];
function weekendPost() {
    const wk = Math.floor(Date.now() / (7 * 86400000));
    const p = WEEKEND[wk % WEEKEND.length];
    return { text: p.t, reply_markup: tg.keyboard([[{ text: p.c, url: (typeof p.u === 'function' ? p.u() : p.u) }]]) };
}

// ---- BossFx trade signal card (founder-pushed via the admin endpoint) ----
// Mirrors the BossFx Sunday-prep method: HTF bias → supply/demand zone →
// entry/SL/TP with R:R → invalidation. All fields except pair/direction/
// entry/sl/tp are optional. Pass `photo` (a chart image URL) to send the
// annotated chart with the signal as the caption. See docs/integrations/bossfx-signal-playbook.md.
function signalCard(o) {
    o = o || {};
    const dir = String(o.direction || '').toLowerCase();
    const isBuy = dir === 'buy' || dir === 'long';
    const head = isBuy ? '🟢 <b>BUY' : '🔴 <b>SELL';
    const pairU = String(o.pair || '').toUpperCase();
    const e = Number(o.entry), s = Number(o.sl), t = Number(o.tp);
    let rr = '';
    if (!isNaN(e) && !isNaN(s) && !isNaN(t) && Math.abs(e - s) > 0) {
        rr = `  (1:${(Math.abs(t - e) / Math.abs(e - s)).toFixed(1)} R:R)`;
    }
    const sess = o.session ? ` · ${o.session}` : '';
    const bias = o.bias ? `\n📊 <b>Bias:</b> ${o.bias}` : '';
    const zone = o.zone ? `\n🎯 <b>Zone:</b> ${o.zone}` : '';
    const tp2 = (o.tp2 != null && o.tp2 !== '') ? `   <b>TP2:</b> ${o.tp2}` : '';
    const inv = o.invalidation ? `\n❌ <b>Invalid:</b> ${o.invalidation}` : '';
    const why = o.reason ? `\n\n📋 <i>${o.reason}</i>` : '';
    return {
        text: `${head} ${pairU}</b>${sess}${bias}${zone}\n\n<b>Entry:</b> ${o.entry}   <b>SL:</b> ${o.sl}   <b>TP:</b> ${o.tp}${tp2}${rr}${inv}${why}\n\n⚠️ <i>Educational only — not financial advice. Never risk more than 1–2% of your account per trade.</i>`,
        photo: o.photo || undefined
    };
}

// ---- Key Levels to Watch (auto, computed from TwelveData — see lib/market-levels.js) ----
function fmtLvl(n) {
    return (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function levelsCard(d) {
    if (!d) return { text: `📍 <b>Key Levels</b>\n<i>Levels are refreshing — check back shortly.</i>` };
    const name = d.symbol === 'XAU/USD' ? 'Gold (XAU/USD)' : d.symbol;
    const pd = (d.pdh != null || d.pdl != null) ? `\n🔹 <b>Prior day</b>   H ${fmtLvl(d.pdh)}  ·  L ${fmtLvl(d.pdl)}` : '';
    const asia = (d.asiaH != null) ? `\n🔸 <b>Asia (${d.asiaWindow})</b>   H ${fmtLvl(d.asiaH)}  ·  M ${fmtLvl(d.asiaM)}  ·  L ${fmtLvl(d.asiaL)}` : '';
    return {
        text: `📍 <b>Key Levels to Watch — ${name}</b>\n\n<b>Now:</b> ${fmtLvl(d.priceNow)}${pd}${asia}\n\n<i>Price is ${d.context}.</i>\n\nThese are <b>reference levels, not signals</b> — watch how price reacts at them. BossFx signals follow on confirmation.\n⚠️ <i>Educational only — not financial advice.</i>`,
        reply_markup: tg.keyboard([[{ text: '🎓 Learn the method', url: FREE() }]])
    };
}

// ---- Cross-post formatter (push new content to channel) ----
function crossPost({ title, url, kind = 'video', photo }) {
    const emoji = kind === 'blog' ? '📝' : kind === 'short' ? '🎬' : '▶️';
    return {
        text: `${emoji} <b>New ${kind}:</b> ${title}`,
        reply_markup: tg.keyboard([[{ text: 'Watch / read →', url }]]),
        photo: photo || undefined
    };
}

module.exports = { welcome, COMMANDS, STOPPED, dailyPost, promoStep, sessionBrief, signalCard, weekendPost, levelsCard, crossPost, PROMO_LEN: PROMO.length };
