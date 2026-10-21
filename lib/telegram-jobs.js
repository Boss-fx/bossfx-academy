// ================================================================
// lib/telegram-jobs.js — on-time scheduled posts + founder approval
//
// WHY: GitHub Actions cron ran 5–7 hours late (London brief landing at
// 3 PM, NY overlap at 8 PM). The schedule now lives HERE and is driven by a
// Supabase pg_cron "tick" every 5 minutes (supabase/telegram-jobs-schema.sql),
// which fires on the minute.
//
// HOW A SLOT WORKS (approval mode, the default when TELEGRAM_FOUNDER_ID is set):
//   T-30 min  bot DMs the founder a preview with [✅ Post now] [⏭ Skip].
//             Founder can REPLY to the preview with a note to add it.
//   T         if nobody tapped: TG_APPROVAL_FALLBACK=post (default) posts it,
//             =skip drops it. Anything >60 min stale is never posted.
//
// Times are written in each market's OWN clock, so they follow the UK/US
// daylight-saving changes automatically (WAT has no DST).
// ================================================================
'use strict';

const tg = require('./telegram');
const C = require('./telegram-content');
const { getSupabaseClient } = require('./supabase');

const TABLE = 'telegram_jobs';
const LEAD_MIN = 30;          // preview this many minutes before the slot
const STALE_MIN = 60;         // never post a slot more than this late
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [6, 0];

// ---- The schedule (local time in the market's own zone) ----
// London Open   : levels 07:30, brief 08:00 London  (08:00 WAT now, 09:00 WAT after 25 Oct)
// NY Overlap    : levels 07:00, brief 07:30 New York — 30 min before NY opens into the
//                 overlap (12:30 WAT now, 13:30 WAT after 1 Nov)
// Daily review  : 12:30 New York — 30 min after the overlap ends (17:30 WAT now)
// Weekend       : 11:00 Lagos, Sat & Sun
const SCHEDULE = [
    { id: 'levels_london', label: 'Key Levels (London)',        zone: 'Europe/London',    at: '07:30', days: WEEKDAYS },
    { id: 'brief_london',  label: 'London Open brief',          zone: 'Europe/London',    at: '08:00', days: WEEKDAYS },
    { id: 'levels_ny',     label: 'Key Levels (NY overlap)',    zone: 'America/New_York', at: '07:00', days: WEEKDAYS },
    { id: 'brief_ny',      label: 'London–NY Overlap brief',    zone: 'America/New_York', at: '07:30', days: WEEKDAYS },
    { id: 'review',        label: 'Daily Review',               zone: 'America/New_York', at: '12:30', days: WEEKDAYS },
    { id: 'weekend',       label: 'Weekend mindset',            zone: 'Africa/Lagos',     at: '11:00', days: WEEKEND }
];

// ---------------- time helpers ----------------
function zoneParts(zone, date) {
    const f = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23'
    });
    const p = {}; f.formatToParts(date || new Date()).forEach(x => { p[x.type] = x.value; });
    const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
    return { date: `${p.year}-${p.month}-${p.day}`, min: (+p.hour) * 60 + (+p.minute), dow };
}
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
function fmtWat(date) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date) + ' WAT';
}
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function founderId() { return process.env.TELEGRAM_FOUNDER_ID || ''; }
function approvalOn() { return !!founderId() && (process.env.TG_APPROVAL || 'on') !== 'off'; }
function fallback() { return (process.env.TG_APPROVAL_FALLBACK || 'post') === 'skip' ? 'skip' : 'post'; }

