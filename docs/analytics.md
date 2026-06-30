# Analytics Implementation — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering / Marketing

---

## Analytics Stack

| Service | ID | Purpose | Integration Method |
|---|---|---|---|
| Google Tag Manager | GTM-T3R88HZB | Tag management, event routing | Inline script in all HTML `<head>` sections |
| Google Analytics 4 | G-ZFQ9P5KFSJ | Traffic, behavior, conversions | Via GTM + config.js |
| Meta Pixel | 804009589230621 | Facebook/Instagram ad attribution | Via tracking.js |
| Microsoft Clarity | wnde2od79f | Heatmaps, session recordings, rage clicks | Via config.js |

---

## Client-Side Files

### tracking.js
Primary analytics layer loaded on all pages. Responsibilities:
- GTM container verification (checks dataLayer exists and GTM loaded)
- Meta Pixel initialization and `PageView` event
- dataLayer event standardization
- Event tracking: `generate_lead`, `purchase`, `outbound_click`, `whatsapp_click`, `newsletter_signup`, `checkout_start`
- Debug panel for analytics verification (activated via console)

### bfx-analytics.js (921 lines, 11 modules)
Advanced analytics engine that extends the base tracking layer:

1. **UTM Attribution Engine** — First-touch and last-touch attribution stored in localStorage. Captures: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`. Persists across sessions.

2. **Form Attribution Injection** — Automatically injects hidden fields into all forms with attribution data (`_bfx_utm_source`, `_bfx_ft_source`, `_bfx_landing_page`, `_bfx_referrer`, `_bfx_device`, `_bfx_channel`).

3. **Event Taxonomy Standardization** — Normalizes event names across GA4, Pixel, and Clarity to a consistent naming convention.

4. **Missing Event Trackers** — Adds tracking for events not covered by GTM: pricing section views, broker link clicks, video watch events, CTA button clicks.

5. **Clarity Enhancement** — Pushes custom tags to Clarity for segmentation (traffic source, device type, user engagement level).

6. **Mobile Intelligence** — Tracks orientation changes, tap zone mapping, thumb-zone interaction patterns. Useful for UX optimization on mobile (60%+ of traffic).

7. **Engagement Scoring** — Client-side scoring based on: scroll depth, time on page, interactions, pages visited. Score stored in localStorage and passed to lead capture forms.

8. **Conversion Flow Tracking** — Tracks funnel progression: landing → content viewed → pricing seen → checkout started → payment completed.

9. **Social Outbound Tracking** — Tracks clicks to Telegram, Instagram, YouTube, X, TikTok with platform attribution.

10. **GA4 Enhanced Ecommerce** — Pushes ecommerce events: `view_item`, `add_to_cart`, `begin_checkout`, `purchase` with product-level detail.

11. **Analytics Health Check** — Self-diagnostic that verifies GTM loaded, Pixel initialized, GA4 receiving events, Clarity active.

### config.js
Stores analytics IDs and configuration:
```javascript
BFX.config = {
    ga4Id: 'G-ZFQ9P5KFSJ',
    clarityId: 'wnde2od79f',
    // ... other config
};
```

---

## UTM Naming Conventions

### Source Values
| Source | Usage |
|---|---|
| `instagram` | Instagram organic or paid |
| `facebook` | Facebook organic or paid |
| `tiktok` | TikTok organic or paid |
| `google` | Google Ads |
| `youtube` | YouTube organic |
| `twitter` | X (Twitter) |
| `telegram` | Telegram community links |
| `email` | Email campaigns |
| `direct` | Direct traffic |

### Medium Values
| Medium | Usage |
|---|---|
| `social` | Organic social media posts |
| `paid_social` | Paid social media ads |
| `cpc` | Google Ads cost-per-click |
| `email` | Email newsletters and drip |
| `referral` | Third-party website referrals |
| `organic` | Organic search |

### Campaign Naming
Format: `{year}-{month}-{campaign-slug}`
Example: `2026-06-mentorship-launch`

### UTM Link Format
```
https://www.bossfxcademy.com/courses.html?utm_source=instagram&utm_medium=paid_social&utm_campaign=2026-06-course-promo&utm_content=carousel-1
```

---

## GA4 Events Tracked

| Event | Trigger | Parameters |
|---|---|---|
| `page_view` | Page load | page_title, page_location |
| `generate_lead` | Form submission | source, email (hashed), program |
| `begin_checkout` | Checkout button click | product_id, value, currency |
| `purchase` | Payment success page load | transaction_id, value, items |
| `view_item` | Product section scroll into view | product_id, product_name, price |
| `add_to_cart` | EA addon checkbox selected | product_id: ea-bundle, value: 15000 |
| `outbound_click` | External link click | link_url, link_domain |
| `whatsapp_click` | WhatsApp link click | — |
| `newsletter_signup` | Newsletter form submission | source |
| `cta_click` | CTA button click | cta_text, cta_location |

---

## Meta Pixel Events

| Event | Trigger | Parameters |
|---|---|---|
| `PageView` | Every page load | — |
| `Lead` | Form submission | content_name: source |
| `InitiateCheckout` | Checkout button click | content_ids, value, currency |
| `Purchase` | Payment success | value, currency, content_ids |
| `ViewContent` | Product section view | content_name, content_ids |

---

## Attribution Data Flow

```
Visitor arrives with UTM params
  ↓
bfx-analytics.js stores in localStorage:
  - First-touch: saved only once, never overwritten
  - Last-touch: updated on every visit with UTM params
  ↓
Form submission triggers:
  - bfx-analytics.js injects hidden fields into form
  - Hidden fields contain: UTM data, referrer, landing page, device, channel
  ↓
POST /api/lead-capture receives attribution data
  ↓
Brevo contact created/updated with attributes:
  UTM_SOURCE, UTM_MEDIUM, UTM_CAMPAIGN, UTM_CONTENT,
  FIRST_TOUCH_SOURCE, FIRST_TOUCH_MEDIUM,
  TRAFFIC_SOURCE, TRAFFIC_CHANNEL, LANDING_PAGE, REFERRER
```

---

## Debugging Analytics

### Browser Console
The analytics engine logs to console with prefixes:
- `[BFX Analytics]` — bfx-analytics.js events
- `[Tracking]` — tracking.js events
- GTM debug: Enable GTM Preview mode in GTM dashboard

### Debug Panel
Activate via browser console:
```javascript
BFX.analytics.debug();  // Shows analytics health check status
```

### Verifying Events
1. **GA4:** Google Analytics → Realtime → Events
2. **Meta Pixel:** Facebook Events Manager → Test Events
3. **Clarity:** Clarity Dashboard → Recordings (filter by custom tags)
4. **GTM:** GTM Preview mode (Tag Assistant)

---

## Future Improvements
- [ ] Server-side Conversions API for Meta Pixel (bypass ad blockers)
- [ ] GA4 Measurement Protocol for server-side events
- [ ] Looker Studio dashboard for unified analytics view
- [ ] A/B testing framework integration
- [ ] Custom Clarity events for funnel step tracking
