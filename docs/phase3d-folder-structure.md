# BossFx OS — Folder Structure Overview

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## Founder OS Directory

```
founder/
├── index.html          # App shell — login, sidebar, topbar, content sections,
│                       #   modal, drawer, activity panel, notification panel
│                       #   Script load: Supabase → core.js → components.js → app.js
│
├── core.js             # OS namespace (IIFE → window.OS)
│                       #   13 subsystems: events, store, api, adapters, search,
│                       #   commands, notifications, activity, workspaces,
│                       #   permissions, theme, nav, shortcuts
│
├── components.js       # BFX namespace (IIFE → window.BFX)
│                       #   28+ UI builder functions + 7 helper utilities
│                       #   Returns HTML strings for DOM insertion
│
├── app.js              # Application logic (IIFE, no exports)
│                       #   Auth flow, navigation, command palette,
│                       #   notifications, 10 module renderers, goals system
│
├── founder.css         # All styles (~530 lines)
│                       #   Dark theme (default), light theme overrides,
│                       #   layout, sidebar, topbar, cards, metrics,
│                       #   modal, drawer, activity panel, timeline,
│                       #   breadcrumbs, filters, responsive breakpoints
│
└── setup/
    └── index.html      # Setup wizard (DO NOT MODIFY)
```

## Full Repository Structure (Phase 3D Context)

```
bossfx-academy/
│
├── founder/                    # ← BossFx OS (Phase 3C + 3D)
│   ├── index.html              #   App shell
│   ├── core.js                 #   OS core (Phase 3D — NEW)
│   ├── components.js           #   UI components (Phase 3C, expanded 3D)
│   ├── app.js                  #   App logic (Phase 3C, refactored 3D)
│   ├── founder.css             #   Styles (Phase 3C, expanded 3D)
│   └── setup/                  #   Setup wizard (DO NOT MODIFY)
│
├── api/                        # Vercel serverless functions (11/12 slots)
│   ├── admin.js                #   Consolidated admin router
│   ├── health.js               #   System health check
│   ├── webhooks/flutterwave.js #   Payment webhook
│   ├── verify-payment.js       #   Client verification
│   ├── download.js             #   Token-gated downloads
│   ├── lead-capture.js         #   Lead capture + CRM
│   ├── booking.js              #   Mentorship bookings
│   ├── market-data.js          #   Market data API
│   ├── cron-reengagement.js    #   Daily cron job
│   ├── download-forex101.js    #   Legacy (tech debt)
│   └── vip-access.js           #   VIP portal data
│
├── lib/                        # Shared backend modules
│   ├── fulfillment.js          #   Core business logic
│   ├── email.js                #   Brevo email service
│   ├── drip.js                 #   Drip automation engine
│   ├── templates.js            #   19+ email templates
│   ├── files.js                #   HMAC token generation
│   ├── products.js             #   Product catalog
│   ├── orders.js               #   Order CRUD
│   ├── calendar.js             #   ICS calendar
│   ├── admin-auth.js           #   JWT verification
│   ├── rate-limit.js           #   Rate limiting
│   ├── supabase.js             #   DB singleton
│   └── validate-env.js         #   Env validation
│
├── docs/                       # Engineering documentation
│   ├── architecture.md         #   System architecture
│   ├── api-reference.md        #   API endpoints
│   ├── deployment.md           #   Deployment guide
│   ├── analytics.md            #   Analytics implementation
│   ├── analytics-guide.md      #   Analytics user guide
│   ├── environment.md          #   Env var reference
│   ├── integrations/           #   Per-service guides
│   ├── phase3d-*.md            #   Phase 3D documentation (10 files)
│   └── BossFx-Strategic-*.pdf  #   Strategic growth guide
│
├── sop/                        # Standard operating procedures
├── admin/                      # Legacy admin dashboard
├── blog/                       # Blog posts (11 + index + template)
├── resources/                  # Interactive tools (8 pages)
├── vip/                        # VIP portal
├── scripts/                    # CLI utilities
├── supabase/                   # Database schema
├── assets/                     # Images, icons, logos
├── downloads/                  # Legacy PDF storage
│
├── CLAUDE.md                   # Project memory
├── CHANGELOG.md                # Version changelog
├── PROJECT_ROADMAP.md          # Execution plan
├── AUTOMATION_MAP.md           # Workflow documentation
├── config.js                   # Client-side configuration
├── script.js                   # Main checkout JS
├── tracking.js                 # Analytics layer
├── bfx-analytics.js            # Advanced analytics engine
├── chatbot.js                  # BossFx Mirror chatbot
├── bfx-convert.js              # Conversion optimization
├── bfx-market.js               # Market data display
├── email-config.js             # Email subscription
├── page-nav.js                 # Page navigation
├── blog.js                     # Blog listing
├── styles.css                  # Main stylesheet
├── vercel.json                 # Vercel configuration
├── package.json                # Dependencies
└── .env.local                  # Environment variables (not committed)
```
