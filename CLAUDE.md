# CLAUDE.md — BossFx Academy Project Memory

> **Last Updated:** 2026-06-30
> **Version:** 2.0.0
> **Owner:** Timilehin "BossFx" Shobande

This file is the permanent project memory for every Claude Code session working on this repository. Read it first. Follow it always.

---

## Business Context

### Mission

BossFx Academy is a fintech education platform built for African traders. The mission is to make professional forex trading education and automation tools accessible across Africa, starting with Nigeria.

### Founder

Timilehin "BossFx" Shobande — forex trader, EA developer, and educator. Also the sole operator of the business (marketing, customer support, content creation, and engineering decisions).

### Products

| Product | ID | Price (NGN) | Type | Delivery |
|---|---|---|---|---|
| Forex 101: The Trader's Bible | `forex-101` | ₦25,000 | Course | Digital download + Telegram |
| Group Mentorship (Monthly) | `mentorship-group` | ₦60,000 | Mentorship | Live sessions + Telegram |
| 1-on-1 Mentorship (Monthly) | `mentorship-1on1` | ₦150,000 | Mentorship | Private sessions + Telegram |
| VIP Program (Lifetime) | `vip` | ₦350,000 | VIP | Everything + EA + Priority |
| SMA Pro Trend EA (Bundle) | `ea-bundle` | ₦15,000 | EA Tool | Digital download |

The EA bundle is also available as an add-on (₦15,000) during checkout for any product. It is tracked via JSONB `meta` column on the orders table.

### Revenue Model

One-time digital product sales + monthly mentorship subscriptions. All payments processed through Flutterwave in Nigerian Naira (NGN). No recurring billing automation yet — mentorship renewals are manual.

### Customer Journey

```
Visitor → Landing Page → Content/Blog/Resources
  ↓
Lead Capture (exit intent, newsletter, webinar, resource download)
  ↓
Drip Email Sequence (Brevo — 4 sequences, up to 5 steps each)
  ↓
Product Page → Flutterwave Checkout
  ↓
Webhook → Fulfillment Orchestrator → Supabase (order record)
  ↓
Email (product access + download token) → Telegram Community Invite
  ↓
Download (HMAC-SHA256 token-gated, time-expiring)
  ↓
Post-purchase: Admin dashboard tracks all orders, downloads, bookings
```

### Sales Funnel

1. **Top of funnel:** Blog posts (11), resource tools (8), social media (Instagram, TikTok, YouTube, X)
2. **Middle of funnel:** Lead magnets, exit intent popups, newsletter, webinar registration
3. **Bottom of funnel:** Course page, mentorship page, checkout with EA addon upsell
4. **Post-purchase:** Fulfillment email, Telegram community, mentorship booking

### Target Audience

- Nigerian and African forex traders (beginner to intermediate)
- Age 18-35, mobile-first (60%+ traffic is mobile)
- Interested in: automated trading, forex education, prop firm preparation, income diversification

### Brand Voice

