# Flutterwave Integration — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

---

## Purpose

Flutterwave processes all payments for BossFx Academy. Supports card, bank transfer, USSD, and mobile money payments in Nigerian Naira (NGN).

---

## Environment Variables

| Variable | Purpose | Where to Find |
|---|---|---|
| `FLUTTERWAVE_SECRET_KEY` | Server-side payment verification (API v3) | Flutterwave Dashboard → Settings → API Keys |
| `FLUTTERWAVE_WEBHOOK_HASH` | Webhook signature verification | Flutterwave Dashboard → Settings → Webhooks → Secret Hash |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Alternative name for webhook hash (fallback) | Same as above |

Client-side public key is in `config.js`:
```javascript
BFX.config.flutterwave.publicKey = 'FLWPUBK-bce48ede719bb5397228ffedb549c38b-X'
```

---

## Dashboard Settings

### Webhook URL
Set in Flutterwave Dashboard → Settings → Webhooks:
```
https://www.bossfxcademy.com/api/webhooks/flutterwave
```

### Webhook Events
Enable: `charge.completed` (the only event the handler processes)

### Secret Hash
Set a strong random hash. This value must match the `FLUTTERWAVE_WEBHOOK_HASH` environment variable.

---

## How It Works

### Checkout Flow (Client-Side)
1. Customer clicks "Buy Now" on a product page
2. `script.js` calls `FlutterwaveCheckout()` with:
   - `public_key` from config.js
   - `amount` from product catalog (includes EA addon if selected)
   - `tx_ref`: `bfx-{product-id}-{timestamp}`
   - `customer`: email, phone, name
   - `meta`: `{ product: "product-id", ea_bundle: "yes"|"no" }`
3. Flutterwave modal appears for payment
4. On success: customer redirected to `/payment-success.html?tx_ref=...&status=successful`

### Webhook Flow (Server-Side)
1. Flutterwave sends POST to `/api/webhooks/flutterwave`
2. Handler verifies `verif-hash` header against `FLUTTERWAVE_WEBHOOK_HASH`
3. Handler verifies payment via Flutterwave API: `GET /v3/transactions/{id}/verify`
4. Validates amount matches a product in the catalog
5. Triggers `fulfillOrder()` for fulfillment

### Transaction Reference Format
```
bfx-{product-id}-{timestamp}
```
Examples:
- `bfx-forex-101-1719750000000`
- `bfx-mentorship-group-1719750001234`
- `bfx-vip-1719750002345`

---

## Testing

### Test Mode
Flutterwave provides test API keys. To test:
1. Use test public key in `config.js`
2. Use test secret key in `.env.local`
3. Use test card: `4187 4274 1556 4246` (expiry: any future date, CVV: 828, PIN: 3310, OTP: 12345)

### Webhook Testing
Use Flutterwave's webhook test feature in the dashboard, or:
```bash
curl -X POST https://localhost:3000/api/webhooks/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: your-webhook-hash" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 12345,
      "tx_ref": "bfx-forex-101-test",
      "amount": 25000,
      "currency": "NGN",
      "status": "successful",
      "customer": {
        "email": "test@example.com",
        "name": "Test User"
      }
    }
  }'
```

---

## Common Failures

| Failure | Cause | Fix |
|---|---|---|
| "Invalid public key" in checkout modal | Wrong public key in config.js | Verify config.js `flutterwave.publicKey` matches Flutterwave dashboard |
| Webhook returns 401 | `verif-hash` doesn't match | Verify `FLUTTERWAVE_WEBHOOK_HASH` matches Flutterwave dashboard webhook hash |
| Webhook returns 500 | `FLUTTERWAVE_WEBHOOK_HASH` not set | Add env var to Vercel production environment |
| Payment verified but no email | Brevo API key missing or invalid | Check `BREVO_API_KEY` in Vercel environment |
| "Amount doesn't match any product" | Payment amount not in product catalog | Check `lib/products.js` — amount must exactly match `amountNGN` |
| Duplicate order created | Webhook fired twice | Check `flw_transaction_id` dedup in `lib/orders.js` |

---

## Recovery Steps

### Customer didn't receive email after payment
1. Check Vercel logs for the webhook invocation
2. Look for `[Fulfillment]` log entries with the tx_ref
3. If fulfillment failed: use admin dashboard to resend (Admin → Resend button)
4. If order not in database: manually verify payment in Flutterwave dashboard, then use admin token generation

### Payment successful but order not in database
1. Check Flutterwave dashboard for the transaction
2. Verify webhook URL is correct in Flutterwave settings
3. Check Vercel logs for webhook invocation errors
4. If webhook never fired: contact Flutterwave support for webhook retry
