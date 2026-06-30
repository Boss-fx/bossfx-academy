# AUTOMATION_MAP.md — BossFx Academy Automated Workflows

> **Last Updated:** 2026-06-30
> **Owner:** Engineering
> **Purpose:** Document every automated workflow, its trigger, action, failure handling, and improvement opportunities.

---

## 1. Lead Capture → CRM → Drip Sequence

**Status:** Active
**Endpoint:** `POST /api/lead-capture`
**Files:** `api/lead-capture.js`, `lib/drip.js`, `lib/templates.js`

| Field | Value |
|---|---|
| **Trigger** | Frontend form submission (exit intent, newsletter, webinar registration, resource download, mentorship inquiry) |
| **Action** | 1. Validate email → 2. Create/update Brevo contact with attribution data → 3. Add to appropriate Brevo list → 4. Determine drip sequence → 5. Calculate lead score → 6. Assign tags → 7. Send immediate email (step 0) → 8. Store automation state on contact |
| **External Services** | Brevo (Contacts API + Transactional Email API) |
| **Brevo Lists** | general: 2, webinar: 3, mentorship: 5, resource: 6, exit_intent: 2 |
| **Fallback** | If Brevo API key missing: returns success without CRM action. If contact creation fails with duplicate: attempts update. If automation engine errors: logs but returns success (non-blocking). |
| **Failure Handling** | All errors caught and logged. Frontend always receives success response to avoid breaking user experience. |
| **Source Mapping** | `webinar*` → webinar list, `mentorship/coaching/funded/vip/strategy_call` → mentorship list, `resource/magnet/starter/ebook/guide/pdf/download/toolkit` → resource list, `exit_intent*` → general list, everything else → general list |

### Drip Sequences

| Sequence | Steps | Timing | Trigger Source |
|---|---|---|---|
| **Welcome** | 4 steps | Immediate, +24h, +72h, +120h | General signups |
| **Webinar** | 2 steps | Immediate, +48h | Webinar registration |
| **Resource** | 3 steps | Immediate, +48h, +96h | Resource/PDF downloads |
| **Mentorship** | 3 steps | Immediate, +24h, +72h | Mentorship/coaching inquiries |
| **Exit Intent** | 2 steps | Immediate, +24h | Exit intent popup captures |
| **Re-engagement** | 3 steps | Immediate, +72h, +168h | Cron-triggered for inactive contacts |

### Lead Scoring

| Action | Points |
|---|---|
| Any signup | +10 |
| Webinar registration | +25 |
| Resource download | +15 |
| Mentorship inquiry | +40 |
| Exit intent capture | +5 |

### Attribution Data Captured

UTM source, medium, campaign, content. First-touch source and medium. Traffic source, channel, landing page, referrer. Device type. Experience level (webinar/mentorship forms). Signup date, page URL.

### Future Improvements
- [ ] Sync lead scores to Brevo for segmented campaigns
- [ ] Abandoned cart sequence (email captured pre-checkout but no purchase)
- [ ] Post-purchase upsell sequences
- [ ] Review collection sequence (7 days post-purchase)

---

## 2. Payment → Fulfillment → Delivery

**Status:** Active
**Endpoint:** `POST /api/webhooks/flutterwave`
**Files:** `api/webhooks/flutterwave.js`, `lib/fulfillment.js`, `lib/orders.js`, `lib/email.js`, `lib/files.js`, `lib/products.js`

