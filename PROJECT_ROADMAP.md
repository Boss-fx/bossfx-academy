# PROJECT_ROADMAP.md — BossFx Academy Execution Plan

> **Last Updated:** 2026-06-30
> **Owner:** Timilehin "BossFx" Shobande
> **Status:** Phase 0 in progress

---

## Phase 0 — Immediate (This Week)

Critical fixes and foundation items that should ship before any feature work.

| # | Item | Priority | Difficulty | Business Impact | Status | Dependencies | Owner |
|---|---|---|---|---|---|---|---|
| 0.1 | Commit and deploy EA addon (10 files, 296 lines) | Critical | Low | Revenue: enables ₦15K upsell on every checkout | Not Started | None | Engineering |
| 0.2 | Add package-lock.json to git | High | Low | Reliability: prevents dependency drift across environments | Not Started | None | Engineering |
| 0.3 | Fix admin API CORS (change `*` to production domain) | Critical | Low | Security: prevents cross-origin abuse of admin endpoints | Not Started | None | Engineering |
| 0.4 | Add Content Security Policy header to vercel.json | High | Low | Security: blocks XSS script injection | Not Started | None | Engineering |
| 0.5 | Create CLAUDE.md and documentation system | High | Medium | Maintainability: enables self-documenting repository | In Progress | None | Engineering |

---

## Phase 1 — Foundation (Week 1–2)

Reliability and visibility improvements that reduce operational risk.

| # | Item | Priority | Difficulty | Business Impact | Status | Dependencies | Owner |
|---|---|---|---|---|---|---|---|
| 1.1 | Add error monitoring (Sentry free tier or Telegram webhook) | Critical | Medium | Reliability: gain visibility into production failures | Not Started | Telegram Bot API or Sentry account | Engineering |
| 1.2 | Fix sitemap.xml (add all 30+ pages, add blog posts, resources) | High | Low | SEO: 20+ pages invisible to Google crawlers | Not Started | None | Engineering |
| 1.3 | Remove legacy /api/download-forex101.js endpoint | Medium | Low | Architecture: frees 1 of 12 function slots, removes code duplication | Not Started | Verify no active links to legacy endpoint | Engineering |
| 1.4 | Wire frontend email subscriptions to Brevo (fix config.js emailProvider) | High | Medium | Revenue: newsletter subscribers currently don't reach CRM | Not Started | Brevo list IDs configured | Engineering |
| 1.5 | Add OG tags to blog/index.html | Medium | Low | SEO: blog listing page missing social sharing metadata | Not Started | None | Engineering |
| 1.6 | Write environment variable documentation | Medium | Low | Maintainability: new developers can't set up the project | Completed | None | Engineering |
| 1.7 | Add Permissions-Policy header to vercel.json | Medium | Low | Security: controls browser feature access | Not Started | None | Engineering |

---

## Phase 2 — Reliability (Week 3–4)

Hardening the system against silent failures and enabling safe development workflow.

| # | Item | Priority | Difficulty | Business Impact | Status | Dependencies | Owner |
|---|---|---|---|---|---|---|---|
| 2.1 | Add webhook failure alerting (Telegram bot notification on errors) | Critical | Medium | Revenue: failed webhooks = lost orders with no visibility | Not Started | Telegram Bot token | Engineering |
| 2.2 | Implement idempotent webhook retry logic | High | Medium | Revenue: recover from transient Supabase/Brevo outages | Not Started | 2.1 for alerting | Engineering |
| 2.3 | Add integration tests (webhook flow, download ACL, admin auth) | High | Medium | Reliability: catch regressions before production | Not Started | Test framework (vitest or jest) | Engineering |
| 2.4 | Set up Vercel preview deployments for branches | Medium | Low | Reliability: test changes before production | Not Started | None | Engineering |
| 2.5 | Upgrade rate limiter to persistent storage (Supabase or Vercel KV) | Medium | Medium | Security: current in-memory limiter resets on cold start | Not Started | Storage backend decision | Engineering |
| 2.6 | Restrict admin dashboard Supabase anon key exposure | Low | Low | Security: reduce attack surface on admin page | Not Started | None | Engineering |

---

## Phase 3 — Growth (Month 2)

Revenue growth through automation and funnel optimization.

