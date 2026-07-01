# BossFx OS — Future Extension Guide

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## Overview

Phase 3D built the core OS infrastructure. This guide explains how to extend it in Phase 4 and beyond without modifying the core subsystems.

## Adding a New Module (Phase 4 Pattern)

### 1. Register the Workspace

In `app.js`, register the workspace with its metadata and commands:

```js
OS.workspaces.register('crm', {
    label: 'CRM',
    category: 'growth',
    commands: [
        { id: 'nav:crm', label: 'Go to CRM', type: 'nav', keywords: 'crm contacts leads',
          action: function() { OS.nav.go('crm'); } },
        { id: 'action:new-contact', label: 'New Contact', type: 'action', keywords: 'add create contact',
          action: function() { fdrOpenModal('New Contact', contactFormHtml()); } }
    ]
});
```

### 2. Add Navigation Item

In `index.html`, add a nav item in the sidebar under the appropriate category:

```html
<button class="fdr-nav-item" data-section="crm">
    <svg><!-- icon --></svg> CRM
</button>
```

### 3. Add Content Section

```html
<div id="sec-crm" class="fdr-section"></div>
```

### 4. Write the Renderer

```js
function renderCRM() {
    var d = OS.store.get('dashData');
    var html = BFX.sectionHeader('CRM', 'Customer relationship management');
    html += BFX.metricGrid([...]);
    html += BFX.card('Contacts', ...);
    document.getElementById('sec-crm').innerHTML = html;
}
```

### 5. Register Search Data

```js
OS.search.register('crm-contacts', contacts.map(function(c) {
    return { id: c.id, label: c.name, detail: c.email, type: 'contact',
             action: function() { OS.nav.go('crm'); showContact(c.id); } };
}));
```

## Adding New Commands

```js
OS.commands.register([
    { id: 'action:export-csv', label: 'Export Orders as CSV', type: 'action',
      keywords: 'export download csv orders',
      action: function() { exportOrdersCSV(); } }
]);
```

Commands automatically appear in the command palette (⌘K).

## Adding Keyboard Shortcuts

```js
OS.shortcuts.register('mod+shift+e', function() {
    exportOrdersCSV();
}, 'Export Orders CSV');
```

Shortcuts are displayed in the Settings module and the shortcuts modal.

## Using the Modal System

```js
// Simple content modal
fdrOpenModal('Export Complete', '<p>Downloaded 150 orders.</p>');

// Modal with footer actions
fdrOpenModal('Confirm Delete',
    '<p>Are you sure you want to delete this contact?</p>',
    '<button class="fdr-btn fdr-btn-outline" onclick="fdrCloseModal()">Cancel</button>' +
    '<button class="fdr-btn fdr-btn-primary" onclick="deleteContact();fdrCloseModal()">Delete</button>'
);
```

## Using the Drawer

```js
// Detail view in drawer
fdrOpenDrawer('Order #12345', orderDetailHtml);
```

## Activity Logging

Log significant user actions and system events:

```js
OS.activity.log('order', 'New order received: ₦25,000');    // type: order
OS.activity.log('system', 'Backup completed');                // type: system
OS.activity.log('error', 'Email delivery failed');            // type: error
OS.activity.log('command', 'Exported CSV');                   // type: command
```

Timeline dot colors are assigned by type in `BFX.timeline()`.

## Adding Notifications

```js
OS.notifications.add(
    'New Lead',                          // title
    'John Doe signed up via webinar.',   // body
    'success',                           // type: success/warn/error/info
    { source: 'crm', priority: 'normal' } // options
);
```

## Theme-Aware Components

When writing custom HTML, use CSS custom properties for theme compatibility:

```js
var html = '<div style="background:var(--fdr-card);border:1px solid var(--fdr-border);' +
           'color:var(--fdr-text);border-radius:10px;padding:16px;">' +
           '<h3 style="color:var(--fdr-text);">Title</h3>' +
           '<p style="color:var(--fdr-muted);">Description</p></div>';
```

Available variables: `--fdr-bg`, `--fdr-bg2`, `--fdr-bg3`, `--fdr-card`, `--fdr-border`, `--fdr-text`, `--fdr-muted`, `--fdr-dim`, `--fdr-green`, `--fdr-blue`, `--fdr-amber`, `--fdr-purple`.

## Permission-Gating (Future Multi-User)

When multi-user support is added, gate module access:

```js
if (OS.permissions.canAccess('finance')) {
    renderFinance();
} else {
    document.getElementById('sec-finance').innerHTML =
        BFX.emptyState('🔒', 'Access Denied', 'You do not have permission to view Finance.');
}
```

## Constraints to Respect

1. **No new API endpoints** — 11/12 Vercel function slots used. Extend via `api/admin.js` actions.
2. **No build step** — all JS must work as raw `<script>` tags. No ES modules, no imports.
3. **No new dependencies** — static HTML/CSS/JS only on the frontend.
4. **Global namespaces only** — use `OS.*` for infrastructure, `BFX.*` for components, `window.*` for app-level functions.
5. **Auth is frozen** — do not modify the Supabase auth flow or `admin-auth.js`.
6. **Preserve analytics** — never remove GTM, GA4, Pixel, Clarity, or bfx-analytics tracking.
