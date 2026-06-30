# Business Operating System — BossFx Academy

> **Version:** 1.0.0
> **Created:** 2026-06-30
> **Owner:** Timilehin "BossFx" Shobande

---

## What This Is

This is the complete business operating system for BossFx Academy. Every document in this directory describes how the business works — strategy, operations, sales, marketing, customer success, finance, legal, content, growth, AI team, and product lifecycle.

Combined with the technical documentation (`/docs/`, `/sop/`, `CLAUDE.md`), this repository is fully self-documenting. Any future Claude Code session can understand the entire business by reading these files.

---

## Document Index

### Core Business Documents

| Document | Purpose | Key Decisions |
|---|---|---|
| [COMPANY_OVERVIEW.md](COMPANY_OVERVIEW.md) | Identity, products, team, market position | What BossFx is |
| [MISSION_AND_VISION.md](MISSION_AND_VISION.md) | Mission, 3-year vision, North Star Metric | Where we're going |
| [VALUES.md](VALUES.md) | 6 core values | How we operate |
| [ORG_STRUCTURE.md](ORG_STRUCTURE.md) | Solo founder + AI team structure | Who does what |
| [BUSINESS_MODEL.md](BUSINESS_MODEL.md) | Revenue streams, unit economics, pricing | How we make money |
| [REVENUE_ENGINE.md](REVENUE_ENGINE.md) | 5-stage revenue flow, levers, protection | How revenue flows |
| [CUSTOMER_JOURNEY.md](CUSTOMER_JOURNEY.md) | 8-stage journey with implementation status | How customers experience us |
| [PRODUCT_LIFECYCLE.md](PRODUCT_LIFECYCLE.md) | All products (live + planned) with detailed profiles | What we sell |
| [COMPANY_PLAYBOOK.md](COMPANY_PLAYBOOK.md) | Day-to-day operating guide | How we run daily |
| [KPI_DASHBOARD.md](KPI_DASHBOARD.md) | All KPIs with sources, targets, tracking status | What we measure |
| [RISKS.md](RISKS.md) | 17 identified risks with severity and mitigation | What could go wrong |
| [MEETING_RHYTHMS.md](MEETING_RHYTHMS.md) | Daily/weekly/monthly/quarterly review cadences | When we review |
| [DECISION_FRAMEWORK.md](DECISION_FRAMEWORK.md) | Decision types, priority matrix, spending rules | How we decide |
| [AI_ROLES.md](AI_ROLES.md) | 13 AI employee definitions with boundaries | How AI team operates |

### Executive Documents

| Document | Purpose |
|---|---|
| [CEO.md](CEO.md) | CEO objectives, priorities, scorecard, decision principles |
| [COO.md](COO.md) | Operations cadence, tool inventory, incident escalation |

### Department Playbooks

| Department | Document | Focus |
|---|---|---|
| Marketing | [marketing/MARKETING_STRATEGY.md](marketing/MARKETING_STRATEGY.md) | Channels, funnel, content, SEO, email, campaigns |
| Sales | [sales/SALES_PLAYBOOK.md](sales/SALES_PLAYBOOK.md) | Value ladder, objection handling, upsell, scripts |
| Customer Success | [customer-success/CUSTOMER_SUCCESS.md](customer-success/CUSTOMER_SUCCESS.md) | Onboarding, support, FAQ, retention |
| Growth | [growth/GROWTH_ENGINE.md](growth/GROWTH_ENGINE.md) | Growth loops, channels, viral mechanics, experiments |
| Finance | [finance/FINANCE.md](finance/FINANCE.md) | Revenue, costs, unit economics, cash flow |
| Operations | [operations/OPERATIONS.md](operations/OPERATIONS.md) | Checklists, monitoring, continuity, vendors, credentials |
| Content | [content/CONTENT_ENGINE.md](content/CONTENT_ENGINE.md) | Pillars, calendar, production workflow, AI-assisted |
| HR | [hr/HR.md](hr/HR.md) | Team structure, hiring plan, founder development |
| Legal | [legal/LEGAL.md](legal/LEGAL.md) | Compliance, disclaimers, IP, privacy, terms |

### AI Team Role Cards

