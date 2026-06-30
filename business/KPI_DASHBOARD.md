# KPI Dashboard — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO
> **Review Frequency:** Weekly (summary), Monthly (full review)

---

## North Star Metric

**Paying students who complete and return for the next tier.**

---

## Revenue KPIs

| KPI | Source | Frequency | Target | Status |
|---|---|---|---|---|
| Monthly revenue (NGN) | Admin Dashboard → Total Revenue | Monthly | Trending up month-over-month | ✅ Tracked |
| Weekly new orders | Admin Dashboard → Total Orders | Weekly | ≥ 5 per week | ✅ Tracked |
| Average order value | Revenue / Orders | Monthly | > ₦30,000 | ✅ Calculable |
| EA addon conversion rate | Admin Dashboard → EA Conv. Rate | Weekly | ≥ 20% | ✅ Tracked |
| EA addon revenue | Admin Dashboard → EA Revenue | Monthly | Growing | ✅ Tracked |
| Revenue by product | Admin Dashboard → Product Breakdown | Monthly | Diversified | ✅ Tracked |
| Refund rate | Flutterwave Dashboard (manual) | Monthly | < 5% | 🟡 Manual check |
| Customer lifetime value | Revenue / unique customers | Quarterly | Growing | 🟡 Manual calc |
| Customer acquisition cost | Ad spend / new customers | Monthly | < ₦5,000 | 🟡 When ads start |

---

## Traffic KPIs

| KPI | Source | Frequency | Target | Status |
|---|---|---|---|---|
| Monthly sessions | GA4 → Acquisition | Monthly | Growing 10%+ | ✅ Tracked |
| Monthly unique users | GA4 → Acquisition | Monthly | Growing | ✅ Tracked |
| Organic search traffic | GA4 → Acquisition → Organic Search | Monthly | Growing | ✅ Tracked |
| Top traffic sources | GA4 → Traffic Acquisition | Weekly | Diversified | ✅ Tracked |
| Mobile vs desktop | GA4 → Tech → Overview | Monthly | Track (expect 60%+ mobile) | ✅ Tracked |
| Bounce rate | GA4 → Engagement | Monthly | < 60% | ✅ Tracked |
| Page load speed | PageSpeed Insights | Quarterly | 90+ mobile | 🟡 Manual check |

---

## Conversion KPIs

| KPI | Source | Frequency | Target | Status |
|---|---|---|---|---|
| Lead capture rate | GA4: generate_lead / sessions | Weekly | > 3% | ✅ Tracked via events |
| Checkout start rate | GA4: begin_checkout / generate_lead | Weekly | > 10% | ✅ Tracked via events |
| Purchase conversion rate | GA4: purchase / begin_checkout | Weekly | > 30% | ✅ Tracked via events |
| Overall conversion rate | Orders / sessions | Monthly | > 1% | ✅ Calculable |
| Exit intent capture rate | Exit intent leads / total visitors | Monthly | > 2% | ✅ Tracked |

---

## Email & CRM KPIs

| KPI | Source | Frequency | Target | Status |
|---|---|---|---|---|
| Total email subscribers | Brevo → Contact Lists | Monthly | Growing 10%+ | ✅ Tracked |
| List growth rate | New contacts / total contacts | Monthly | > 10% | ✅ Tracked |
| Email open rate | Brevo → Campaign Stats | Monthly | > 25% | ✅ Tracked in Brevo |
| Email click rate | Brevo → Campaign Stats | Monthly | > 3% | ✅ Tracked in Brevo |
| Drip sequence completion | Cron job response JSON | Monthly | Track | ✅ Logged |
| Leads by source | Brevo → Contact Attributes (SOURCE) | Monthly | Diversified | ✅ Tracked |

---

## Community KPIs

| KPI | Source | Frequency | Target | Status |
|---|---|---|---|---|
| Telegram members | Telegram group (manual) | Monthly | Growing | 🟡 Manual check |
| Instagram followers | Instagram (manual) | Monthly | Growing | 🟡 Manual check |
| TikTok followers | TikTok (manual) | Monthly | Growing | 🟡 Manual check |
| YouTube subscribers | YouTube Studio | Monthly | Growing | 🟡 Manual check |

---

## Product KPIs

| KPI | Source | Frequency | Target | Status |
|---|---|---|---|---|
| Downloads per product | Admin Dashboard → Downloads tab | Monthly | Track | ✅ Tracked |
| Mentorship bookings | Admin Dashboard → Bookings tab | Monthly | Growing | ✅ Tracked |
| Mentorship renewal rate | Manual tracking | Monthly | > 50% | 🟡 Manual |
| Course completion rate | Not tracked yet | — | > 60% | 🟡 Planned (Phase 4) |
| Student satisfaction (NPS) | Not tracked yet | — | > 50 | 🟡 Planned |

---

## System Health KPIs

| KPI | Source | Frequency | Target | Status |
|---|---|---|---|---|
| API health check | `/api/health` | Daily (manual) | All services healthy | ✅ Available |
| Webhook success rate | Vercel logs (search [Webhook]) | Weekly | > 99% | 🟡 Manual log check |
| Email delivery rate | Brevo Dashboard | Monthly | > 95% | ✅ Tracked |
| Function invocations | Vercel Dashboard → Usage | Monthly | Within limits | ✅ Tracked |
| Serverless function count | `find api -name '*.js'` | Per deploy | ≤ 12 | ✅ Checked |
| Error rate | Vercel logs | Weekly | < 1% | 🟡 Manual log check |

---

## How to Review

### Weekly Review (15 min)
1. Open Admin Dashboard → note orders, revenue, EA rate
2. Open GA4 Realtime → confirm tracking is working
3. Scan Vercel logs for errors in the past 7 days
4. Check Telegram for customer feedback

### Monthly Review (1 hour)
Follow the full process in [/sop/analytics.md](/sop/analytics.md):
1. Revenue: total, by product, trend
2. Traffic: sessions, sources, pages
3. Conversion: funnel rates at each stage
4. Email: list size, open rates, click rates
5. Community: member counts across platforms
6. System: health check, error review
7. Action items: identify top 3 improvements for next month

### Quarterly Review (2 hours)
All monthly items plus:
1. Pricing review (adjust based on demand and competition)
2. Product performance (keep/kill/improve decisions)
3. Roadmap progress (update PROJECT_ROADMAP.md)
4. Competitor analysis
5. Goal setting for next quarter
