# SOP: Customer Support — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Operations

---

## Purpose

Step-by-step procedures for common customer support scenarios.

---

## Customer Didn't Receive Download Email

### Quick Check
1. Open Admin Dashboard → Orders tab
2. Search by customer email
3. Check the order status and fulfilled column

### If Order Exists and Fulfilled = true
The email was sent but may have gone to spam.
1. Ask customer to check spam/junk folder
2. If not found: click **Resend** button in admin dashboard
3. If resend fails: click **Token** button to generate new download link, send manually

### If Order Exists and Fulfilled = false
Fulfillment failed (email not sent).
1. Click **Resend** button — this re-triggers the full fulfillment flow
2. Check Vercel logs for the error if resend also fails
3. As last resort: click **Token** button and send download link manually

### If Order Does NOT Exist
Payment was received but webhook may have failed.
1. Check Flutterwave dashboard for the transaction (search by customer email)
2. If payment confirmed: generate a download token via admin dashboard (you'll need to create the order manually or use a direct Supabase insert)
3. Send download link to customer manually

---

## Customer's Download Link Expired

Token expiry: 72 hours for standard products, 720 hours (30 days) for VIP.

1. Open Admin Dashboard → Orders tab
2. Find the customer's order
3. Click **Token** button
4. Copy the generated download URL
5. Send to customer

---

## Customer Wants a Different Product

1. Verify original purchase in Flutterwave dashboard
2. If valid exchange request:
   - Generate new download token for the requested product via Admin → Token
   - Send new download link to customer
   - Note the exchange in order notes (if applicable)

---

## Customer Reports Payment Error

### Payment Failed
1. Check Flutterwave dashboard for failed transaction
2. Common causes: insufficient funds, card declined, network timeout
3. Advise customer to retry or use a different payment method

### Payment Deducted But No Confirmation
1. Check Flutterwave dashboard — is the transaction `successful`?
2. If successful but no order in admin: webhook may have failed (see "Order Does NOT Exist" above)
3. If pending in Flutterwave: ask customer to wait — some payment methods take time to confirm

---

## Mentorship Booking Issues

### Booking Confirmation Not Received
1. Check Admin Dashboard → Bookings tab
2. If booking exists: email was sent but may be in spam
3. If booking doesn't exist: ask customer to resubmit the booking form

### Reschedule Request
1. Note the new preferred time
2. Update the booking in the admin dashboard or Supabase directly
3. Confirm new time with the student via email/Telegram

---

## Refund Request

1. Review the refund policy (refund.html)
2. If eligible:
   - Process refund in Flutterwave dashboard
   - Update order status in Supabase if needed
   - Confirm refund with customer
3. If not eligible: explain the refund policy and offer alternatives

---

## Common Customer Questions

| Question | Answer |
|---|---|
| "How do I access the course?" | Check email (including spam) for download link. If not found, we'll resend. |
| "How do I install the EA?" | The fulfillment email includes installation guide. Also: mql5.com/en/market/product/174970 |
| "How do I join the Telegram group?" | Click the Telegram link in your purchase confirmation email. |
| "Can I get a refund?" | Review refund policy at bossfxcademy.com/refund.html |
| "When is my mentorship session?" | Check your email for booking confirmation with calendar invite. Timilehin confirms within 24h. |
| "Do I get lifetime access?" | Course and VIP: yes, lifetime access. Mentorship: monthly subscription. |

---

## Support Channels

| Channel | Usage |
|---|---|
| Email | hello@bossfxcademy.com (via Formspree contact form) |
| Telegram | Community group for general questions |
| Instagram DM | @bossfx_academy |
| WhatsApp | Direct messaging (no API integration yet) |
