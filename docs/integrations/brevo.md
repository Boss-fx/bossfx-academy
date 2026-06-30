# Brevo Integration — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

---

## Purpose

Brevo (formerly Sendinblue) handles transactional emails, CRM contact management, and drip automation for BossFx Academy.

---

## Environment Variables

| Variable | Purpose | Where to Find |
|---|---|---|
| `BREVO_API_KEY` | API v3 access for emails and contacts | Brevo Dashboard → SMTP & API → API Keys |
| `SENDER_EMAIL` | From address for transactional emails | Must be verified in Brevo (default: `hello@bossfxcademy.com`) |
| `ADMIN_EMAIL` | Receives admin notifications | Any email address |

---

## Dashboard Settings

### Sender Verification
The `SENDER_EMAIL` must be verified in Brevo:
1. Brevo Dashboard → Senders & IPs → Senders
2. Add sender email and verify via confirmation link
3. For custom domain: add SPF and DKIM DNS records

### Contact Lists
| List ID | Name | Purpose |
|---|---|---|
| 2 | BFX Academy Starter Pack | General signups, exit intent captures |
| 3 | Enthusiast Traders | Webinar registrations |
| 5 | Mentorship Inquiries | Mentorship and coaching leads |
| 6 | Resource Downloaders | Resource/guide/toolkit downloads |

### Contact Attributes
Custom attributes used by the drip engine (must be created in Brevo dashboard):

| Attribute | Type | Purpose |
|---|---|---|
| SOURCE | Text | Lead source identifier |
| PROGRAM | Text | Product/program interest |
| SIGNUP_PAGE | Text | Page where signup occurred |
| SIGNUP_DATE | Text | ISO date of signup |
| UTM_SOURCE | Text | Last-touch UTM source |
| UTM_MEDIUM | Text | Last-touch UTM medium |
| UTM_CAMPAIGN | Text | Last-touch UTM campaign |
| FIRST_TOUCH_SOURCE | Text | First-touch UTM source |
| FIRST_TOUCH_MEDIUM | Text | First-touch UTM medium |
| TRAFFIC_SOURCE | Text | Overall traffic source |
| TRAFFIC_CHANNEL | Text | Marketing channel |
| LANDING_PAGE | Text | First page visited |
| REFERRER | Text | HTTP referrer |
| DEVICE_TYPE | Text | mobile/desktop/tablet |
| EXPERIENCE_LEVEL | Text | Trading experience |
| LEAD_SCORE | Text | Computed lead score |
| AUTOMATION_FLOW | Text | Active drip sequence name |
| AUTOMATION_STEP | Text | Current step in sequence |
| AUTOMATION_START | Text | ISO timestamp of sequence start |
| CONTACT_TAGS | Text | Comma-separated tag list |

---

## How It Works

### Transactional Emails (lib/email.js)
Used for: fulfillment emails, booking confirmations, admin notifications.

4 product-specific email templates:
- **Course template** — download links, Telegram invite, course access instructions
- **Mentorship template** — booking confirmation, scheduling details
- **VIP template** — full access details, EA download, priority support info
- **EA template** — EA download link, MT5 installation guide

Plus: EA addon section (appended when addon purchased with another product), admin notification template.

### CRM Contacts (api/lead-capture.js)
On form submission:
1. Creates or updates Brevo contact (`updateEnabled: true`)
2. Adds to appropriate list based on source
3. Sets all attribution attributes
4. Triggers drip sequence via `lib/drip.js`

### Drip Automation (lib/drip.js)
6 sequences with 2-5 steps each. Step 0 sent immediately on lead creation. Subsequent steps processed by daily cron (`/api/cron-reengagement`).

Email content built by `lib/templates.js` (19+ HTML templates).

---

## Testing

### Send Test Email
```javascript
// In Node.js console with .env.local loaded
require('dotenv').config({ path: '.env.local' });
const { sendFulfillmentEmail } = require('./lib/email');
const { getProduct } = require('./lib/products');
const product = getProduct('forex-101');
product.id = 'forex-101';
sendFulfillmentEmail(
    { name: 'Test User', email: 'your-email@example.com' },
    product, 'test-tx-ref', 'test-token', {}
);
```

### Verify API Key
```bash
curl -H "api-key: YOUR_BREVO_API_KEY" \
  "https://api.brevo.com/v3/account"
```

---

## Common Failures

| Failure | Cause | Fix |
|---|---|---|
| "BREVO_API_KEY not set" | Env var missing | Add to Vercel and .env.local |
| Emails not arriving | Sender not verified in Brevo | Verify sender in Brevo dashboard |
| Contact creation fails with "duplicate" | Contact already exists | SDK's `updateEnabled: true` should handle this; fallback to `updateContact()` |
| Drip emails not sending | Cron job not running or Brevo rate limit | Check Vercel cron logs; check Brevo sending limits |
| Emails going to spam | Missing SPF/DKIM records | Add DNS records per Brevo dashboard instructions |
| "401 Unauthorized" from Brevo API | Invalid or expired API key | Regenerate API key in Brevo dashboard |

---

## Recovery Steps

### Emails Not Sending for New Orders
1. Check Vercel logs for `[Fulfillment] Customer email FAILED` entries
2. Verify BREVO_API_KEY in Vercel: `vercel env ls`
3. Test API key: `curl -H "api-key: KEY" "https://api.brevo.com/v3/account"`
4. Check Brevo dashboard for sending limits (free tier: 300/day)
5. Use admin dashboard Resend button to re-send failed emails

### Drip Sequence Not Progressing
1. Check cron logs in Vercel: Deployments → Functions → `/api/cron-reengagement`
2. Verify contact has `AUTOMATION_FLOW` and `AUTOMATION_START` attributes in Brevo
3. Check if contact's step count matches expected progression
4. Manually trigger cron: `curl https://www.bossfxcademy.com/api/cron-reengagement`

---

## Key Constraints

- **Free tier:** 300 emails/day, unlimited contacts
- **No visual email editor integration:** All templates are HTML in `lib/templates.js`
- **Daily cron pacing:** Drip steps processed once daily (max 20 per run), not in real-time
- **No webhook from Brevo:** Can't track opens/clicks server-side without Brevo webhook setup
