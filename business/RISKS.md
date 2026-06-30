# Business Risks — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** CEO
> **Review Frequency:** Quarterly

---

## Critical Risks (Immediate Attention)

### R1: Single Point of Failure — Founder Dependency
| Field | Detail |
|---|---|
| **Risk** | The entire business depends on one person (Timilehin Shobande) |
| **Impact** | If founder is unavailable, all operations stop — content, support, mentorship, deployments |
| **Probability** | Medium (illness, travel, burnout) |
| **Current mitigation** | SOPs documented, automated fulfillment, Claude Code as engineering partner |
| **Further mitigation** | Document all processes (this Business OS), build more automation, eventually hire |

### R2: Payment Flow Failure
| Field | Detail |
|---|---|
| **Risk** | Flutterwave webhook fails, customers pay but don't receive products |
| **Impact** | Revenue loss, refund requests, trust damage |
| **Probability** | Low (webhook is resilient) but high impact |
| **Current mitigation** | Signature verification, API verification, admin resend capability, dedup protection |
| **Further mitigation** | Webhook failure alerting (Phase 2), retry logic (Phase 2), payment verification fallback on success page |

### R3: Admin API Security
| Field | Detail |
|---|---|
| **Risk** | Admin API has CORS `Access-Control-Allow-Origin: *` — any website can call admin endpoints |
| **Impact** | Data exposure (order history, customer emails) |
| **Probability** | Low (requires knowing the endpoint + auth) but high severity |
| **Current mitigation** | JWT auth required, Supabase email whitelist |
| **Further mitigation** | Restrict CORS to specific origins (Phase 1 roadmap item) |

### R4: No Content Security Policy
| Field | Detail |
|---|---|
| **Risk** | No CSP header — vulnerable to XSS if any user input is reflected |
| **Impact** | Script injection, data theft, session hijacking |
| **Probability** | Low (minimal user-controlled content on pages) |
| **Current mitigation** | Static HTML with no dynamic content rendering |
| **Further mitigation** | Add CSP header in vercel.json (Phase 0 roadmap item) |

---

## High Risks

### R5: Platform Dependency — Vercel Hobby Plan
| Field | Detail |
|---|---|
| **Risk** | 12 serverless function limit, 30s timeout, no SLA on free tier |
| **Impact** | Cannot add new features without removing existing ones; no uptime guarantee |
| **Probability** | Medium (currently at 11/12 functions) |
| **Mitigation** | Consolidate endpoints (admin is already 3-in-1), upgrade to Pro when revenue justifies |

### R6: Platform Dependency — Supabase Free Tier
| Field | Detail |
|---|---|
| **Risk** | 500MB database limit, 1GB storage, paused after 7 days of inactivity |
| **Impact** | Data loss if paused (requires manual reactivation), storage cap limits product files |
| **Probability** | Medium (low traffic periods could trigger pause) |
| **Mitigation** | Daily cron keeps project active, monitor usage, upgrade when approaching limits |

### R7: Platform Dependency — Brevo Free Tier
| Field | Detail |
|---|---|
| **Risk** | 300 emails/day limit |
| **Impact** | On high-volume days (launch, campaign), emails could be throttled or dropped |
| **Probability** | Low (current volume well below 300/day) |
| **Mitigation** | Monitor daily email count, upgrade when running campaigns |

### R8: In-Memory Rate Limiter
| Field | Detail |
|---|---|
| **Risk** | Rate limiter uses in-memory Map, resets on every Vercel cold start |
| **Impact** | API abuse possible during cold starts |
| **Probability** | Medium (cold starts are frequent on Hobby plan) |
| **Mitigation** | Move to persistent rate limiting (Redis/KV) in Phase 2 |

### R9: Newsletter Subscribers Not Reaching Brevo
| Field | Detail |
|---|---|
| **Risk** | config.js `emailProvider` is set to `'none'` — frontend newsletter forms don't send to Brevo |
| **Impact** | Losing potential leads, CRM incomplete |
| **Probability** | Certain (this is a known active issue) |
| **Mitigation** | Fix config.js emailProvider setting (Phase 1 priority) |

---

## Medium Risks

### R10: No Automated Backups
| Field | Detail |
|---|---|
| **Risk** | No backup system for Supabase data or Supabase Storage files |
| **Impact** | Data loss from accidental deletion, corruption, or platform issues |
| **Probability** | Low |
| **Mitigation** | Supabase has point-in-time recovery on paid plans; implement export scripts |

### R11: Nigerian Regulatory Risk
| Field | Detail |
|---|---|
| **Risk** | CBN and SEC regulations on forex trading education could change |
| **Impact** | May need disclaimers, licensing, or operational changes |
| **Probability** | Low-Medium |
| **Mitigation** | Monitor regulatory developments, ensure clear disclaimers on all content |

### R12: Flutterwave Dependency
| Field | Detail |
|---|---|
| **Risk** | Flutterwave is the sole payment processor — API changes, outages, or account issues |
| **Impact** | All revenue stops during outages |
| **Probability** | Low (Flutterwave is established) |
| **Mitigation** | Monitor Flutterwave status, have Paystack as a backup option |

### R13: Competition
| Field | Detail |
|---|---|
| **Risk** | Increasing number of forex education platforms in Nigeria |
| **Impact** | Price pressure, customer acquisition becomes harder |
| **Probability** | Medium (market is growing) |
| **Mitigation** | Differentiate through EA tools, quality content, community, automation |

### R14: Supabase Anon Key Exposure
| Field | Detail |
|---|---|
| **Risk** | Supabase anon key is visible in admin/index.html meta tag |
| **Impact** | Public can query tables (RLS limits access, but surface area increases) |
| **Probability** | Medium |
| **Mitigation** | RLS policies enforce access control; move to server-side auth for admin (Phase 2) |

---

## Low Risks

### R15: Domain/DNS Issues
| Field | Detail |
|---|---|
| **Risk** | Domain registration lapses or DNS misconfiguration |
| **Impact** | Site goes offline |
| **Probability** | Low (set auto-renewal) |
| **Mitigation** | Calendar reminder 30 days before domain expiry |

### R16: Content Piracy
| Field | Detail |
|---|---|
| **Risk** | Course materials shared without authorization |
| **Impact** | Revenue loss |
| **Probability** | Medium (digital products are easily shared) |
| **Mitigation** | Token-gated downloads with expiry, DMCA takedowns if discovered |

### R17: Social Media Account Risk
| Field | Detail |
|---|---|
| **Risk** | Account hacking, platform bans, algorithm changes |
| **Impact** | Loss of audience and organic traffic channel |
| **Probability** | Low |
| **Mitigation** | 2FA on all accounts, diversify across platforms, build email list as owned channel |

---

## Risk Response Priority

| Priority | Risks | Action |
|---|---|---|
| **This month** | R9 (newsletter fix), R4 (CSP), R3 (CORS) | Phase 0-1 roadmap items |
| **This quarter** | R5 (function limit), R8 (rate limiter), R14 (anon key) | Phase 2 roadmap items |
| **Ongoing** | R1 (founder dependency), R2 (payment flow) | Continuous automation + documentation |
| **Monitor** | R11 (regulatory), R13 (competition), R12 (Flutterwave) | Quarterly review |
