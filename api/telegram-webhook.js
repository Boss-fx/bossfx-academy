// ================================================================
// api/telegram-webhook.js — BossFx Telegram bot webhook
// Receives Telegram updates: new-member welcome, /commands, buttons.
// Secured by a secret token (TELEGRAM_WEBHOOK_SECRET) that Telegram
// echoes back in the X-Telegram-Bot-Api-Secret-Token header.
//
// Register once (after setting env + deploy):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=
//     https://www.bossfxcademy.com/api/telegram-webhook&secret_token=<SECRET>
// ================================================================
'use strict';

const tg = require('../lib/telegram');
const C = require('../lib/telegram-content');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Verify the webhook secret
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!tg.isConfigured()) return res.status(200).json({ ok: true, skipped: 'no token' });

    const update = req.body || {};
    try {
        // --- New members joining a group/channel ---
        const nm = update.message && update.message.new_chat_members;
        if (Array.isArray(nm) && nm.length) {
            for (const m of nm) {
                if (m.is_bot) continue;
                const w = C.welcome(m.first_name || '');
                await tg.sendMessage(update.message.chat.id, w.text, { reply_markup: w.reply_markup });
            }
            return res.status(200).json({ ok: true });
        }

        // --- Text commands ---
        if (update.message && typeof update.message.text === 'string' && update.message.text.startsWith('/')) {
            const cmd = update.message.text.slice(1).split(/[@\s]/)[0].toLowerCase();
            const resp = (C.COMMANDS[cmd] || C.COMMANDS.help)();
            await tg.sendMessage(update.message.chat.id, resp.text, { reply_markup: resp.reply_markup });
            return res.status(200).json({ ok: true });
        }

        // --- Inline button callbacks ---
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
        return res.status(200).json({ ok: true, error: err.message }); // 200 so Telegram doesn't retry-storm
    }
};
