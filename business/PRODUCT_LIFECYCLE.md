# Product Lifecycle — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO / Product

---

## Current Products

### Forex 101: The Trader's Bible
| Field | Value |
|---|---|
| **ID** | `forex-101` |
| **Status** | ✅ Live |
| **Price** | ₦25,000 |
| **Type** | Digital course (12 modules) |
| **Target** | Beginner traders, new to forex |
| **Deliverables** | 12-module course, Telegram access, Forex Starter Pack |
| **Funnel** | Blog/SEO → resource download → drip email → course page → checkout |
| **Upsell** | EA addon at checkout (₦15K), Group Mentorship post-purchase (🟡) |
| **KPIs** | Units sold, revenue, EA addon rate, completion rate (🟡 not tracked yet) |
| **Automation** | ✅ Payment → fulfillment → email → download — fully automated |
| **Dependencies** | Flutterwave, Brevo, Supabase Storage |
| **Launch Checklist** | ✅ Completed — product is live |

### Group Mentorship (Monthly)
| Field | Value |
|---|---|
| **ID** | `mentorship-group` |
| **Status** | ✅ Live |
| **Price** | ₦60,000/month |
| **Type** | Live group sessions + community |
| **Target** | Intermediate traders wanting guided learning |
| **Deliverables** | Weekly live sessions, market breakdowns, peer group, mentor support |
| **Funnel** | Social media → mentorship page → inquiry form → drip email → checkout |
| **Upsell** | 1-on-1 Mentorship (₦150K), VIP (₦350K) |
| **KPIs** | Active students, renewal rate, session attendance |
| **Automation** | ✅ Payment + booking automated. 🟡 Renewal billing is manual |
| **Dependencies** | Flutterwave, Brevo, Supabase, Telegram |

### 1-on-1 Mentorship (Monthly)
| Field | Value |
|---|---|
| **ID** | `mentorship-1on1` |
| **Status** | ✅ Live |
| **Price** | ₦150,000/month |
| **Type** | Private sessions with founder |
| **Target** | Serious traders wanting personalized guidance |
| **Deliverables** | Weekly 1-on-1 sessions, trade reviews, custom plan, direct access |
| **Funnel** | Referral / mentorship page → inquiry → consultation → checkout |
| **Upsell** | VIP Lifetime (₦350K) |
| **KPIs** | Active students, revenue per student, retention months |
| **Automation** | ✅ Payment + booking automated. 🟡 Session scheduling manual |

### VIP Program (Lifetime)
| Field | Value |
|---|---|
| **ID** | `vip` |
| **Status** | ✅ Live |
| **Price** | ₦350,000 |
| **Type** | Lifetime everything bundle |
| **Target** | High-intent traders wanting full access |
| **Deliverables** | All courses, EA included, priority support, all future updates, VIP Telegram |
| **Funnel** | Social proof / referral → VIP page → consultation → checkout |
| **Upsell** | None (top of ladder) |
| **KPIs** | LTV, referrals generated, community engagement |
| **Automation** | ✅ Payment → fulfillment → VIP portal access |

### SMA Pro Trend EA (Bundle)
| Field | Value |
|---|---|
| **ID** | `ea-bundle` |
| **Status** | ✅ Live (standalone + 🚧 checkout addon pending deploy) |
| **Price** | ₦15,000 |
| **Type** | MetaTrader 5 Expert Advisor |
| **Target** | Traders wanting automated execution |
| **Deliverables** | EA file, installation guide, recommended settings, lifetime updates |
| **Funnel** | MQL5 marketplace + checkout addon + direct purchase |
| **KPIs** | Units sold, addon conversion rate, support tickets |
| **Automation** | ✅ Fulfillment automated. EA addon tracking via JSONB meta |
| **Also sold on** | MQL5 Marketplace ($49.99 USD) |

---

## Planned Products

### Trading Challenges
| Field | Value |
|---|---|
| **Status** | 🟡 Planned |
| **Concept** | 30-day trading challenge with daily tasks, journaling, peer accountability |
| **Price** | ₦10,000-₦25,000 |
| **Target** | Beginner-intermediate traders |
| **Dependencies** | Progress tracking system, daily email automation |
| **Existing foundation** | `/resources/challenges/trading-discipline-tracker.html` exists as free tool |

### Additional Trading EAs
| Field | Value |
|---|---|
| **Status** | 🟡 Planned |
| **Concept** | Additional MetaTrader 5 EAs for different strategies |
| **Price** | ₦15,000-₦50,000 each |
| **Dependencies** | MQL5 development, MetaQuotes validation |

### Prop Firm Preparation Program
| Field | Value |
|---|---|
| **Status** | 🟡 Planned |
| **Concept** | Structured program to pass prop firm challenges (FTMO, MyForexFunds, etc.) |
| **Price** | ₦50,000-₦100,000 |
| **Existing foundation** | `/resources/prop-firm/prop-firm-survival-guide.html` exists as free resource |

### Trading Signals Service
| Field | Value |
|---|---|
| **Status** | 🟡 Planned (Phase 4+) |
| **Concept** | Daily/weekly forex trading signals via Telegram or WhatsApp |
| **Price** | ₦10,000-₦25,000/month |
| **Dependencies** | Telegram Bot API, signal generation system |

### Mobile App
| Field | Value |
|---|---|
| **Status** | 🟡 Planned (Phase 4+) |
| **Concept** | React Native or PWA for course access, signals, community |
| **Dependencies** | API refactoring, significant engineering investment |

### AI Trading Assistant
| Field | Value |
|---|---|
| **Status** | 🚧 Prototype exists |
| **Concept** | AI chatbot that answers trading questions and recommends products |
| **Existing foundation** | `chatbot.js` (1,435 lines) + `/api/market-data.js` already built |
| **Future** | Claude API integration for LLM-powered responses |

---

## Product Launch Process

See [/sop/new-product-launch.md](/sop/new-product-launch.md) for the 12-step launch SOP.

Summary: Define → Catalog → Upload files → Checkout button → Email template → Success page → Analytics → Sitemap → Test → Deploy → Announce.

---

## Free Products (Lead Magnets)

| Resource | Path | Purpose | Lead Capture |
|---|---|---|---|
| Forex Starter Pack | /resources/beginner/forex-starter-pack.html | Beginner onboarding | ✅ Via lead-capture |
| Pre-Trade Checklist | /resources/beginner/pre-trade-checklist.html | Daily trading tool | ✅ Via lead-capture |
| Trading Discipline Tracker | /resources/challenges/trading-discipline-tracker.html | Habit building | ✅ Via lead-capture |
| Trade Journal Sheet | /resources/journals/trade-journal-sheet.html | Trade logging | ✅ Via lead-capture |
| Prop Firm Survival Guide | /resources/prop-firm/prop-firm-survival-guide.html | Prop firm prep | ✅ Via lead-capture |
| Risk Calculator | /resources/risk-management/risk-calculator.html | Position sizing | ✅ Via lead-capture |
| Risk Management Blueprint | /resources/risk-management/risk-management-blueprint.html | Risk framework | ✅ Via lead-capture |
| Trading Plan Template | /resources/templates/trading-plan-template.html | Trading plan builder | ✅ Via lead-capture |
