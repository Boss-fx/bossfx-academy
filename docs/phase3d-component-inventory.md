# BossFx OS — Shared Component Inventory

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## BFX Namespace (components.js)

All components return HTML strings. Insert via `element.innerHTML = BFX.component(...)`.

### Helper Utilities

| Function | Signature | Description |
|---|---|---|
| `esc` | `(str)` | HTML entity escaping (prevents XSS) |
| `naira` | `(n)` | Format number as ₦ with commas |
| `num` | `(n)` | Format number with commas |
| `pct` | `(n)` | Format as percentage with 1 decimal |
| `productName` | `(id)` | Map product ID → display name |
| `shortDate` | `(iso)` | Format ISO date → `DD Mon YYYY` |
| `timeAgo` | `(iso)` | Relative time string (`2h ago`, `3d ago`) |

### Layout Components

| Component | Signature | Description |
|---|---|---|
| `sectionHeader` | `(title, subtitle)` | Section heading with optional subtitle |
| `card` | `(title, body, headerRight, footer)` | Card container with header, body, optional footer |
| `metricGrid` | `(items)` | Grid of metric cards. Items: `[label, value, color?]` |
| `metric` | `(label, value, color?)` | Single metric display |

### Data Display

| Component | Signature | Description |
|---|---|---|
| `ordersTable` | `(orders, showResend)` | Orders table with status badges, optional resend |
| `table` | `(headers, rows, emptyMsg)` | Generic data table |
| `trendChart` | `(data)` | 30-day SVG sparkline with area fill |
| `productBreakdown` | `(products)` | Horizontal bar chart of products by revenue |

### Status & Feedback

| Component | Signature | Description |
|---|---|---|
| `badge` | `(text, color)` | Colored pill badge |
| `statusBadge` | `(status)` | Status-specific badge (healthy/error/configured/pending) |
| `alert` | `(type, text)` | Alert banner (success/warn/error/info) |
| `emptyState` | `(icon, title, text, action?)` | Empty state placeholder |
| `healthCard` | `(name, status, detail)` | Service health indicator |

### Navigation & Actions

| Component | Signature | Description |
|---|---|---|
| `tabs` | `(items, activeId, onClickFn)` | Tab bar with active state |
| `breadcrumbs` | `(items)` | Navigation breadcrumbs with optional action links |
| `filterBar` | `(filters, activeId, onClickFn)` | Pill-style filter buttons with optional count badges |
| `quickAction` | `(icon, label, onclick)` | Icon + label action button |
| `searchResult` | `(item)` | Search result row with badge, label, detail |
| `kbdHint` | `(key)` | Keyboard shortcut display badge |

### Specialized Cards

| Component | Signature | Description |
|---|---|---|
| `aiCard` | `(role)` | AI role card with title, subtitle, purpose, cadence, color |
| `autoCard` | `(title, desc, status, trigger, lastRun)` | Automation card |
| `settingRow` | `(label, detail, right)` | Settings row with label, description, action |
| `serviceLink` | `(name, detail, url, bgColor, icon)` | External service link card |

### Goals System

| Component | Signature | Description |
|---|---|---|
| `goalsCard` | `(title, period)` | Goals card wrapper with title |
| `goalsList` | `(period, goals)` | Goal list with add input, toggle, delete |

### Overlay Components (Phase 3D — New)

| Component | Signature | Description |
|---|---|---|
| `modal` | `(title, contentHtml, footerHtml?)` | Modal dialog with close button, body, optional footer |
| `drawer` | `(title, contentHtml)` | Right-side drawer panel with close button |
| `timeline` | `(items)` | Activity timeline with colored dots by type |

### Timeline Dot Colors

| Event Type | Color |
|---|---|
| `order` | Green (#10B981) |
| `download` | Blue (#3b82f6) |
| `login` | Purple (#a855f7) |
| `system` | Amber (#f59e0b) |
| `error` | Red (#ef4444) |
| `command` | Cyan (#06b6d4) |
| `nav` | Dim (--fdr-dim) |
| `data` | Green (#10B981) |

---

## CSS Class Reference

### Phase 3D New Classes

| Class | Element | Purpose |
|---|---|---|
| `fdr-modal-backdrop` | `div` | Fixed overlay with backdrop blur |
| `fdr-modal-container` | `div` | Centered 560px modal card |
| `fdr-modal-header/title/close/body/footer` | `div/h3/button` | Modal internals |
| `fdr-drawer` | `div` | 480px fixed right panel, add `.open` to show |
| `fdr-drawer-header/title/close/body` | `div/h3/button` | Drawer internals |
| `fdr-activity-panel` | `div` | 380px fixed right panel, add `.open` to show |
| `fdr-timeline` | `div` | Timeline container |
| `fdr-timeline-item/dot/content/text/time` | `div/span` | Timeline row |
| `fdr-breadcrumbs` | `div` | Breadcrumb nav container |
| `fdr-crumb` | `span` | Individual crumb, `.active` for current |
| `fdr-crumb-sep` | `span` | Separator (`/`) |
| `fdr-filters` | `div` | Filter bar container |
| `fdr-filter` | `button` | Filter pill, `.active` for selected |
| `fdr-filter-count` | `span` | Count badge inside filter |
| `fdr-quick-actions` | `div` | Quick action grid |
| `fdr-quick-action/icon/label` | `button/span` | Quick action button |
| `fdr-search-result` | `div` | Search result row |
| `fdr-search-result-badge/content/label/detail` | `div/span` | Result parts |
| `fdr-kbd` | `kbd` | Keyboard shortcut badge |
| `fdr-theme-btn` | `button` | Theme toggle button |
