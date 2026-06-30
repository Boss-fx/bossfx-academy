# Deployment Guide — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

---

## Overview

BossFx Academy deploys automatically to Vercel on every push to the `main` branch. There is no staging environment (planned in Phase 2). All changes go directly to production.

**Hosting:** Vercel Hobby (free tier)
**Domain:** `www.bossfxcademy.com`
**Deploy trigger:** `git push origin main`

---

## Pre-Deployment Checklist

Before pushing to main:

1. **Test locally** — Run `vercel dev` and test the affected functionality
2. **Check function count** — Verify you haven't exceeded 12 serverless functions (`ls api/ api/webhooks/ | wc -l`)
3. **Verify env vars** — Run `node -e "require('./lib/validate-env').logEnvStatus()"` to check all required vars
4. **Check for secrets** — Ensure no API keys, tokens, or secrets are hardcoded in committed files
5. **Update documentation** — If you changed features, update CLAUDE.md, CHANGELOG.md, and relevant docs
6. **Test payment flow** — If you modified anything in the payment path (script.js, webhook, fulfillment, download), test end-to-end

---

## Deployment Steps

### Standard Deploy
```bash
git add <specific-files>
git commit -m "descriptive commit message"
git push origin main
```

Vercel auto-deploys within 30-60 seconds. Monitor at: Vercel Dashboard → Deployments.

### Verifying Deployment
1. Check Vercel dashboard for deployment status
2. Visit `https://www.bossfxcademy.com/api/health` to verify backend connectivity
3. Check a product checkout flow if payment-related changes were made
4. Check admin dashboard if admin-related changes were made

---

## Rollback

### Quick Rollback (Vercel Dashboard)
1. Go to Vercel Dashboard → Project → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → "Promote to Production"
4. The previous deployment becomes live immediately

### Git Rollback
```bash
git log --oneline -10     # Find the commit to revert to
git revert <commit-hash>  # Create a revert commit
git push origin main      # Deploy the revert
```

Never use `git reset --hard` and force push unless absolutely necessary — it destroys commit history.

---

## Vercel Configuration

### vercel.json Structure

**Headers:**
- `/assets/*` — 1 year immutable cache
- `/*.js`, `/*.css` — 1 day browser cache, 7 day CDN cache
- `/api/*` — Security headers (nosniff, X-Frame-Options: DENY, XSS protection, referrer policy)
- `/admin/*` — noindex, nofollow, X-Frame-Options: DENY
- `/vip/*` — noindex, nofollow, no-cache

**Routes:**
- `/index.html` → 301 redirect to `/` (canonical URL)
- `/downloads/*` → 404 (block direct file access)
- `/api/*` → pass through to serverless functions

**Functions:**
- `api/**/*.js` — 30s max duration

**Crons:**
- `/api/cron-reengagement` — `0 9 * * *` (daily at 09:00 UTC)

---

## Constraints

### Vercel Hobby Plan Limits
| Limit | Value | Current Usage |
|---|---|---|
| Serverless Functions | 12 max | 11/12 |
| Function Duration | 30 seconds max | Configured in vercel.json |
| Bandwidth | 100 GB/month | Well within limits |
| Builds | 6000/month | Well within limits |
| Cron Jobs | 1 per project | 1/1 (daily reengagement) |

### Adding New API Endpoints
Before adding a new `/api/*.js` file:
1. Check current count: `find api -name '*.js' | wc -l` (must be < 12)
2. Consider consolidating into existing router pattern (like `/api/admin.js`)
3. If at 12/12, remove the legacy `/api/download-forex101.js` first

### Environment Variables
All env vars must be set in both:
- `.env.local` — for local development (`vercel dev`)
- Vercel Dashboard — for production deployment

Use `vercel env add <NAME>` or the Vercel Dashboard (Project → Settings → Environment Variables).

---

## Monitoring

### Current Monitoring
- **Vercel Dashboard:** Deployment status, function invocations, errors
- **Browser console:** Client-side errors visible during testing
- **Server logs:** `console.log/error` output visible in Vercel Functions logs

### Checking Logs
1. Vercel Dashboard → Project → Logs (real-time function execution logs)
2. Filter by function name or search for `[Webhook]`, `[Fulfillment]`, `[drip]`, `[cron]` prefixes

### Missing Monitoring (Planned)
- No error alerting (Sentry or Telegram bot — Phase 1/2)
- No uptime monitoring
- No performance monitoring
- No webhook failure notifications

---

## Troubleshooting

### "Function not found" after deploy
- Check file is in `/api/` directory
- Check function count hasn't exceeded 12
- Check `vercel.json` isn't blocking the route

### Webhook not firing
- Verify webhook URL in Flutterwave Dashboard: `https://www.bossfxcademy.com/api/webhooks/flutterwave`
- Check `FLUTTERWAVE_WEBHOOK_HASH` matches the hash in Flutterwave settings
- Check Vercel logs for the function invocation

### Emails not sending
- Verify `BREVO_API_KEY` is set in Vercel production environment
- Check Brevo dashboard for sending limits (free tier: 300 emails/day)
- Check Vercel logs for `[Fulfillment]` or `[drip]` error messages

### Downloads failing
- Check `DOWNLOAD_SECRET` is set and matches between environments
- Verify files exist in Supabase Storage `product-files` bucket
- Check token hasn't expired (72h for standard, 720h for VIP)
- Check product_files table has active entries for the product
