# SOP: Content Publishing — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Marketing / Engineering

---

## Purpose

Step-by-step guide for creating and publishing new content pages on BossFx Academy.

---

## Adding a New Page

1. **Create the HTML file** in the appropriate directory:
   - Core pages: root directory (`/`)
   - Blog posts: `/blog/`
   - Resource tools: `/resources/{category}/`

2. **Include required head elements:**
   ```html
   <!-- GTM (must be first script in <head>) -->
   <script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-T3R88HZB');</script>
   
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>{Page Title} — BossFx Academy</title>
   <meta name="description" content="{150-char description}">
   <meta property="og:title" content="{Page Title} — BossFx Academy">
   <meta property="og:description" content="{Description}">
   <meta property="og:image" content="https://www.bossfxcademy.com/assets/og-banner.png">
   <meta property="og:url" content="https://www.bossfxcademy.com/{page-path}">
   <meta name="twitter:card" content="summary_large_image">
   <link rel="canonical" href="https://www.bossfxcademy.com/{page-path}">
   ```

3. **Include required scripts** (before `</body>`):
   ```html
   <script src="/config.js"></script>
   <script src="/tracking.js"></script>
   <script src="/bfx-analytics.js"></script>
   <script src="/page-nav.js"></script>
   ```

4. **Add to sitemap.xml:**
   ```xml
   <url>
     <loc>https://www.bossfxcademy.com/{page-path}</loc>
     <lastmod>{YYYY-MM-DD}</lastmod>
     <changefreq>monthly</changefreq>
     <priority>0.7</priority>
   </url>
   ```

5. **Add to navigation** if it's a core page (update nav in relevant HTML files)

6. **Test locally:**
   - `npx live-server` — verify page renders correctly
   - Check browser console for JS errors
   - Verify GTM loads (check dataLayer in console)
   - Test mobile viewport

7. **Commit and deploy:**
   ```bash
   git add {new-file} sitemap.xml
   git commit -m "content: add {page-name} page"
   git push origin main
   ```

8. **Post-deploy:** Verify page is live and analytics are firing

---

## Adding a New Resource Tool

Follow the same steps as above, plus:

1. Place in appropriate subdirectory under `/resources/`:
   - `beginner/` — Beginner tools
   - `challenges/` — Trading challenges
   - `journals/` — Trade journals
   - `prop-firm/` — Prop firm preparation
   - `risk-management/` — Risk tools
   - `templates/` — Trading templates

2. Include interactive CSS if needed (e.g., `bfx-convert.css`)

3. Link from relevant blog posts and product pages as CTAs

---

## Content Checklist

- [ ] Page title is unique and includes "BossFx Academy"
- [ ] Meta description is 150 characters or less
- [ ] OG tags present (title, description, image, url)
- [ ] Twitter card meta tag present
- [ ] Canonical URL set
- [ ] GTM script in `<head>`
- [ ] config.js, tracking.js, bfx-analytics.js loaded
- [ ] Added to sitemap.xml
- [ ] Mobile responsive
- [ ] No console errors
- [ ] At least one CTA linking to a product or lead capture
