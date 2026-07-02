# EMAIL_ARCHITECTURE.md — BossFx Academy Email Infrastructure

> **Last Updated:** 2026-07-02
> **Owner:** Timilehin "BossFx" Shobande
> **Status:** Production — Brevo as single source of truth

---

## Architecture Overview

Brevo is the **single source of truth** for all email across the BossFx ecosystem. Every email — transactional, marketing, authentication, and CRM — routes through Brevo's infrastructure.

```
┌─────────────────────────────────────────────────────────────────┐
│                    BREVO (Single Source of Truth)                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ SMTP Relay   │  │ API v3       │  │ CRM & Automation      │  │
│  │              │  │              │  │                       │  │
│  │ Supabase     │  │ Fulfillment  │  │ 4 contact lists       │  │
│  │ Auth emails  │  │ Drip engine  │  │ 20+ CRM attributes    │  │
│  │              │  │ Admin alerts │  │ 6 drip sequences      │  │
│  │ Port: 587    │  │ Lead capture │  │ Lead scoring           │  │
│  │ TLS: Yes     │  │ Booking conf │  │ Tag management         │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
   ┌───────────┐      ┌──────────────┐      ┌─────────────┐
   │ Supabase  │      │ Vercel       │      │ Frontend    │
   │ Auth      │      │ Serverless   │      │ Forms       │
   │           │      │              │      │             │
   │ • Sign up │      │ • Webhook    │      │ • Newsletter│
   │ • Verify  │      │ • Lead cap   │      │ • Exit popup│
   │ • Reset   │      │ • Booking    │      │ • Webinar   │
   │ • Magic   │      │ • Cron       │      │ • Contact   │
   │ • Invite  │      │ • Admin      │      │ • Blog CTA  │
   └───────────┘      └──────────────┘      └─────────────┘
```

---

## Email Flows — Complete Inventory

### 1. Transactional Emails (Brevo API v3)

| Email | Trigger | Sender | Template | File |
|---|---|---|---|---|
| Course fulfillment | Payment webhook | BossFx Academy | `courseEmailContent()` | `lib/email.js` |
| Mentorship fulfillment | Payment webhook | BossFx Academy | `mentorshipEmailContent()` | `lib/email.js` |
| VIP fulfillment | Payment webhook | BossFx Academy | `vipEmailContent()` | `lib/email.js` |
| EA bundle fulfillment | Payment webhook | BossFx Academy | `eaEmailContent()` | `lib/email.js` |
| EA addon section | Payment webhook (addon) | Appended to above | `eaAddonSection()` | `lib/email.js` |
| Admin sale notification | Payment webhook | BossFx System | `adminNotificationContent()` | `lib/email.js` |
| Booking confirmation | Mentorship booking | BossFx Academy | `bookingConfirmation()` | `lib/templates.js` |
| Admin booking alert | Mentorship booking | BossFx System | `adminBookingAlert()` | `lib/templates.js` |

**Delivery path:** `lib/email.js` → Brevo API v3 (`sendTransacEmail`) → Recipient inbox

**Sender identity:**
- Name: `BossFx Academy` (customer) / `BossFx System` (admin)
- Email: `SENDER_EMAIL` env var (default: `hello@bossfxcademy.com`)
- Reply-to: `hello@bossfxcademy.com`

### 2. Drip Email Sequences (Brevo API v3)

| Sequence | Trigger | Steps | Timing | List |
|---|---|---|---|---|
| Welcome | Newsletter signup | 4 | 0, 1d, 3d, 7d | General (2) |
| Webinar | Webinar registration | 2 | 0, 1d | Webinar (3) |
| Resource | Resource download | 3 | 0, 2d, 5d | Resource (6) |
| Mentorship | Mentorship inquiry | 4 | 0, 1d, 3d, 7d | Mentorship (5) |
| Exit Intent | Exit popup capture | 3 | 0, 1d, 4d | General (2) |
| Re-engagement | 30d inactive | 3 | 0, 3d, 7d | All lists |

**Delivery path:** `api/cron-reengagement.js` (daily 09:00 UTC) → `lib/drip.js` → Brevo API v3 → Recipient inbox

