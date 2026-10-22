// ================================================================
// lib/bootcamp.js — free bootcamp registrations (Oshodi cohort & future ones)
// Stored in Supabase `bootcamp_registrations` (supabase/bootcamp-schema.sql).
// WhatsApp number is the key — many young people don't use email. If an
// email IS given, /api/lead-capture also adds them to Brevo as usual.
// The founder gets a Telegram DM per signup with the running total.
// ================================================================
'use strict';

const { getSupabaseClient } = require('./supabase');
const tg = require('./telegram');

const TABLE = 'bootcamp_registrations';

// Normalise Nigerian numbers to +234XXXXXXXXXX; keep other international numbers as typed.
function normPhone(raw) {
    let d = String(raw || '').replace(/[^\d+]/g, '');
    if (/^0\d{10}$/.test(d)) d = '+234' + d.slice(1);
    else if (/^234\d{10}$/.test(d)) d = '+' + d;
    else if (/^\d{10}$/.test(d) && /^[789]/.test(d)) d = '+234' + d;
    return /^\+?\d{10,15}$/.test(d) ? (d.startsWith('+') ? d : '+' + d) : null;
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n || 120);

async function register(body) {
    const name = clean(body.name, 80);
    const whatsapp = normPhone(body.whatsapp);
    if (name.length < 2) return { status: 400, json: { error: 'Please enter your name' } };
    if (!whatsapp) return { status: 400, json: { error: 'Please enter a valid WhatsApp number' } };

    const row = {
        cohort: clean(body.cohort || 'oshodi-nov-2026', 40),
        name,
        whatsapp,
        email: clean(body.email, 120).toLowerCase() || null,
        age_range: clean(body.age_range, 20) || null,
        area: clean(body.area, 60) || null,
        experience: clean(body.experience, 30) || null,
        ref: clean(body.ref || body._bfx_utm_source, 40) || null
    };

    const db = getSupabaseClient();
    let total = null, duplicate = false;
    if (db) {
        const { error } = await db.from(TABLE).insert(row);
        if (error) {
            if (error.code === '23505') duplicate = true;          // same WhatsApp, same cohort
            else { console.error('[bootcamp] insert failed:', error.message); return { status: 500, json: { error: 'Could not save — please try again' } }; }
        }
        const { count } = await db.from(TABLE).select('id', { count: 'exact', head: true }).eq('cohort', row.cohort);
        total = count;
    }

    // Founder ping (best effort)
    const me = process.env.TELEGRAM_FOUNDER_ID;
    if (me && !duplicate) {
        const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
        await tg.sendMessage(me, `🎟️ <b>New bootcamp signup</b>${total ? ` · #${total}` : ''}\n${esc(row.name)} · ${esc(row.area || '—')} · ${esc(row.experience || '—')}${row.ref ? `\n<i>via ${esc(row.ref)}</i>` : ''}`).catch(() => {});
    }
    return { status: 200, json: { success: true, duplicate, total } };
}

// Founder summary for the bot (/bootcamp)
async function summary(cohort) {
    const db = getSupabaseClient(); if (!db) return null;
    cohort = cohort || 'oshodi-nov-2026';
    const { data, count } = await db.from(TABLE).select('name, area, experience, ref, created_at', { count: 'exact' })
        .eq('cohort', cohort).order('created_at', { ascending: false }).limit(5);
    const { data: refs } = await db.from(TABLE).select('ref').eq('cohort', cohort);
    const byRef = {};
    (refs || []).forEach(r => { const k = r.ref || 'direct'; byRef[k] = (byRef[k] || 0) + 1; });
    return { cohort, total: count || 0, latest: data || [], byRef };
}

module.exports = { register, summary, normPhone };
