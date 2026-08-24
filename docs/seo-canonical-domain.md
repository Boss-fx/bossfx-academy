# Canonical Domain & SEO — BossFx Academy

> **Last Updated:** 2026-08-23
> **Owner:** Engineering

---

## Overview

BossFx Academy serves from one canonical host: **`https://bossfxcademy.com`** (no `www`).

This is declared in the markup (`<link rel="canonical">`) *and* enforced at the edge (a 308 redirect from `www`). Both matter — a canonical tag is a hint Google may ignore, a redirect is enforcement.

**Canonical host:** `bossfxcademy.com`
**Redirect:** `www.bossfxcademy.com` → `bossfxcademy.com` (308 Permanent, configured in Vercel → Project → Domains)
**Search Console property:** registered to the non-`www` host

> **Rule:** any new page, sitemap entry, `og:url`, `canonical`, or hardcoded site URL uses **non-`www`**. No exceptions.

---

## The incident this fixed (2026-08-23)

### Symptom

Google Search Console reported almost no data for the property, despite the site being live and crawlable.

### Diagnosis

URL Inspection on `https://bossfxcademy.com/` returned:

```
URL is not on Google
Page indexing: Page is not indexed: Alternative page with proper canonical tag
User-declared canonical:   https://www.bossfxcademy.com/
Google-selected canonical: Same as user-declared canonical
```

Crawling was fine — `Crawl allowed: Yes`, `Page fetch: Successful`, `Indexing allowed: Yes`. The page was simply telling Google *"index the `www` version instead"*, and Google obeyed.

Three compounding problems:

1. **11 pages declared `www` canonicals** (`index`, `about`, `community`, `contact`, `courses`, `disclaimer`, `live`, `mentorship`, `privacy`, `refund`, `terms`) while `sitemap.xml`, `robots.txt` and all 13 blog posts used non-`www`.
2. **No redirect between hosts.** Both `www` and non-`www` returned `200` with byte-identical content (md5-confirmed) — textbook duplicate content.
3. **The Search Console property was the non-`www` prefix**, so it reported on a URL that had been explicitly de-indexed by its own canonical tag.

### Fix

| Change | Commit |
|---|---|
| Journal page canonical → non-`www` | `4f8b007` (then corrected) |
| All 11 page canonicals + `og:url` + `og:image` + `twitter:image` → non-`www` | `e576824` |
| 308 redirect `www` → non-`www` | Vercel dashboard (not in code — see below) |

---

## Why the redirect is not in `vercel.json`

`vercel.json` uses the **legacy `routes` key**. Vercel documents that `routes` cannot be combined with `redirects`, `rewrites`, `cleanUrls` or `trailingSlash`. Adding a `redirects` block risks a *"mixed routing properties"* build failure, which would block all future deploys until unpicked.

The redirect is therefore configured at the **domain level** in the Vercel dashboard, which is Vercel's recommended method for apex/`www` anyway:

**Vercel → Project `bossfx-academy` → Domains → `www.bossfxcademy.com` → Edit → Redirect to `bossfxcademy.com`, 308 Permanent.**

> If `vercel.json` is ever migrated off `routes` to the modern `redirects`/`rewrites` schema, the redirect could move into code. Until then, **it lives in the dashboard** — it will not appear in the repo, so don't go looking for it there.

---

## Verification

Run after any domain, DNS, or `vercel.json` change.

### 1. The redirect fires, permanently

```bash
curl -sI https://www.bossfxcademy.com/ | grep -iE "^HTTP|location"
```

Expect `HTTP/2 308` and `location: https://bossfxcademy.com/`.
**Not** `200` (redirect missing) and **not** `307` (temporary — passes no ranking signal).

### 2. Deep paths are preserved

```bash
for p in courses.html mentorship.html live.html resources/journals/trading-journal.html sitemap.xml; do
  printf "%-46s %s\n" "/$p" "$(curl -sI "https://www.bossfxcademy.com/$p" | grep -i '^location' | tr -d '\r')"
done
```

Every line must redirect to the **same path** on `bossfxcademy.com`. A redirect that dumps everything at `/` silently destroys deep links.