| Role | File |
|---|---|
| CEO AI | [ai-team/ceo-ai.md](ai-team/ceo-ai.md) |
| COO AI | [ai-team/coo-ai.md](ai-team/coo-ai.md) |
| Marketing AI | [ai-team/marketing-ai.md](ai-team/marketing-ai.md) |
| Sales AI | [ai-team/sales-ai.md](ai-team/sales-ai.md) |
| Support AI | [ai-team/support-ai.md](ai-team/support-ai.md) |
| Content AI | [ai-team/content-ai.md](ai-team/content-ai.md) |
| Analytics AI | [ai-team/analytics-ai.md](ai-team/analytics-ai.md) |
| SEO AI | [ai-team/seo-ai.md](ai-team/seo-ai.md) |
| Developer AI | [ai-team/developer-ai.md](ai-team/developer-ai.md) |
| Security AI | [ai-team/security-ai.md](ai-team/security-ai.md) |
| Research AI | [ai-team/research-ai.md](ai-team/research-ai.md) |
| Trading AI | [ai-team/trading-ai.md](ai-team/trading-ai.md) |
| Automation AI | [ai-team/automation-ai.md](ai-team/automation-ai.md) |

---

## Cross-Reference Map

### Revenue Path
```
BUSINESS_MODEL.md → REVENUE_ENGINE.md → PRODUCT_LIFECYCLE.md → CUSTOMER_JOURNEY.md
       ↕                    ↕                     ↕                      ↕
   FINANCE.md          sales/PLAYBOOK.md     KPI_DASHBOARD.md    customer-success/
```

### Growth Path
```
marketing/STRATEGY.md → growth/ENGINE.md → content/ENGINE.md → KPI_DASHBOARD.md
        ↕                     ↕                   ↕
   sales/PLAYBOOK.md    CUSTOMER_JOURNEY.md  ai-team/content-ai.md
```

### Operations Path
```
COMPANY_PLAYBOOK.md → operations/OPERATIONS.md → MEETING_RHYTHMS.md → KPI_DASHBOARD.md
        ↕                      ↕                        ↕
    COO.md              AI_ROLES.md              DECISION_FRAMEWORK.md
```

### Risk & Compliance Path
```
RISKS.md → legal/LEGAL.md → operations/OPERATIONS.md → ai-team/security-ai.md
                                    ↕
                             DECISION_FRAMEWORK.md
```

### Document Hierarchy
```
CLAUDE.md (technical foundation — read first always)
  ├── /docs/ (technical documentation)
  ├── /sop/ (standard operating procedures)
  └── /business/ (business operating system)
       ├── INDEX.md (this file — start here for business context)
       ├── Core documents (13 files)
       ├── Executive documents (2 files)
       ├── Department playbooks (9 directories)
       └── AI team role cards (13 files)
```

---

## Status Legend

Throughout all Business OS documents:
- ✅ **Existing** — Built, deployed, and working in production
- 🚧 **In Progress** — Built but not yet deployed, or partially complete
- 🟡 **Planned** — Documented but not yet built

---

## Execution Priority

### Immediate (This Week)
1. Deploy EA addon changes (10 files, 296 lines ready — Phase 0.1)
2. Fix newsletter→Brevo pipeline (config.js emailProvider)
3. Add CSP header to vercel.json

### This Month
4. Fix Admin API CORS (restrict from wildcard)
5. Publish Terms of Service page
6. Publish Privacy Policy page
7. First content batch using Content AI workflow

### This Quarter (Q3 2026)
8. Post-purchase upsell email sequence
9. Abandoned checkout recovery
10. Review/testimonial collection system
11. Quarterly security audit
12. First paid advertising experiment

### Next Quarter (Q4 2026)
13. Recurring mentorship billing
14. Referral program
15. Webhook failure alerting
16. Persistent rate limiting (Redis/KV)
17. Course completion tracking

---

## Missing Business Documentation

The following areas could benefit from additional documentation in future phases:

| Area | Priority | Reason |
|---|---|---|
| Partnership playbook | Medium | Framework for collaborations with other educators |
| Affiliate program design | Medium | Revenue share structure and tracking |
| International expansion plan | Low | Multi-currency, multi-language strategy |
| Investor / funding documentation | Low | If external funding is ever considered |
| Brand style guide | Medium | Visual standards for all content |
| Crisis communication plan | Low | How to handle public negative events |

---

## Phase 4 Recommendation

After completing the immediate and quarterly items above, the next major phase should focus on:

1. **Revenue automation** — Recurring billing eliminates manual mentorship renewals
2. **Growth systems** — Referral program and webinar funnel for scalable acquisition
3. **Product expansion** — Trading challenges and additional EAs diversify revenue
4. **Infrastructure maturity** — Monitoring, alerting, backups, staging environment
5. **Team expansion** — First hire when revenue consistently exceeds ₦500K/month

The business is well-positioned: near-zero costs, high margins, growing product suite, and a fully documented operating system. The next phase is about scaling what works.

---

*This Business Operating System was created on 2026-06-30 as Phase 3 of the BossFx Operating System initiative. It should be reviewed and updated quarterly.*
