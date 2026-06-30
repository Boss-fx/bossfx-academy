# COO Operating Manual — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO (COO role currently handled by CEO + AI)

---

## Role Definition

The COO function ensures daily operations run smoothly, systems are monitored, incidents are handled, and improvements are implemented continuously. Currently performed by the founder with AI assistance. This document defines the role so it can be delegated (to a human or AI agent) when the business scales.

---

## Daily Operations

| Time (WAT) | Task | Tool | Status |
|---|---|---|---|
| 9:00 AM | Check Vercel deployment status | Vercel Dashboard | ✅ Manual |
| 9:00 AM | Review overnight orders | Admin Dashboard (`/admin/`) | ✅ Manual |
| 9:00 AM | Daily cron runs automatically | `/api/cron-reengagement` | ✅ Automated |
| 9:30 AM | Check for customer support emails | Email inbox | ✅ Manual |
| 9:30 AM | Respond to Telegram questions | Telegram app | ✅ Manual |
| Throughout day | Monitor for payment notifications | Flutterwave email alerts | ✅ Automated alerts |

---

## Weekly Operations

| Day | Task | Owner |
|---|---|---|
| Monday | Review last week's analytics (GA4 + Admin Dashboard) | CEO |
| Monday | Plan week's content calendar | CEO |
| Tuesday-Thursday | Publish content (social, blog if scheduled) | CEO |
| Friday | Review email sequence performance (Brevo) | CEO |
| Sunday | Weekly review (see [CEO.md](CEO.md) → Weekly Review Process) | CEO |

---

## Monthly Operations

| Task | When | Owner | Tool |
|---|---|---|---|
| Full analytics review | 1st of month | CEO | GA4, Admin Dashboard, Brevo |
| Revenue reconciliation | 1st of month | CEO | Flutterwave Dashboard vs Admin Dashboard |
| Brevo list health check | 1st of month | CEO | Brevo Contacts |
| Supabase storage check | 1st of month | AI Partner | Supabase Dashboard |
| Blog performance review | 1st of month | CEO | GA4 → Pages |
| Sitemap verification | 1st of month | AI Partner | Review sitemap.xml vs live pages |
| Security header review | 1st of month | AI Partner | Verify vercel.json headers |

---

## Quarterly Operations

| Task | Owner | Deliverable |
|---|---|---|
| Pricing review | CEO | Decision to adjust or maintain prices |
| Roadmap review | CEO + AI | Update PROJECT_ROADMAP.md |
| Product performance review | CEO | Revenue by product, identify winners/losers |
| Competitor analysis | CEO | Review 3-5 competitor offerings |
| Infrastructure review | AI Partner | Vercel limits, Supabase storage, Brevo limits |
| Documentation audit | AI Partner | Verify all docs reflect current state |

---

## Incident Response

See [/sop/incident-response.md](/sop/incident-response.md) for full procedures.

### Escalation Flow

```
Automated monitoring (🟡 Planned — not yet implemented)
  ↓
Founder notices issue (manual check / customer report)
  ↓
Classify severity: P0 (revenue) > P1 (feature) > P2 (degraded) > P3 (cosmetic)
  ↓
P0/P1: Immediate action — check Vercel logs, rollback if needed
P2: Fix within 24 hours
P3: Add to backlog
  ↓
Post-incident: Document what happened, update SOPs
```

---

## Automation Ownership

Every automated system has an owner responsible for monitoring and maintaining it.

| System | Owner | Monitor How | Status |
|---|---|---|---|
| Payment webhook | AI Partner | Vercel function logs | ✅ Active |
| Fulfillment orchestrator | AI Partner | `[Fulfillment]` log entries | ✅ Active |
| Drip email sequences | AI Partner | Cron job response JSON | ✅ Active |
| Daily cron job | AI Partner | Vercel cron logs | ✅ Active |
| Token-gated downloads | AI Partner | `[Files]` log entries | ✅ Active |
| Analytics engine | AI Partner | Browser debug panel | ✅ Active |
| Admin dashboard | AI Partner | Manual testing | ✅ Active |

See [/AUTOMATION_MAP.md](/AUTOMATION_MAP.md) for complete workflow documentation.

---

## Documentation Ownership

| Document Set | Owner | Update Frequency |
|---|---|---|
| CLAUDE.md | AI Partner | Every feature change |
| PROJECT_ROADMAP.md | AI Partner | Every phase completion |
| AUTOMATION_MAP.md | AI Partner | Every automation change |
| CHANGELOG.md | AI Partner | Every release |
| docs/ (technical) | AI Partner | Every architectural change |
| sop/ (procedures) | AI Partner + CEO | Every process change |
| business/ (operations) | CEO + AI Partner | Quarterly review |

---

## Tool Inventory

| Tool | Purpose | Cost | Status |
|---|---|---|---|
| Vercel | Hosting + serverless | Free (Hobby) | ✅ |
| Supabase | Database + storage + auth | Free tier | ✅ |
| Flutterwave | Payment processing | Transaction fees only | ✅ |
| Brevo | Email + CRM | Free (300/day) | ✅ |
| Formspree | Contact form | Free tier | ✅ |
| GitHub | Source control | Free | ✅ |
| Google Analytics 4 | Traffic analytics | Free | ✅ |
| Google Tag Manager | Tag management | Free | ✅ |
| Meta Business Suite | Pixel + ads | Free (+ ad spend) | ✅ |
| Microsoft Clarity | Heatmaps + recordings | Free | ✅ |
| Telegram | Community | Free | ✅ |
| Claude Code | AI engineering partner | Subscription | ✅ |
| Canva | Design | Free/Pro | ✅ |
| MQL5 | EA marketplace listing | Free | ✅ |

**Total fixed cost (excluding ad spend):** Near zero. All critical infrastructure runs on free tiers.

---

## Cost Review

Current monthly costs:
| Item | Cost | Notes |
|---|---|---|
| Vercel Hobby | ₦0 | Free tier |
| Supabase Free | ₦0 | Free tier (monitor for pausing) |
| Brevo Free | ₦0 | 300 emails/day limit |
| Domain renewal | ~₦5,000/year | Annual cost |
| Claude Code | Variable | AI partner subscription |
| Flutterwave fees | ~1.4% per transaction | Deducted from payments |

**Trigger to upgrade:** Upgrade Vercel when exceeding 12 functions or 100GB bandwidth. Upgrade Brevo when exceeding 300 emails/day. Upgrade Supabase when exceeding 500MB storage or tired of 7-day inactivity pausing.
