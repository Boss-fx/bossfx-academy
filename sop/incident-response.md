# SOP: Incident Response — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

---

## Purpose

What to do when something breaks in production. Follow in order of severity.

---

## Severity Levels

| Level | Description | Examples | Response Time |
|---|---|---|---|
| **P0 — Critical** | Revenue flow broken | Webhook failing, payments not processing, downloads broken | Immediate |
| **P1 — High** | Feature broken, customers impacted | Emails not sending, admin dashboard down, booking broken | Within 1 hour |
| **P2 — Medium** | Degraded experience | Analytics not firing, chatbot down, slow page loads | Within 24 hours |
| **P3 — Low** | Cosmetic or minor | Styling issues, typos, non-critical page errors | Next work session |

---

## P0: Payment/Webhook Failure

### Symptoms
- Customers report no email after payment
- Admin dashboard shows missing recent orders
- Flutterwave dashboard shows successful payments not reflected in Supabase

### Diagnosis
1. Check Vercel logs: Dashboard → Functions → filter for `/api/webhooks/flutterwave`
2. Search for `[Webhook]` or `[Fulfillment]` error entries
3. Check Flutterwave dashboard for webhook delivery status

### Resolution Steps
1. **If webhook not receiving:** Verify webhook URL in Flutterwave Dashboard → Settings → Webhooks
2. **If signature failing:** Check `FLUTTERWAVE_WEBHOOK_HASH` matches Flutterwave settings
3. **If payment verification failing:** Check `FLUTTERWAVE_SECRET_KEY` is valid
4. **If database write failing:** Check Supabase status (status.supabase.com), check if project paused
5. **If email failing:** Check Brevo API key and daily sending limits

### Customer Recovery
For each affected customer:
1. Verify payment in Flutterwave dashboard
2. If order exists in Supabase: use Admin Dashboard → Resend
3. If order missing: manually trigger fulfillment or generate download token via Admin → Token

---

## P1: Email System Down

### Symptoms
- Fulfillment emails not arriving
- Drip sequence not progressing
- Booking confirmations missing

### Diagnosis
1. Test Brevo API: `curl -H "api-key: KEY" "https://api.brevo.com/v3/account"`
2. Check Brevo dashboard for sending limits and account status
3. Check Vercel logs for `[drip]` or `[Fulfillment]` errors

### Resolution Steps
1. **API key expired:** Regenerate in Brevo dashboard, update in Vercel
2. **Daily limit hit:** Wait for reset (midnight UTC) or upgrade Brevo plan
3. **Sender blocked:** Check Brevo sender verification status
4. **Code error:** Check recent commits for email-related changes, rollback if needed

---

## P1: Admin Dashboard Inaccessible

### Symptoms
- Login fails
- Dashboard loads but shows no data
- API returns 401 or 500

### Diagnosis
1. Check admin/index.html meta tags for correct Supabase credentials
2. Test Supabase connection: `/api/health`
3. Check `ADMIN_EMAILS` env var includes the login email

### Resolution Steps
1. **Auth failure:** Verify Supabase Auth user exists and is active
2. **API error:** Check `SUPABASE_SERVICE_ROLE_KEY` is valid
3. **No data:** Check Supabase project isn't paused (free tier pauses after 7 days inactivity)

---

## P0: Download System Broken

### Symptoms
- Customers get 401/403/404 when clicking download links
- "Token expired" errors on recent purchases

### Diagnosis
1. Test a download link manually
2. Check `DOWNLOAD_SECRET` env var hasn't changed
3. Check Supabase Storage `product-files` bucket exists and has files

### Resolution Steps
1. **Token verification failing:** `DOWNLOAD_SECRET` changed between token generation and verification — restore original value
2. **Files missing:** Re-upload to Supabase Storage: `node scripts/upload-product-file.js`
3. **Token expired:** Generate new token via Admin Dashboard → Token button

---

## General Rollback Procedure

If a recent deploy caused the issue:

1. Identify the bad commit:
   ```bash
   git log --oneline -10
   ```

2. Immediate rollback via Vercel Dashboard:
   - Deployments → find last good deploy → Promote to Production

3. Then fix the issue properly:
   ```bash
   git revert <bad-commit-hash>
   git push origin main
   ```

---

## Post-Incident

After resolving any P0 or P1 incident:
1. Document what happened and how it was resolved
2. Identify if monitoring would have caught it earlier
3. Update this SOP if the resolution steps were missing or wrong
4. Consider adding automated alerting for the failure mode (see PROJECT_ROADMAP.md Phase 2)
