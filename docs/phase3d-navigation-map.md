# BossFx OS — Navigation Map

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## Section Hierarchy

```
BossFx OS
│
├── Command ──────────────────────────────────────────
│   └── CEO Dashboard ................ [ceo]
│       ├── Executive KPIs (revenue, orders, students)
│       ├── System alerts
│       ├── 30-day revenue trend
│       ├── Revenue by product
│       ├── Daily & weekly goals
│       ├── Recent orders (→ Sales)
│       └── AI team summary (→ AI Control)
│
├── Growth ───────────────────────────────────────────
│   ├── Marketing .................... [marketing]
│   │   ├── Email subscribers (Brevo)
│   │   ├── Email lists
│   │   ├── Social media channels
│   │   ├── Analytics & tracking platforms
│   │   ├── Content calendar (placeholder)
│   │   └── Campaign performance (placeholder)
│   │
│   ├── Sales ........................ [sales]
│   │   ├── Revenue by period (tabs: today/week/month/quarter/all)
│   │   ├── Revenue by product
│   │   ├── 30-day trend
│   │   ├── Flutterwave gateway status
│   │   ├── Period report
│   │   └── Full orders table (with resend action)
│   │
│   └── Students ..................... [students]
│       ├── Student metrics
│       ├── Students by product
│       ├── Certificates (placeholder)
│       ├── Recent downloads (Supabase query)
│       ├── Mentorship bookings (Supabase query)
│       └── Support tickets (placeholder)
│
├── Intelligence ─────────────────────────────────────
│   ├── Analytics .................... [analytics]
│   │   ├── GA4 status + link
│   │   ├── GTM status + link
│   │   ├── Meta Pixel status + link
│   │   ├── Microsoft Clarity status + link
│   │   ├── bfx-analytics.js module status
│   │   └── Conversion funnels (placeholder)
│   │
│   └── AI Control Center ........... [ai-control]
│       ├── AI team metrics
│       ├── 13 AI role cards
│       └── AI activity log (placeholder)
│
├── Operations ───────────────────────────────────────
│   ├── Automation ................... [automation]
│   │   ├── Active automations (4)
│   │   ├── Email drip sequences (6)
│   │   ├── Job queue (placeholder)
│   │   └── Workflow builder (placeholder)
│   │
│   ├── Finance ...................... [finance]
│   │   ├── Revenue metrics
│   │   ├── Revenue by product
│   │   ├── 30-day revenue
│   │   ├── Revenue streams breakdown
│   │   ├── Expenses (placeholder)
│   │   └── Cash flow & forecasting (placeholder)
│   │
│   └── Operations ................... [operations]
│       ├── System health (4 services)
│       ├── Environment variables
│       ├── Monthly & quarterly goals
│       ├── SOP library
│       ├── Projects & tasks (placeholder)
│       └── Company calendar (placeholder)
│
└── System ───────────────────────────────────────────
    └── Settings ..................... [settings]
        ├── API connections (6 services)
        ├── Infrastructure (Vercel, domain, SSL)
        ├── Display (theme toggle)
        ├── Quick links (external dashboards)
        ├── Documentation index
        ├── User management (placeholder)
        ├── Feature flags
        ├── Security overview
        └── Keyboard shortcuts
```

## Navigation Methods

| Method | Description |
|---|---|
| Sidebar click | Primary navigation — click any nav item |
| Command palette (⌘K) | Search and navigate to any section |
| Breadcrumbs | Click root crumb to go to CEO Dashboard |
| Cross-links | Inline links between modules (e.g., "View All →" in CEO) |
| `fdrNav('section')` | Global function for onclick handlers |
| `OS.nav.go('section')` | Programmatic navigation |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘/Ctrl + K` | Open command palette |
| `⌘/Ctrl + Shift + A` | Toggle activity feed |
| `⌘/Ctrl + Shift + N` | Toggle notifications |
| `⌘/Ctrl + Shift + T` | Toggle theme (dark/light) |

## Navigation Features

### Recent Pages
- Last 10 visited sections stored in `localStorage` (`bfx_recent`)
- Updated on every `OS.nav.go()` call
- Available via `OS.nav.recent()`

### Favorites
- Toggle with `OS.nav.toggleFavorite(section)`
- Stored in `localStorage` (`bfx_favorites`)
- Check with `OS.nav.isFavorite(section)`
- List with `OS.nav.favorites()`

### Activity Logging
- Every navigation is logged to the activity feed
- `OS.activity.log('nav', 'Opened {section}')`
- Visible in the activity panel (⌘⇧A)

### Breadcrumbs
- Auto-updated on every navigation
- Format: `BossFx OS > {Category} > {Section}`
- Root crumb links back to CEO Dashboard
