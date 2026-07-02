# CHANGELOG.md — BossFx Academy

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.2.0] — Unreleased (Pending Deploy)

### Added
- **BossFx OS Core Infrastructure (Phase 3D)** — full operating system architecture
  - `core.js` — OS namespace IIFE with 13 subsystems:
    - Event Bus: pub/sub with wildcard `*` support, `OS.events.on/off/emit`
    - State Store: centralized state with watchers, `OS.store.get/set/watch`
    - API Layer: standardized fetch wrappers, `OS.api.dashboard/system/resend/supabase`
    - Data Adapters: normalize Supabase/Brevo/Flutterwave data
    - Global Search: multi-module indexing with `OS.search.register/query`
    - Command Registry: centralized commands with upsert, `OS.commands.register/search/execute`
    - Notification Service: read/unread/priority/source, `OS.notifications.add/markRead/clear`
    - Activity Feed: unified timeline (max 200), `OS.activity.log/recent/byType`
    - Workspace Registry: module registration with per-workspace commands
    - Permission Architecture: 9 roles (founder→instructor), module ACL
    - Theme System: dark/light via CSS custom properties + `[data-theme]` attribute
    - Navigation: history tracking, recents, favorites, localStorage persistence
    - Keyboard Shortcuts: global keydown handler with mod+shift+alt parsing
  - 8 new shared UI components in `components.js`: modal, drawer, timeline, breadcrumbs, filterBar, quickAction, searchResult, kbdHint
  - Light theme CSS with full coverage of all UI elements
  - Modal system (backdrop blur, 560px container, close-on-outside-click)
  - Drawer system (480px right slide, responsive to full-width at 768px)
  - Activity panel (380px right panel with timeline view)
  - Theme toggle button in topbar
  - Activity feed button in topbar
  - Breadcrumb navigation below page title
  - 12 action commands (refresh, logout, theme, activity, shortcuts, external dashboards)
  - 4 keyboard shortcuts (⌘K command palette, ⌘⇧A activity, ⌘⇧N notifications, ⌘⇧T theme)
  - Search indexing for orders, products, AI roles, sections
  - Workspace registration for all 10 modules
  - Activity logging at login, data load, refresh, resend, navigation, goals, theme

- **Phase 4 — ERP Module-by-Module Expansion** — all 10 dashboards enhanced to production-grade panels
  - **Analytics Dashboard** — 6 analytics platforms table, SEO health (12 checks), conversion funnel (5 stages), UTM attribution, content performance, real-time metrics, AI insights
  - **Finance Dashboard** — business health score, MRR/ARR projections, revenue by category, product unit economics, expense tracking, tax compliance (NGN), budget vs actual, cash flow, AI insights
  - **Operations Dashboard** — API endpoint monitor (11 endpoints), infrastructure (Vercel/Supabase/CDN), deployment pipeline (5 stages), website health (12 pages), automation queue, incident log, SOP library, support/tickets, AI insights
  - **AI Control Center** — agent health dashboard (13 agents), capabilities matrix, prompt management (10 prompts), memory status (6 sources), execution logs, AI integration architecture (5 stages), AI insights
  - **Automation Center** — payment flow (8 stages), lead capture flow (7 stages), drip sequences (6 sequences, 19 steps), email templates (9 groups, 19+ templates), Brevo CRM integration, conversion analytics, automation architecture, AI insights
  - **Settings Dashboard** — API & integrations (9 services), infrastructure (Vercel/Supabase/Frontend), environment variables (10 vars), security configuration (14 controls, 4 sections), display preferences, feature flags (10), external dashboards (10 links), user management, documentation index, keyboard shortcuts, about section
  - Each module includes: quick actions bar, 8-metric summary grid, multiple data cards, and AI-driven insights/recommendations
