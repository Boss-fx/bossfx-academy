// ================================================================
// api/telegram-webhook.js — BossFx Telegram bot (unified endpoint)
// Two modes on one function (keeps us under Vercel's function limit):
//   1. WEBHOOK  — Telegram POSTs updates here (verified by the
//      X-Telegram-Bot-Api-Secret-Token header == TELEGRAM_WEBHOOK_SECRET).
//      Handles new-member welcome, /commands, inline buttons.
//   2. ADMIN POST — POST with "Authorization: Bearer <SECRET>" to push a
//      post / cross-post to the channel on demand.
//
// Register the webhook once (after env + deploy):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=
//     https://www.bossfxcademy.com/api/telegram-webhook&secret_token=<SECRET>
// ================================================================
'use strict';

const tg = require('../lib/telegram');
const C = require('../lib/telegram-content');
const store = require('../lib/telegram-store');
const jobs = require('../lib/telegram-jobs');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    // ---- Mode 2: authenticated admin post / cross-post ----
    const auth = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (auth) {
        if (!secret || auth !== secret) return res.status(401).json({ error: 'Unauthorized' });
        if (!tg.isConfigured() || !tg.channelId()) return res.status(500).json({ error: 'Telegram not configured' });
        // Scheduler heartbeat (Supabase pg_cron, every 5 min) — posts whatever is due, on time.
        if ((req.body || {}).type === 'tick') {
            const done = await jobs.tick({ dry: !!req.body.dry });
            return res.status(200).json({ ok: true, done });
        }
        return adminPost(req, res);
    }

    // ---- Mode 1: Telegram webhook ----
    if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!tg.isConfigured()) return res.status(200).json({ ok: true, skipped: 'no token' });

    const update = req.body || {};
    try {
        // Founder controls in the bot DM: /signal, /review, /today, reply-to-preview notes.
        if (update.message && update.message.chat && update.message.chat.type === 'private' &&
            await jobs.founderMessage(update.message)) {
            return res.status(200).json({ ok: true, founder: true });
        }
        // Approve / skip buttons on founder previews.
        if (update.callback_query && await jobs.founderCallback(update.callback_query)) {
            if (update.callback_query.data === 'noop') await tg.answerCallbackQuery(update.callback_query.id);
            return res.status(200).json({ ok: true, founder: true });
        }
        const nm = update.message && update.message.new_chat_members;
        if (Array.isArray(nm) && nm.length) {
            for (const m of nm) {
                if (m.is_bot) continue;
                const w = C.welcome(m.first_name || '');
                await tg.sendMessage(update.message.chat.id, w.text, { reply_markup: w.reply_markup });
            }
            return res.status(200).json({ ok: true });
        }
        if (update.message && typeof update.message.text === 'string' && update.message.text.startsWith('/')) {
            const chat = update.message.chat;
            const cmd = update.message.text.slice(1).split(/[@\s]/)[0].toLowerCase();
            const isPrivate = chat.type === 'private';
            // DM funnel: /start in a private chat enrols the person in the drip.
            if (isPrivate && cmd === 'start') {
                await store.upsertStart({ id: chat.id, first_name: chat.first_name, username: chat.username });
                const w = C.welcome(chat.first_name || '');
                await tg.sendMessage(chat.id, w.text, { reply_markup: w.reply_markup });
                return res.status(200).json({ ok: true, enrolled: true });
            }
            if (isPrivate && cmd === 'whoami') {
                await tg.sendMessage(chat.id, `Your Telegram chat id: <code>${chat.id}</code>\nSet it as <b>TELEGRAM_FOUNDER_ID</b> in Vercel to unlock founder controls.`);
                return res.status(200).json({ ok: true });
            }
            if (isPrivate && cmd === 'stop') {
                await store.markStopped(chat.id);
                await tg.sendMessage(chat.id, C.STOPPED.text);
                return res.status(200).json({ ok: true, stopped: true });
            }
            const resp = (C.COMMANDS[cmd] || C.COMMANDS.help)();
            await tg.sendMessage(chat.id, resp.text, { reply_markup: resp.reply_markup });
            return res.status(200).json({ ok: true });
        }
        if (update.callback_query) {
            const q = update.callback_query;
            await tg.answerCallbackQuery(q.id);
            const map = { cmd_start: 'start', cmd_help: 'help', cmd_free: 'free', cmd_course: 'course' };
            const key = map[q.data];
            if (key && q.message) {
                const resp = C.COMMANDS[key]();
                await tg.sendMessage(q.message.chat.id, resp.text, { reply_markup: resp.reply_markup });
            }
            return res.status(200).json({ ok: true });
        }
        return res.status(200).json({ ok: true, ignored: true });
    } catch (err) {
        console.error('[telegram-webhook] error:', err.message);
        return res.status(200).json({ ok: true, error: err.message });
    }
};

