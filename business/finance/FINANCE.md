# Finance — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO
> **Status:** Lean operation, near-zero fixed costs

---

## Revenue Streams

| Stream | Price | Type | Margin | Status |
|---|---|---|---|---|
| Forex 101 course | ₦25,000 | One-time | ~98.6% | ✅ Active |
| Group Mentorship | ₦60,000/mo | Recurring (manual) | ~90% | ✅ Active |
| 1-on-1 Mentorship | ₦150,000/mo | Recurring (manual) | ~85% | ✅ Active |
| VIP Lifetime | ₦350,000 | One-time | ~98.6% | ✅ Active |
| EA Bundle | ₦15,000 | One-time | ~98.6% | ✅ Active |
| EA Addon (checkout) | ₦15,000 | One-time | ~100% | 🚧 Built, pending deploy |
| MQL5 EA sales | $49.99 | One-time | ~70% (MQL5 takes ~30%) | ✅ Active |

---

## Cost Structure

### Fixed Costs (Monthly)

| Item | Cost | Notes |
|---|---|---|
| Domain registration | ~₦500/mo (amortized) | Annual payment |
| Claude Code | Subscription | AI engineering partner |
| **Total fixed** | **Minimal** | |

### Variable Costs (Per Transaction)

| Item | Cost | Notes |
|---|---|---|
| Flutterwave processing | ~1.4% per transaction | Capped at ₦2,000 per transaction |
| Brevo emails | ₦0 | Free tier (300/day) |
| Vercel hosting | ₦0 | Hobby plan (free) |
| Supabase | ₦0 | Free tier |
| GA4 + GTM | ₦0 | Free |
| MQL5 commission | ~30% of EA sales | MQL5 Marketplace fee |

### Infrastructure (Free Tier Limits)

| Service | Free Limit | Current Usage | Upgrade Trigger |
|---|---|---|---|
| Vercel | 12 functions, 100GB bandwidth | 11 functions | At 12 functions |
| Supabase | 500MB DB, 1GB storage | Below limits | Approaching limits |
| Brevo | 300 emails/day | Well below | Campaigns > 300/day |

---

## Unit Economics

### Forex 101 (Core Product)
```
Revenue per sale:           ₦25,000
- Flutterwave fee (~1.4%):  -₦350
= Gross profit:             ₦24,650
Gross margin:               98.6%

With EA addon:
Revenue per sale:           ₦40,000
- Flutterwave fee:          -₦560
= Gross profit:             ₦39,440
Gross margin:               98.6%
```

### VIP (Highest Value)
```
Revenue per sale:           ₦350,000
- Flutterwave fee (~1.4%):  -₦2,000 (capped)
= Gross profit:             ₦348,000
Gross margin:               99.4%
```

### Group Mentorship (Recurring)
```
Revenue per student/month:  ₦60,000
- Flutterwave fee:          -₦840
= Monthly gross profit:     ₦59,160
Gross margin:               98.6%
LTV (3 months avg):         ₦177,480
```

---

## Financial Tracking

### How Revenue is Tracked
| Source | What It Shows | Access |
|---|---|---|
| Admin Dashboard | Orders, revenue, EA addon stats | www.bossfxcademy.com/admin/ |
| Flutterwave Dashboard | All transactions, settlements, refunds | dashboard.flutterwave.com |
| Supabase orders table | Complete order history with metadata | Supabase dashboard |
| MQL5 Seller Dashboard | EA sales, commissions, earnings | mql5.com |

### Monthly Financial Review Checklist
- [ ] Total revenue from Flutterwave dashboard
- [ ] Number of orders from admin dashboard
- [ ] Revenue by product breakdown
- [ ] EA addon revenue and conversion rate
- [ ] MQL5 earnings
- [ ] Any refunds processed
- [ ] Flutterwave settlement status (funds received)
- [ ] Any new costs incurred
- [ ] Compare vs previous month

---

## Pricing Strategy

### Current Pricing Philosophy
- **Accessible for Nigerian market** — priced below international competitors
- **Value ladder** — each tier is a natural step up
- **High margins** — near-zero COGS means almost all revenue is profit
- **EA addon is impulse** — ₦15K feels small at checkout

### Pricing Anchors
| Product | Price | Compared To |
|---|---|---|
| Forex 101 | ₦25K | WhatsApp courses (₦5-15K) = premium but structured |
| Group Mentorship | ₦60K/mo | Trading rooms (₦20-50K/mo) = competitive |
| VIP | ₦350K | International courses ($500-$5K) = accessible |
| EA Bundle | ₦15K | MQL5 EAs ($50-$500) = affordable entry |

### When to Adjust Pricing
- **Increase:** When demand consistently exceeds capacity (mentorship waitlist)
- **Decrease:** Never lower prices. Add value instead (bonuses, extras)
- **New tier:** When there's a clear gap in the value ladder

---

## Cash Flow

### Revenue Timing
- **Flutterwave settlement:** T+1 business day for most transactions
- **MQL5 payout:** Monthly, 30-day delay
- **Mentorship renewals:** Manual monthly billing (no recurring system yet)

### Cash Flow Risks
| Risk | Mitigation |
|---|---|
| Seasonal dip (December/January) | Build email list for launch campaigns |
| Delayed Flutterwave settlement | Keep operating reserves |
| High refund period | Clear refund policy, quality delivery |
| MQL5 payout delays | Don't depend on MQL5 revenue for operations |

---

## Financial Goals

### Short-Term (This Quarter)
- Deploy EA addon for additional per-order revenue
- Fix newsletter→Brevo to grow email list (future revenue)
- Track monthly revenue consistently

### Medium-Term (Next 2 Quarters)
- Consistent monthly revenue growth
- Automated mentorship billing (reduce churn from forgotten renewals)
- First paid advertising with positive ROAS

### Long-Term (2027+)
- Multi-currency payments (expand beyond NGN)
- Recurring billing infrastructure
- Revenue diversification (signals, additional EAs, partnerships)

---

## Tax & Legal

### Current Status
- Business operates as sole proprietorship
- Income reported as personal income
- No formal business registration documented here

### Recommended Actions (🟡)
- Consult Nigerian tax advisor for proper filing
- Consider CAC registration when revenue justifies it
- Keep records of all Flutterwave transactions
- Document all business expenses for deductions
