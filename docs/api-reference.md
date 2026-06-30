# API Reference — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering
> **Base URL:** `https://www.bossfxcademy.com/api`

All endpoints are Vercel Serverless Functions (Node.js). Max duration: 30 seconds.

---

## POST /api/webhooks/flutterwave

**Purpose:** Receives payment webhooks from Flutterwave and triggers order fulfillment.

**Authentication:** Webhook signature (`verif-hash` header must match `FLUTTERWAVE_WEBHOOK_HASH`)

**Input:**
```json
{
  "event": "charge.completed",
  "data": {
    "id": 123456,
    "tx_ref": "bfx-forex-101-1719750000000",
    "amount": 25000,
    "currency": "NGN",
    "status": "successful",
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe",
      "phone_number": "+2348012345678"
    },
    "meta": {
      "product": "forex-101",
      "ea_bundle": "yes"
    }
  }
}
```

**Output (200):**
```json
{
  "status": "success",
  "fulfillment": "fulfilled",
  "txRef": "bfx-forex-101-1719750000000"
}
```

**Errors:**
| Status | Condition |
|---|---|
| 200 + `status: "skipped"` | Non-successful charge or non `charge.completed` event |
| 200 + `status: "error"` | Internal processing error (200 returned to prevent Flutterwave retries) |
| 400 | Invalid payload or payment verification failed |
| 401 | Invalid webhook signature |
| 405 | Non-POST request |
| 500 | Webhook hash not configured |

**Dependencies:** `lib/fulfillment.js`, `lib/products.js`, Flutterwave API v3, Supabase, Brevo

**Used by:** Flutterwave webhook configuration (set in Flutterwave dashboard)

---

## GET /api/verify-payment

**Purpose:** Client-side payment verification. Called by payment-success.html to retrieve order details and download links.

**Authentication:** None (relies on tx_ref knowledge as proof of purchase)

**Input (query params):**
| Param | Type | Required | Description |
|---|---|---|---|
| `tx_ref` | string | Yes | Transaction reference from checkout |

**Output (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "txRef": "bfx-forex-101-...",
    "productId": "forex-101",
    "amount": 25000,
    "customerEmail": "customer@example.com",
    "status": "successful"
  },
  "product": {
    "name": "Forex 101: The Trader's Bible",
    "type": "course",
    "deliverables": ["..."]
  },
  "downloadToken": "base64url.hmac",
  "files": [
    { "file_name": "Course.pdf", "file_key": "forex-101/Course.pdf" }
  ],
  "hasEaAddon": true,
  "eaDownloadToken": "base64url.hmac",
  "eaFiles": [
    { "file_name": "SMA_Pro_EA.ex5", "file_key": "ea-bundle/SMA_Pro_EA.ex5" }
  ]
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Missing tx_ref parameter |
| 404 | Order not found in database or Flutterwave |
| 500 | Database unavailable |

**Dependencies:** Supabase (orders, product_files, access_tokens), Flutterwave API (fallback verification)

**Used by:** `payment-success.html`

---

## GET /api/download

**Purpose:** Token-gated file delivery. Verifies download token and redirects to signed Supabase Storage URL.

**Authentication:** HMAC-SHA256 download token (query param)

**Input (query params):**
| Param | Type | Required | Description |
|---|---|---|---|
| `token` | string | Yes | HMAC-SHA256 signed download token |
| `file` | string | No | Specific file key to download (defaults to first file) |

**Output (302):** Redirect to signed Supabase Storage URL (300s expiry)