// ---------------- content builders ----------------
async function marketData() {
    try {
        const r = await fetch(`${tg.SITE}/api/market-data?type=all`);
        if (r.ok) return await r.json();
    } catch (e) { console.warn('[jobs] market-data fetch failed:', e.message); }
    return null;
}
async function build(id) {
    const levels = require('./market-levels');
    switch (id) {
        case 'levels_london':
        case 'levels_ny':     return C.levelsCard(await levels.getLevels('XAU/USD'));
        case 'brief_london':  return C.sessionBrief('london', await marketData());
        case 'brief_ny':      return C.sessionBrief('ny', await marketData());
        case 'review': {
            const [lv, md] = await Promise.all([levels.getLevels('XAU/USD'), marketData()]);
            return C.dailyReview(lv, md);
        }
        case 'weekend':       return C.weekendPost();
    }
    return null;
}

// Founder note → appended to the post.
function withNote(draft, note) {
    if (!note) return draft;
    return Object.assign({}, draft, { text: `${draft.text}\n\n🎯 <b>BossFx note:</b> ${esc(note)}` });
}

// Send a rendered message to the channel (photo captions max 1024 chars).
async function sendDraft(chat, d, extraMarkup) {
    const markup = extraMarkup || d.reply_markup;
    if (d.photo) {
        if (d.text.length <= 1000) return tg.sendPhoto(chat, d.photo, d.text, { reply_markup: markup });
        await tg.sendPhoto(chat, d.photo, '');
    }
    return tg.sendMessage(chat, d.text, { reply_markup: markup });
}

// ---------------- job store ----------------
async function claim(row) {
    const db = getSupabaseClient();
    if (!db) return { error: 'supabase not configured' };
    const { data, error } = await db.from(TABLE).insert(row).select().single();
    if (error) return { dup: error.code === '23505', error: error.message };
    return { row: data };
}
async function update(id, fields) {
    const db = getSupabaseClient();
    if (!db) return;
    const { error } = await db.from(TABLE).update(Object.assign({ updated_at: new Date().toISOString() }, fields)).eq('id', id);
    if (error) console.warn('[jobs] update:', error.message);
}
async function exists(key) {
    const db = getSupabaseClient(); if (!db) return false;
    const { data } = await db.from(TABLE).select('id').eq('job_key', key).maybeSingle();
    return !!data;
}
async function getJob(id) {
    const db = getSupabaseClient(); if (!db) return null;
    const { data } = await db.from(TABLE).select('*').eq('id', id).maybeSingle();
    return data;
}

// Post a stored job to the channel (once — status guard).
async function publish(job, how) {
    const db = getSupabaseClient(); if (!db) return { ok: false };
    // Atomically flip pending → posting so a tap + a tick can't double-post.
    const { data: locked } = await db.from(TABLE).update({ status: 'posting', updated_at: new Date().toISOString() })
        .eq('id', job.id).eq('status', 'pending').select().maybeSingle();
    if (!locked) return { ok: false, reason: 'not pending' };
    const r = await sendDraft(tg.channelId(), withNote(locked.draft, locked.note));
    await update(job.id, { status: r.ok ? how : 'failed', channel_msg_id: r.result && r.result.message_id });
    if (locked.founder_msg_id) await markPreview(locked.founder_msg_id, r.ok ? (how === 'posted_auto' ? '✅ Auto-posted (no reply)' : '✅ Posted') : '⚠️ Post failed');
    return { ok: !!r.ok };
}
function markPreview(msgId, label) {
    return tg.call('editMessageReplyMarkup', {
        chat_id: founderId(), message_id: msgId,
        reply_markup: { inline_keyboard: [[{ text: label, callback_data: 'noop' }]] }
    });
}

// Send the founder a preview with approve/skip buttons.
async function preview(job, header) {
    await tg.sendMessage(founderId(), header);
    const kb = tg.keyboard([[{ text: '✅ Post now', data: `ap:${job.id}` }, { text: '⏭ Skip', data: `sk:${job.id}` }]]);
    const r = await sendDraft(founderId(), job.draft, kb);
    if (r.ok && r.result) await update(job.id, { founder_msg_id: r.result.message_id });
    return r;
}

