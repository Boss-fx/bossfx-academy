# BossFx OS — State Management Documentation

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## Overview

The State Store (`OS.store`) is a centralized, observable key-value store that replaces scattered closure variables. Every state change emits an event and triggers watchers, enabling reactive UI updates without a framework.

## API

### `OS.store.get(key)` → value

Read the current value of a state key.

```js
var session = OS.store.get('session');
var dashData = OS.store.get('dashData');
var theme = OS.store.get('theme');
```

### `OS.store.set(key, value)`

Update a state value. This triggers:
1. `emit('state:{key}', { value, prev })` — event bus notification
2. All watchers registered for that key

```js
OS.store.set('session', result.data.session);
OS.store.set('dashData', dashboardPayload);
OS.store.set('loading', true);
```

### `OS.store.watch(key, handler)` → `unsubscribe()`

Register a watcher that fires whenever a specific key changes. More targeted than events — use for direct reactions to specific state changes.

```js
var unsub = OS.store.watch('theme', function(newVal, prevVal) {
  console.log('Theme changed from', prevVal, 'to', newVal);
});
// Later: unsub() to remove the watcher
```

## State Keys

| Key | Type | Default | Persisted | Description |
|---|---|---|---|---|
| `session` | `object|null` | `null` | No | Supabase auth session (JWT, user info) |
| `dashData` | `object|null` | `null` | No | Dashboard API response (orders, revenue, students, etc.) |
| `sysData` | `object|null` | `null` | No | System health API response |
| `activeSection` | `string` | `'ceo'` | No | Currently active navigation section |
| `theme` | `string` | `'dark'` | Yes (`bfx_theme`) | Current theme mode |
| `recentPages` | `array` | `[]` | Yes (`bfx_recent`) | Recently visited sections (max 10) |
| `favorites` | `array` | `[]` | Yes (`bfx_favorites`) | Favorited sections |
| `loading` | `boolean` | `false` | No | Whether data is being loaded |

## Persistence

Three state keys are persisted to `localStorage`:

| Key | Storage Key | Format |
|---|---|---|
| `theme` | `bfx_theme` | Plain string (`'dark'` or `'light'`) |
| `recentPages` | `bfx_recent` | JSON array of section IDs |
| `favorites` | `bfx_favorites` | JSON array of section IDs |

Persisted values are loaded at startup (in `core.js` initialization) and updated by their respective subsystems (`OS.theme.set()`, `OS.nav.go()`, `OS.nav.toggleFavorite()`).

## Data Flow

```
               ┌──────────────┐
               │ OS.store.set │
               │  (key, val)  │
               └──────┬───────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────┴────┐  ┌────┴────┐  ┌───┴────┐
    │ Update  │  │  Emit   │  │  Fire  │
    │ _state  │  │ state:  │  │watchers│
    │  object │  │  {key}  │  │ for key│
    └─────────┘  └────┬────┘  └───┬────┘
                      │           │
                 Any event    Direct callback
                 listener     (newVal, prevVal)
```

## Usage Patterns

### Reading Dashboard Data in Renderers

```js
function renderCEO() {
    var d = OS.store.get('dashData');
    var s = OS.store.get('sysData');
    // Use d.revenue.today, d.orders.total, etc.
}
```

### Checking Auth State

```js
var session = OS.store.get('session');
if (session) {
    // User is logged in
    var email = session.user.email;
    var token = session.access_token;
}
```

### Reacting to State Changes

```js
// Via events (broad — any listener can react):
OS.events.on('state:dashData', function(data) {
    console.log('Dashboard data updated');
    updateCharts(data.value);
});

// Via watchers (targeted — registered per key):
OS.store.watch('loading', function(isLoading) {
    document.getElementById('spinner').style.display = isLoading ? 'block' : 'none';
});
```

## State vs Events vs Watchers

| Mechanism | When to Use |
|---|---|
| `OS.store.get()` | Read current value at any time |
| `OS.events.on('state:key')` | React to state changes alongside other event types |
| `OS.store.watch(key, fn)` | React specifically to one key's changes |
| `OS.events.on('nav:changed')` | React to higher-level actions (not raw state) |

The store emits events via the event bus, so `OS.events.on('state:theme', fn)` and `OS.store.watch('theme', fn)` respond to the same change. Watchers receive `(newVal, prevVal)` directly; event handlers receive `{ value, prev }`.
