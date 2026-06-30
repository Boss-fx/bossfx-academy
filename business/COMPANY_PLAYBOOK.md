# Company Playbook — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO
> **Purpose:** Single reference for how BossFx Academy operates day-to-day

---

## 1. How We Make Money

**Model:** Digital education products + mentorship services for forex traders.

**Value ladder:**
```
Free Resources → Forex 101 (₦25K) → Group Mentorship (₦60K/mo)
                                          ↓
                              1-on-1 Mentorship (₦150K/mo)
                                          ↓
                                   VIP Lifetime (₦350K)

Cross-sell: EA addon (₦15K) at any checkout
```

**Revenue flow:** Traffic → Lead capture → Email nurture → Purchase → Fulfillment → Expansion

See [BUSINESS_MODEL.md](BUSINESS_MODEL.md) and [REVENUE_ENGINE.md](REVENUE_ENGINE.md) for full details.

---

## 2. How We Get Customers

### Current (Organic Only)
1. **Content creation** — Instagram, TikTok, YouTube, X posts about forex trading
2. **SEO** — 11 blog posts with JSON-LD structured data
3. **Free resource tools** — 8 interactive tools that capture leads
4. **Telegram community** — Word-of-mouth referrals
5. **Exit intent popups** — Capture abandoning visitors

### Planned
6. Paid advertising (Instagram/Facebook)
7. Webinar funnels
8. Referral/affiliate program
9. WhatsApp Business channel

See [CUSTOMER_JOURNEY.md](CUSTOMER_JOURNEY.md) for the full acquisition-to-expansion map.

---

## 3. How We Deliver

Every product delivery is fully automated:

1. Customer pays via Flutterwave checkout
2. Webhook fires → signature verified → payment confirmed via API
3. Order created in Supabase database
4. HMAC-SHA256 download tokens generated
5. Fulfillment email sent with product-specific content
6. Admin notification sent
7. Contact updated in Brevo CRM

**Manual steps required:**
- Mentorship session scheduling (after automated booking)
- Mentorship renewal billing (monthly, manual)
- Telegram community moderation

---

## 4. Daily Operating Rhythm

### Morning (First Thing)
- [ ] Check admin dashboard for overnight orders
- [ ] Scan Vercel logs for errors
- [ ] Reply to Telegram community messages
- [ ] Check email for customer support requests

### Content Block (Flexible)
- [ ] Create 1 piece of content (Instagram, TikTok, or YouTube)
- [ ] Engage with comments/DMs on social platforms

### Business Block (Flexible)
- [ ] Work on roadmap items (see [/PROJECT_ROADMAP.md](/PROJECT_ROADMAP.md))
- [ ] Conduct scheduled mentorship sessions
- [ ] Review any pending support tickets

### Evening
- [ ] Quick admin dashboard check
- [ ] Plan next day's content topic

---

## 5. Weekly Operating Rhythm

| Day | Focus |
|---|---|
| Monday | Content creation + community engagement |
| Tuesday | Mentorship sessions + content |
| Wednesday | Platform development (roadmap items) |
| Thursday | Mentorship sessions + content |
| Friday | Content + marketing experiments |
| Saturday | Analytics review (15 min) + light engagement |
| Sunday | Rest / planning for next week |

### Weekly Review Checklist (Saturday, 15 min)
- [ ] Orders this week (Admin Dashboard)
- [ ] Revenue this week
- [ ] New leads captured
- [ ] Telegram member count
- [ ] Any errors in Vercel logs
- [ ] Social media growth (follower counts)

---

## 6. Monthly Operating Rhythm

**Week 1:** Full analytics review (see [KPI_DASHBOARD.md](KPI_DASHBOARD.md))
**Week 2:** Content planning for next month
**Week 3:** Platform/roadmap sprint
**Week 4:** Business review + goal setting

### Monthly Review Checklist (1 hour)
- [ ] Revenue: total, by product, trend vs last month
- [ ] Traffic: sessions, sources, top pages (GA4)
- [ ] Conversion: funnel rates at each stage
- [ ] Email: list growth, open rates, click rates (Brevo)
- [ ] Community: Telegram, Instagram, TikTok, YouTube growth
- [ ] System: health check, error rates, function usage (Vercel)
- [ ] Update CHANGELOG.md if any releases shipped
- [ ] Set 3 priorities for next month

---

## 7. How We Handle Problems

### Customer Issues
| Issue | Response | SOP |
|---|---|---|
| Didn't receive download | Check admin dashboard → resend via API | [/sop/customer-support.md](/sop/customer-support.md) |
| Payment failed | Check Flutterwave dashboard, verify webhook | [/sop/incident-response.md](/sop/incident-response.md) |
| Refund request | Evaluate via Flutterwave dashboard | [/sop/customer-support.md](/sop/customer-support.md) |
| Can't install EA | Send MT5 installation guide | Standard response template |
| Telegram spam | Remove user, report | Community moderation |

### System Issues
| Issue | Response | SOP |
|---|---|---|
| Webhook not firing | Check Vercel logs → Flutterwave dashboard | [/sop/incident-response.md](/sop/incident-response.md) |
| Site down | Check Vercel status → redeploy | [/sop/deployments.md](/sop/deployments.md) |
| Email not sending | Check Brevo dashboard → API key → daily limit | [/sop/incident-response.md](/sop/incident-response.md) |
| Database issue | Check Supabase dashboard → connection pooling | [/sop/incident-response.md](/sop/incident-response.md) |

---

## 8. Rules We Never Break

1. **Never break the payment flow** — test before every deploy
2. **Never expose secrets** — env vars only, never hardcode
3. **Never remove analytics tracking** — data is irreplaceable
4. **Never exceed 12 serverless functions** — Vercel Hobby limit
5. **Always verify webhooks** — signature + API verification
6. **Always validate payment amounts** — prevent manipulation
7. **Always send admin notifications** — founder must know about every order
8. **Always back up before major changes** — git commit first

---

## 9. Tools We Use

| Tool | Purpose | Cost | Login |
|---|---|---|---|
| Vercel | Hosting + serverless functions | Free (Hobby) | vercel.com |
| Supabase | Database + file storage + auth | Free tier | supabase.com |
| Flutterwave | Payment processing | Per-transaction (~1.4%) | flutterwave.com |
| Brevo | Email + CRM + drip automation | Free (300 emails/day) | brevo.com |
| GitHub | Source code + version control | Free | github.com |
| GA4 | Traffic analytics | Free | analytics.google.com |
| GTM | Tag management | Free | tagmanager.google.com |
| Meta Pixel | Facebook/Instagram tracking | Free | business.facebook.com |
| Microsoft Clarity | Heatmaps + session recordings | Free | clarity.microsoft.com |
| Formspree | Contact form backend | Free tier | formspree.io |
| MQL5 Marketplace | EA distribution | Revenue share | mql5.com |
| Claude Code | AI engineering partner | Subscription | claude.ai |

---

## 10. How We Make Decisions

**Default:** Ship fast, measure, iterate. Prefer action over analysis.

**Decision framework:**
- **Revenue impact?** → Do it this week
- **Customer experience?** → Do it this sprint
- **Technical debt?** → Schedule for next sprint
- **Nice to have?** → Add to roadmap, revisit quarterly

**Escalation:** There is no escalation — the founder decides everything. AI (Claude) provides analysis and recommendations but never makes business decisions autonomously.

See [DECISION_FRAMEWORK.md](DECISION_FRAMEWORK.md) for the full framework.