// ---------------- the tick (called every 5 min by pg_cron) ----------------
async function tick(opts) {
    opts = opts || {};
    const now = new Date();
    const out = [];

    // 1) Start slots that are due (preview window or post time).
    for (const s of SCHEDULE) {
        const z = zoneParts(s.zone, now);
        if (!s.days.includes(z.dow)) continue;
        const slot = toMin(s.at), lead = approvalOn() ? LEAD_MIN : 0;
        if (z.min < slot - lead || z.min >= slot + STALE_MIN) continue;
        const postAt = new Date(now.getTime() + (slot - z.min) * 60000);
        const key = `${s.id}:${z.date}`;
        if (opts.dry) { out.push({ key, action: 'due', postAt: fmtWat(postAt) }); continue; }

        if (await exists(key)) continue;               // cheap check before hitting market APIs
        const draft = await build(s.id);
        if (!draft) { out.push({ key, action: 'no-content' }); continue; }
        const c = await claim({ job_key: key, kind: s.id, status: 'pending', draft, post_at: postAt.toISOString() });
        if (!c.row) { out.push({ key, action: c.dup ? 'already-done' : 'error', error: c.dup ? undefined : c.error }); continue; }

        if (approvalOn() && z.min < slot) {
            await preview(c.row, `👀 <b>Preview · ${s.label}</b>\nGoes to the channel at <b>${fmtWat(postAt)}</b>${fallback() === 'post' ? ' unless you tap Skip' : ' only if you tap Post'}.\n<i>Reply to the preview with a note to add your take.</i>`);
            out.push({ key, action: 'previewed', postAt: fmtWat(postAt) });
        } else {
            const r = await publish(c.row, 'posted_auto');
            out.push({ key, action: r.ok ? 'posted' : 'post-failed' });
        }
    }

    // 2) Resolve previews whose post time has arrived with no tap.
    const db = getSupabaseClient();
    if (db && !opts.dry) {
        const { data: due } = await db.from(TABLE).select('*').eq('status', 'pending')
            .not('post_at', 'is', null).lte('post_at', now.toISOString()).limit(20);
        for (const j of due || []) {
            const lateMin = (now - new Date(j.post_at)) / 60000;
            if (fallback() === 'skip' || lateMin > STALE_MIN) {
                await update(j.id, { status: 'expired' });
                if (j.founder_msg_id) await markPreview(j.founder_msg_id, '⏭ Not posted (no reply)');
                out.push({ key: j.job_key, action: 'expired' });
            } else {
                const r = await publish(j, 'posted_auto');
                out.push({ key: j.job_key, action: r.ok ? 'auto-posted' : 'skipped' });
            }
        }
    }
    return out;
}

// ---------------- founder DM: /signal, /review, notes, buttons ----------------
const SIGNAL_HELP =
`📡 <b>Post a signal</b> — send this to me (edit the numbers):

<code>/signal sell XAUUSD
entry 4390
sl 4402
tp 4345
tp2 4305
session NY Overlap
bias HTF bearish, lower highs from 4,400
zone 2H supply 4,383–4,400
invalid 2H close above 4,402
why Swept Asia high, rejected supply</code>

Only the first 4 lines are required. Send it as a <b>photo caption</b> to attach your chart. I'll show you the card first — nothing posts until you tap ✅.

📓 <b>Daily review:</b> <code>/review your thoughts on today…</code>
If today's auto review hasn't gone out yet, your words are added to it. Otherwise it posts as its own card after you confirm.

💬 <b>Add your take to any preview:</b> reply to the preview message.`;

const FOUNDER_MENU =
`👑 <b>What I can do for you, Boss</b>

<b>Automatic (on time, every weekday)</b>
📍 07:30 Key Levels — gold prior-day + Asia levels
🇬🇧 08:00 London Open brief — majors, sentiment, high-impact news
📍 12:00 Key Levels — refreshed for New York
🗽 12:30 Overlap brief — 30 min before the 1 PM overlap
📓 17:30 Daily Review — how gold behaved at the levels + a lesson
🧠 Sat & Sun 11:00 — weekend mindset post
<i>(WAT times shift +1h when the UK/US clocks change)</i>

<b>You approve</b>
Each post previews here 30 min early →
✅ Post now · ⏭ Skip · or <b>reply</b> with your take to add a "BossFx note"
No reply → it posts on time.

<b>Your commands</b>
/signal — post a trade card (send with a chart photo to attach it)
/review — add your words to today's review
/today — today's posting times
/help — this menu + the signal template

<b>For everyone else</b>
New members get a welcome · /free · /course · /start → Forex 101 drip`;