**Templates:** 19+ HTML templates in `lib/templates.js`, branded with BossFx colors and styling.

### 3. Supabase Authentication Emails (Brevo SMTP Relay)

| Email | Trigger | Template Variables |
|---|---|---|
| Confirm Email | User signup | `{{ .ConfirmationURL }}` |
| Reset Password | Password reset request | `{{ .ConfirmationURL }}` |
| Magic Link | Magic link login | `{{ .ConfirmationURL }}` |
| Invite User | Admin invites user | `{{ .ConfirmationURL }}` |
| Change Email | Email change request | `{{ .ConfirmationURL }}` |
| Re-authentication | Re-auth required | `{{ .ConfirmationURL }}` |

**Delivery path:** Supabase Auth → Brevo SMTP Relay (`smtp-relay.brevo.com:587`) → Recipient inbox

**Configuration location:** Supabase Dashboard → Auth → SMTP Settings + Email Templates

### 4. CRM Contact Management (Brevo Contacts API)

| Action | Trigger | Data Captured |
|---|---|---|
| Create/update contact | Lead capture form | Email, name, source, UTM, lead score, list assignment |
| Create/update contact | Purchase fulfillment | Email, name, product, purchase date |
| Update attributes | Drip progression | AUTOMATION_FLOW, AUTOMATION_STEP, AUTOMATION_START |
| Tag assignment | Lead source detection | Source-based tags |

**Contact Lists:**
| ID | Name | Purpose |
|---|---|---|
| 2 | BFX Academy Starter Pack | General signups, exit intent |
| 3 | Enthusiast Traders | Webinar registrations |
| 5 | Mentorship Inquiries | Mentorship leads |
| 6 | Resource Downloaders | Resource downloads |

### 5. Frontend Form Submissions

| Form | Current Provider | Target Provider | File |
|---|---|---|---|
| Newsletter signup | Formspree (fallback) | Brevo API `/api/lead-capture` | `email-config.js` |
| Exit intent popup | Formspree (fallback) | Brevo API `/api/lead-capture` | `bfx-convert.js` |
| Webinar registration | Formspree (fallback) | Brevo API `/api/lead-capture` | various pages |
| Contact form | Formspree (`xeenzyna`) | Formspree (keep — different purpose) | `contact.html` |
| Blog CTAs | Formspree (fallback) | Brevo API `/api/lead-capture` | blog pages |

**Note:** `config.js` has `email.provider: 'none'` which causes all frontend subscriptions to fall back to Formspree instead of routing to Brevo. This should be changed to `'brevo'` with proper list IDs once Brevo API key is configured for frontend use.

### 6. Contact Form (Formspree — Retained)

The contact form on `contact.html` submits to Formspree endpoint `xeenzyna`. This is intentionally separate from Brevo because:
- Contact form submissions are support/inquiry messages, not newsletter signups
- Formspree provides a clean inbox for reading messages
- No CRM workflow needed for support inquiries

---

## SMTP Configuration

### Brevo SMTP Relay (for Supabase Auth)

```
Host:     smtp-relay.brevo.com
Port:     587
Security: STARTTLS
Username: [Brevo account login email]
Password: [Brevo SMTP key — from Dashboard → SMTP & API → SMTP tab]
```

### Supabase Dashboard Configuration

Navigate to: **Supabase Dashboard → Project Settings → Auth → SMTP Settings**

| Field | Value |
|---|---|
| Enable Custom SMTP | ✅ On |
| Sender email | `hello@bossfxcademy.com` |
| Sender name | `BossFx Academy` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Minimum interval | `30` (seconds) |
| Username | `[Brevo login email]` |
| Password | `[Brevo SMTP key]` |

---

## DNS Configuration

### Current DNS Status