| Field | Value |
|---|---|
| **Trigger** | Flutterwave webhook: `charge.completed` with `status: successful` |
| **Action** | 1. Verify webhook signature → 2. Verify payment via Flutterwave API → 3. Validate amount against product catalog → 4. Check for duplicate (DB-backed by flw_transaction_id) → 5. Detect product (tx_ref pattern → meta → amount) → 6. Create order in Supabase → 7. Detect EA addon → 8. Generate download token(s) → 9. Store tokens in DB → 10. Send fulfillment email + admin notification (parallel) → 11. Add to Brevo contact list → 12. Mark order as fulfilled |
| **External Services** | Flutterwave (verification API), Brevo (email + contacts), Supabase (orders, access_tokens) |
| **Fallback** | If DB write fails: continues with email delivery. If token generation fails: logs warning but continues. If email fails: logs error, records failure in DB. If admin notification fails: logs but doesn't affect customer delivery. |
| **Failure Handling** | Returns HTTP 200 to Flutterwave on all outcomes (prevents infinite retries). Unmatched payments trigger admin notification. All errors logged with `[Fulfillment]` prefix. |
| **Duplicate Protection** | DB-backed check on `flw_transaction_id`. If order exists and is fulfilled, returns `duplicate` status immediately. |

### Product Detection Order
1. TX ref pattern match: `bfx-{product-id}-{timestamp}`
2. Meta field: `paymentData.meta.product`
3. Amount fallback: match against product catalog amounts

### EA Addon Detection
- Check `meta.ea_bundle === 'yes'` or `meta.has_ea_addon === true`
- Generate separate EA download token (type: `ea`, 72h expiry)
- Append EA bonus card to fulfillment email
- Track in order's JSONB meta: `has_ea_addon: true, ea_addon_price: 15000`

### Token Expiry
| Product Type | Expiry |
|---|---|
| Course | 72 hours |
| EA | 72 hours |
| Mentorship | 72 hours |
| VIP | 720 hours (30 days) |

### Future Improvements
- [ ] Webhook failure alerting via Telegram bot
- [ ] Retry logic with idempotency for transient failures
- [ ] Failed payment recovery emails
- [ ] Post-purchase upsell email (course → mentorship, mentorship → VIP)

---

## 3. Download → Token Verification → File Delivery

**Status:** Active
**Endpoint:** `GET /api/download?token=...`
**Files:** `api/download.js`, `lib/files.js`

| Field | Value |
|---|---|
| **Trigger** | Customer clicks download link (from fulfillment email or success page) |
| **Action** | 1. Verify HMAC-SHA256 token → 2. Check expiry → 3. Enforce type (EA requires `ea` or `vip` token) → 4. Look up product files from Supabase → 5. Generate signed Supabase Storage URL (300s) → 6. Record download in audit log → 7. Redirect to signed URL |
| **External Services** | Supabase (Storage + Database) |
| **Fallback** | If token invalid/expired: returns 401/403 with descriptive error. If no files found: returns 404. |
| **Failure Handling** | Token verification is cryptographic — no database dependency for auth check. Download recording is non-blocking (fails silently if DB unavailable). |

### Access Control Rules
- Token must have valid HMAC signature
- Token must not be expired
- EA files require token type `ea` or `vip` (course tokens cannot access EA files)
- VIP tokens can access all products

### Future Improvements
- [ ] Download count limits per token
- [ ] IP-based abuse detection
- [ ] Bandwidth monitoring

---

## 4. Mentorship Booking → Calendar → Notification

**Status:** Active
**Endpoint:** `POST /api/booking`
**Files:** `api/booking.js`, `lib/calendar.js`

| Field | Value |
|---|---|
| **Trigger** | Student submits booking form after mentorship purchase |
| **Action** | 1. Validate product ID (must be `mentorship-group` or `mentorship-1on1`) → 2. Link to order if tx_ref provided → 3. Save booking to Supabase → 4. Generate ICS calendar invite → 5. Send confirmation email to student (with .ics attachment) → 6. Send notification email to admin |
| **External Services** | Brevo (transactional email), Supabase (mentorship_bookings) |
| **Fallback** | If Brevo API key missing: booking saved to DB but no email sent. If DB unavailable: returns 500 error. |
| **Failure Handling** | Email failure is non-blocking (booking still recorded). Rate limited: 5 requests per minute per IP. |
| **Rate Limit** | 5 requests/minute (in-memory, resets on cold start) |

