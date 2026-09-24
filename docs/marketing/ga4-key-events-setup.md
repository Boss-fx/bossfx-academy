# GA4 Key Events & Referral Exclusions — Setup

> **Property:** BossFx Academy · **Measurement ID:** `G-ZFQ9P5KFSJ` · **GTM:** `GTM-T3R88HZB`
> **Last updated:** 2026-09-24

This covers the two things that made GA4 report **0 qualified leads / 0 conversions**:
1. Key Events were never marked (and the LMS wasn't even tracked) — **code fixed**, dashboard toggle below.
2. Traffic attribution is polluted by self/API referrals — **dashboard config below**.

---

## 1. Key Events — what now fires (code shipped)

The `/learn/` area previously loaded **no analytics at all** (only `config.js`). It now loads GA4 + GTM + Clarity, and fires these events:

| GA4 event | Where it fires | Meaning | Mark as Key Event? |
|---|---|---|---|
| `sign_up` | `/learn/` — email + Google signup | New free student account | ✅ Yes |
| `generate_lead` | `/learn/` — on every signup | **The "Lead Gen Key Event" GA4 asked for** → powers *Qualified Leads* | ✅ Yes |
| `student_signup` | `/learn/` — on signup | Custom, for clean LMS reporting | optional |
| `begin_checkout` | `/learn/` lesson — Enroll click | Free→paid intent | ✅ Yes |
| `tutorial_complete` | `/learn/` lesson — finished last free module | Strong upgrade signal | optional |
| `purchase` | `payment-success.html` (already existed) | Completed paid enrollment | ✅ Yes |

### How to mark them as Key Events (2 min, one-time)
1. GA4 → **Admin** (bottom-left gear) → **Data display → Events**
2. Wait until each event has fired at least once (they appear in the list within ~24h of going live; or use **DebugView** to see them immediately).
3. Toggle **"Mark as key event"** on: `sign_up`, `generate_lead`, `begin_checkout`, `purchase`.
4. (Optional) Admin → **Key events** → set a **value** for `purchase` and `generate_lead` so GA4 can report revenue/lead value.

### The "Complete your implementation — Lead Gen Key Event" nag
That GA4 recommendation is satisfied by `generate_lead` (now firing on every signup). Once it's marked as a Key Event, the recommendation clears and **Qualified Leads stops showing 0.**

### Verify it's working (DebugView)
1. GA4 → Admin → **DebugView**.
2. On your phone/desktop, open `https://bossfxcademy.com/learn/?_dbg=1` and create a test account (or use the GA Debugger Chrome extension).
3. Watch `sign_up` + `generate_lead` land in DebugView in real time.

---

## 2. Referral Exclusions — clean the attribution

**Problem:** 84% of traffic shows as `(direct)/(none)`, plus noise from `api / (not set)` (56 sessions), the Brevo click-tracker (`…sendib…`), and the broker (`crm.xtools.tv`). These are **self-referrals and redirects**, not real sources — they hide which channels actually work.

> ⚠️ GA4 (unlike Universal Analytics) has **no code/gtag setting** for this. It must be done in the dashboard. There is nothing to deploy.

### How to add unwanted referrals (5 min, one-time)
1. GA4 → **Admin → Data streams** → click your web stream (`bossfxcademy.com`).
2. **Configure tag settings** → **Show more** → **List unwanted referrals**.
3. Match type **"Referral domain contains"**, add each of these:

| Domain | Why |
|---|---|
| `bossfxcademy.com` | Self-referral (own pages) |
| `flutterwave.com` | Payment redirect back to `payment-success` |
| `checkout.flutterwave.com` | Payment checkout |
| `ravemodal` | Flutterwave modal host |
| `sendibm1.com` / `sendibm2.com` / `sendibm3.com` | Brevo email click-tracking |
| `r.ag.d.sendibm` | Brevo redirect (seen in your data) |
| `crm.xtools.tv` | Broker/affiliate redirect |
| `mql5.com` | EA marketplace redirect |

4. Save. Applies to **new** traffic going forward (won't rewrite history).

### About `api / (not set)`
These are hits arriving without a page/source context (payment callbacks / API redirects). The exclusions above absorb most; the rest disappears once every inbound link carries a UTM (see the UTM sheet). If it persists after a week, check that no server-side/Measurement-Protocol calls are sending events without a `source`.

---

## 3. Order of operations
1. ✅ **Deploy** the code changes (learn-page tracking) — see PR/commit.
2. Add the **referral exclusions** (section 2).
3. Once `generate_lead` shows up, **mark Key Events** (section 1).
4. Tag every link with **UTMs** → `docs/marketing/utm-link-sheet.md`.
5. In ~3–5 days, check **Reports → Acquisition → Traffic acquisition** and **Engagement → Conversions** — "(direct)" should shrink and Qualified Leads should be > 0.
