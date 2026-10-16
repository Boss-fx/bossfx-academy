// ================================================================
// api/telegram-post.js — push a post to the BossFx channel on demand
// Protected by TELEGRAM_WEBHOOK_SECRET (Bearer token). Use for
// cross-posting new content, pinning a welcome, or ad-hoc broadcasts.
//
// Example:
//   curl -X POST https://www.bossfxcademy.com/api/telegram-post \
//     -H "Authorization: Bearer $TELEGRAM_WEBHOOK_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"type":"crosspost","title":"Sunday Market Prep","url":"https://youtu.be/...","kind":"video","pin":false}'
// ================================================================
'use strict';

const tg = require('../lib/telegram');
const C = require('../lib/telegram-content');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const auth = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!secret || auth !== secret) return res.status(401).json({ error: 'Unauthorized' });
    if (!tg.isConfigured() || !tg.channelId()) return res.status(500).json({ error: 'Telegram not configured' });

    const body = req.body || {};
    const chat = body.chat_id || tg.channelId();
    let msg;

    switch (body.type) {
        case 'daily':     msg = C.dailyPost(); break;
        case 'promo':     msg = C.promoStep(Number(body.step) || 0); break;
        case 'welcome':   msg = C.welcome(body.name || ''); break;
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
    if (r.ok && body.pin && r.result && r.result.message_id) {
        await tg.pinChatMessage(chat, r.result.message_id);
    }
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, message_id: r.result && r.result.message_id, pinned: !!(r.ok && body.pin) });
};