| Record | Type | Status | Value |
|---|---|---|---|
| SPF | TXT @ | ⚠️ Incomplete | `v=spf1 include:spf.cloudeu.xion.oxcs.net ~all` — missing Brevo |
| DMARC | TXT _dmarc | ✅ Exists | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` |
| DKIM | TXT/CNAME | ❌ Missing | No DKIM records found for Brevo |
| MX | MX @ | ✅ Exists | `mx00[1-4].go54.xion.oxcs.net` (hosting provider) |

### Required DNS Changes

#### 1. SPF Record (UPDATE existing)

**Current:**
```
v=spf1 include:spf.cloudeu.xion.oxcs.net ~all
```

**Updated:**
```
v=spf1 include:spf.cloudeu.xion.oxcs.net include:sendinblue.com ~all
```

> Add `include:sendinblue.com` before `~all`. This authorizes Brevo's mail servers to send on behalf of `bossfxcademy.com`.

#### 2. DKIM Records (ADD new)

After authenticating the domain in Brevo (Dashboard → Senders & IPs → Domains → Add Domain), Brevo provides DKIM records. Typical format:

```
Type:  TXT
Name:  mail._domainkey.bossfxcademy.com
Value: [Provided by Brevo after domain verification]
```

> The exact values are generated by Brevo when you add `bossfxcademy.com` as a domain. You cannot generate these manually.

#### 3. DMARC Record (KEEP — upgrade later)

Current `p=none` is appropriate while setting up DKIM. After 2-4 weeks of monitoring reports at `rua@dmarc.brevo.com`, upgrade to:

```
v=DMARC1; p=quarantine; rua=mailto:rua@dmarc.brevo.com; pct=100
```

---

## Environment Variables

### Email-Related Variables

| Variable | Purpose | Location | Status |
|---|---|---|---|
| `BREVO_API_KEY` | Brevo API v3 for transactional emails, CRM, drips | `.env.local`, Vercel | ✅ Configured |
| `SENDER_EMAIL` | From address for all outbound emails | `.env.local`, Vercel | ✅ Configured |
| `ADMIN_EMAIL` | Receives admin notifications (sale alerts, booking alerts) | `.env.local`, Vercel | ✅ Configured |
| `ADMIN_EMAILS` | Comma-separated whitelist for dashboard access | `.env.local`, Vercel | ✅ Configured |

### Supabase SMTP Variables (Supabase Dashboard only)

These are configured in the Supabase Dashboard, NOT in `.env.local` or Vercel:

| Setting | Value |
|---|---|
| SMTP Host | `smtp-relay.brevo.com` |
| SMTP Port | `587` |
| SMTP Username | Brevo account login email |
| SMTP Password | Brevo SMTP key |
| Sender Email | `hello@bossfxcademy.com` |
| Sender Name | `BossFx Academy` |

---

## Security

### Secrets Management

| Secret | Storage | Exposure Risk |
|---|---|---|
| `BREVO_API_KEY` | Vercel env vars + `.env.local` | Server-side only, never sent to client |
| `SENDER_EMAIL` | Vercel env vars + `.env.local` | Low risk (public in email headers) |
| Brevo SMTP key | Supabase Dashboard only | Never in code or env files |
| Supabase service role key | Vercel env vars + `.env.local` | Server-side only |

### Email Security Checklist

- [x] API keys stored in environment variables, never in code
- [x] SMTP credentials stored in Supabase Dashboard, not in codebase
- [x] SPF record exists (needs Brevo include)
- [x] DMARC record exists (monitoring mode)
- [ ] DKIM records need to be added
- [ ] SPF needs `include:sendinblue.com`
- [x] Reply-to configured on all outbound emails
- [x] Webhook signature verification on payment flow
- [x] Rate limiting on lead capture endpoint
- [x] Email whitelist on admin endpoints

### Production Optimization

- [x] Sender identity verified in Brevo
- [x] Reply-to set to `hello@bossfxcademy.com`
- [x] Tags on all transactional emails for tracking
- [x] Rate limiting on API endpoints (30 req/min)
- [ ] Bounce handling (requires Brevo webhook — future)
- [ ] Delivery monitoring dashboard (requires Brevo paid plan — future)
- [x] Brevo free tier: 300 emails/day (sufficient for current volume)

---

## Supabase Auth Email Templates

All 6 authentication email templates are branded with BossFx colors, responsive HTML, and consistent with the transactional email design system. Templates are configured in:

**Supabase Dashboard → Auth → Email Templates**

Each template uses GoTemplate syntax with `{{ .ConfirmationURL }}` for action links.

Template files for reference: `docs/supabase-auth-templates/`

---

## Architecture Decisions

### Why Brevo as single provider?

1. **Already integrated** — Brevo API v3 powers all transactional and drip emails
2. **CRM built-in** — Contact management, lists, attributes, and segmentation
3. **SMTP relay available** — Can serve Supabase Auth emails via same infrastructure
4. **DNS already partially configured** — DMARC reports already go to Brevo
5. **Free tier sufficient** — 300 emails/day covers current volume
6. **Single vendor** — Reduces complexity, one dashboard for all email analytics

### Why keep Formspree for contact form?

1. Contact form is a **support channel**, not a marketing flow
2. Formspree provides a **clean inbox** for reading inquiries
3. No CRM workflow needed for support messages
4. Migrating would require a new API endpoint (Vercel at 11/12 limit)

### Why not use Brevo API for Supabase Auth?

Supabase Auth generates its own emails internally — the only way to route them through Brevo is via SMTP relay. The Brevo API v3 cannot be used because Supabase Auth doesn't support custom API integrations for auth emails; it only supports SMTP.

---

## Maintenance Procedures

### Adding a New Email Template

1. Add template function to `lib/templates.js`
2. Add send function to `lib/email.js` or use existing `sendTransacEmail` pattern
3. Add tags for tracking
4. Test with Brevo test mode or staging contact
5. Update this document

### Adding a New Drip Sequence

1. Add sequence definition to `lib/drip.js` `SEQUENCES` object
2. Add templates to `lib/templates.js`
3. Add trigger in `api/lead-capture.js`
4. Test cron processing via manual trigger
5. Update AUTOMATION_MAP.md

### Rotating Brevo API Key

1. Generate new key in Brevo Dashboard → SMTP & API → API Keys
2. Update in Vercel: `vercel env rm BREVO_API_KEY && vercel env add BREVO_API_KEY`
3. Update `.env.local` for local development
4. Redeploy: `git push origin main`
5. Test: send a test email via admin dashboard resend

### Rotating Brevo SMTP Key (Supabase Auth)

1. Generate new SMTP key in Brevo Dashboard → SMTP & API → SMTP
2. Update in Supabase Dashboard → Auth → SMTP Settings → Password
3. Test: trigger a password reset email
4. No code changes needed

### DNS Record Changes

1. SPF/DKIM/DMARC changes are made at the domain registrar
2. Allow 24-48 hours for DNS propagation
3. Verify with: `dig TXT bossfxcademy.com +short`
4. Monitor DMARC reports at Brevo for 2-4 weeks after changes

---

## Scaling Considerations (100,000+ users)

### Current Limits
- Brevo free tier: 300 emails/day
- Supabase free tier: limited auth emails

### Scaling Path
1. **Brevo Starter plan** (€19/mo): 20,000 emails/month, no daily limit
2. **Brevo Business plan** (€49/mo): marketing automation, A/B testing, send-time optimization
3. **Supabase Pro plan** ($25/mo): higher auth email limits, custom SMTP guaranteed
4. **Dedicated IP** (Brevo add-on): own sending reputation at 100K+ volume
5. **Subdomain isolation**: `mail.bossfxcademy.com` for transactional, main domain for marketing
6. **Webhook for bounces**: Brevo webhook → API endpoint for bounce/complaint handling

### Architecture at Scale
```
                    ┌──────────────────┐
                    │   Load Balancer   │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Transactional │ │  Marketing   │ │    Auth      │
    │  (API v3)     │ │  (API v3)    │ │  (SMTP)      │
    │               │ │              │ │              │
    │ Fulfillment   │ │ Newsletters  │ │ Supabase     │
    │ Notifications │ │ Drip series  │ │ Sign up      │
    │ Booking conf  │ │ Re-engage    │ │ Reset        │
    │ Admin alerts  │ │ Promotions   │ │ Verify       │
    └───────────────┘ └──────────────┘ └──────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             ▼
                    ┌──────────────────┐
                    │  Brevo Platform  │
                    │  - Sending       │
                    │  - CRM           │
                    │  - Analytics     │
                    │  - Bounce mgmt   │
                    │  - Deliverability│
                    └──────────────────┘
```
