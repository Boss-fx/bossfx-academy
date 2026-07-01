# BossFx OS — Event System Documentation

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## Overview

The Event Bus (`OS.events`) is a publish-subscribe system that enables decoupled communication between OS subsystems and application code. It is the backbone of the OS — most subsystems emit events that other subsystems or application code react to.

## API

### `OS.events.on(event, handler)` → `unsubscribe()`

Subscribe to an event. Returns an unsubscribe function.

```js
var unsub = OS.events.on('nav:changed', function(data) {
  console.log('Navigated to:', data.section);
});
// Later: unsub() to remove the listener
```

### `OS.events.off(event, handler)`

Remove a specific handler from an event.

```js
OS.events.off('nav:changed', myHandler);
```

### `OS.events.emit(event, data)`

Emit an event with optional data. All subscribed handlers fire synchronously. Errors in handlers are caught and logged, never propagated.

```js
OS.events.emit('custom:event', { key: 'value' });
```

### Wildcard Listener

Subscribe to `'*'` to receive all events. The handler receives `(eventName, data)`.

```js
OS.events.on('*', function(evt, data) {
  console.log('[Event]', evt, data);
});
```

## Event Catalog

### State Events

Emitted by `OS.store.set()` whenever a value changes.

| Event | Data | Emitted By |
|---|---|---|
| `state:session` | `{ value, prev }` | Login/logout |
| `state:dashData` | `{ value, prev }` | Dashboard data load |
| `state:sysData` | `{ value, prev }` | System data load |
| `state:activeSection` | `{ value, prev }` | Navigation |
| `state:theme` | `{ value, prev }` | Theme toggle |
| `state:loading` | `{ value, prev }` | Load start/end |

### Navigation Events

| Event | Data | Emitted By |
|---|---|---|
| `nav:changed` | `{ section, prev }` | `OS.nav.go()` |
| `nav:favorites` | `[sections]` | `OS.nav.toggleFavorite()` |

### Notification Events

| Event | Data | Emitted By |
|---|---|---|
| `notification:added` | `{ id, title, body, type, ... }` | `OS.notifications.add()` |
| `notification:read` | `{ id, ... }` | `OS.notifications.markRead()` |
| `notification:allRead` | (none) | `OS.notifications.markAllRead()` |
| `notification:cleared` | (none) | `OS.notifications.clear()` |

### Activity Events

| Event | Data | Emitted By |
|---|---|---|
| `activity:logged` | `{ id, type, text, time, meta }` | `OS.activity.log()` |
| `activity:cleared` | (none) | `OS.activity.clear()` |

### Command Events

| Event | Data | Emitted By |
|---|---|---|
| `command:executed` | `{ id, label, type, ... }` | `OS.commands.execute()` |

### Workspace Events

| Event | Data | Emitted By |
|---|---|---|
| `workspace:registered` | `{ id, label, category, ... }` | `OS.workspaces.register()` |

### Theme Events

| Event | Data | Emitted By |
|---|---|---|
| `theme:changed` | `'dark'` or `'light'` | `OS.theme.set()` |

### Role Events

| Event | Data | Emitted By |
|---|---|---|
| `role:changed` | `'founder'` (role name) | `OS.permissions.setRole()` |

### Application Events

| Event | Data | Emitted By |
|---|---|---|
| `dashboard:loaded` | (none) | `loadDashboard()` in app.js |

## Event Flow Diagrams

### Login Flow
```
supabase.auth.signIn()
  → OS.store.set('session', data)
    → emit('state:session')
  → OS.activity.log('login', ...)
    → emit('activity:logged')
  → onLogin() → loadDashboard()
    → OS.api.dashboard() + OS.api.system()
    → OS.store.set('dashData', ...) → emit('state:dashData')
    → OS.store.set('sysData', ...)  → emit('state:sysData')
    → generateNotifications()
      → OS.notifications.add() × N → emit('notification:added') × N
    → buildSearchIndex()
    → OS.activity.log('data', ...) → emit('activity:logged')
    → emit('dashboard:loaded')
```

### Navigation Flow
```
user clicks nav item
  → OS.nav.go(section)
    → OS.store.set('activeSection', section) → emit('state:activeSection')
    → localStorage.setItem('bfx_recent', ...)
    → OS.activity.log('nav', ...) → emit('activity:logged')
    → emit('nav:changed', { section, prev })
      → app.js listener: update sidebar, sections, title, breadcrumbs
```

### Theme Toggle
```
user clicks theme button
  → fdrToggleTheme()
    → OS.theme.toggle()
      → OS.theme.set('light' or 'dark')
        → document.documentElement.setAttribute('data-theme', mode)
        → localStorage.setItem('bfx_theme', mode)
        → OS.store.set('theme', mode) → emit('state:theme')
        → emit('theme:changed', mode)
    → OS.activity.log('system', ...) → emit('activity:logged')
```

## Usage Guidelines

1. **Always use `on()` return value** to unsubscribe when listeners are temporary
2. **Never throw inside handlers** — errors are caught but logged to console
3. **Event names use colon-delimited namespaces** — `category:action`
4. **State events** include `{ value, prev }` for comparing old and new values
5. **Wildcard `*`** is for debugging/logging only — avoid for business logic
