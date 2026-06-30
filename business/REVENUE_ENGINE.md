# Revenue Engine — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO

---

## Revenue Flow

```
Traffic Sources                    Capture              Nurture              Convert              Expand
─────────────                    ───────              ───────              ───────              ──────
Instagram ─┐                   Exit Intent ─┐       Welcome Seq ─┐      Checkout ─┐         EA Addon ─┐
TikTok ────┤                   Newsletter ──┤       Resource Seq ┤      Webhook ──┤         Upsell ───┤
YouTube ───┤──→ Website ──→    Lead Bar ────┤──→    Webinar Seq ─┤──→   Fulfill ──┤──→      Cross-sell┤──→ Repeat
X ─────────┤    (38 pages)     Webinar ─────┤       Mentor Seq ──┤      Email ────┤         Referral ─┤    Revenue
Blog/SEO ──┤                   Resource DL ─┘       Exit Seq ────┘      Download ─┘         Re-engage ┘
Telegram ──┤                                        Re-engage ───┘
Google ────┘
```

---

## Revenue Stages

### Stage 1: Traffic (✅ Active)

| Source | Status | Monthly Volume | Quality |
|---|---|---|---|
| Instagram organic | ✅ | Variable | High (engaged traders) |
| TikTok organic | ✅ | Variable | Medium (broad reach) |
| YouTube organic | ✅ | Variable | High (long-form viewers) |
| SEO / Blog (11 posts) | ✅ | Growing | High (search intent) |
| Resource tools (8 pages) | ✅ | Growing | High (problem-solving intent) |
| Direct / Telegram | ✅ | Stable | Very High (warm referrals) |
| Paid ads | 🟡 | Not started | — |

### Stage 2: Capture (✅ Active)

| Method | Implementation | Conversion to Lead |
|---|---|---|
| Exit intent popup | bfx-convert.js → /api/lead-capture | ✅ Active |
| Newsletter signup | Footer/sidebar forms → /api/lead-capture | ✅ Active |
| Webinar registration | Webinar form → /api/lead-capture | ✅ Active |
| Resource download | Resource forms → /api/lead-capture | ✅ Active |
| Mentorship inquiry | Mentorship form → /api/lead-capture | ✅ Active |
| Contact form | contact.html → Formspree | ✅ Active (not in CRM) |

All lead capture routes to Brevo CRM with UTM attribution data. See [/AUTOMATION_MAP.md](/AUTOMATION_MAP.md) §1.

### Stage 3: Nurture (✅ Active)

| Sequence | Trigger | Steps | Goal |
|---|---|---|---|
| Welcome | General signup | 4 emails over 5 days | Introduce brand, build trust |
| Webinar | Webinar registration | 2 emails | Confirm + follow-up |
| Resource | Resource download | 3 emails over 4 days | Deliver value, upsell |
| Mentorship | Mentorship inquiry | 3 emails over 3 days | Social proof, conversion push |
| Exit Intent | Exit popup capture | 2 emails over 1 day | Recovery |
| Re-engagement | 30+ days inactive | 3 emails over 7 days | Win-back |

Lead scoring assigns 5-40 points per action, stored in Brevo contact attributes. See `lib/drip.js`.

### Stage 4: Convert (✅ Active)

| Conversion Path | Flow |
|---|---|
| Self-serve purchase | Product page → Flutterwave checkout → webhook → fulfillment |
| EA addon upsell | Any checkout → EA checkbox → bundled payment → separate EA token |
| Mentorship booking | Post-payment → booking form → ICS calendar invite |

Payment processing: Flutterwave inline checkout, NGN only, 5 product price points.
Fulfillment: Automated via webhook → `lib/fulfillment.js`.

### Stage 5: Expand (🚧 Partially Built)

| Method | Status | Implementation |
|---|---|---|
| EA addon upsell | 🚧 Built, pending deploy | Checkout checkbox, ₦15K |
| Post-purchase upsell email | 🟡 Planned (Phase 3) | Course buyer → mentorship drip |
| Cross-sell (mentorship tiers) | 🟡 Planned (Phase 3) | Group → 1-on-1 upsell |
| Re-engagement | ✅ Active | 30-day inactive → re-engagement sequence |
| Referral program | 🟡 Planned (Phase 4) | Discount codes + JSONB tracking |
| Abandoned checkout recovery | 🟡 Planned (Phase 3) | Pre-checkout email capture |

---

## Revenue Levers

### Immediate Impact (This Month)
1. **Deploy EA addon** — ₦15K additional revenue per qualifying order
2. **Fix newsletter → Brevo** — Currently losing subscribers (go to Formspree only)
3. **Run first paid campaign** — Instagram/TikTok ads to course page

### Medium-Term (Q3-Q4 2026)
4. **Post-purchase upsell sequence** — Automated course → mentorship email
5. **Abandoned checkout recovery** — 5-15% recovery rate on abandoned carts
6. **Referral program** — Viral growth through satisfied students
7. **Webinar funnel** — Highest-converting funnel in education

### Long-Term (2027+)
8. **Recurring billing** — Auto-renewal for mentorship reduces churn
9. **Multi-currency** — Open up non-Nigerian markets
10. **Additional EAs** — Expand product catalog
11. **Signals service** — Recurring revenue from active traders

---

## Revenue Protection

Revenue-critical systems that must never break:

| System | What Happens if It Breaks | Protection |
|---|---|---|
| Flutterwave webhook | Orders not fulfilled → customers don't receive products | Signature verification, amount validation, dedup protection |
| Fulfillment orchestrator | Emails not sent → customers complain | Parallel execution, admin resend, error logging |
| Download token system | Files not accessible → refund requests | HMAC-SHA256 crypto, stored tokens, admin token regeneration |
| Payment success page | Customers confused after payment | Client-side verification fallback, clear error messages |

See [/sop/incident-response.md](/sop/incident-response.md) for P0 response procedures.
