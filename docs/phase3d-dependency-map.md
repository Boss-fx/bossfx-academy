# BossFx OS — Module Dependency Map

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## Dependency Graph

```
                    ┌──────────────┐
                    │  index.html  │
                    │  (Entry)     │
                    └──────┬───────┘
                           │ loads (in order)
              ┌────────────┼────────────────┐
              │            │                │
       ┌──────┴──────┐ ┌──┴───────────┐ ┌──┴─────────┐
       │  core.js    │ │components.js │ │  app.js    │
       │  (OS)       │ │  (BFX)       │ │  (App)     │
       └──────┬──────┘ └──────┬───────┘ └──────┬─────┘
              │               │                │
              │               │                ├── depends on: OS, BFX
              │               │                ├── reads: OS.store
              │               ├── standalone    ├── calls: OS.api.*
              │               │  (no deps)     ├── uses: OS.commands
              ├── depends on: │                ├── uses: OS.notifications
              │  Supabase CDN │                ├── uses: OS.nav
              │  (meta tags)  │                ├── uses: OS.search
              │               │                ├── uses: OS.activity
              │               │                ├── uses: OS.shortcuts
              │               │                ├── uses: OS.theme
              │               │                └── uses: BFX.* (all components)
              │               │
              │               └── helpers: esc, naira, num, pct,
              │                   productName, shortDate, timeAgo
              │
              └── subsystem dependencies:
                  store ← events (set emits 'state:{key}')
                  api ← store (reads session for auth)
                  nav ← store + events + activity
                  commands ← activity (logs on execute)
                  theme ← store + events (stores mode)
                  workspaces ← commands (registers per-ws cmds)
```

## Internal Dependency Matrix

| Subsystem | Depends On | Depended By |
|---|---|---|
| `events` | (none) | store, nav, commands, notifications, activity, workspaces, theme, permissions |
| `store` | events | api, nav, theme, app.js |
| `api` | store (session) | app.js |
| `adapters` | (none) | (future use) |
| `search` | (none) | app.js (command palette) |
| `commands` | activity, events | app.js, workspaces |
| `notifications` | events | app.js |
| `activity` | events | commands, nav, app.js |
| `workspaces` | commands, events | app.js |
| `permissions` | events | (future enforcement) |
| `theme` | store, events | app.js |
| `nav` | store, events, activity | app.js |
| `shortcuts` | (none) | app.js |

## File Size Budget

| File | Lines | Size (approx) | Role |
|---|---|---|---|
| `core.js` | ~310 | 10 KB | OS infrastructure |
| `components.js` | ~295 | 10 KB | UI component library |
| `founder.css` | ~530 | 15 KB | All styles |
| `app.js` | ~780 | 28 KB | Application logic |
| `index.html` | ~195 | 8 KB | HTML shell |
| **Total** | **~2,110** | **~71 KB** | |

## External Dependencies

| Dependency | Loaded From | Used By |
|---|---|---|
| Supabase JS Client | CDN (`<script>`) | core.js (API layer), app.js (auth) |
| Flutterwave Inline | CDN on checkout pages | script.js (not in founder/) |
| Inter font | Google Fonts | founder.css |
| Space Grotesk font | Google Fonts | founder.css |
