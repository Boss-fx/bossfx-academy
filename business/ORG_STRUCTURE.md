# Organization Structure — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO

---

## Current Structure (Solo Founder + AI)

```
┌─────────────────────────────────────────────────┐
│                 CEO / FOUNDER                    │
│           Timilehin "BossFx" Shobande            │
│                                                  │
│  Strategy · Content · Community · Final Decisions │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        │            │                │
   ┌────▼────┐  ┌────▼────┐    ┌─────▼─────┐
   │   AI    │  │ Founder │    │ Automated │
   │ Partner │  │ Direct  │    │  Systems  │
   │         │  │         │    │           │
   │ Claude  │  │Marketing│    │ Webhooks  │
   │ Code    │  │ Content │    │ Drip Seqs │
   │         │  │ Support │    │ Cron Jobs │
   │ Eng.    │  │Community│    │ Analytics │
   │ Docs    │  │ Sales   │    │ Tracking  │
   │ DevOps  │  │         │    │ Fulfillmt │
   └─────────┘  └─────────┘    └───────────┘
```

---

## Role Breakdown

### Founder (Timilehin Shobande)

| Function | Responsibility |
|---|---|
| **Strategy** | Product roadmap, pricing, market positioning, partnerships |
| **Content** | Trading education, video content, blog posts, social media |
| **Community** | Telegram group management, student engagement, live sessions |
| **Sales** | High-ticket consultations (VIP, 1-on-1 mentorship) |
| **Marketing** | Social media, campaign planning, brand voice |
| **Support** | Customer inquiries, booking confirmations, refund decisions |
| **Finance** | Revenue tracking, pricing decisions, vendor payments |

### AI Engineering Partner (Claude Code)

| Function | Responsibility |
|---|---|
| **Engineering** | Feature development, bug fixes, code review |
| **DevOps** | Deployment, infrastructure, monitoring |
| **Documentation** | Technical docs, SOPs, business docs |
| **Architecture** | System design, integration planning, security |
| **Analytics** | Tracking implementation, attribution setup |
| **Automation** | Drip sequences, webhook flows, cron jobs |
| **Product** | Feature specification, roadmap execution |

### Automated Systems (No Human Required)

| System | What It Does |
|---|---|
| Flutterwave Webhook | Receives payments, triggers fulfillment |
| Fulfillment Orchestrator | Creates order, generates token, sends email, notifies admin |
| Drip Engine | Sends sequenced emails based on lead source and timing |
| Daily Cron | Processes pending drip steps, re-engages inactive contacts |
| Analytics Engine | Tracks UTM attribution, engagement scoring, conversion funnels |
| Token-Gated Downloads | Verifies access, serves signed URLs, records audit trail |
| Admin Dashboard | Shows stats, enables resend/token actions |

---

## Future Org Structure (2027+)

As revenue grows, the first hires should be:

| Priority | Role | Trigger | Responsibility |
|---|---|---|---|
| 1 | Virtual Assistant | > ₦500K/month revenue | Customer support, booking management, social media scheduling |
| 2 | Content Editor | > ₦1M/month revenue | Video editing, thumbnail creation, content repurposing |
| 3 | Community Manager | > 500 Telegram members | Moderation, engagement, student support |
| 4 | Marketing Manager | > ₦2M/month revenue | Campaign management, paid ads, partnerships |

Until then, AI-assisted operations handle the load. See [AI_ROLES.md](AI_ROLES.md).

---

## Decision Authority

| Decision Type | Authority | Process |
|---|---|---|
| Product pricing | CEO only | Review quarterly |
| New product launch | CEO only | Follow [sop/new-product-launch.md](/sop/new-product-launch.md) |
| Code changes | AI Partner → CEO approval | PR review or session approval |
| Documentation | AI Partner (autonomous) | Follow standards in CLAUDE.md |
| Customer refunds | CEO only | Review case, apply refund policy |
| Infrastructure changes | AI Partner → CEO approval | Never auto-deploy risky changes |
| Content publishing | CEO | AI assists with drafts |
| Marketing spend | CEO only | Budget approval required |