### Future Improvements
- [ ] Google Calendar API integration (auto-create event)
- [ ] Automated reminder 24h before session
- [ ] Booking status management in admin dashboard (confirm/reschedule/cancel)

---

## 5. Daily Cron → Drip Processing → Re-engagement

**Status:** Active
**Endpoint:** `GET /api/cron-reengagement`
**Schedule:** Daily at 09:00 UTC (Vercel Cron)
**Files:** `api/cron-reengagement.js`, `lib/drip.js`

| Field | Value |
|---|---|
| **Trigger** | Vercel Cron schedule: `0 9 * * *` |
| **Action** | **Phase 1 (Drip):** Fetch contacts from all 4 Brevo lists → Check each contact's automation state → If next drip step is due (elapsed time ≥ step delay): send email and update step counter. Max 20 drip emails per run. **Phase 2 (Re-engagement):** Find contacts who signed up > 30 days ago and completed their original sequence → Trigger re-engagement sequence (3 emails). Max 5 re-engagement triggers per run. |
| **External Services** | Brevo (Contacts API + Transactional Email API) |
| **Fallback** | If Brevo API key missing: returns 500. Individual email failures logged but don't stop the run. |
| **Failure Handling** | Each contact processed independently. Single contact failure doesn't block others. All results returned in response JSON for monitoring. |
| **Safety Limits** | Max 20 drip emails/run, max 5 re-engagement triggers/run, 60-day cooldown between re-engagement attempts for same contact. High-value contacts (mentorship flow) excluded from re-engagement. |

### Future Improvements
- [ ] Run results → Telegram notification (daily digest)
- [ ] A/B testing different re-engagement templates
- [ ] Smarter re-engagement triggers (based on page visits, not just time)

---

## 6. Client-Side Analytics Tracking

**Status:** Active
**Files:** `tracking.js`, `bfx-analytics.js`, `config.js`

| Field | Value |
|---|---|
| **Trigger** | Page load, user interactions (clicks, scrolls, form submissions, checkout, navigation) |
| **Action** | **tracking.js:** GTM verification, Meta Pixel loading, dataLayer events (generate_lead, purchase, outbound_click, whatsapp_click, newsletter_signup, checkout_start). **bfx-analytics.js (11 modules):** 1. UTM attribution (first-touch + last-touch via localStorage), 2. Form attribution injection (hidden fields), 3. Event taxonomy standardization, 4. Missing event trackers (pricing views, broker clicks, video watches, CTA clicks), 5. Clarity enhancement, 6. Mobile intelligence (orientation, tap zones, thumb-zone mapping), 7. Engagement scoring, 8. Conversion flow tracking, 9. Social outbound tracking, 10. GA4 enhanced ecommerce events, 11. Analytics health check |
| **External Services** | Google Tag Manager (GTM-T3R88HZB), Google Analytics 4 (G-ZFQ9P5KFSJ), Meta Pixel (804009589230621), Microsoft Clarity (wnde2od79f) |
| **Fallback** | All analytics code wrapped in try/catch. Missing services don't break page functionality. Debug panel available for verification. |
| **Failure Handling** | Silent failure — analytics errors never affect user experience. Console warnings for missing GTM/Pixel. |

### Future Improvements
- [ ] Server-side event tracking (Conversions API for Meta, Measurement Protocol for GA4)
- [ ] Custom Clarity events for funnel steps
- [ ] Analytics dashboard (Looker Studio or custom)

---

## 7. Contact Form → Formspree

**Status:** Active
**File:** `contact.html`

| Field | Value |
|---|---|
| **Trigger** | Contact form submission on contact.html |
| **Action** | Fetch POST to `https://formspree.io/f/xeenzyna` with name, email, subject, message |
| **External Services** | Formspree |
| **Fallback** | None — Formspree is the only handler |
| **Failure Handling** | Frontend shows error message if fetch fails |

### Future Improvements
- [ ] Route contact forms through /api/lead-capture to also capture in Brevo CRM
- [ ] Auto-reply email via Brevo
- [ ] Telegram notification for new contact form submissions