const PAIRS = { gold: 'XAUUSD', xau: 'XAUUSD', xauusd: 'XAUUSD' };
function parseSignal(text) {
    const lines = String(text || '').replace(/^\/signal(@\w+)?/i, '').split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const o = {};
    // First line: direction + pair (any order), optional inline "key value" pairs.
    const first = lines.shift().split(/\s+/);
    const rest = [];
    for (let i = 0; i < first.length; i++) {
        const t = first[i].toLowerCase();
        if (!o.direction && /^(buy|sell|long|short)$/.test(t)) o.direction = (t === 'long' ? 'buy' : t === 'short' ? 'sell' : t);
        else if (!o.pair && /^[a-z]{3,6}\/?[a-z]{0,6}$/.test(t) && !KEYS[t]) o.pair = PAIRS[t] || t.replace('/', '').toUpperCase();
        else rest.push(first[i]);
    }
    if (rest.length) lines.unshift(rest.join(' '));
    for (const line of lines) {
        // Allow several "key value" pairs on one line only for numeric keys (entry 1 sl 2 tp 3).
        const m = line.match(/^([a-z0-9]+)\s*[:=]?\s*(.+)$/i);
        if (!m) continue;
        const k = KEYS[m[1].toLowerCase()];
        if (!k) continue;
        if (NUMERIC.has(k)) {
            const toks = line.split(/\s+/);
            for (let i = 0; i < toks.length - 1; i++) {
                const kk = KEYS[toks[i].toLowerCase().replace(/[:=]$/, '')];
                if (kk && NUMERIC.has(kk)) o[kk] = toks[i + 1].replace(/,/g, '');
            }
        } else o[k] = m[2].trim();
    }
    return o;
}
const KEYS = { entry: 'entry', e: 'entry', sl: 'sl', stop: 'sl', stoploss: 'sl', tp: 'tp', tp1: 'tp', target: 'tp', tp2: 'tp2',
    bias: 'bias', zone: 'zone', invalid: 'invalidation', invalidation: 'invalidation', why: 'reason', reason: 'reason', session: 'session' };
const NUMERIC = new Set(['entry', 'sl', 'tp', 'tp2']);

