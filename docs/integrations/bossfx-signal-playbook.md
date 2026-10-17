# BossFx Signal Playbook (XAU/USD) — from Sunday Market Prep to Telegram

> Reverse-engineered from the BossFx Sunday-prep charts (Sep 2026, XAU/USD 2H) so the
> Telegram signal card mirrors how you actually analyse the market. **You stay the analyst;
> the bot is the broadcaster.** This is education, not financial advice.

---

## The BossFx method (what the charts show)

Your prep is a **top-down supply/demand + session-liquidity** read. The recurring building blocks:

1. **HTF bias first.** The dominant structure sets direction. Across the sample the 2H made
   **lower highs / lower lows from ~4,400 → ~4,147** — a clean bearish leg — and your down-arrow
   projections tracked it. Trade *with* that bias; fade it only at a major zone.
2. **Supply & demand zones** (the coloured boxes): red = **supply** (sell zones) above price,
   blue/green/orange = **demand** (buy zones) below. Drawn from the last strong move's origin
   (order block) and prior reaction points.
3. **Session levels** — the `AsiaSessionHighLowMidLines (1800–0200)` indicator: Asia **High / Low /
   Mid**. Price sweeping the Asia high/low then reclaiming is a core trigger.
4. **Prior day / range High & Low** (the right-edge "High" / "Low" markers + dashed purple
   equilibrium lines) — liquidity targets and invalidation references.
5. **Session windows** (the shaded vertical bands) — London and the London–NY overlap, where the
   decisive move usually prints.
6. **Projected path** (the arrows) — the if/then plan: *"if price taps supply X and rejects →
   target demand Y."*

### The BossFx setup checklist (A+ = all five)
- [ ] **Bias** — HTF structure agrees with the trade direction
- [ ] **Zone** — price is AT a drawn supply (sell) / demand (buy) zone
- [ ] **Liquidity** — a session or prior-day high/low has just been swept
- [ ] **Trigger** — rejection / reclaim confirms (2H candle)
- [ ] **R:R** — target (next opposing zone) gives **≥ 1:2**, SL beyond the zone

---

## The Telegram signal template

The bot formats this into the branded card (`signalCard()` in `lib/telegram-content.js`).
Fire it from anywhere (apex host + `-L`):

```bash
curl -fsSL -X POST https://bossfxcademy.com/api/telegram-webhook \
  -H "Authorization: Bearer <TELEGRAM_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "signal",
    "pair": "XAUUSD",
    "direction": "sell",
    "session": "NY Overlap",
    "bias": "HTF bearish — lower highs from 4,400",
    "zone": "4H supply 4,383–4,400",
    "entry": 4390, "sl": 4402, "tp": 4345, "tp2": 4305,
    "invalidation": "2H close above 4,402",
    "reason": "Swept Asia high, rejected supply — targeting demand below",
    "photo": "https://bossfxcademy.com/media/analysis/2026-09-21-xau.png"
  }'
```

Renders as:

> 🔴 **SELL XAUUSD** · NY Overlap
> 📊 **Bias:** HTF bearish — lower highs from 4,400
> 🎯 **Zone:** 4H supply 4,383–4,400
> **Entry:** 4390  **SL:** 4402  **TP:** 4345  **TP2:** 4305  (1:3.8 R:R)
> ❌ **Invalid:** 2H close above 4,402
> 📋 *Swept Asia high, rejected supply — targeting demand below*
> ⚠️ *Educational only — not financial advice. Risk ≤1–2% per trade.*

**Fields:** `pair`, `direction` (buy/sell), `entry`, `sl`, `tp` are required; `session`, `bias`,
`zone`, `tp2`, `invalidation`, `reason`, `photo` are optional. R:R is computed automatically.

### Attaching your chart (the picture IS the template)
Pass `photo` = a public image URL of your annotated chart and the bot sends the **chart image with the
signal as its caption** (`sendPhoto`). Easiest sources: a TradingView snapshot link, or upload the PNG to
`media/analysis/` on the site and use `https://bossfxcademy.com/media/analysis/<file>.png`.

---

## Can a picture of my analysis drive the signal? — yes, two ways

- **Template (now, recommended).** Your annotated chart already contains everything the card needs —
  bias, the zone, entry/SL/TP, invalidation. You read it (exactly like Sunday prep), fill the fields (or
  just attach the chart as `photo` + a one-line `reason`), and the bot broadcasts it in the BossFx format.
  This is the honest model: **your discretion, the bot's distribution.**
- **Fully mechanical (not recommended from a picture alone).** Drawing zones is judgement, and the site's
  `/api/market-data` has prices/sentiment/calendar but **no S/R zones**, so a bot can't *auto-generate* your
  entries without inventing levels. What a bot *can* compute reliably is a **"Key Levels to Watch"** post:
  Asia session High/Low/Mid + prior-day High/Low + current price + HTF bias — posted before each session as
  the backdrop, with your actual entry/SL/TP signal fired manually when price reacts. (Say the word and I'll
  build that auto "Key Levels" layer.)
