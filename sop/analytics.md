# SOP: Analytics Review — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Marketing / Engineering

---

## Purpose

Guide for regular analytics review and performance monitoring.

---

## Weekly Analytics Review

### GA4 Check (analytics.google.com)
1. **Traffic:** Acquisition → Traffic acquisition
   - Total sessions, users, new users
   - Top traffic sources (which channels drive traffic)
   - Trend vs. previous week
2. **Engagement:** Engagement → Pages and screens
   - Top pages by views
   - Average engagement time
   - Bounce rate by page
3. **Conversions:** Conversions report
   - `generate_lead` count
   - `begin_checkout` count
   - `purchase` count and value
   - Conversion rate: leads → checkouts → purchases

### Admin Dashboard Check
1. Login to `/admin/`
2. Note: total orders, revenue, downloads, bookings for the week
3. Check EA addon conversion rate
4. Review recent orders for any anomalies

### Clarity Check (clarity.microsoft.com)
1. **Session Recordings:** Watch 5-10 recent sessions
   - Focus on checkout page recordings
   - Look for rage clicks, dead clicks
   - Note any UX friction points
2. **Heatmaps:** Check top pages
   - Are CTAs getting clicks?
   - How far do users scroll?
3. **Insights:** Review automated insights
   - Rage clicks, dead clicks, excessive scrolling, quick backs

---

## Monthly Analytics Review

Everything in the weekly review, plus:

### Traffic Source Analysis
1. GA4 → Acquisition → Traffic acquisition
2. Compare month-over-month for each source
3. Identify growing and declining channels
4. Calculate cost per acquisition by channel (if running paid ads)

### Funnel Analysis
1. Track the full funnel:
   ```
   Page views → Lead captures → Checkouts started → Purchases
   ```
2. Calculate conversion rates at each step
3. Identify the biggest drop-off point
4. Plan optimization for the worst-performing step

### Content Performance
1. GA4 → Engagement → Pages and screens
2. Sort by engagement time and views
3. Identify top-performing blog posts
4. Plan new content around successful topics

### Revenue Analysis
1. Admin Dashboard → total revenue, product breakdown
2. Calculate average order value
3. Track EA addon conversion rate trend
4. Compare revenue to previous month

---

## Quarterly Analytics Review

Everything in the monthly review, plus:

### SEO Check
1. Google Search Console → Performance
2. Check: impressions, clicks, average position, CTR
3. Identify keywords gaining/losing position
4. Plan content updates for underperforming pages

### Technical Performance
1. Google PageSpeed Insights → test homepage and product pages
2. Target: 90+ on mobile, 95+ on desktop
3. Note any Core Web Vitals issues

### Attribution Analysis
1. GA4 → Advertising → Attribution
2. Review first-touch vs. last-touch attribution
3. Identify which channels start journeys vs. close sales
4. Adjust marketing spend accordingly

---

## Analytics Health Check

Run the built-in analytics health check:
```javascript
// In browser console on any page:
BFX.analytics.debug();
```

Verify:
- [ ] GTM container loaded (GTM-T3R88HZB)
- [ ] GA4 receiving events (G-ZFQ9P5KFSJ)
- [ ] Meta Pixel initialized (804009589230621)
- [ ] Clarity recording (wnde2od79f)
- [ ] UTM attribution engine storing data in localStorage
- [ ] Form attribution injection working (check hidden fields on any form)

---

## Key Metrics to Track

| Metric | Target | Source |
|---|---|---|
| Weekly sessions | Trending up | GA4 |
| Lead capture rate | > 3% of visitors | GA4 (generate_lead / sessions) |
| Checkout start rate | > 10% of leads | GA4 (begin_checkout / generate_lead) |
| Purchase conversion rate | > 30% of checkouts | GA4 (purchase / begin_checkout) |
| Average order value | > ₦30,000 | Admin Dashboard |
| EA addon conversion rate | > 20% of orders | Admin Dashboard |
| Email open rate | > 25% | Brevo Dashboard |
| Mobile vs desktop split | Track | GA4 (Tech → Overview) |
