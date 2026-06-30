# Architecture — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

---

## System Overview

BossFx Academy is a static frontend served by Vercel with serverless backend functions (Node.js), a PostgreSQL database (Supabase), payment processing (Flutterwave), transactional email and CRM (Brevo), and a comprehensive analytics stack (GTM, GA4, Meta Pixel, Clarity).

There is no build step. HTML, CSS, and JS files are served directly by Vercel's CDN. Backend functions run as Vercel Serverless Functions with a 30-second timeout.

---

## Architectural Layers

### Layer 1: Static Frontend
- 38 HTML pages served directly from Vercel's CDN
- 7 CSS files (no preprocessor, no PostCSS)
- 7 major client-side JS modules loaded via `<script>` tags
- `config.js` centralizes all client-side configuration (loaded before other scripts)
- No framework, no bundler, no transpilation

### Layer 2: Vercel Serverless Functions
- 11 Node.js functions in `/api/` directory
- Vercel Hobby plan limit: 12 functions max, 30s timeout
- Each function is a standalone HTTP handler exported as `module.exports`
- CommonJS modules (`require`) — not ESM
- Shared logic in `/lib/` (12 modules)

### Layer 3: Supabase (Database + Storage + Auth)
- PostgreSQL with 5 tables
- Row Level Security (RLS) on all tables
- `product-files` storage bucket for digital deliverables
- Auth used for admin dashboard login only
- Client accessed via `@supabase/supabase-js` SDK

### Layer 4: External Services
- **Flutterwave** — payment processing (inline checkout + webhooks + verification API)
- **Brevo** — transactional email, CRM contacts, drip automation
- **Formspree** — contact form processing (frontend only)
- **Telegram** — community access (invite links in emails and pages)

---

## Database Schema

### orders
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| flw_transaction_id | text (unique) | Flutterwave transaction ID — dedup key |
| tx_ref | text | Transaction reference (`bfx-{product}-{timestamp}`) |
| product_id | text | Product slug from catalog |
| amount | numeric | Payment amount in NGN |
| currency | text | Always `NGN` |
| customer_email | text | Buyer email |
| customer_name | text | Buyer name |
| customer_phone | text | Buyer phone |
| status | text | `successful`, `pending`, `failed` |
| fulfilled | boolean | Whether fulfillment email was sent |
| fulfillment_error | text | Error message if email failed |
| meta | jsonb | Extensible metadata (EA addon tracking, etc.) |
| created_at | timestamptz | Order creation time |

### access_tokens
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| order_id | uuid (FK) | References orders.id |
| token | text | HMAC-SHA256 signed token string |
| customer_email | text | Token owner |
| product_id | text | Product this token grants access to |
| product_type | text | `course`, `ea`, `mentorship`, `vip` |
| expires_at | timestamptz | Token expiry time |
| created_at | timestamptz | Token creation time |

### downloads
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| order_id | uuid (FK) | References orders.id |
| token_id | uuid (FK) | References access_tokens.id |
| customer_email | text | Downloader email |
| product_id | text | Downloaded product |
| file_key | text | Supabase Storage file path |
| file_name | text | Display filename |
| ip_address | text | Client IP |
| user_agent | text | Client user agent |
| downloaded_at | timestamptz | Download time |

### product_files
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| product_id | text | Product slug |
| file_key | text | Supabase Storage path |
| file_name | text | Display name |
| file_size | bigint | File size in bytes |
| sort_order | int | Display order |
| active | boolean | Whether file is available |
| created_at | timestamptz | Upload time |

### mentorship_bookings
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| order_id | uuid (FK) | References orders.id |
| customer_email | text | Student email |
| customer_name | text | Student name |
| product_id | text | `mentorship-group` or `mentorship-1on1` |
| preferred_day | text | Preferred session day |
| preferred_time | text | Preferred session time |
| timezone | text | Student timezone (default: Africa/Lagos) |
| communication | text | Preferred method (telegram, whatsapp, zoom) |
| focus_area | text | Study focus area |
| experience | text | Trading experience level |
| notes | text | Additional notes |
| status | text | `pending`, `confirmed`, `completed`, `cancelled` |
| created_at | timestamptz | Booking time |

### RLS Policies (All Tables)
- `service_role`: Full CRUD access (used by backend functions)
- `authenticated`: Read access (used by admin dashboard)
- `public`: Read access on `product_files` only

---

## Key Design Decisions

### Why static HTML instead of a framework?
No build step means instant deployment, zero build failures, and any developer can read and modify the code. The site is content-heavy, not interaction-heavy. SEO benefits from server-rendered HTML. The team is one person — framework overhead isn't justified.

