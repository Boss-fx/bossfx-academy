# Decision Framework — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO

---

## Core Principle

**Ship fast, measure, iterate.** Prefer action over analysis. Prefer reversible decisions over perfect decisions.

---

## Decision Types

### Type 1: One-Way Doors (High Stakes, Hard to Reverse)

**Examples:** Pricing changes, removing a product, changing payment processor, legal commitments, hiring

**Process:**
1. Define the problem clearly
2. List options (minimum 2)
3. Identify risks of each option
4. Sleep on it (minimum 24 hours)
5. Decide and document the reasoning

**Who decides:** CEO only

### Type 2: Two-Way Doors (Low Stakes, Easily Reversible)

**Examples:** Blog post topics, social media content, email copy, UI tweaks, feature experiments

**Process:**
1. Make the best judgment call now
2. Ship it
3. Measure the result
4. Adjust or revert if needed

**Who decides:** CEO or AI (within documented guidelines in CLAUDE.md)

---

## Priority Matrix

When multiple tasks compete for attention, use this hierarchy:

| Priority | Category | Examples | Timeline |
|---|---|---|---|
| **P0** | Revenue at risk | Payment flow broken, webhook down, fulfillment failing | Drop everything |
| **P1** | Revenue opportunity | Deploy EA addon, fix newsletter→Brevo, new product launch | This week |
| **P2** | Growth | New content, SEO improvements, email campaigns | This sprint |
| **P3** | Infrastructure | Security fixes, documentation, code cleanup | This month |
| **P4** | Nice to have | UI polish, new features with unclear ROI | Backlog |

---

## Revenue Decisions

**Question:** Does this directly increase or protect revenue?

| Answer | Action |
|---|---|
| Yes, increases revenue | Do it this week |
| Yes, protects existing revenue | Do it today |
| Indirectly (SEO, content, conversion) | Schedule for this sprint |
| No clear revenue impact | Add to backlog, revisit quarterly |

---

## Build vs. Buy vs. Skip

| Factor | Build | Buy | Skip |
|---|---|---|---|
| Core to the business | ✅ | — | — |
| One-time need | — | ✅ | — |
| Nice to have | — | — | ✅ |
| Free tool exists | — | ✅ | — |
| Costs > revenue impact | — | — | ✅ |

**Current stance:** Build only what's core (payment, fulfillment, content). Use free tools for everything else (Vercel, Supabase, Brevo, GA4). Don't buy until revenue justifies it.

---

## Technology Decisions

**Defaults (don't revisit unless broken):**
- Frontend: Static HTML/CSS/JS (no framework until complexity demands it)
- Backend: Vercel Serverless Functions (Node.js)
- Database: Supabase (PostgreSQL)
- Payments: Flutterwave
- Email: Brevo
- Analytics: GA4 + bfx-analytics.js

**When to revisit:**
- Hitting Vercel Hobby plan limits → upgrade to Pro
- Hitting Supabase free tier limits → upgrade
- Need recurring billing → Flutterwave Subscription API
- Need more than 300 emails/day → Brevo paid plan
- Frontend becomes unmanageable → consider a framework

---

## Feature Decisions

Before building any new feature, answer:

1. **Who asked for it?** (Customer? Founder? Idea?)
2. **How many customers does it affect?** (All? Some? None yet?)
3. **Does it increase revenue?** (Direct? Indirect? No?)
4. **Can we ship it in one session?** (< 2 hours?)
5. **Does it add a serverless function?** (Check 12-function limit)

**Ship if:** Answers are mostly "yes" or "customers asked for it"
**Defer if:** Speculative, complex, or adds infrastructure burden

---

## Content Decisions

**Create content that:**
- Answers a question traders are searching for (SEO value)
- Shows a result or teaches a skill (social media value)
- Can be repurposed across 3+ platforms
- Naturally leads to a product recommendation

**Don't create content that:**
- Has no search volume and no viral potential
- Requires ongoing maintenance
- Competes with existing content on the site
- Has no connection to the product funnel

---

## Spending Decisions

| Amount | Process |
|---|---|
| Free | Use immediately |
| < ₦10,000/month | Decide and start |
| ₦10,000 - ₦50,000/month | Justify with expected revenue impact |
| > ₦50,000/month | Must have proven ROI or clear strategic value |

**Current monthly costs:** Near zero (all free tiers + domain). Maximize free tools until revenue consistently exceeds ₦200,000/month.

---

## When Stuck

If you can't decide:

1. **Ask:** "What would I regret NOT doing in 30 days?"
2. **Ask:** "Is this reversible?" → If yes, just do it
3. **Ask:** "Does this make money?" → If not clear, skip it
4. **Ask:** "Am I avoiding this because it's hard or because it's wrong?"
5. **Default:** Ship the simpler version. Iterate later.