async function founderMessage(msg) {
    const me = founderId();
    const chatId = String(msg.chat.id);
    if (!me || chatId !== String(me)) return false;     // not the founder → normal bot handling
    const text = msg.text || msg.caption || '';
    const cmd = text.startsWith('/') ? text.slice(1).split(/[@\s]/)[0].toLowerCase() : '';

    if (cmd === 'signal') {
        const o = parseSignal(text);
        if (msg.photo && msg.photo.length) o.photo = msg.photo[msg.photo.length - 1].file_id;
        if (!o || !o.pair || !o.direction || !o.entry || !o.sl || !o.tp) {
            await tg.sendMessage(me, `⚠️ I need at least direction, pair, entry, sl and tp.\n\n${SIGNAL_HELP}`);
            return true;
        }
        const draft = C.signalCard(o);
        const c = await claim({ job_key: `signal:${Date.now()}`, kind: 'signal', status: 'pending', draft, post_at: null });
        if (!c.row) { await tg.sendMessage(me, `⚠️ Couldn't save the signal: ${esc(c.error)}`); return true; }
        await preview(c.row, `👀 <b>Your signal card</b> — check the numbers. It posts only when you tap ✅.`);
        return true;
    }
    if (cmd === 'review') {
        const note = text.replace(/^\/review(@\w+)?/i, '').trim();
        if (!note) { await tg.sendMessage(me, SIGNAL_HELP); return true; }
        const today = zoneParts('America/New_York').date;
        const db = getSupabaseClient();
        const { data: auto } = db ? await db.from(TABLE).select('*').eq('job_key', `review:${today}`).maybeSingle() : { data: null };
        if (auto && auto.status === 'pending') {
            await update(auto.id, { note });
            await tg.sendMessage(me, `✅ Added to today's Daily Review (goes out ${fmtWat(new Date(auto.post_at))}).`);
            return true;
        }
        const c = await claim({ job_key: `review_manual:${Date.now()}`, kind: 'review_manual', status: 'pending', draft: C.founderReview(note), post_at: null });
        if (c.row) await preview(c.row, `👀 <b>Your review card</b> — posts when you tap ✅.`);
        return true;
    }
    if (cmd === 'jobs' || cmd === 'today') {
        const today = SCHEDULE.filter(s => s.days.includes(zoneParts(s.zone).dow)).map(s => {
            const z = zoneParts(s.zone); const slot = toMin(s.at);
            const at = new Date(Date.now() + (slot - z.min) * 60000);
            return `• ${fmtWat(at)} — ${s.label}`;
        });
        const plan = today.length ? today.join('\n') : '• No scheduled posts today';
        await tg.sendMessage(me, `🗓️ <b>Today's schedule</b>\n${plan}\n\nPreviews reach you 30 min before each post. No reply → ${fallback() === 'post' ? 'it posts automatically' : 'it is skipped'}.\nWeekends: one mindset post at 11:00 WAT.`);
        return true;
    }
    if (cmd === 'help' || cmd === 'founder' || cmd === 'start') {
        await tg.sendMessage(me, FOUNDER_MENU);
        await tg.sendMessage(me, SIGNAL_HELP);
        return true;
    }
    // Reply to a preview = add a note to that post.
    if (!cmd && msg.reply_to_message && text) {
        const db = getSupabaseClient();
        const { data: job } = db ? await db.from(TABLE).select('*').eq('founder_msg_id', msg.reply_to_message.message_id).maybeSingle() : { data: null };
        if (job && job.status === 'pending') {
            await update(job.id, { note: text });
            await tg.sendMessage(me, `✅ Note added. ${job.post_at ? `Goes out ${fmtWat(new Date(job.post_at))}, or tap ✅ Post now.` : 'Tap ✅ Post now when ready.'}`);
            return true;
        }
        if (job) { await tg.sendMessage(me, 'That one has already gone out (or was skipped).'); return true; }
    }
    // Any other plain message from the founder → show the menu instead of silence.
    if (!cmd && text) {
        await tg.sendMessage(me, FOUNDER_MENU);
        return true;
    }
    return false;
}

async function founderCallback(q) {
    const me = founderId();
    if (!me || String(q.from.id) !== String(me)) return false;
    const m = /^(ap|sk):(\d+)$/.exec(q.data || '');
    if (!m) return q.data === 'noop';
    const job = await getJob(+m[2]);
    if (!job) { await tg.answerCallbackQuery(q.id, 'Not found'); return true; }
    if (m[1] === 'ap') {
        const r = await publish(job, 'posted');
        await tg.answerCallbackQuery(q.id, r.ok ? 'Posted to the channel ✅' : 'Already handled');
    } else {
        const db = getSupabaseClient();
        const { data } = await db.from(TABLE).update({ status: 'skipped', updated_at: new Date().toISOString() })
            .eq('id', job.id).eq('status', 'pending').select().maybeSingle();
        if (data && data.founder_msg_id) await markPreview(data.founder_msg_id, '⏭ Skipped');
        await tg.answerCallbackQuery(q.id, data ? 'Skipped — nothing posted' : 'Already handled');
    }
    return true;
}

module.exports = { tick, founderMessage, founderCallback, parseSignal, zoneParts, SCHEDULE };
