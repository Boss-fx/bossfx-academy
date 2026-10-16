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

// ---- Promo drip step (for DM funnel — Phase 2) ----
const PROMO = [
    { text: `🎓 Your free <b>Forex 101</b> is waiting — Modules 1 &amp; 2, no payment. Start Module 1 (~10 min).`, btn: { text: 'Start Module 1 →', url: FREE } },
    { text: `📈 Finished the free modules? The full 12-module system (risk, psychology, strategy, your trading plan) is where traders are made.`, btn: { text: 'Unlock Forex 101 →', url: COURSE } }
];
function promoStep(i) {
    const p = PROMO[i]; if (!p) return null;
    return { text: p.text, reply_markup: tg.keyboard([[{ text: p.btn.text, url: (typeof p.btn.url === 'function' ? p.btn.url() : p.btn.url) }]]) };
}

// ---- Cross-post formatter (push new content to channel) ----
function crossPost({ title, url, kind = 'video' }) {
    const emoji = kind === 'blog' ? '📝' : kind === 'short' ? '🎬' : '▶️';
    return {
        text: `${emoji} <b>New ${kind}:</b> ${title}`,
        reply_markup: tg.keyboard([[{ text: 'Watch / read →', url }]])
    };
}

module.exports = { welcome, COMMANDS, dailyPost, promoStep, crossPost, PROMO_LEN: PROMO.length };
