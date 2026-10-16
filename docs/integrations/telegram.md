# Telegram Bot — BossFx Academy

> Full-funnel channel bot. **Phase 1 (this doc):** channel broadcasts, daily tips, welcome/pin, commands, on-demand cross-post. **Phase 2 (later):** DM drip sequences with saved state.

---

## What it does (Phase 1)
- **Daily channel post** — a rotating market tip / soft CTA, sent by the existing daily cron (`/api/cron-reengagement`, 09:00 UTC). No extra cron.
- **Welcome + commands** — new members get a welcome; `/free`, `/course`, `/start`, `/help` reply with site links + buttons (`api/telegram-webhook.js`).
- **On-demand posting / cross-post** — push any content to the channel via `api/telegram-post.js` (protected).
- All site links are **UTM-tagged** (`utm_source=telegram`) so GA4 attributes Telegram traffic.

## Files
| File | Role |
|---|---|
| `lib/telegram.js` | Bot API client (send, pin, keyboard, UTM links) |
| `lib/telegram-content.js` | **All copy** — welcome, commands, daily tips, promo, cross-post |
| `api/telegram-webhook.js` | Webhook (welcome, commands, buttons) **and** protected on-demand poster / cross-post |
| `api/cron-reengagement.js` | Appends the daily channel post |

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

## Phase 2 (next)
DM funnel: on `/start` in a private chat, save the user (`chat_id`, step, timestamp) in a `telegram_subscribers` Supabase table, then a cron advances a **promo drip** (free → paid) over days — mirroring the Brevo email drip, with buttons back to `/learn/`. The copy already exists (`promoStep()`); Phase 2 adds the state table + scheduler.

## Common issues
| Symptom | Fix |
|---|---|
| Bot can't post to channel | Not an admin, or **Post Messages** permission off |
| Webhook 401 | `TELEGRAM_WEBHOOK_SECRET` mismatch between env and `setWebhook` |
| Nothing sends | `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHANNEL_ID` not set, or not redeployed |
| Daily post missing | Check Vercel cron logs for `telegram=` in the cron result |
