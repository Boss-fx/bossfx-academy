# Sales Playbook — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO / Sales AI
> **Status:** Self-serve sales model with consultative mentorship selling

---

## Sales Model

BossFx uses a **hybrid sales model:**
- **Self-serve** for courses and EA (customer buys directly via Flutterwave checkout)
- **Consultative** for mentorship and VIP (inquiry → conversation → purchase)

There is no dedicated sales team. The founder handles all consultative selling. The website handles self-serve conversion.

---

## Products & Positioning

| Product | Price | Buyer Type | Sales Motion |
|---|---|---|---|
| Forex 101 | ₦25,000 | Beginner, price-conscious | Self-serve (content → trust → buy) |
| EA Bundle | ₦15,000 | Automation-curious | Self-serve (demo → buy) + checkout addon |
| Group Mentorship | ₦60,000/mo | Intermediate, wants guidance | Consultative (inquiry → DM → sell) |
| 1-on-1 Mentorship | ₦150,000/mo | Serious, wants personal attention | Consultative (call → sell) |
| VIP Lifetime | ₦350,000 | High-intent, wants everything | Consultative (relationship → sell) |

---

## Value Ladder

```
FREE                    ENTRY                 GROWTH                 PREMIUM
────                    ─────                 ──────                 ───────
Resource tools (₦0)     Forex 101 (₦25K)      Group Mentorship       1-on-1 (₦150K/mo)
Blog posts (₦0)         EA Bundle (₦15K)      (₦60K/mo)             VIP Lifetime (₦350K)
Telegram (₦0)
```

**Movement strategy:** Each tier should naturally lead to the next. Free → Entry is driven by content and email nurture. Entry → Growth is driven by post-purchase upsell (🟡 planned). Growth → Premium is driven by results and relationship.

---

## Lead Qualification

### Lead Scoring (Automated via lib/drip.js)

| Action | Score | Interpretation |
|---|---|---|
| General newsletter signup | 10 | Curious, early stage |
| Resource download | 15 | Problem-aware, seeking tools |
| Webinar registration | 25 | Engaged, learning-ready |
| Mentorship inquiry | 40 | High intent, ready to buy |
| Exit intent capture | 5 | Casual, needs warming |

### Qualification Framework

**For consultative sales (mentorship/VIP inquiries):**

| Question | Purpose |
|---|---|
| How long have you been trading? | Assess level (determines group vs 1-on-1) |
| What's your biggest challenge right now? | Understand pain point |
| Have you invested in education before? | Gauge price sensitivity |
| What are your trading goals? | Align with product benefits |
| Are you currently profitable? | Determine urgency |

---

## Objection Handling

### Price Objections

**"₦25,000 is expensive for a course"**
> "I understand. Consider that one bad trade from lack of knowledge costs more than the course. Forex 101 gives you 12 structured modules plus the Telegram community. Many students make back the cost within their first month of disciplined trading."

**"₦60,000/month for group mentorship is a lot"**
> "You're right to think carefully about it. Here's the difference: you get weekly live sessions, real-time market breakdowns, and a mentor who trades daily. The accountability alone prevents losses that dwarf the fee. And you can cancel anytime."

**"₦150,000 for 1-on-1 is too much"**
> "1-on-1 is for serious traders who want personalized strategy. I review your actual trades, build a custom plan, and we meet every week. This is what prop firm traders invest in before passing their challenges."

### Trust Objections

**"How do I know this isn't a scam?"**
> "Valid question — the forex education space has too many scammers. Check our Telegram community (real students), our free resources (real tools), and our blog (real education). I also sell our EA on the official MQL5 Marketplace, which verifies all sellers."

**"Can I see results?"**
> "Absolutely. Check our Instagram for trade breakdowns and student testimonials. The SMA Pro Trend EA is live on MQL5 with a verified track record. But I'll be honest — no one can guarantee results in trading. What I guarantee is proper education."

### Timing Objections

**"I'm not ready yet"**
> "That's fair. Start with our free resources — the Forex Starter Pack and Risk Calculator are great starting points. Join our Telegram community too. When you're ready, the course will be here."

---

## Sales Process (Consultative)

### For Mentorship Inquiries

1. **Inquiry received** (via mentorship form → /api/lead-capture → drip sequence starts)
2. **First touch** — automated acknowledgment email within minutes
3. **Second touch** — drip email with social proof (Day 1)
4. **Third touch** — conversion push email (Day 3)
5. **If they reply** — start Telegram/WhatsApp conversation
6. **Qualification call** — ask qualification questions (above)
7. **Recommendation** — match to Group or 1-on-1 based on answers
8. **Close** — send payment link, follow up within 24 hours
9. **Onboarding** — booking form → calendar invite → Telegram group

### For VIP Inquiries

1. Same inquiry flow as mentorship
2. Personal conversation (Telegram/call)
3. Walk through everything VIP includes
4. Emphasize lifetime access and EA included
5. Handle objections
6. Send payment link
7. Full VIP onboarding (all access + priority support)

---

## Upsell Strategy

### At Checkout (✅ Built)
- EA addon checkbox: ₦15,000 added to any purchase

### Post-Purchase (🟡 Planned — Phase 3)
| From | To | Trigger | Message |
|---|---|---|---|
| Forex 101 | Group Mentorship | 7 days post-purchase | "Ready for the next level?" |
| Group Mentorship | 1-on-1 | 30 days active | "Want personalized attention?" |
| Any | VIP | 60 days active | "Unlock everything with VIP" |
| EA standalone | Course | 7 days post-purchase | "Get the education behind the EA" |

### Cross-Sell (🟡 Planned)
- Course buyers → EA upsell email
- Mentorship students → EA recommendation during sessions
- All customers → new product launches

---

## Win-Back Strategy

### Re-engagement Sequence (✅ Active)
- Trigger: 30+ days inactive in Brevo
- 3 emails over 7 days
- 60-day cooldown between sequences
- Processed daily by cron at 09:00 UTC

### Manual Win-Back (For High-Value Leads)
- Mentorship inquiries that didn't convert
- Send personal Telegram message after 2 weeks
- Offer to answer any remaining questions
- Never discount — offer value instead

---

## Sales Metrics to Track

| Metric | Source | Target |
|---|---|---|
| Monthly orders | Admin Dashboard | Growing |
| Conversion rate (visitor → purchase) | GA4 events / orders | > 1% |
| EA addon rate | Admin Dashboard | > 20% |
| Average order value | Revenue / Orders | > ₦30,000 |
| Mentorship inquiry → enrollment | Manual tracking | > 20% |
| Upsell rate | 🟡 Not tracked yet | > 10% (when implemented) |
