// ================================================================
// lib/telegram.js — BossFx Telegram Bot API client
// Thin wrapper over the Telegram Bot API. Uses global fetch (Node 18+).
// Requires env: TELEGRAM_BOT_TOKEN. Channel target: TELEGRAM_CHANNEL_ID
// (either @username or numeric -100… id).
// ================================================================
'use strict';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : '';
const SITE = 'https://bossfxcademy.com';

function isConfigured() { return !!TOKEN; }
function channelId() { return process.env.TELEGRAM_CHANNEL_ID || ''; }

// Low-level call
async function call(method, payload) {
    if (!TOKEN) return { ok: false, error: 'TELEGRAM_BOT_TOKEN not set' };
    try {
        const r = await fetch(`${API}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {})
        });
        const data = await r.json();
        if (!data.ok) console.warn(`[telegram] ${method} failed:`, data.description);
        return data;
    } catch (err) {
        console.warn(`[telegram] ${method} threw:`, err.message);
        return { ok: false, error: err.message };
    }
}

// --- Messaging ---
function sendMessage(chatId, text, opts = {}) {
    return call('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: opts.parse_mode || 'HTML',
        disable_web_page_preview: opts.preview === true ? false : true,
        reply_markup: opts.reply_markup,
        message_thread_id: opts.thread
    });
}
function sendPhoto(chatId, photo, caption, opts = {}) {
    return call('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup: opts.reply_markup });
}
function sendVideo(chatId, video, caption, opts = {}) {
    return call('sendVideo', { chat_id: chatId, video, caption, parse_mode: 'HTML', reply_markup: opts.reply_markup });
}
function pinChatMessage(chatId, messageId, disableNotification = true) {
    return call('pinChatMessage', { chat_id: chatId, message_id: messageId, disable_notification: disableNotification });
}
function answerCallbackQuery(id, text) {
    return call('answerCallbackQuery', { callback_query_id: id, text });
}
function setWebhook(url, secretToken) {
    return call('setWebhook', {
        url,
        secret_token: secretToken,
        allowed_updates: ['message', 'callback_query', 'chat_member', 'my_chat_member', 'chat_join_request']
    });
}
function deleteWebhook() { return call('deleteWebhook', {}); }

// --- Inline keyboard helper ---
// rows: [[{text, url}|{text, data}], …]
function keyboard(rows) {
    return {
        inline_keyboard: rows.map(row => row.map(btn =>
            btn.url ? { text: btn.text, url: btn.url } : { text: btn.text, callback_data: btn.data }
        ))
    };
}

// UTM-tagged site link (keeps Telegram attribution clean in GA4)
function link(path, campaign, medium = 'channel') {
    const sep = path.includes('?') ? '&' : '?';
    return `${SITE}${path}${sep}utm_source=telegram&utm_medium=${medium}&utm_campaign=${campaign}`;
}

module.exports = {
    isConfigured, channelId, call,
    sendMessage, sendPhoto, sendVideo, pinChatMessage, answerCallbackQuery,
    setWebhook, deleteWebhook, keyboard, link, SITE
};
