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

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    // ---- Mode 2: authenticated admin post / cross-post ----
    const auth = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (auth) {
        if (!secret || auth !== secret) return res.status(401).json({ error: 'Unauthorized' });
        if (!tg.isConfigured() || !tg.channelId()) return res.status(500).json({ error: 'Telegram not configured' });
        return adminPost(req, res);
    }

    // ---- Mode 1: Telegram webhook ----
    if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!tg.isConfigured()) return res.status(200).json({ ok: true, skipped: 'no token' });

    const update = req.body || {};
    try {
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
            const cmd = update.message.text.slice(1).split(/[@\s]/)[0].toLowerCase();
            const resp = (C.COMMANDS[cmd] || C.COMMANDS.help)();
            await tg.sendMessage(update.message.chat.id, resp.text, { reply_markup: resp.reply_markup });
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
        case 'crosspost':
            if (!body.title || !body.url) return res.status(400).json({ error: 'title and url required' });
            msg = C.crossPost({ title: body.title, url: body.url, kind: body.kind || 'video' });
            break;
        case 'custom':
            if (!body.text) return res.status(400).json({ error: 'text required' });
            msg = { text: body.text, reply_markup: body.button ? tg.keyboard([[{ text: body.button.text, url: body.button.url }]]) : undefined };
            break;
        default:
            return res.status(400).json({ error: 'type must be daily|promo|welcome|crosspost|custom' });
    }
    if (!msg) return res.status(400).json({ error: 'nothing to send' });
    const r = await tg.sendMessage(chat, msg.text, { reply_markup: msg.reply_markup, preview: body.preview });
    if (r.ok && body.pin && r.result && r.result.message_id) await tg.pinChatMessage(chat, r.result.message_id);
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, message_id: r.result && r.result.message_id, pinned: !!(r.ok && body.pin) });
}
