# BossFx OS — Architecture Diagram (Phase 3D)

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Static HTML)                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    index.html (Entry Point)                  │   │
│  │  • Login screen (Supabase Auth)                              │   │
│  │  • App shell: sidebar + topbar + content area                │   │
│  │  • Modal, Drawer, Activity Panel, Notification Panel         │   │
│  │  • Toast overlay                                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────── Script Load Order ──────────────────────┐    │
│  │                                                             │    │
│  │  1. Supabase CDN  →  supabase.createClient()               │    │
│  │  2. core.js       →  OS namespace (13 subsystems)          │    │
│  │  3. components.js →  BFX namespace (28+ UI builders)       │    │
│  │  4. app.js        →  Application logic (IIFE)              │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────── OS Namespace (core.js) ──────────────────────┐    │
│  │                                                             │    │
│  │  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │    │
│  │  │ Event Bus │  │  State   │  │   API    │  │ Adapters │  │    │
│  │  │ on/off/   │  │  Store   │  │  Layer   │  │ orders/  │  │    │
│  │  │ emit      │  │ get/set/ │  │ get/post │  │ downloads│  │    │
│  │  │ wildcard  │  │ watch    │  │ supabase │  │ bookings │  │    │
│  │  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘  │    │
│  │        │              │              │                      │    │
│  │  ┌─────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌──────────┐  │    │
│  │  │  Search   │  │ Commands │  │  Notifs  │  │ Activity │  │    │
│  │  │ register/ │  │ register/│  │ add/mark │  │ log/     │  │    │
│  │  │ query     │  │ execute  │  │ read/clr │  │ recent   │  │    │
│  │  └───────────┘  └──────────┘  └──────────┘  └──────────┘  │    │
│  │                                                             │    │
│  │  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │    │
│  │  │Workspaces │  │Permissions│  │  Theme   │  │   Nav    │  │    │
│  │  │ register/ │  │ canAccess│  │ set/     │  │ go/      │  │    │
│  │  │ get/list  │  │ getRole  │  │ toggle   │  │ favorites│  │    │
│  │  └───────────┘  └──────────┘  └──────────┘  └──────────┘  │    │
│  │                                                             │    │
│  │  ┌───────────┐                                             │    │
│  │  │ Shortcuts │                                             │    │
│  │  │ register/ │                                             │    │
│  │  │ all       │                                             │    │
│  │  └───────────┘                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────── BFX Namespace (components.js) ───────────────┐    │
│  │  sectionHeader, metricGrid, card, metric, badge, alert,    │    │
│  │  statusBadge, trendChart, productBreakdown, ordersTable,   │    │
│  │  table, emptyState, tabs, aiCard, autoCard, settingRow,    │    │
│  │  goalsCard, goalsList, serviceLink, healthCard,            │    │
│  │  modal, drawer, timeline, breadcrumbs, filterBar,          │    │
│  │  quickAction, searchResult, kbdHint                        │    │
│  │  + helpers: esc, naira, num, pct, productName, shortDate,  │    │
│  │             timeAgo                                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   Vercel Serverless │
                    │   /api/admin.js     │
                    │   ?action=          │
                    │   • founder (stats) │
                    │   • system (health) │
                    │   • resend (email)  │
                    │   • token (gen)     │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────┴────┐   ┌─────┴─────┐   ┌─────┴─────┐
         │Supabase │   │   Brevo   │   │Flutterwave│
         │ DB/Auth │   │Email/CRM  │   │ Payments  │
         └─────────┘   └───────────┘   └───────────┘
```

## Data Flow

```
Login:
  User → Supabase Auth → JWT → OS.store.set('session') → onLogin()

Data Load:
  OS.api.dashboard() ─┐
  OS.api.system()   ──┤──→ Promise.all() → OS.store.set('dashData'/'sysData')
                       │                  → render all 10 modules
                       │                  → generateNotifications()
                       │                  → buildSearchIndex()
                       │                  → OS.activity.log('data', ...)
                       │                  → OS.events.emit('dashboard:loaded')

Navigation:
  User click → OS.nav.go(section) → OS.store.set('activeSection')
                                  → localStorage persist recents
                                  → OS.activity.log('nav', ...)
                                  → OS.events.emit('nav:changed')
                                  → app.js listener → DOM update

Command Palette:
  ⌘K → openCmd() → user types → OS.commands.search(q) + OS.search.query(q)
                               → merged results rendered
                               → execute → action() or OS.nav.go()

Notifications:
  OS.notifications.add() → emit('notification:added') → badge + panel update
  
State Watchers:
  OS.store.set(key, val) → emit('state:{key}') → registered watchers fire
```

## Event Flow

```
Events emitted by OS core:
  state:{key}          — Any store value changed
  nav:changed          — Section navigation occurred
  nav:favorites        — Favorites list changed
  theme:changed        — Dark/light mode toggled
  notification:added   — New notification created
  notification:read    — Single notification marked read
  notification:allRead — All notifications marked read
  notification:cleared — All notifications removed
  activity:logged      — New activity entry
  activity:cleared     — Activity feed reset
  command:executed     — Command palette action run
  workspace:registered — New module registered
  role:changed         — User role updated
  dashboard:loaded     — All data loaded successfully
```
