# CHANGELOG.md — BossFx Academy

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] — Unreleased (Pending Deploy)

### Added
- EA addon upsell system across all checkout flows (₦15,000 add-on)
- EA addon checkbox in checkout UI (script.js)
- Conditional EA section on payment success page
- Separate EA download token generation in fulfillment orchestrator
- EA addon email section appended to non-EA fulfillment emails
- EA addon stats in admin dashboard (count, revenue, conversion rate)
- "+EA" badge on orders with EA addon in admin order list
- EA access control enforcement in download endpoint (requires `ea` or `vip` token type)
- BossFx Operating System documentation (CLAUDE.md, PROJECT_ROADMAP.md, AUTOMATION_MAP.md, full docs/ and sop/ structure)

### Changed
- `lib/orders.js` — enriches JSONB meta with `has_ea_addon` and `ea_addon_price`
- `lib/fulfillment.js` — detects EA addon, generates separate EA token, passes EA options to email
- `lib/email.js` — `sendFulfillmentEmail` accepts `eaOptions` parameter, new `eaAddonSection()` function
- `api/verify-payment.js` — returns `hasEaAddon`, `eaDownloadToken`, and `eaFiles[]`
- `api/download.js` — blocks EA file access for non-EA/non-VIP tokens
- `api/admin.js` — includes `meta` in stats query, computes EA addon analytics

### Files Modified
- `script.js`, `payment-success.html`, `admin/index.html`, `admin/admin.js`
- `api/admin.js`, `api/download.js`, `api/verify-payment.js`
- `lib/email.js`, `lib/fulfillment.js`, `lib/orders.js`

---

## [2.0.0] — 2026-05-30

### Added
- Complete purchase fulfillment system
  - Flutterwave webhook handler with signature verification
  - Server-side payment verification via Flutterwave API v3
  - Fulfillment orchestrator (webhook → product detection → DB → email → delivery)
  - HMAC-SHA256 token-gated download system with expiry
  - Brevo transactional email service with 4 product templates
  - Mentorship booking system with ICS calendar invites
  - Admin dashboard (stats, order search, email resend, token generation)
  - VIP portal with protected access
  - Health check endpoint for diagnostics
- Supabase database integration
  - 5 tables: orders, access_tokens, downloads, product_files, mentorship_bookings
  - Row Level Security (RLS) on all tables
  - Supabase Storage for digital product files
- Drip automation engine
  - 6 email sequences: welcome, webinar, resource, mentorship, exit_intent, reengagement
  - Lead scoring system (10-40 points based on action)
  - Tag assignment based on source and attributes
  - Daily cron job for drip step processing and re-engagement
- Lead capture system
  - Brevo CRM contact creation with attribution data
  - UTM passthrough (first-touch + last-touch)
  - Source-based list routing (4 Brevo lists)
- 11-module advanced analytics engine (bfx-analytics.js)
- Conversion optimization module (bfx-convert.js)
- BossFx Mirror AI chatbot
- Market data endpoint for chatbot
- Admin endpoint consolidation (3-in-1 router to fit Vercel Hobby plan)

### Changed
- Upgraded from static site to full-stack application
- Payment flow migrated from simple redirect to webhook-based fulfillment

---

## [1.0.0] — 2026-05-15

### Added
- Initial BossFx Academy website
- Landing page with product showcase
- Course, mentorship, and pricing pages
- Blog section (11 posts with JSON-LD structured data)
- Resource tools (8 interactive pages)
- Contact page with Formspree integration
- Legal pages (terms, privacy, disclaimer, refund policy)
- Community page with social links
- Live trading page
- About page
- GTM, GA4, Meta Pixel, Clarity analytics
- Tracking.js analytics layer
- Basic Flutterwave checkout integration
- SEO foundations (meta tags, canonical, OG tags, sitemap, robots.txt)
- Responsive mobile design

---

## Release Structure

### Version Format
- **MAJOR.MINOR.PATCH**
- Major: Breaking changes, architecture overhauls
- Minor: New features, new integrations
- Patch: Bug fixes, documentation updates, minor improvements

### Release Process
1. Complete all changes for the release
2. Update this CHANGELOG with all changes
3. Update version in `package.json`
4. Commit: `release: v{version} — {summary}`
5. Push to main (auto-deploys via Vercel)
6. Verify production deployment
7. Tag: `git tag v{version}`
