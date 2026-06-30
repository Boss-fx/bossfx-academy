# CEO Operating Manual — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Timilehin Shobande

---

## Role Definition

The CEO is the sole human decision-maker at BossFx Academy. Responsible for strategy, content, community, sales, and all final decisions. Everything else is either automated or delegated to AI.

---

## Annual Objectives (2026)

| # | Objective | Key Results | Status |
|---|---|---|---|
| 1 | Launch full product suite | 5 products live with automated fulfillment | ✅ Complete |
| 2 | Build self-documenting platform | CLAUDE.md + full docs + business OS | 🚧 In Progress |
| 3 | Deploy EA addon upsell | Checkout integration + admin analytics | 🚧 Built, pending deploy |
| 4 | Establish content engine | Blog (11 posts), resources (8 tools), social presence | ✅ Active |
| 5 | Build email automation | 6 drip sequences, lead scoring, CRM | ✅ Active |

## Quarterly Objectives — Q3 2026 (Jul–Sep)

| # | Objective | Key Results | Priority |
|---|---|---|---|
| 1 | Deploy EA addon and Phase 0 fixes | Commit code, fix CORS, add CSP, deploy | Critical |
| 2 | Add error monitoring | Webhook failure visibility, Telegram alerts | High |
| 3 | Fix sitemap and newsletter | All pages indexed, frontend subscriptions → Brevo | High |
| 4 | Publish 6 new blog posts | Keyword-targeted, internal-linked, CTA-optimized | Medium |
| 5 | Launch post-purchase upsell sequence | Course → mentorship email automation | Medium |

## Monthly Objectives — July 2026

| # | Task | Owner |
|---|---|---|
| 1 | Deploy Phase 0 items (EA addon, CORS, CSP) | Engineering (AI) |
| 2 | Set up error monitoring (Sentry or Telegram) | Engineering (AI) |
| 3 | Publish 2 blog posts | CEO + AI |
| 4 | Review analytics (first monthly review) | CEO |
| 5 | Run first paid campaign (Instagram/TikTok) | CEO |

---

## Weekly Review Process

**When:** Every Sunday evening (30 minutes)

| Step | Action |
|---|---|
| 1 | Check Admin Dashboard — review new orders, revenue, EA addon rate |
| 2 | Check GA4 — traffic, top pages, conversion events |
| 3 | Check Brevo — email opens, new contacts, list growth |
| 4 | Check Telegram — community engagement, questions, feedback |
| 5 | Check social media — follower growth, engagement on recent posts |
| 6 | Plan next week's content (2-3 posts, 1 blog if scheduled) |
| 7 | Review any customer support issues from the week |

---

## Decision Principles

1. **Revenue-protecting decisions take priority over everything.** If it risks breaking payments, downloads, or email delivery — stop and think twice.
2. **When in doubt, document.** A decision without documentation is a decision that will need to be re-made.
3. **Automate before hiring.** Every recurring task should be automated before considering a human hire.
4. **Test before shipping.** No change to production without local testing. Payment changes require end-to-end testing.
5. **Small bets, fast feedback.** Launch the minimum viable version of a product or campaign. Measure. Iterate.

---

## Prioritization Framework

When deciding what to work on, rank by this order:

1. **Is it broken?** Fix production bugs and revenue-blocking issues first.
2. **Does it protect revenue?** Error monitoring, webhook reliability, backup systems.
3. **Does it grow revenue?** New products, upsell sequences, conversion optimization.
4. **Does it save time?** Automation, documentation, templates.
5. **Does it build brand?** Content, SEO, community, social proof.

---

## Company Scorecard

| Metric | Frequency | Source | Target |
|---|---|---|---|
| Monthly revenue | Monthly | Admin Dashboard | Trending up |
| New orders | Weekly | Admin Dashboard | ≥ 5/week |
| EA addon conversion | Weekly | Admin Dashboard | ≥ 20% |
| Email list size | Monthly | Brevo | Growing 10%/month |
| Telegram members | Monthly | Telegram | Growing |
| Blog traffic | Monthly | GA4 | Growing |
| Refund rate | Monthly | Flutterwave + manual | < 5% |
| System uptime | Weekly | /api/health + Vercel | 99%+ |

---

## Founder Responsibilities

### Do More Of
- Content creation (videos, blog posts, social)
- High-ticket sales conversations (VIP, 1-on-1)
- Community engagement (Telegram, live sessions)
- Strategy and product vision
- Partnership outreach

### Do Less Of (Delegate to AI/Automation)
- Manual order processing → ✅ Automated via webhook
- Email sending → ✅ Automated via Brevo
- Download delivery → ✅ Automated via token system
- Lead nurturing → ✅ Automated via drip sequences
- Analytics tracking → ✅ Automated via analytics engine
- Documentation → ✅ Delegated to AI partner
- Code changes → ✅ Delegated to AI partner

---

## Delegation Plan

| Task | Currently | Target | How |
|---|---|---|---|
| Customer support replies | CEO | VA (future) | Hire when revenue > ₦500K/month |
| Video editing | CEO | Editor (future) | Hire when budget allows |
| Social media scheduling | CEO | AI + scheduling tool | Set up Buffer/Later |
| Email campaigns | CEO | Automated sequences | Build in Phase 3 |
| Content repurposing | CEO | AI-assisted | Use AI to repurpose videos → blog → social |
| Mentorship scheduling | CEO (manual) | Automated booking | ✅ Partially automated (booking form) |

---

## Succession / Business Continuity

If the founder is unavailable for 1+ weeks:

1. **Automated systems continue:** Payments process, emails send, downloads work, cron runs
2. **Admin dashboard accessible:** by any whitelisted admin email
3. **Documentation exists:** for all SOPs, incident response, and customer support
4. **AI partner can:** answer engineering questions from CLAUDE.md context
5. **Community moderates:** Telegram group has pinned rules and resources

What stops: new content, marketing campaigns, high-ticket sales conversations, strategic decisions, refund approvals.

See [operations/BUSINESS_CONTINUITY.md](operations/BUSINESS_CONTINUITY.md).