- **Unified Email Architecture** — Brevo as single source of truth for all email
  - `docs/EMAIL_ARCHITECTURE.md` — comprehensive email infrastructure documentation covering all 9 email flows, DNS configuration, security, scaling to 100K+ users
  - 6 branded Supabase Auth email templates (`docs/supabase-auth-templates/`) — confirm email, reset password, magic link, invite user, change email, re-authentication
  - Setup guide for Supabase custom SMTP via Brevo relay
  - DNS audit: SPF exists (needs Brevo include), DMARC exists (reports to Brevo), DKIM missing
  - Updated AUTOMATION_MAP.md with Supabase Auth → Brevo SMTP workflow

### Changed
- `app.js` fully refactored to use OS.* infrastructure instead of inline state/commands/notifications
- Navigation powered by `OS.nav.go()` + event-driven DOM updates via `OS.events.on('nav:changed')`
- Command palette powered by `OS.commands.search()` + `OS.search.query()` for unified results
- Notifications powered by `OS.notifications` with badge auto-update via events
- All module renderers read from `OS.store.get('dashData')` instead of closure variables
- API calls use `OS.api.dashboard/system/resend` instead of inline fetch
- Version badge updated to v3.2

## [3.1.0] — Unreleased (Pending Deploy)

### Added
- **BossFx Operating System (Phase 3C)** — complete internal platform at `/founder/`
  - 10 modular dashboards: CEO, Marketing, Sales, Students, Analytics, AI Control, Automation, Finance, Operations, Settings
  - Shared component library (`components.js`) with 20+ reusable UI builders
  - Command palette with keyboard shortcut (Cmd/Ctrl+K) for instant navigation
  - Notification panel with system alerts and activity tracking
  - Search bar integrated with command palette
  - Sectioned sidebar navigation (Command, Growth, Intelligence, Operations, System)
  - CEO Dashboard: executive KPIs, alerts, goals, revenue trend, product breakdown, AI summary
  - Marketing Dashboard: social channels, Brevo email lists, analytics platforms, content calendar placeholder
  - Sales Dashboard: period-filtered revenue reports, Flutterwave gateway status, full order history
  - Student Dashboard: student directory, downloads, bookings, certificates placeholder, support placeholder
  - Analytics Dashboard: unified view of GA4, GTM, Meta Pixel, Clarity with external links, bfx-analytics module status
  - AI Control Center: 13 AI role cards with status, responsibilities, cadence, activity log placeholder
  - Automation Center: 4 active automations, 6 drip sequences, job queue placeholder, workflow builder placeholder
  - Finance Dashboard: revenue streams by category, product breakdown, expense/forecast placeholders
  - Operations Dashboard: system health, env vars, SOP library, goals (monthly/quarterly), project management placeholder
  - Global Settings: API connections, infrastructure status, quick links, feature flags, security overview
  - Loading skeletons, empty states, and toast notifications throughout
  - Full responsive design with collapsible sidebar and mobile overlay

### Changed
- Upgraded from 9-section monolithic dashboard to 10-module modular architecture
- Extracted reusable components from inline rendering into shared `components.js` library
- Sidebar redesigned with section headers and categorized navigation
- Topbar enhanced with search, notifications, and command palette access

## [3.0.0] — Unreleased (Pending Deploy)

### Added
- **Founder Command Center** — authenticated CEO dashboard at `/founder/`
  - 9 modules: Executive Overview, Revenue & Sales, Students, Marketing, Operations, AI Team, Decisions, Reports, Settings
  - Real-time data from Supabase (orders, downloads, bookings) and Brevo (email subscribers, lists)
  - 30-day revenue trend visualization
  - Product breakdown with revenue share percentages
  - System health monitoring (Supabase, Brevo, Flutterwave, Vercel status)
  - AI Team overview (13 roles from business/AI_ROLES.md)
  - Decision Center with localStorage-persisted goals (daily/weekly/monthly/quarterly)
  - Period-filtered reports (today, week, month, quarter, all-time)
  - Settings with API connection status and quick links
  - Full responsive design with collapsible sidebar
  - Order management with fulfillment email resend
- Two new admin API actions via consolidated router:
  - `?action=founder` — comprehensive dashboard data in a single call
  - `?action=system` — service health checks and environment status
- Noindex/nofollow headers for `/founder/` path in vercel.json
- Business Operating System documentation (40 files, 4,609 lines in /business/)

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