// On-demand post: { type: daily|promo|welcome|crosspost|custom, ... , pin?, chat_id? }
async function adminPost(req, res) {
    const body = req.body || {};
    const chat = body.chat_id || tg.channelId();
    let msg;
    switch (body.type) {
        case 'daily':   msg = C.dailyPost(); break;
        case 'promo':   msg = C.promoStep(Number(body.step) || 0); break;
        case 'welcome': msg = C.welcome(body.name || ''); break;
        case 'session': {
            // Scheduled market brief — pull live data from our own market-data API.
            const which = body.which === 'ny' ? 'ny' : 'london';
            let data = null;
            try {
                const mr = await fetch(`${tg.SITE}/api/market-data?type=all`);
                if (mr.ok) data = await mr.json();
            } catch (e) { console.warn('[telegram] market-data fetch failed:', e.message); }
            msg = C.sessionBrief(which, data);
            break;
        }
        case 'signal':
            if (!body.pair || !body.direction || body.entry == null || body.sl == null || body.tp == null) {
                return res.status(400).json({ error: 'pair, direction, entry, sl, tp required' });
            }
            msg = C.signalCard(body);
            break;
        case 'weekend': msg = C.weekendPost(); break;
        case 'review': {
            const levels = require('../lib/market-levels');
            let data = null;
            try { const mr = await fetch(`${tg.SITE}/api/market-data?type=all`); if (mr.ok) data = await mr.json(); } catch (e) {}
            msg = C.dailyReview(await levels.getLevels('XAU/USD'), data);
            break;
        }
        case 'levels': {
            const levels = require('../lib/market-levels');
            const data = await levels.getLevels(body.symbol || 'XAU/USD');
            msg = C.levelsCard(data);
            break;
        }
        case 'crosspost':
            if (!body.title || !body.url) return res.status(400).json({ error: 'title and url required' });
            msg = C.crossPost({ title: body.title, url: body.url, kind: body.kind || 'video', photo: body.photo });
            break;
        case 'custom':
            if (!body.text) return res.status(400).json({ error: 'text required' });
            msg = { text: body.text, reply_markup: body.button ? tg.keyboard([[{ text: body.button.text, url: body.button.url }]]) : undefined };
            break;
        default:
            return res.status(400).json({ error: 'type must be daily|promo|welcome|session|signal|weekend|levels|review|crosspost|custom|tick' });
    }
    if (!msg) return res.status(400).json({ error: 'nothing to send' });
    // A signal (or any post) with a chart image → send the photo with the text as caption.
    const r = msg.photo
        ? await tg.sendPhoto(chat, msg.photo, msg.text, { reply_markup: msg.reply_markup })
        : await tg.sendMessage(chat, msg.text, { reply_markup: msg.reply_markup, preview: body.preview });
    if (r.ok && body.pin && r.result && r.result.message_id) await tg.pinChatMessage(chat, r.result.message_id);
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, message_id: r.result && r.result.message_id, pinned: !!(r.ok && body.pin) });
}