**Output (200, if listing files):**
```json
{
  "files": [
    { "name": "Course.pdf", "key": "forex-101/Course.pdf", "url": "/api/download?token=...&file=..." }
  ]
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Missing token parameter |
| 401 | Invalid token signature or expired token |
| 403 | EA files requested with non-EA/non-VIP token |
| 404 | No files found for product |
| 500 | Storage URL generation failed |

**Dependencies:** `lib/files.js` (token verification), Supabase (product_files, downloads, storage)

**Used by:** `payment-success.html`, fulfillment emails

---

## POST /api/lead-capture

**Purpose:** Receives lead form submissions, creates/updates Brevo CRM contact, and triggers drip automation sequence.

**Authentication:** None (public endpoint)

**Input:**
```json
{
  "email": "lead@example.com",
  "name": "Jane Doe",
  "source": "newsletter_footer",
  "page": "/courses.html",
  "program": "forex-education",
  "device": "mobile",
  "_bfx_utm_source": "instagram",
  "_bfx_utm_medium": "social",
  "_bfx_utm_campaign": "june-launch",
  "_bfx_ft_source": "google",
  "_bfx_ft_medium": "organic",
  "_bfx_referrer": "https://google.com",
  "_bfx_landing_page": "/",
  "_bfx_channel": "social"
}
```

**Output (200):**
```json
{
  "success": true,
  "brevo": true,
  "list": "general",
  "automation": {
    "sequence": "welcome",
    "steps_scheduled": 1,
    "score": 10,
    "tags": ["mobile_user", "instagram_lead"]
  },
  "env": "production"
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Missing or invalid email |
| 405 | Non-POST request |

Note: Returns 200 with `brevo: false` if Brevo API key is missing or Brevo call fails (never breaks frontend UX).

**Dependencies:** `lib/drip.js`, Brevo (Contacts API + Transactional Email API)

**Used by:** Frontend forms (exit intent, newsletter, webinar registration, resource download, mentorship inquiry)

---

## POST /api/booking

**Purpose:** Creates mentorship booking, generates ICS calendar invite, sends confirmation emails.

**Authentication:** None (public endpoint)

**Rate Limit:** 5 requests/minute per IP

**Input:**
```json
{
  "txRef": "bfx-mentorship-group-...",
  "email": "student@example.com",
  "name": "Student Name",
  "productId": "mentorship-group",
  "preferredDay": "Wednesday",
  "preferredTime": "4:00 PM",
  "timezone": "Africa/Lagos",
  "communication": "telegram",
  "focusArea": "Price Action",
  "experience": "Intermediate",
  "notes": "Focus on GBP/USD"
}
```

**Output (200):**
```json
{
  "success": true,
  "bookingId": "uuid",
  "message": "Booking submitted! Check your email for confirmation and calendar invite."
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Missing email/productId, or invalid productId (must be `mentorship-group` or `mentorship-1on1`) |
| 405 | Non-POST request |
| 429 | Rate limit exceeded |
| 500 | Database error |

**Dependencies:** `lib/calendar.js`, Supabase (mentorship_bookings), Brevo (transactional email)

**Used by:** Mentorship booking form (post-payment flow)

---

## GET /api/admin?action=stats

**Purpose:** Returns aggregate statistics for the admin dashboard.

**Authentication:** Supabase JWT + admin email whitelist (`ADMIN_EMAILS` env var)

**Rate Limit:** 30 requests/minute per IP

**Output (200):**
```json
{
  "totalOrders": 42,
  "totalRevenue": 1250000,
  "totalDownloads": 156,
  "totalBookings": 8,
  "eaAddonStats": {
    "count": 12,
    "revenue": 180000,
    "conversionRate": 29
  },
  "productBreakdown": {
    "forex-101": { "count": 25, "revenue": 625000 },
    "mentorship-group": { "count": 10, "revenue": 600000 }
  },
  "recentOrders": [
    {
      "id": "uuid",
      "txRef": "bfx-forex-101-...",
      "productId": "forex-101",
      "amount": 25000,
      "customerEmail": "customer@example.com",
      "status": "successful",
      "fulfilled": true,
      "hasEaAddon": true,
      "createdAt": "2026-06-15T10:30:00Z"
    }
  ]
}
```

**Dependencies:** Supabase (orders, downloads, mentorship_bookings)

**Used by:** `admin/admin.js`

---

## POST /api/admin?action=resend

**Purpose:** Re-sends fulfillment email for a specific order.

**Authentication:** Supabase JWT + admin email whitelist

**Input:**
```json
{ "orderId": "uuid" }
```

**Output (200):**
```json
{ "success": true, "message": "Email resent successfully" }
```

**Dependencies:** `lib/fulfillment.js` (re-runs fulfillOrder with stored order data)

---

## POST /api/admin?action=token

**Purpose:** Generates a new download token for an order.

**Authentication:** Supabase JWT + admin email whitelist

**Input:**
```json
{ "orderId": "uuid" }
```

**Output (200):**
```json
{
  "success": true,
  "token": "base64url.hmac",
  "downloadUrl": "/api/download?token=...",
  "expiresAt": "2026-07-03T10:30:00Z"
}
```

**Dependencies:** `lib/files.js` (token generation), Supabase (access_tokens)

---

## GET /api/health

**Purpose:** Diagnostic health check. Tests connectivity to Brevo and Supabase.

**Authentication:** None

**Output (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-30T12:00:00Z",
  "services": {
    "brevo": { "status": "ok", "latency_ms": 234 },
    "supabase": { "status": "ok", "latency_ms": 89 }
  },
  "environment": {
    "node": "18.x",
    "vercel_env": "production"
  }
}
```

**Dependencies:** Brevo API, Supabase

**Used by:** Manual health checks, uptime monitoring

---

## GET /api/cron-reengagement

**Purpose:** Daily cron job that processes pending drip steps and triggers re-engagement for inactive contacts.

**Authentication:** `CRON_SECRET` bearer token (enforced in production only)

**Schedule:** `0 9 * * *` (daily at 09:00 UTC via Vercel Cron)

**Output (200):**
```json
{
  "timestamp": "2026-06-30T09:00:00Z",
  "success": true,
  "drip": { "processed": 5, "skipped": 12, "errors": [] },
  "reengagement": { "processed": 2, "skipped": 8, "errors": [] },
  "total_contacts_checked": 47
}
```

**Safety Limits:** Max 20 drip emails/run, max 5 re-engagement triggers/run, 60-day cooldown

**Dependencies:** `lib/drip.js`, Brevo (Contacts API + Transactional Email API)

**Used by:** Vercel Cron scheduler

---

## GET /api/market-data

**Purpose:** Provides forex market data and trading information for the chatbot widget.

**Authentication:** None

**Output (200):** Market data JSON (pairs, prices, analysis context)

**Dependencies:** None (data generated server-side)

**Used by:** `chatbot.js`

---

## GET /api/download-forex101

**Purpose:** Legacy download endpoint for the Forex 101 starter pack. Technical debt — should be consolidated into `/api/download`.

**Authentication:** Token-based (similar to `/api/download`)

**Status:** Active but deprecated. Scheduled for removal in Phase 1.

**Dependencies:** `lib/files.js`, Supabase Storage

---

## GET /api/vip-access

**Purpose:** Returns VIP portal data (access verification, content listing).

**Authentication:** Supabase Auth session

**Dependencies:** Supabase (orders, auth)

**Used by:** `vip/welcome.html`