| # | Item | Priority | Difficulty | Business Impact | Status | Dependencies | Owner |
|---|---|---|---|---|---|---|---|
| 3.1 | Post-purchase upsell drip sequences (course → mentorship → VIP) | High | Medium | Revenue: 15-25% upsell potential on existing customers | Not Started | Brevo templates | Engineering + Marketing |
| 3.2 | Abandoned checkout recovery (capture email pre-payment, recovery email) | High | Medium | Revenue: 5-15% recovery rate on abandoned carts | Not Started | Lead capture before redirect | Engineering |
| 3.3 | Automated sitemap and blog RSS generation | Medium | Low | SEO: ensure all new content is discoverable | Not Started | None | Engineering |
| 3.4 | Lead score → Brevo CRM sync (engagement scoring feeds segmentation) | Medium | Medium | Conversion: better targeted emails based on behavior | Not Started | bfx-analytics.js score data | Engineering |
| 3.5 | Review/testimonial collection automation (7-day post-purchase email) | Medium | Low | Conversion: social proof for product pages | Not Started | Brevo template | Engineering + Marketing |
| 3.6 | Blog content expansion (keyword-targeted posts) | Medium | Low | SEO: 3x organic traffic potential in 6 months | Not Started | Content calendar | Marketing |

---

## Phase 4 — Scale (Month 3+)

Platform expansion and advanced automation.

| # | Item | Priority | Difficulty | Business Impact | Status | Dependencies | Owner |
|---|---|---|---|---|---|---|---|
| 4.1 | Referral program (discount codes with JSONB tracking) | High | High | Revenue: viral growth through customer referrals | Not Started | Coupon/discount system | Engineering |
| 4.2 | Webinar funnel automation (registration → reminder → replay → offer) | High | High | Revenue: highest-converting funnel in digital education | Not Started | Webinar platform integration | Engineering + Marketing |
| 4.3 | WhatsApp Business API integration | Medium | High | Engagement: 90% open rate vs 20% email in Nigeria | Not Started | WhatsApp Business account | Engineering |
| 4.4 | Supabase backup automation (daily pg_dump to cloud storage) | Medium | Medium | Reliability: protect against data loss | Not Started | Cloud storage bucket | Engineering |
| 4.5 | Performance optimization (JS splitting, lazy loading, image optimization) | Medium | Medium | Conversion: faster pages convert better | Not Started | Performance audit | Engineering |
| 4.6 | Mobile app (React Native or PWA) | Low | Very High | Reach: mobile-first audience prefers apps | Not Started | API refactoring | Engineering |
| 4.7 | Recurring billing for mentorship (automated monthly renewal) | High | High | Revenue: reduce churn from manual renewal friction | Not Started | Flutterwave subscription API | Engineering |
| 4.8 | Multi-currency support (USD, GHS, KES) | Medium | Medium | Revenue: expand beyond Nigeria | Not Started | Flutterwave multi-currency config | Engineering |

---

## Completed Items

| # | Item | Completed | Notes |
|---|---|---|---|
| — | Flutterwave payment integration | 2026-05 | Full checkout flow with webhook verification |
| — | Supabase database setup (5 tables, RLS) | 2026-05 | orders, access_tokens, downloads, product_files, mentorship_bookings |
| — | Brevo transactional email system | 2026-05 | 4 product-specific email templates |
| — | Drip automation engine (6 sequences) | 2026-05 | welcome, webinar, resource, mentorship, exit_intent, reengagement |
| — | Admin dashboard with stats and actions | 2026-05 | Stats, search, resend, token generation |
| — | 11-module analytics engine | 2026-05 | UTM attribution, engagement scoring, conversion tracking |
| — | Blog with JSON-LD structured data | 2026-05 | 11 posts with full SEO |
| — | Token-gated download system | 2026-05 | HMAC-SHA256 with expiry and type enforcement |
| — | EA addon upsell system | 2026-06 | Checkout UI, fulfillment, admin analytics (pending deploy) |
| — | BossFx Operating System documentation | 2026-06 | CLAUDE.md, roadmap, automation map, full docs |
| — | Business Operating System (Phase 3) | 2026-06 | 40 files, 4,609 lines — complete business documentation |
| — | Founder Command Center dashboard | 2026-06 | Authenticated internal dashboard with 9 modules, real-time data from Supabase/Brevo |

---

## How to Update This File

When completing a roadmap item:
1. Move the row from its phase table to the "Completed Items" section
2. Add the completion date and any relevant notes
3. Update the phase status if all items in a phase are complete
4. Commit with message: `docs: update roadmap — complete [item description]`