Professional but relatable. Technical confidence without jargon. African identity is a feature, not a disclaimer. Uses "Trader" as the default greeting. Dark theme with emerald (#10B981) and amber (#f59e0b) accents.

### Future Vision

Self-operating fintech education platform with full automation — from lead capture to fulfillment to upsell to re-engagement. Eventual expansion to: prop firm preparation programs, additional EAs, WhatsApp Business integration, affiliate/referral system, and a mobile app.

---

## Tech Stack

### Frontend
- **Framework:** Static HTML/CSS/JavaScript (no build step, no framework)
- **Pages:** 38 HTML files (11 core, 11 blog, 8 resources, 3 system, admin, VIP, blog template)
- **CSS:** 7 files (main styles.css + component CSS)
- **Client JS:** 7 major modules (tracking.js, bfx-analytics.js, chatbot.js, bfx-convert.js, bfx-market.js, email-config.js, script.js)
- **Config:** config.js — centralized site constants (Flutterwave public key, GA4 ID, Clarity ID, social links, email provider config)

### Backend
- **Runtime:** Node.js on Vercel Serverless Functions
- **API Endpoints:** 11 functions (of 12 max on Hobby plan)
- **Shared Modules:** 12 lib/ files (2,135 lines)
- **Package:** 3 dependencies (@getbrevo/brevo, @supabase/supabase-js, dotenv), 2 devDeps (live-server, pg)

### Database — Supabase
- **PostgreSQL** with 5 tables: `orders`, `access_tokens`, `downloads`, `product_files`, `mentorship_bookings`
- **Storage:** `product-files` bucket for digital deliverables
- **Auth:** Used for admin dashboard login
- **RLS:** Row Level Security on all tables (service_role: full access, authenticated: read, public: read on product_files)
- **URL:** `https://kklwvzpwgpcwxjmgikfq.supabase.co`

### Payments — Flutterwave
- **Checkout:** Client-side Flutterwave inline checkout (script.js)
- **Webhook:** POST /api/webhooks/flutterwave (signature-verified)
- **Verification:** Server-side payment verification via Flutterwave API v3
- **Currency:** NGN only
- **TX ref format:** `bfx-{product-id}-{timestamp}`

### Email — Brevo (Sendinblue)
- **Transactional:** Fulfillment emails, booking confirmations, admin notifications
- **CRM:** Contact management with attributes (UTM, lead score, automation state)
- **Drip:** 6 sequences (welcome, webinar, resource, mentorship, exit_intent, reengagement)
- **Lists:** 4 Brevo lists (general: 2, webinar: 3, mentorship: 5, resource: 6)
- **Templates:** 19+ HTML email templates built in lib/templates.js

### Forms — Formspree
- **Contact form** on contact.html submits to Formspree (endpoint: `xeenzyna`)
- **Note:** Frontend email subscriptions currently bypass Brevo (config.js `emailProvider: 'none'`)

### Community — Telegram
- **Invite link:** `https://t.me/qD_fBeaziqE5YzU8`
- **Usage:** Post-purchase community access, mentorship communication, course discussions

### Analytics
- **Google Tag Manager:** GTM-T3R88HZB (container on all pages)
- **Google Analytics 4:** G-ZFQ9P5KFSJ (via GTM + config.js)
- **Meta Pixel:** 804009589230621 (loaded via tracking.js)
- **Microsoft Clarity:** wnde2od79f (loaded via config.js)
- **Custom Engine:** bfx-analytics.js — 11-module analytics system (UTM attribution, engagement scoring, conversion tracking, mobile intelligence, enhanced ecommerce)

### Hosting — Vercel
- **Plan:** Hobby (free tier)
- **Limits:** 12 serverless functions max, 30s max function duration
- **Cron:** Daily at 09:00 UTC → `/api/cron-reengagement`
- **Domain:** `www.bossfxcademy.com`

### Source Control — GitHub
- **Repository:** bossfx-academy
- **Commits:** 20 (as of 2026-06-30)
- **Branch:** main (single branch workflow)

---

## Architecture

### File Structure

```
bossfx-academy/
├── api/                        # Vercel serverless functions (11 endpoints)
│   ├── webhooks/flutterwave.js # Payment webhook handler
│   ├── verify-payment.js       # Client-side payment verification
│   ├── download.js             # Token-gated file delivery
│   ├── lead-capture.js         # Lead capture + Brevo CRM + drip trigger
│   ├── booking.js              # Mentorship booking + ICS calendar
│   ├── admin.js                # Consolidated admin router (stats/resend/token)
│   ├── health.js               # Diagnostic health check
│   ├── market-data.js          # Market data for chatbot
│   ├── cron-reengagement.js    # Daily cron: drip processing + re-engagement
│   ├── download-forex101.js    # Legacy download endpoint (technical debt)
│   └── vip-access.js           # VIP portal data
├── lib/                        # Shared backend modules (12 files)
│   ├── fulfillment.js          # Fulfillment orchestrator (core business logic)
│   ├── email.js                # Brevo transactional email service
│   ├── drip.js                 # Drip automation engine (6 sequences)
│   ├── files.js                # HMAC-SHA256 token generation + Supabase Storage
│   ├── products.js             # Product catalog (single source of truth)
│   ├── orders.js               # Order CRUD operations
│   ├── templates.js            # 19+ email HTML templates
│   ├── calendar.js             # ICS calendar generation
│   ├── admin-auth.js           # Admin JWT verification + email whitelist
│   ├── rate-limit.js           # In-memory sliding window rate limiter
│   ├── supabase.js             # Database client singleton
│   └── validate-env.js         # Startup env var validation
├── admin/                      # Admin dashboard (protected)
│   ├── index.html
│   ├── admin.js
│   └── admin.css
├── blog/                       # Blog posts (11 posts + index + template)
├── resources/                  # Interactive tools and templates
│   ├── beginner/               # Forex starter pack, pre-trade checklist
│   ├── challenges/             # Trading discipline tracker
│   ├── journals/               # Trade journal sheet
│   ├── prop-firm/              # Prop firm survival guide
│   ├── risk-management/        # Risk calculator, risk management blueprint
│   └── templates/              # Trading plan template
├── vip/                        # VIP portal
├── docs/                       # Engineering documentation
├── sop/                        # Standard operating procedures
├── scripts/                    # Admin CLI utilities
├── supabase/                   # Database schema
│   └── schema.sql
├── downloads/                  # Legacy PDF storage (blocked by robots.txt)
├── assets/                     # Images, icons, logos
├── config.js                   # Client-side configuration
├── script.js                   # Main checkout + site JS
├── tracking.js                 # Analytics layer (GTM, Pixel, GA4)
├── bfx-analytics.js            # 11-module advanced analytics engine
├── chatbot.js                  # BossFx Mirror AI chatbot
├── bfx-convert.js              # Conversion optimization module
├── bfx-market.js               # Market data display
├── email-config.js             # Provider-agnostic email subscription
├── page-nav.js                 # Page navigation component
├── blog.js                     # Blog listing logic
├── styles.css                  # Main stylesheet
├── vercel.json                 # Vercel configuration (headers, cron, routes)
├── package.json                # Dependencies (v2.0.0)
└── .env.local                  # Environment variables (never commit)
```

### Payment Flow (Revenue-Critical Path)

```
1. Customer selects product on checkout page
2. Optional: EA addon checkbox adds ₦15,000
3. script.js → FlutterwaveCheckout() with product meta
4. Customer pays via Flutterwave modal (card, bank, USSD)
5. Flutterwave sends webhook → POST /api/webhooks/flutterwave
6. Webhook verifies: signature → API verification → amount validation
7. fulfillOrder() orchestrates:
   a. Duplicate check (DB-backed by flw_transaction_id)
   b. Product detection (tx_ref pattern → meta → amount fallback)
   c. Order persisted to Supabase (orders table, JSONB meta)
   d. Download token generated (HMAC-SHA256, 72h/720h expiry)
   e. If EA addon: separate EA token generated
   f. Parallel: fulfillment email + Brevo contact + admin notification
   g. Order marked as fulfilled in database
8. Customer redirected to payment-success.html with tx_ref
9. payment-success.html calls /api/verify-payment for download links
10. Customer downloads files via /api/download?token=...
```

### Download Security

- **Token format:** `{base64url-payload}.{HMAC-SHA256-signature}`
- **Payload:** email, product, type, orderId, expiry timestamp
- **Secret:** `DOWNLOAD_SECRET` env var (falls back to `FLUTTERWAVE_SECRET_KEY`)
- **Expiry:** 72 hours for course/EA/mentorship, 720 hours (30 days) for VIP
- **Type enforcement:** EA files require token type `ea` or `vip`
- **Audit trail:** Every download recorded in `downloads` table (email, IP, user agent, timestamp)

### EA Addon System

The EA addon (₦15,000) is available during checkout for any product. Implementation:
- Checkout UI: checkbox in script.js appends `&ea=1` to success URL
- Meta tracking: `meta.ea_bundle = 'yes'` passed to Flutterwave
- DB storage: JSONB `meta` column on orders table (`has_ea_addon: true`, `ea_addon_price: 15000`)
- Fulfillment: separate EA download token generated alongside primary product token
- Download security: EA files blocked unless token type is `ea` or `vip`
- Success page: conditional EA section shown when `ea=1` in URL params
- Admin dashboard: EA addon stats (count, revenue, conversion rate)
- Email: EA bonus card appended to fulfillment emails when addon purchased

---

## Project Rules

### Never Do
- Never remove analytics tracking (GTM, GA4, Pixel, Clarity, bfx-analytics)
- Never remove SEO elements (meta tags, JSON-LD, canonical, OG tags, sitemap entries)
- Never break the payment flow (webhook → fulfillment → email → download)
- Never expose secrets (API keys, webhook secrets, service role keys)
- Never exceed 12 serverless functions (Vercel Hobby plan limit)
- Never hardcode API keys, tokens, or secrets — always use environment variables
- Never remove existing integrations without explicit approval
- Never push directly to production without testing

### Always Do
- Always update documentation when changing features
- Always update PROJECT_ROADMAP.md when completing phases
- Always update AUTOMATION_MAP.md when adding/modifying automations
- Always preserve backwards compatibility for existing customers
- Always test payment flow end-to-end before deploying payment changes
- Always commit frequently with descriptive messages
- Always validate environment variables at startup

---

## Development Rules

### Local Development
```bash
npm install              # Install dependencies
npx live-server          # Serve static files on localhost:8080
vercel dev               # Run serverless functions locally (port 3000)
```

### Environment Variables
See [docs/environment.md](docs/environment.md) for complete reference. Required:
- `FLUTTERWAVE_SECRET_KEY` — Payment verification
- `BREVO_API_KEY` — Email sending
- `SUPABASE_URL` — Database connection
- `SUPABASE_SERVICE_ROLE_KEY` — Database operations

### Deployment
```bash
git add <files>
git commit -m "descriptive message"
git push origin main     # Auto-deploys to Vercel
```
See [docs/deployment.md](docs/deployment.md) for full deployment guide.

### Key Constraints
- **Vercel Hobby plan:** 12 function max. Currently at 11/12. The admin endpoint is a consolidated router (3-in-1) to save slots.
- **No direct SQL access:** Cannot ALTER TABLE on Supabase free tier dashboard easily. Use JSONB `meta` column for extending order data.
- **In-memory rate limiter:** Resets on cold start. Known limitation.
- **Static frontend:** No build step, no bundler. JS files loaded directly via `<script>` tags.

---

## Business Priorities (Ordered)

1. **Revenue** — Protect and grow payment flows. Never break checkout.
2. **Reliability** — System must work 24/7. Payments and downloads cannot fail silently.
3. **Automation** — Reduce manual work. Every repeatable task should be automated.
4. **SEO** — Organic traffic is free revenue. Protect rankings and metadata.
5. **Conversion** — Optimize the funnel. Every visitor should encounter a CTA.
6. **Performance** — Fast pages convert better. Minimize load times.
7. **Maintainability** — Clean code, good docs, easy to understand for future sessions.

---

## AI Session Instructions

Every Claude Code session working on this repository should:

1. Read this CLAUDE.md file first to understand the full context
2. Read PROJECT_ROADMAP.md to understand current priorities and progress
3. Read AUTOMATION_MAP.md to understand existing automated workflows
4. Check git status and recent commits before making changes
5. Never duplicate existing functionality — search first
6. Always document work (update relevant docs, roadmap, changelog)
7. Suggest improvements based on audit findings and business priorities
8. Preserve all analytics, SEO, and integration code
9. Test changes locally before recommending deployment
10. Follow the commit message conventions in the git history

### Key Files to Read for Context
- `lib/products.js` — Product catalog and pricing
- `lib/fulfillment.js` — Core business logic (payment → delivery)
- `lib/drip.js` — Email automation sequences
- `config.js` — All client-side configuration
- `vercel.json` — Infrastructure configuration
- `supabase/schema.sql` — Database schema

---

## Documentation Index

| Document | Purpose |
|---|---|
| [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Phased execution plan with priorities and status |
| [AUTOMATION_MAP.md](AUTOMATION_MAP.md) | All automated workflows, triggers, and actions |
| [CHANGELOG.md](CHANGELOG.md) | Semantic versioning changelog |
| [docs/architecture.md](docs/architecture.md) | System architecture and design decisions |
| [docs/api-reference.md](docs/api-reference.md) | All API endpoint documentation |
| [docs/deployment.md](docs/deployment.md) | Deployment workflow and rollback procedures |
| [docs/analytics.md](docs/analytics.md) | Analytics implementation guide |
| [docs/environment.md](docs/environment.md) | Environment variable reference |
| [docs/integrations/](docs/integrations/) | Per-service integration guides |
| [sop/](sop/) | Standard operating procedures |