### Why JSONB meta column instead of dedicated columns?
Supabase free tier doesn't provide easy ALTER TABLE access through the dashboard. The JSONB `meta` column on the orders table allows extending order data without schema migrations. Currently used for EA addon tracking (`has_ea_addon`, `ea_addon_price`). Trade-off: no type safety or indexing on meta fields.

### Why consolidated admin endpoint (3-in-1)?
Vercel Hobby plan limits to 12 serverless functions. The admin dashboard needs stats, resend, and token generation — three separate endpoints would consume 3 slots. The router pattern (`?action=stats|resend|token`) keeps it to 1 slot.

### Why in-memory rate limiting?
Simplicity. A Map-based sliding window requires zero external dependencies. Trade-off: state resets on every cold start (5-15 minutes idle). Acceptable for current traffic volume. Should be upgraded to persistent storage (Vercel KV or Supabase) when traffic grows.

### Why Formspree for contact forms but Brevo for everything else?
Formspree was the original form handler before Brevo was integrated. Contact form submissions go to Formspree; lead capture forms go to Brevo via `/api/lead-capture`. This is technical debt — both should use Brevo for unified CRM.

### Why return 200 on webhook errors?
Flutterwave retries webhooks that return non-200 responses. Returning 200 on processing errors prevents infinite retry loops. Errors are logged server-side. This means silent failures are possible — error monitoring (Phase 2 roadmap) will address this.

---

## Security Architecture

### Payment Security
1. **Webhook signature verification:** Flutterwave's `verif-hash` header compared against `FLUTTERWAVE_WEBHOOK_HASH`
2. **Server-side payment verification:** Every webhook payment verified via Flutterwave API v3 before fulfillment
3. **Amount validation:** Payment amount validated against product catalog — no arbitrary amounts accepted
4. **Duplicate protection:** DB-backed dedup on `flw_transaction_id` prevents double fulfillment

### Download Security
1. **HMAC-SHA256 tokens:** Cryptographic tokens with email, product, type, and expiry baked in
2. **Time expiry:** 72h for standard products, 720h for VIP
3. **Type enforcement:** EA files require EA or VIP token — course tokens cannot access EA content
4. **Signed URLs:** Supabase Storage generates short-lived (300s) signed URLs for actual file delivery
5. **Audit trail:** Every download recorded with email, IP, user agent, timestamp

### Admin Security
1. **Supabase Auth:** JWT-based authentication
2. **Email whitelist:** Only emails in `ADMIN_EMAILS` env var can access admin API
3. **Rate limiting:** 30 requests/minute on admin endpoint
4. **noindex headers:** Admin pages have `X-Robots-Tag: noindex, nofollow`

### Infrastructure Security
- Security headers on all API routes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`
- VIP portal: `Cache-Control: no-store, no-cache`
- `/downloads/` path returns 404 (blocked direct access)
- All secrets in environment variables, `.env.local` gitignored
- **Known gap:** No Content Security Policy header (planned in Phase 0)
- **Known gap:** Admin API CORS is `*` instead of production domain (planned in Phase 0)

---

## Data Flow Diagrams

### Payment → Fulfillment Flow
```
Customer → Flutterwave Checkout (client-side)
  ↓
Flutterwave → POST /api/webhooks/flutterwave
  ↓
Verify signature → Verify payment (Flutterwave API) → Validate amount
  ↓
fulfillOrder() [lib/fulfillment.js]
  ├─ createOrder() → Supabase [orders table]
  ├─ generateAccessToken() → HMAC-SHA256 token
  ├─ storeAccessToken() → Supabase [access_tokens table]
  ├─ sendFulfillmentEmail() → Brevo API
  ├─ addToContactList() → Brevo Contacts API
  └─ sendAdminNotification() → Brevo API (admin email)
  ↓
markFulfilled() → Supabase [orders.fulfilled = true]
```

### Lead Capture → Drip Flow
```
Frontend form → POST /api/lead-capture
  ↓
Create/update Brevo contact (with attribution data)
  ↓
processNewLead() [lib/drip.js]
  ├─ getSequenceForSource() → determine sequence
  ├─ calculateScore() → lead scoring
  ├─ assignTags() → tag assignment
  ├─ triggerSequence() → send step 0 email immediately
  └─ updateAutomationState() → store flow/step/score on Brevo contact
  ↓
Daily cron [/api/cron-reengagement]
  ├─ Check each contact's automation state
  ├─ If next step due → processNextStep() → send email
  └─ If inactive 30+ days → trigger re-engagement sequence
```

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@getbrevo/brevo` | latest | Brevo (Sendinblue) email and CRM SDK |
| `@supabase/supabase-js` | ^2 | Supabase client for DB, Storage, Auth |
| `dotenv` | latest | Load .env.local in development |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `live-server` | latest | Local static file server |
| `pg` | latest | PostgreSQL client for admin scripts |
