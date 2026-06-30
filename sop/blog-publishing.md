# SOP: Blog Post Publishing — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Marketing / Engineering

---

## Purpose

Step-by-step guide for writing, publishing, and promoting blog posts.

---

## Step 1: Create the Post

1. Copy the blog template:
   ```bash
   cp blog/_template.html blog/{slug}.html
   ```

2. Slug format: lowercase, hyphenated, keyword-rich
   - Good: `best-forex-pairs-beginners.html`
   - Bad: `post-12.html`

3. Fill in the template:
   - Title (H1 and `<title>` tag)
   - Meta description (unique, 150 chars, includes primary keyword)
   - OG tags (title, description, image, url)
   - Canonical URL
   - JSON-LD structured data (Article schema)
   - Post content with proper heading hierarchy (H2, H3)
   - Author, date, category
   - Internal links to relevant product pages or resources

---

## Step 2: JSON-LD Structured Data

Every blog post must include Article schema:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Post Title",
  "description": "Meta description",
  "author": {
    "@type": "Person",
    "name": "Timilehin Shobande"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BossFx Academy",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.bossfxcademy.com/assets/logo.png"
    }
  },
  "datePublished": "2026-06-30",
  "dateModified": "2026-06-30",
  "image": "https://www.bossfxcademy.com/assets/og-banner.png"
}
</script>
```

---

## Step 3: Internal Linking

Every blog post should include:
- At least 2 internal links to other blog posts
- At least 1 link to a product page (course, mentorship, or EA)
- At least 1 link to a resource tool (risk calculator, trading plan, etc.)
- A clear CTA section at the end (newsletter signup or product page)

---

## Step 4: Update Blog Index

Add the new post to `blog/index.html` with:
- Title
- Short excerpt (2 sentences)
- Category tag
- Publication date
- Link to the full post

---

## Step 5: Update Sitemap

Add to `sitemap.xml`:
```xml
<url>
  <loc>https://www.bossfxcademy.com/blog/{slug}.html</loc>
  <lastmod>{YYYY-MM-DD}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.6</priority>
</url>
```

---

## Step 6: Test

1. Run `npx live-server` and open the post
2. Check mobile rendering
3. Verify JSON-LD: paste URL into Google's Rich Results Test (search.google.com/test/rich-results)
4. Verify OG tags: use Facebook Sharing Debugger (developers.facebook.com/tools/debug)
5. Check all internal links work
6. Verify GTM fires on page load

---

## Step 7: Deploy

```bash
git add blog/{slug}.html blog/index.html sitemap.xml
git commit -m "blog: publish {post-title}"
git push origin main
```

---

## Step 8: Promote

1. Share on social channels (Instagram, TikTok, X, YouTube)
2. Post in Telegram community
3. Include in next email newsletter (if applicable)
4. Use UTM links for tracking:
   ```
   https://www.bossfxcademy.com/blog/{slug}.html?utm_source=instagram&utm_medium=social&utm_campaign=blog-{slug}
   ```

---

## Blog Post Checklist

- [ ] Unique, keyword-rich title
- [ ] Meta description (150 chars)
- [ ] OG tags (title, description, image, url)
- [ ] Canonical URL
- [ ] JSON-LD Article structured data
- [ ] Heading hierarchy (H1 → H2 → H3)
- [ ] 2+ internal links to other blog posts
- [ ] 1+ product page CTA
- [ ] 1+ resource tool link
- [ ] Added to blog/index.html
- [ ] Added to sitemap.xml
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Rich Results Test passes