---

## 8. Admin Dashboard → Stats/Resend/Token

**Status:** Active
**Endpoint:** `GET/POST /api/admin?action=stats|resend|token`
**Files:** `api/admin.js`, `admin/index.html`, `admin/admin.js`

| Field | Value |
|---|---|
| **Trigger** | Admin user loads dashboard or takes action (resend email, generate token) |
| **Action** | **stats:** Aggregate orders, downloads, bookings, EA addon stats from Supabase. **resend:** Re-trigger fulfillOrder() for a specific order ID. **token:** Generate new download token for an order. |
| **External Services** | Supabase (database queries), Brevo (email via fulfillOrder on resend) |
| **Authentication** | Supabase JWT token + email whitelist (ADMIN_EMAILS env var) |
| **Fallback** | If Supabase unavailable: returns 500. If admin email not whitelisted: returns 401. |
| **Rate Limit** | 30 requests/minute (in-memory) |

### Future Improvements
- [ ] Pagination for orders/downloads/bookings
- [ ] Date range filtering
- [ ] Export to CSV
- [ ] Order status management (refund, cancel)
- [ ] Customer lookup by email

---

## 9. Payment Verification (Client-Side)

**Status:** Active
**Endpoint:** `GET /api/verify-payment?tx_ref=...`
**Files:** `api/verify-payment.js`

| Field | Value |
|---|---|
| **Trigger** | payment-success.html loads and calls verify endpoint with tx_ref from URL |
| **Action** | 1. Look up order in Supabase by tx_ref → 2. Return order details including product info, download token, files list, EA addon status |
| **External Services** | Supabase (orders, product_files, access_tokens) |
| **Fallback** | If order not found: attempts Flutterwave API verification as backup |
| **Failure Handling** | Returns structured error with guidance message for customer |

### Future Improvements
- [ ] Cache verification results to reduce DB queries on page refresh

---

## 10. Conversion Optimization (Client-Side)

**Status:** Active
**Files:** `bfx-convert.js`, `bfx-convert.css`

| Field | Value |
|---|---|
| **Trigger** | Page load + user behavior signals (scroll depth, time on page, exit intent) |
| **Action** | Exit intent popup, sticky CTAs, social proof notifications, urgency elements, scroll-triggered offers |
| **External Services** | None (pure client-side) |
| **Failure Handling** | All features wrapped in try/catch. Failures don't affect core page. |

### Future Improvements
- [ ] A/B testing framework for popup variants
- [ ] Personalization based on UTM source
- [ ] Returning visitor detection and messaging

---

## 11. AI Chatbot

**Status:** Active
**Files:** `chatbot.js`, `chatbot.css`, `api/market-data.js`

| Field | Value |
|---|---|
| **Trigger** | User clicks chatbot widget |
| **Action** | BossFx Mirror AI — answers forex trading questions, provides market data, recommends products |
| **External Services** | /api/market-data endpoint for live data |
| **Failure Handling** | Graceful degradation to static responses if API unavailable |

### Future Improvements
- [ ] LLM-powered responses (Claude API or similar)
- [ ] Conversation history persistence
- [ ] Product recommendation engine

---

## Automations Not Yet Implemented (Planned)

| Automation | Priority | Phase | Description |
|---|---|---|---|
| Webhook failure alerting | Critical | 2 | Telegram bot notification when webhook processing fails |
| Abandoned checkout recovery | High | 3 | Email sequence when checkout is started but not completed |
| Post-purchase upsell | High | 3 | Course buyer → mentorship email, mentorship → VIP email |
| Review collection | Medium | 3 | 7-day post-purchase email requesting testimonial |
| Referral tracking | High | 4 | Discount codes with referral attribution |
| WhatsApp notifications | Medium | 4 | Order confirmations and drip via WhatsApp Business API |
| Automated backups | Medium | 4 | Daily Supabase pg_dump to cloud storage |
| Mentorship reminders | Medium | 4 | 24h reminder before scheduled session |
