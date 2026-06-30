# BossFx Academy

Professional forex trading education and automation tools built for African traders.

**Live:** https://www.bossfxcademy.com
**EA Product:** https://www.mql5.com/en/market/product/174970

---

## Overview

BossFx Academy is a full-stack fintech education platform offering forex courses, mentorship programs, and the SMA Pro Trend EA. The platform handles the complete lifecycle from lead capture and nurturing through payment processing, digital product delivery, and post-purchase community access.

### Products

| Product | Price (NGN) | Type |
|---|---|---|
| Forex 101: The Trader's Bible | ₦25,000 | Digital course |
| Group Mentorship (Monthly) | ₦60,000 | Live sessions |
| 1-on-1 Mentorship (Monthly) | ₦150,000 | Private sessions |
| VIP Program (Lifetime) | ₦350,000 | Everything included |
| SMA Pro Trend EA (Bundle) | ₦15,000 | EA tool (also available as checkout add-on) |

---

## Architecture

```
Static Frontend (HTML/CSS/JS) → Vercel CDN
                                    ↓
                        Vercel Serverless Functions (Node.js)
                        ├── Flutterwave (payments + webhooks)
                        ├── Brevo (email + CRM + drip automation)
                        ├── Supabase (PostgreSQL + Storage + Auth)
                        └── Analytics (GTM + GA4 + Meta Pixel + Clarity)
```

- **Frontend:** 38 HTML pages, 7 CSS files, 7 JS modules — no framework, no build step
- **Backend:** 11 serverless functions, 12 shared lib modules
- **Database:** 5 PostgreSQL tables with Row Level Security
- **Analytics:** 11-module custom analytics engine with UTM attribution

---

## Features

- **Payment processing** — Flutterwave inline checkout with webhook-based fulfillment
- **Token-gated downloads** — HMAC-SHA256 signed tokens with time expiry
- **Drip automation** — 6 email sequences with lead scoring and tag-based segmentation
- **Admin dashboard** — Order management, email resend, token generation, EA analytics
- **Lead capture** — Multi-source form handling with Brevo CRM and UTM attribution
- **Mentorship booking** — Calendar integration with ICS invite generation
- **EA addon upsell** — ₦15,000 add-on available during any product checkout
- **AI chatbot** — BossFx Mirror AI for trading questions and product recommendations
- **Conversion optimization** — Exit intent popups, scroll-triggered CTAs, engagement scoring
- **Blog** — 11 posts with JSON-LD structured data
- **Resource tools** — 8 interactive trading tools and templates

---

## Setup

### Prerequisites
- Node.js 18+
- npm
- Vercel CLI (`npm i -g vercel`)

### Install
```bash
git clone <repository-url>
cd bossfx-academy
npm install
```

### Environment Variables

Create `.env.local` with the required variables. See [docs/environment.md](docs/environment.md) for the complete reference.

**Required:**
```bash
FLUTTERWAVE_SECRET_KEY=     # Flutterwave API secret key
BREVO_API_KEY=              # Brevo (Sendinblue) API v3 key
SUPABASE_URL=               # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=  # Supabase service role key
```

---

## Development

### Local Server (Static Files)
```bash
npx live-server
# Serves on http://localhost:8080
```

### Local Server (With Serverless Functions)
```bash
vercel dev
# Serves on http://localhost:3000
```

### Key Files
| File | Purpose |
|---|---|
| `config.js` | All client-side configuration |
| `lib/products.js` | Product catalog (single source of truth) |
| `lib/fulfillment.js` | Payment → delivery orchestrator |
| `lib/drip.js` | Email automation engine |
| `vercel.json` | Infrastructure config |
| `supabase/schema.sql` | Database schema |

---

## Deployment

Automatic deployment on push to `main`:
```bash
git push origin main
```

See [docs/deployment.md](docs/deployment.md) for full deployment guide, rollback procedures, and Vercel configuration details.

### Constraints
- **Vercel Hobby plan:** 12 function max (currently 11/12), 30s timeout
- **Brevo free tier:** 300 emails/day
- **Supabase free tier:** 500MB database, project pauses after 7 days inactivity

---

## Documentation

| Document | Purpose |
|---|---|
| [CLAUDE.md](CLAUDE.md) | AI assistant project memory — read this first |
| [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Phased execution plan with priorities |
| [AUTOMATION_MAP.md](AUTOMATION_MAP.md) | All automated workflows and integrations |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [docs/architecture.md](docs/architecture.md) | System architecture and design decisions |
| [docs/api-reference.md](docs/api-reference.md) | API endpoint documentation |
| [docs/deployment.md](docs/deployment.md) | Deployment and rollback procedures |
| [docs/analytics.md](docs/analytics.md) | Analytics implementation guide |
| [docs/environment.md](docs/environment.md) | Environment variable reference |
| [docs/integrations/](docs/integrations/) | Per-service integration guides |
| [sop/](sop/) | Standard operating procedures |

---

## Roadmap

See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for the full phased execution plan.

**Current priorities:**
- Phase 0: EA addon deployment, security hardening, documentation
- Phase 1: Error monitoring, sitemap fixes, newsletter integration
- Phase 2: Webhook alerting, integration tests, staging environment
- Phase 3: Upsell automation, abandoned checkout recovery, lead scoring
- Phase 4: Referral program, WhatsApp integration, mobile app

---

## License

Proprietary — BossFx Academy. All rights reserved.