### 3. Query strings survive — **the critical one**

```bash
curl -sI "https://www.bossfxcademy.com/api/download?token=TESTVALUE123" | grep -i '^location'
```

The `?token=…` must arrive intact. Fulfilment emails (`lib/email.js`) send `www` download URLs carrying HMAC tokens; if the redirect drops query params, **every paying customer's download link breaks silently**. Same mechanism protects UTM attribution.

### 4. No redirect loop, and non-`www` serves directly

```bash
curl -s -o /dev/null -L -w "final: %{url_effective}\nhops: %{num_redirects}\nstatus: %{http_code}\n" https://www.bossfxcademy.com/
curl -s -o /dev/null -w "non-www: %{http_code} (redirects: %{num_redirects})\n" https://bossfxcademy.com/
```

Expect 1 hop ending in `200`, and non-`www` serving `200` with **0** redirects.

### 5. No `www` left in served markup

```bash
grep -rln "www\.bossfxcademy" *.html blog/*.html resources/*/*.html
```

Expect no matches.

⚠️ **Never** blind-replace `www.` across the repo — `www.googletagmanager.com`, `www.clarity.ms`, `www.mql5.com`, `www.instagram.com` and `www.tiktok.com` all contain it. Only ever replace the full string `https://www.bossfxcademy.com`.

---

## Deliberate exceptions

These still reference `www` **on purpose**. Do not "fix" them without reading why.

| Location | Why it stays |
|---|---|
| `lib/cors.js` | Allowlists **both** hosts. Defensive — anything still arriving on `www` (old email link, bookmark, third-party referrer) keeps working through the redirect. Harmless. |
| `lib/email.js` (7 refs) | Live token download URLs. They 308 correctly with query strings intact (verified). Changing them is cosmetic and touches the paid-fulfilment path — not worth the risk. |
| `config.js` → `flutterwave.logo`, `script.js:644` | Logo shown inside the Flutterwave checkout modal. Not crawlable, zero SEO effect. |
| `config.js` → `site.url` | Dead value — referenced nowhere in the codebase. |
| `chatbot.js:986` | A user-facing link; redirects fine. |
| `docs/supabase-auth-templates/` (6 files) | Reference copies pasted into the Supabase dashboard, not served pages. Editing here does not change live emails. |

---

## Adding a new page — checklist

1. `<link rel="canonical" href="https://bossfxcademy.com/PATH" />`
2. `og:url`, `og:image`, `twitter:image` → non-`www`
3. Add to `sitemap.xml` with today's `lastmod` (non-`www`)
4. Validate the sitemap still parses:
   ```bash
   python3 -c "import xml.etree.ElementTree as ET; ET.parse('sitemap.xml'); print('ok')"
   ```
5. If the page carries JSON-LD, validate it parses and use non-`www` in every `url` field
6. After deploy, run verification steps 1–5 above

---

## Search Console

**Property:** URL-prefix, `https://bossfxcademy.com/`

**Recommended:** also add a **Domain property** (`bossfxcademy.com`, no protocol, no `www`). It covers every host and protocol at once, so a hostname split like this one can never again hide traffic. Requires a DNS TXT record.

### After a canonical or domain change

1. **URL Inspection** → enter the URL → **Request Indexing**. Daily quota ~10–12, so do money pages first: `/`, `/courses.html`, `/mentorship.html`, `/live.html`.
2. **Indexing → Sitemaps** → resubmit `sitemap.xml` to trigger a recrawl of all listed URLs.
3. Re-inspect after 3–7 days. Success = *User-declared canonical* reads `https://bossfxcademy.com/…` and the "Alternative page with proper canonical tag" status is gone.

### What normal looks like during migration

Full consolidation takes **2–6 weeks**. Expect `www` impressions to **fall** as non-`www` **rises**. That is the migration working, not traffic loss — judge the combined total in the Domain property, never one prefix property alone.

---

## Related

- [deployment.md](deployment.md) — deploy process and rollback
- [architecture.md](architecture.md) — system overview
- `sitemap.xml`, `robots.txt` — both use non-`www`
- `vercel.json` — headers, legacy `routes`, cron
