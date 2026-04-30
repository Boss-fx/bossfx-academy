# Custom Domain Setup — BossFX Academy

## Steps

### 1. Add domain in Vercel

1. Go to your Vercel project dashboard
2. Settings → Domains
3. Add `bossfxacademy.com` (or your chosen domain)
4. Vercel will show the DNS records you need to add

### 2. Configure DNS records

At your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.), add:

| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

Note: The A record IP may differ — use the exact value Vercel shows you.

### 3. SSL certificate

Vercel provisions a free SSL certificate automatically once DNS propagates. This usually takes 5–30 minutes but can take up to 48 hours.

### 4. Verify www redirect

Vercel automatically redirects `www.bossfxacademy.com` → `bossfxacademy.com` (or vice versa, based on your primary domain setting).

### 5. Update hardcoded URLs

After connecting your domain, update these references in the codebase:

- Social share links in `blog/*.html` (currently point to `bossfxacademy.com`)
- OG meta tags if you change the domain from what's already set
- Formspree allowed domains (in Formspree dashboard)
- GA4 property settings (in Google Analytics)

### 6. Test

- Visit `https://bossfxacademy.com` — should load with valid SSL
- Visit `https://www.bossfxacademy.com` — should redirect to apex
- Check OG tags with https://cards-dev.twitter.com/validator
- Test email signup form submits correctly
