# Operations — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO / COO AI
> **Status:** Highly automated with some manual processes

---

## Operations Overview

BossFx operates with maximum automation. The founder handles only what machines cannot: content creation, mentorship delivery, strategic decisions, and community engagement. Everything else is automated or delegated to AI.

---

## Daily Operations Checklist

### Morning (First Thing)
- [ ] Check admin dashboard for overnight orders
- [ ] Scan Vercel function logs for errors (past 12 hours)
- [ ] Check Telegram for customer messages
- [ ] Review email inbox for support requests
- [ ] Quick social media engagement (reply to comments/DMs)

### Afternoon
- [ ] Content creation or mentorship sessions
- [ ] Platform development (if scheduled)
- [ ] Community engagement

### Evening
- [ ] Final admin dashboard check
- [ ] Reply to any pending DMs/emails
- [ ] Plan next day's priority

---

## Weekly Operations Checklist

| Day | Task | Time |
|---|---|---|
| Saturday | Weekly metrics review (KPI_DASHBOARD.md) | 15 min |
| Saturday | Review social media performance | 10 min |
| Saturday | Check Vercel usage (function invocations, bandwidth) | 5 min |
| Saturday | Scan for any un-answered customer issues | 10 min |
| Sunday | Plan next week's content and priorities | 15 min |

---

## Monthly Operations Checklist

- [ ] Full analytics review (see [KPI_DASHBOARD.md](KPI_DASHBOARD.md))
- [ ] Check Supabase database size and storage usage
- [ ] Check Brevo email sends (approaching 300/day limit?)
- [ ] Check Vercel function count (still ≤ 12?)
- [ ] Review Flutterwave settlements (all funds received?)
- [ ] Check domain expiration date
- [ ] Update CHANGELOG.md if any releases shipped
- [ ] Content calendar for next month
- [ ] Mentorship billing (manual renewals)

---

## Quarterly Operations Checklist

- [ ] Security audit (see Security AI role in AI_ROLES.md)
- [ ] Dependency update check (`npm outdated`)
- [ ] Competitor analysis
- [ ] Pricing review
- [ ] SOP accuracy review (are all SOPs current?)
- [ ] Infrastructure cost review (any free tier approaching limits?)
- [ ] Roadmap progress review and re-prioritization
- [ ] Update Business OS documents with any changes

---

## System Monitoring

### Automated Monitoring
| System | What's Monitored | Alert Method |
|---|---|---|
| Vercel functions | Error logs | Manual log review |
| Daily cron | Drip + re-engagement processing | Logged in function response |
| Webhook | Payment processing | Admin notification email on each order |
| Health check | /api/health → service connectivity | Manual check |

### Manual Monitoring (Current)
| Check | Frequency | How |
|---|---|---|
| Vercel logs | Daily | Vercel Dashboard → Deployments → Logs |
| Supabase health | Weekly | Supabase Dashboard → Database |
| Brevo deliverability | Monthly | Brevo Dashboard → Statistics |
| Flutterwave transactions | Weekly | Flutterwave Dashboard → Transactions |
| GA4 realtime | Daily (quick glance) | analytics.google.com → Realtime |

### Planned Monitoring (🟡)
| System | Implementation | Phase |
|---|---|---|
| Webhook failure alerting | Email/Telegram alert on webhook error | Phase 2 |
| Uptime monitoring | External service (e.g., UptimeRobot) | Phase 2 |
| Error rate alerting | Vercel integration or custom | Phase 2 |
| Database backup verification | Automated export script | Phase 2 |

---

## Business Continuity

### If Founder Is Unavailable (< 1 Week)

**What keeps running automatically:**
- Website and all pages
- Payment processing (checkout → webhook → fulfillment → email)
- Download token system
- Daily cron (drip emails + re-engagement)
- Lead capture forms
- Analytics tracking

**What pauses:**
- Content creation
- Mentorship sessions (reschedule)
- Customer support (delayed response)
- Platform development

**Required action:** None for < 1 week. Automated systems handle sales and delivery.

### If Founder Is Unavailable (> 1 Week)

**Additional risks:**
- Customer support backlog builds
- Mentorship students miss sessions
- Social media goes silent (perception risk)
- No new content (organic growth stalls)

**Mitigation:**
- All SOPs documented for a potential helper
- Claude Code can maintain systems with appropriate instructions
- Telegram community is self-moderating to some degree
- Queue mentorship sessions for return

### Disaster Recovery

| Scenario | Recovery | Time |
|---|---|---|
| Vercel goes down | Wait for recovery (no alternative hosting set up) | Hours |
| Supabase goes down | Wait for recovery. Order data also in Flutterwave. | Hours |
| Brevo goes down | Emails queue. Orders still process (just no email). | Hours |
| Flutterwave goes down | No payments possible. Site still works. | Hours |
| GitHub repo lost | Vercel has deployment copies. Rebuild from latest deploy. | Days |
| Domain expires | Renew immediately. Site goes offline until DNS propagates. | Hours-Days |

---

## Vendor & Tool Inventory

| Vendor | Purpose | Plan | Monthly Cost | Contract |
|---|---|---|---|---|
| Vercel | Hosting | Hobby (free) | ₦0 | No contract |
| Supabase | Database + storage | Free | ₦0 | No contract |
| Flutterwave | Payments | Pay-per-transaction | ~1.4% | No contract |
| Brevo | Email + CRM | Free (300/day) | ₦0 | No contract |
| GitHub | Source code | Free | ₦0 | No contract |
| Google Analytics | Analytics | Free | ₦0 | No contract |
| Google Tag Manager | Tag management | Free | ₦0 | No contract |
| Meta Pixel | FB/IG tracking | Free | ₦0 | No contract |
| Microsoft Clarity | Heatmaps | Free | ₦0 | No contract |
| Formspree | Contact form | Free tier | ₦0 | No contract |
| MQL5 Marketplace | EA distribution | Revenue share (~30%) | Variable | Terms of service |
| Domain registrar | Domain name | Annual | ~₦6,000/year | Annual renewal |
| Claude Code | AI engineering | Subscription | Variable | No contract |

**Total fixed monthly cost:** Near zero (domain amortized + Claude subscription)

---

## Credential Management

| Credential | Where Stored | Who Has Access |
|---|---|---|
| Flutterwave API keys | Vercel env vars | Founder only |
| Brevo API key | Vercel env vars | Founder only |
| Supabase keys | Vercel env vars | Founder only |
| Download secret | Vercel env vars | Founder only |
| GitHub access | GitHub account | Founder only |
| Vercel access | Vercel account | Founder only |
| Flutterwave dashboard | Flutterwave account | Founder only |
| Brevo dashboard | Brevo account | Founder only |
| Supabase dashboard | Supabase account | Founder only |
| GA4 / GTM | Google account | Founder only |
| Domain registrar | Registrar account | Founder only |
| Social media accounts | Platform accounts | Founder only |

**Security notes:**
- 2FA should be enabled on all accounts
- Never share credentials in chat, email, or documents
- Rotate API keys quarterly (🟡 not currently practiced)
- Document recovery emails/phones for all accounts

---

## Maintenance Schedule

| Task | Frequency | Owner |
|---|---|---|
| Check dependencies for updates | Quarterly | Developer AI |
| Review security headers | Quarterly | Security AI |
| Audit env vars | Quarterly | COO AI |
| Review and update SOPs | Quarterly | COO AI |
| Domain renewal check | Monthly | CEO |
| Backup verification | Monthly (🟡 planned) | COO AI |
| Infrastructure cost review | Quarterly | CEO |
