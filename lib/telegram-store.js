// ================================================================
// lib/telegram-store.js — DM-funnel subscriber state (Supabase)
// Backs the Telegram bot's free→paid drip. Table: telegram_subscribers
// (see supabase/telegram-subscribers-schema.sql). Service-role only.
// ================================================================
'use strict';

const { getSupabaseClient } = require('./supabase');
const TABLE = 'telegram_subscribers';

// On /start in a private chat: create or re-arm the subscriber at step 0.
async function upsertStart(chat) {
    const db = getSupabaseClient();
    if (!db) return null;
    const now = new Date().toISOString();
    const { data, error } = await db.from(TABLE).upsert({
        chat_id: chat.id,
        first_name: chat.first_name || null,
        username: chat.username || null,
        step: 0,
        status: 'active',
        start_at: now,
        last_sent_at: now,
        updated_at: now
    }, { onConflict: 'chat_id' }).select().single();
    if (error) console.warn('[tg-store] upsertStart:', error.message);
    return data;
}

async function markStopped(chatId) {
    const db = getSupabaseClient();
    if (!db) return;
    const { error } = await db.from(TABLE)
        .update({ status: 'stopped', updated_at: new Date().toISOString() })
        .eq('chat_id', chatId);
    if (error) console.warn('[tg-store] markStopped:', error.message);
}

// Active subscribers whose next promo step is due.
// delaysHours[i] = hours after start_at that promo step i should fire.
async function dueSubscribers(delaysHours) {
    const db = getSupabaseClient();
    if (!db) return [];
    const { data, error } = await db.from(TABLE)
        .select('*').eq('status', 'active').lt('step', delaysHours.length).limit(40);
    if (error) { console.warn('[tg-store] dueSubscribers:', error.message); return []; }
    const now = Date.now();
    return (data || []).filter(s => {
        const delay = delaysHours[s.step];
        return delay != null && (now - new Date(s.start_at).getTime()) >= delay * 3600000;
    });
}

async function advance(chatId, newStep, done) {
    const db = getSupabaseClient();
    if (!db) return;
    const { error } = await db.from(TABLE).update({
        step: newStep,
        status: done ? 'done' : 'active',
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).eq('chat_id', chatId);
    if (error) console.warn('[tg-store] advance:', error.message);
}

module.exports = { upsertStart, markStopped, dueSubscribers, advance };
