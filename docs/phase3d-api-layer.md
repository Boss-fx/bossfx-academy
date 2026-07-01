# BossFx OS — API Layer Documentation

> **Version:** 3.2.0 | **Updated:** 2026-07-01

---

## Overview

The OS API layer (`OS.api`) wraps all server communication into a standardized interface. It automatically injects the session JWT and handles error responses.

## API Methods

### `OS.api.headers()`

Returns authorization headers for manual fetch calls.

```js
// Returns:
{
  'Authorization': 'Bearer <jwt-access-token>',
  'Content-Type': 'application/json'
}
```

### `OS.api.get(action)`

Generic GET request to the admin API.

```js
var data = await OS.api.get('founder');
// Calls: GET /api/admin?action=founder
// Returns: parsed JSON response
// Throws: Error if response.ok is false
```

### `OS.api.post(action, body)`

Generic POST request to the admin API.

```js
var result = await OS.api.post('resend', { orderId: '123' });
// Calls: POST /api/admin?action=resend
// Body: JSON stringified
// Returns: parsed JSON response
```

### `OS.api.dashboard()`

Fetch founder dashboard data. Alias for `OS.api.get('founder')`.

```js
var dashData = await OS.api.dashboard();
// Returns complete dashboard payload:
// { orders, revenue, students, downloads, bookings, brevo,
//   eaAddon, metrics, products, recentOrders }
```

### `OS.api.system()`

Fetch system health data. Alias for `OS.api.get('system')`.

```js
var sysData = await OS.api.system();
// Returns:
// { supabase, brevo, flutterwave, vercel, envVars }
```

### `OS.api.resend(orderId)`

Resend fulfillment email. Alias for `OS.api.post('resend', { orderId })`.

```js
var result = await OS.api.resend('order-id');
// Returns: { success: true } or { error: 'message' }
```

### `OS.api.supabase()`

Create an authenticated Supabase client for direct queries.

```js
var sb = OS.api.supabase();
var { data } = await sb.from('downloads').select('*').limit(20);
```

The client is created with the current session's JWT in the Authorization header, enabling RLS-aware queries.

## Data Adapters

Data adapters normalize external service data into consistent shapes. They are available at `OS.adapters.*`.

### `OS.adapters.orders(raw)`

Normalizes raw Supabase order rows.

```js
// Input: [{ id, tx_ref, customer_email, ... }]
// Output: [{ id, txRef, customerEmail, customerName, productId,
//            amount, status, fulfilled, hasEa, createdAt, meta }]
```

### `OS.adapters.downloads(raw)`

```js
// Input: [{ id, customer_email, product_id, downloaded_at }]
// Output: [{ id, email, productId, downloadedAt }]
```

### `OS.adapters.bookings(raw)`

```js
// Input: [{ id, customer_name, customer_email, ... }]
// Output: [{ id, name, email, productId, status, createdAt }]
```

### `OS.adapters.brevo(raw)`

```js
// Input: { status, plan, totalSubscribers, lists: [...] }
// Output: { status, plan, totalSubscribers, lists: [{ id, name, subscribers }] }
```

### `OS.adapters.health(sysData)`

```js
// Input: { supabase, brevo, flutterwave, vercel }
// Output: [{ name, status, detail }] for each service
```

## Backend Endpoints (Reference)

The admin API is a consolidated router at `/api/admin.js` (327 lines). All requests require JWT auth verified by `lib/admin-auth.js`.

| Action | Method | Description |
|---|---|---|
| `stats` | GET | Basic stats (order count, revenue) |
| `founder` | GET | Full dashboard payload |
| `system` | GET | System health across all services |
| `resend` | POST | Resend fulfillment email |
| `token` | POST | Generate new download token |

**IMPORTANT:** The admin API is 1 of 11/12 serverless function slots. DO NOT create new API endpoints.
