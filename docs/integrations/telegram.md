# Telegram Bot — BossFx Academy

> Full-funnel channel bot. **Phase 1:** channel broadcasts, daily tips, welcome/pin, commands, on-demand cross-post. **Phase 2:** DM drip funnel (`/start` → free→paid promo drip with saved state). Both shipped.

---

## What it does (Phase 1)
- **Daily channel post** — a rotating market tip / soft CTA, sent by the existing daily cron (`/api/cron-reengagement`, 09:00 UTC). No extra cron.
- **Welcome + commands** — new members get a welcome; `/free`, `/course`, `/start`, `/help` reply with site links + buttons (`api/telegram-webhook.js`).
- **On-demand posting / cross-post** — push any content to the channel via `api/telegram-webhook.js` (protected, `Authorization: Bearer`).
- All site links are **UTM-tagged** (`utm_source=telegram`) so GA4 attributes Telegram traffic.

## Files
| File | Role |
|---|---|
| `lib/telegram.js` | Bot API client (send, pin, keyboard, UTM links) |
| `lib/telegram-content.js` | **All copy** — welcome, commands, daily tips, promo drip, cross-post, /stop |
| `lib/telegram-store.js` | DM-funnel subscriber state (Supabase `telegram_subscribers`) |
| `api/telegram-webhook.js` | Webhook (welcome, commands, buttons, `/start`+`/stop` DM enrol) **and** protected on-demand poster / cross-post |
| `api/cron-reengagement.js` | Appends the daily channel post **and** advances the DM drip |
| `supabase/telegram-subscribers-schema.sql` | One-time DDL for the subscriber table |

> To change wording, edit **`lib/telegram-content.js`** only.

---

## Setup (one-time, ~5 min)

### 1. Create the bot
In Telegram, open **@BotFather** → `/newbot` → give it a name (e.g. *BossFx Academy Bot*) and a username. BotFather returns a **token** like `123456:ABC...`.

### 2. Set environment variables in Vercel
Vercel → Project → Settings → Environment Variables (Production):
| Variable | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | the token from BotFather |
| `TELEGRAM_CHANNEL_ID` | your channel: `@bossfxacademy` (public) **or** the numeric `-100…` id (private) |
| `TELEGRAM_WEBHOOK_SECRET` | any long random string (run `openssl rand -hex 24`) |

Then **redeploy** so the functions pick them up.

> Numeric channel id: add the bot to the channel, post anything, then visit
> `https://api.telegram.org/bot<TOKEN>/getUpdates` — the `chat.id` (starts `-100`) is it.

### 3. Add the bot as a channel admin
Channel → Administrators → Add Admin → your bot → enable **Post Messages** (and Pin Messages if you want it to pin).

### 4. Register the webhook (one-time)
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://www.bossfxcademy.com/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```
Check it: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`.

### 5. Test
- Send `/free` to the bot (or in the channel) → it should reply with the free-course button.
- On-demand post:
```bash
curl -X POST https://www.bossfxcademy.com/api/telegram-webhook \
  -H "Authorization: Bearer <TELEGRAM_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"type":"daily"}'
```

---

## Cross-posting new content
When you publish a video/blog, POST to `/api/telegram-webhook`:
```json
{ "type": "crosspost", "title": "Sunday Market Prep", "url": "https://youtu.be/…", "kind": "video", "pin": false }
```
`kind` = `video` | `short` | `blog`. Set `"pin": true` to pin it.

## Daily post cadence
The rotation lives in `DAILY_POSTS` (`lib/telegram-content.js`) and advances one per day. Add/edit entries freely. It fires on the 09:00 UTC cron.

---

## Phase 2 — DM funnel (shipped)
When someone sends **`/start` to the bot in a private chat**, they're enrolled in a free→paid promo drip:

1. `/start` → `telegram-store.upsertStart()` saves them in `telegram_subscribers` (step 0, `start_at=now`, status `active`) and the bot replies with the welcome + "Start Forex 101 (Free)" button.
2. The **daily cron** (`/api/cron-reengagement`) advances each active subscriber through `promoStep()` on this schedule — `TG_DM_DELAYS = [24, 72]` hours after they joined:
   - **+24h** → *"Your free Forex 101 is waiting"* (→ `/learn/`)
   - **+72h** → *"The full 12-module system"* (→ `/courses.html#forex101`)
   After the last step the subscriber is marked `done`.
3. `/stop` → marked `stopped`, no more messages (re-arm with `/start`). If a user blocks the bot (403), the cron auto-marks them `stopped`.

To change the drip copy or delays: copy lives in `PROMO` (`lib/telegram-content.js`); delays live in `TG_DM_DELAYS` (`api/cron-reengagement.js`).

### One-time DB setup
Run **`supabase/telegram-subscribers-schema.sql`** once in the Supabase SQL Editor (Dashboard → SQL → New query → paste → Run). It creates the server-only `telegram_subscribers` table (RLS on, service-role grant). No new env vars — it reuses the existing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.

> **Note:** `/start` only enrols people who DM the bot directly. Channel members aren't in private chat with the bot, so nudge them to message it (e.g. a channel post with a "Message the bot" button) to feed the DM funnel.

## Common issues
| Symptom | Fix |
|---|---|
| Bot can't post to channel | Not an admin, or **Post Messages** permission off |
| Webhook 401 | `TELEGRAM_WEBHOOK_SECRET` mismatch between env and `setWebhook` |
| Nothing sends | `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHANNEL_ID` not set, or not redeployed |
| Daily post missing | Check Vercel cron logs for `telegram=` in the cron result |
