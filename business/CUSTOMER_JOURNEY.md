# Customer Journey — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO / Product

---

## Journey Stages

### 1. Discovery

**How they find us:**
| Channel | Content Type | Status |
|---|---|---|
| Instagram | Trading tips, EA showcases, lifestyle | ✅ Active |
| TikTok | Short trading clips, results, education | ✅ Active |
| YouTube | Long-form education, tutorials | ✅ Active |
| Google Search | Blog posts (11 articles with JSON-LD) | ✅ Active |
| X (Twitter) | Market commentary, trading insights | ✅ Active |
| Word of mouth | Telegram community referrals | ✅ Active |
| Paid ads | Instagram/Facebook/Google ads | 🟡 Planned |

**First impression:** Landing page (index.html) with hero section, product showcase, social proof, EA validation badge.

### 2. Engagement

**What keeps them on the site:**
| Content | Purpose | Page |
|---|---|---|
| Blog posts | Education, SEO, trust building | /blog/ (11 articles) |
| Resource tools | Practical value, lead magnets | /resources/ (8 tools) |
| Course overview | Curriculum preview | /courses.html |
| Mentorship details | Program structure, founder credibility | /mentorship.html |
| About page | Founder story, mission | /about.html |
| Community page | Social proof, Telegram preview | /community.html |

**Analytics tracking:** UTM attribution (first-touch + last-touch), scroll depth, engagement scoring, conversion flow tracking via bfx-analytics.js.

### 3. Capture

**How we get their email:**

| Capture Point | Trigger | Sequence Assigned | Status |
|---|---|---|---|
| Exit intent popup | Mouse leaves viewport | Exit Intent (2 emails) | ✅ |
| Newsletter form | Scroll past content | Welcome (4 emails) | ✅ |
| Webinar registration | Webinar page CTA | Webinar (2 emails) | ✅ |
| Resource download | Resource page form | Resource (3 emails) | ✅ |
| Mentorship inquiry | Mentorship page form | Mentorship (3 emails) | ✅ |
| Contact form | Contact page | Formspree (no sequence) | ✅ |

**Data captured:** Email, name, source, UTM params, referrer, landing page, device type, experience level (where applicable).

**Lead scoring:** 5-40 points based on action (mentorship inquiry = 40, webinar = 25, resource = 15, general = 10, exit intent = 5).

### 4. Nurture

**Drip email sequences (automated via lib/drip.js):**

| Sequence | Day 0 | Day 1 | Day 2-3 | Day 4-5 | Goal |
|---|---|---|---|---|---|
| Welcome | Welcome email | Value content | Trading tip | Course CTA | Introduce, build trust |
| Resource | Deliver resource | — | Bonus strategies | Upsell path | Deliver value, convert |
| Mentorship | Acknowledgment | Social proof | — | Conversion push | Book consultation |
| Webinar | Confirmation | — | Follow-up | — | Attendance → purchase |
| Exit Intent | Recovery offer | Reminder | — | — | Recover abandoner |
| Re-engagement | "Miss you" | — | Value reminder | Final CTA | Win back inactive |

**Daily cron** (09:00 UTC) processes pending drip steps and triggers re-engagement for 30+ day inactive contacts.

### 5. Purchase

**Checkout flow (implemented in script.js):**

```
Product page → Click "Buy Now"
  ↓
Optional: Select EA addon checkbox (+₦15,000)
  ↓
Flutterwave inline checkout modal
  ↓
Payment: Card / Bank Transfer / USSD / Mobile Money
  ↓
Success redirect → /payment-success.html?tx_ref=...&status=successful
  ↓
Success page displays: product details, download buttons, Telegram link
```

**Automated fulfillment (webhook-triggered):**
1. Flutterwave webhook → signature verified
2. Payment verified via Flutterwave API
3. Order created in Supabase
4. Download token(s) generated (HMAC-SHA256)
5. Fulfillment email sent (product-specific template)
6. Admin notification sent
7. Contact added to Brevo "customer" list

### 6. Onboarding

**Per product type:**

| Product | Onboarding | Status |
|---|---|---|
| Forex 101 | Email with download links + Telegram invite + course access instructions | ✅ |
| Group Mentorship | Booking form → ICS calendar invite → Telegram invite → first session | ✅ |
| 1-on-1 Mentorship | Booking form → personal calendar invite → direct Telegram contact | ✅ |
| VIP | Full access email + EA download + priority support intro + VIP portal | ✅ |
| EA Bundle | Download link + MT5 installation guide + settings document | ✅ |

### 7. Success & Retention

| Method | Status | Implementation |
|---|---|---|
| Telegram community | ✅ Active | Post-purchase invite in every email |
| Course completion tracking | 🟡 Planned | Not yet implemented |
| Mentorship session management | ✅ Partial | Booking system, manual follow-up |
| Post-purchase email sequence | 🟡 Planned (Phase 3) | Upsell to next tier |
| Review/testimonial request | 🟡 Planned (Phase 3) | 7-day post-purchase email |
| Re-engagement for inactive | ✅ Active | 30-day cron-triggered sequence |

### 8. Expansion

**Upsell path (value ladder):**

```
Free Resources → Forex 101 (₦25K) → Group Mentorship (₦60K)
                                          ↓
                              1-on-1 Mentorship (₦150K)
                                          ↓
                                   VIP Lifetime (₦350K)

Cross-sell: EA addon (₦15K) available at any checkout
```

| Expansion Method | Status |
|---|---|
| EA addon upsell at checkout | 🚧 Built, pending deploy |
| Post-purchase upsell email | 🟡 Planned (Phase 3) |
| Referral program | 🟡 Planned (Phase 4) |
| Loyalty / repeat purchase incentive | 🟡 Planned |

---

## Journey Gaps (Opportunities)

| Gap | Impact | Solution | Phase |
|---|---|---|---|
| No abandoned checkout recovery | Lost sales | Capture email pre-payment, send recovery email | Phase 3 |
| No post-purchase upsell sequence | Missed upsell revenue | Automated email: course → mentorship, group → 1-on-1 | Phase 3 |
| No course completion tracking | Can't measure student success | Add progress tracking to VIP portal | Phase 4 |
| No review collection | Missing social proof | 7-day post-purchase email | Phase 3 |
| No WhatsApp channel | Lower engagement for Nigerian audience | WhatsApp Business API | Phase 4 |
| Newsletter subscribers don't reach Brevo | CRM gap | Fix config.js emailProvider setting | Phase 1 |
