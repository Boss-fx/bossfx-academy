# SOP: Email Operations — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Marketing / Engineering

---

## Purpose

Guide for managing email templates, drip sequences, and email campaigns.

---

## Email System Overview

| System | Purpose | Files |
|---|---|---|
| Brevo Transactional | Fulfillment emails, booking confirmations, admin alerts | `lib/email.js`, `lib/templates.js` |
| Brevo Drip | Automated sequences (welcome, webinar, resource, mentorship, exit intent, re-engagement) | `lib/drip.js`, `lib/templates.js` |
| Formspree | Contact form submissions only | `contact.html` |

---

## Modifying Email Templates

### Fulfillment Emails (lib/email.js)

1. Identify the template function: `courseEmailContent()`, `mentorshipEmailContent()`, `vipEmailContent()`, `eaEmailContent()`
2. Edit the HTML string in the function
3. Maintain the existing structure: header → product details → CTA button → deliverables list → footer
4. Keep the Telegram invite link from `product.telegramInvite`
5. Keep the download token link format: `/api/download?token=${downloadToken}`

### Drip Sequence Emails (lib/templates.js)

1. Find the template by key (e.g., `welcome_1`, `resource_2`, `mentorship_3`)
2. Each template has: `subject`, `tags[]`, and `html()` function
3. Edit the HTML returned by `html()`
4. Personalization: use `{{ contact.FIRSTNAME | default:"Trader" }}` (Brevo template syntax)
5. Unsubscribe: always include `{{ unsubscribe }}` link (Brevo variable)

### Testing Email Changes

```bash
# Start local dev
vercel dev

# Test via the health endpoint or manual trigger
# Or use the Node.js test approach:
node -e "
require('dotenv').config({path:'.env.local'});
const {sendFulfillmentEmail} = require('./lib/email');
const {getProduct} = require('./lib/products');
const p = getProduct('forex-101'); p.id = 'forex-101';
sendFulfillmentEmail({name:'Test', email:'YOUR_EMAIL'}, p, 'test-ref', 'test-token', {});
"
```

---

## Adding a New Drip Sequence

1. Define the sequence in `lib/drip.js` → `SEQUENCES` object:
   ```javascript
   new_sequence: {
       name: 'Sequence Name',
       listKey: 'general',
       steps: [
           { template: 'new_seq_1', delay: 0 },
           { template: 'new_seq_2', delay: 24 },
           { template: 'new_seq_3', delay: 72 }
       ]
   }
   ```

2. Create templates in `lib/templates.js` for each step (`new_seq_1`, `new_seq_2`, `new_seq_3`)

3. Add source mapping in `lib/drip.js` → `getSequenceForSource()`:
   ```javascript
   if (s.includes('new_trigger')) return 'new_sequence';
   ```

4. Test: submit a lead capture form with the matching source

---

## Modifying Lead Scoring

Edit `lib/drip.js` → `SCORE_RULES`:
```javascript
const SCORE_RULES = {
    signup: 10,
    webinar_registration: 25,
    resource_download: 15,
    mentorship_inquiry: 40,
    exit_intent_capture: 5,
    // Add new scoring rules here
};
```

---

## Brevo Daily Limits

- **Free tier:** 300 emails/day
- **Drip cron safety limits:** Max 20 drip + 5 re-engagement per daily run = 25 emails/day from cron
- **Fulfillment emails:** ~1-5 per day (depends on sales volume)
- **Remaining daily capacity:** ~270 emails for other purposes

---

## Email Checklist

- [ ] Subject line is clear and compelling (under 60 chars)
- [ ] Sender name is "BossFx Academy"
- [ ] From address matches `SENDER_EMAIL` (verified in Brevo)
- [ ] Unsubscribe link present ({{ unsubscribe }})
- [ ] Mobile-responsive HTML (inline CSS, max-width tables)
- [ ] All links are absolute URLs (https://www.bossfxcademy.com/...)
- [ ] CTA button has clear action text
- [ ] Tested by sending to a real email address
