# Environment Variables — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

All environment variables are stored in `.env.local` for local development and configured in Vercel dashboard for production. Never commit `.env.local` to git.

---

## Required Variables

These must be set for the application to function. Missing any of these will cause critical failures.

| Variable | Purpose | Where to Get It | Impact if Missing |
|---|---|---|---|
| `FLUTTERWAVE_SECRET_KEY` | Server-side payment verification via Flutterwave API v3 | Flutterwave Dashboard → Settings → API Keys → Secret Key | Payment verification fails — orders cannot be fulfilled |
| `BREVO_API_KEY` | Transactional emails (fulfillment, booking, drip) and CRM contact management | Brevo Dashboard → SMTP & API → API Keys → v3 API Key | No emails sent — customers don't receive download links or confirmations |
| `SUPABASE_URL` | PostgreSQL database connection | Supabase Dashboard → Project Settings → API → Project URL | All database operations fail — no orders, tokens, or downloads recorded |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend database access with full RLS bypass | Supabase Dashboard → Project Settings → API → service_role key (secret) | Backend cannot read/write database — fulfillment and admin broken |

---

## Recommended Variables

The application works without these but with degraded functionality.

| Variable | Purpose | Default/Fallback | Impact if Missing |
|---|---|---|---|
| `SENDER_EMAIL` | From address for all Brevo transactional emails | `hello@bossfxcademy.com` | Emails sent from default address (may not match Brevo verified sender) |
| `ADMIN_EMAIL` | Receives admin notifications (new orders, unmatched payments) | Falls back to `SENDER_EMAIL` | Admin notifications go to sender email instead |
| `ADMIN_EMAILS` | Comma-separated list of emails allowed to access admin API | None | Admin API access check may fail or be too restrictive |
| `DOWNLOAD_SECRET` | HMAC secret for generating download tokens | Falls back to `FLUTTERWAVE_SECRET_KEY` | Less secure — payment key reused for token signing |
| `FLUTTERWAVE_WEBHOOK_HASH` | Webhook signature verification hash | Falls back to `FLUTTERWAVE_WEBHOOK_SECRET` | If neither is set: webhook returns 500 |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Alternative name for webhook hash | None | Fallback for `FLUTTERWAVE_WEBHOOK_HASH` |
| `SUPABASE_ANON_KEY` | Client-side Supabase access (admin dashboard login) | None | Admin dashboard login form won't work |
| `CRON_SECRET` | Bearer token for cron endpoint authentication | None (not enforced outside production) | Cron endpoint accessible without authentication in production |

---

## Setting Variables Locally

Create `.env.local` in the project root:

```bash
# Required
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://kklwvzpwgpcwxjmgikfq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Recommended
SENDER_EMAIL=hello@bossfxcademy.com
ADMIN_EMAIL=admin@bossfxcademy.com
ADMIN_EMAILS=admin@bossfxcademy.com
DOWNLOAD_SECRET=a-strong-random-secret-for-download-tokens
FLUTTERWAVE_WEBHOOK_HASH=your-webhook-hash-from-flutterwave
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## Setting Variables in Vercel

```bash
# Add each variable (you'll be prompted for the value)
vercel env add FLUTTERWAVE_SECRET_KEY
vercel env add BREVO_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SENDER_EMAIL
vercel env add ADMIN_EMAIL
vercel env add DOWNLOAD_SECRET
vercel env add FLUTTERWAVE_WEBHOOK_HASH
vercel env add SUPABASE_ANON_KEY
vercel env add CRON_SECRET
```

Or set via the Vercel Dashboard: Project → Settings → Environment Variables.

Each variable can be scoped to: Production, Preview, Development.

---

## Validation

The application validates environment variables at startup via `lib/validate-env.js`:
- **Required** vars that are missing cause console errors with impact descriptions
- **Recommended** vars that are missing cause console warnings
- No startup crash — the app starts but affected features will fail at runtime

To check env status locally:
```bash
node -e "require('./lib/validate-env').logEnvStatus()"
```

---

## Client-Side Configuration

Client-side values (public keys, IDs) are stored in `config.js`, not in environment variables:

| Value | Location | Notes |
|---|---|---|
| Flutterwave public key | `config.js → BFX.config.flutterwave.publicKey` | Public key, safe to expose |
| GA4 measurement ID | `config.js → BFX.config.ga4Id` | G-ZFQ9P5KFSJ |
| Clarity project ID | `config.js → BFX.config.clarityId` | wnde2od79f |
| Formspree endpoint | `config.js → BFX.config.formspree` | xeenzyna |
| Supabase anon key | `admin/index.html` meta tag | Anon key for admin dashboard auth |

These are public values and intentionally client-side. Do not move server-side secrets to `config.js`.
