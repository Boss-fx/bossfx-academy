# UTM Link Sheet — BossFx Academy

> **Purpose:** stop losing attribution to `(direct)`. Every link you post anywhere gets tagged so GA4 shows exactly which channel/post drove signups.
> **Last updated:** 2026-09-24

## The convention (keep it boring and consistent)

`https://bossfxcademy.com/<page>?utm_source=<where>&utm_medium=<what>&utm_campaign=<why>`

| Param | Meaning | Allowed values (lowercase, no spaces) |
|---|---|---|
| `utm_source` | The **platform** | `youtube` · `instagram` · `tiktok` · `whatsapp` · `telegram` · `facebook` · `x` · `email` |
| `utm_medium` | The **format** | `video` · `short` · `reel` · `story` · `bio` · `status` · `broadcast` · `post` · `dm` |
| `utm_campaign` | The **push** | `sunday_prep` · `forex101_launch` · `activation` · `trend_shorts` · `module8` |
| `utm_content` | *(optional)* variant | `pinned_comment` · `link_in_bio` · `thumb_a` |

**Rules:** all lowercase, underscores not spaces, never change the spelling once chosen (GA4 treats `WhatsApp` and `whatsapp` as two sources). Put `?` before the first param, `&` between the rest.

---

## Base pages

| Page | URL |
|---|---|
| Home | `https://bossfxcademy.com/` |
| **Start Here** (best for cold traffic) | `https://bossfxcademy.com/start-here.html` |
| **My Learning / free signup** | `https://bossfxcademy.com/learn/` |
| Forex 101 course | `https://bossfxcademy.com/courses.html#forex101` |
| Live / webinars | `https://bossfxcademy.com/live.html` |
| Mentorship | `https://bossfxcademy.com/mentorship.html` |

---

## Ready-to-copy links — current push

### YouTube
| Placement | Link |
|---|---|
| Sunday Market Prep — description | `https://bossfxcademy.com/learn/?utm_source=youtube&utm_medium=video&utm_campaign=sunday_prep` |
| Sunday Market Prep — pinned comment | `https://bossfxcademy.com/start-here.html?utm_source=youtube&utm_medium=video&utm_campaign=sunday_prep&utm_content=pinned_comment` |
| Shorts (all 6) — description | `https://bossfxcademy.com/learn/?utm_source=youtube&utm_medium=short&utm_campaign=trend_shorts` |
| Channel "Start here" banner link | `https://bossfxcademy.com/start-here.html?utm_source=youtube&utm_medium=bio&utm_campaign=forex101_launch` |

### Instagram
| Placement | Link |
|---|---|
| **Link in bio** | `https://bossfxcademy.com/start-here.html?utm_source=instagram&utm_medium=bio&utm_campaign=forex101_launch` |
| Reels caption / sticker | `https://bossfxcademy.com/learn/?utm_source=instagram&utm_medium=reel&utm_campaign=trend_shorts` |
| Story link sticker | `https://bossfxcademy.com/learn/?utm_source=instagram&utm_medium=story&utm_campaign=sunday_prep` |

### TikTok
| Placement | Link |
|---|---|
| Link in bio | `https://bossfxcademy.com/start-here.html?utm_source=tiktok&utm_medium=bio&utm_campaign=forex101_launch` |
| Video caption | `https://bossfxcademy.com/learn/?utm_source=tiktok&utm_medium=short&utm_campaign=trend_shorts` |

### WhatsApp
| Placement | Link |
|---|---|
| Broadcast / "where do I start" reply | `https://bossfxcademy.com/learn/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=activation` |
| Status update | `https://bossfxcademy.com/learn/?utm_source=whatsapp&utm_medium=status&utm_campaign=sunday_prep` |
| 1:1 DM | `https://bossfxcademy.com/start-here.html?utm_source=whatsapp&utm_medium=dm&utm_campaign=forex101_launch` |

### Telegram
| Placement | Link |
|---|---|
| Channel post | `https://bossfxcademy.com/learn/?utm_source=telegram&utm_medium=post&utm_campaign=activation` |

### Facebook / X
| Placement | Link |
|---|---|
| Facebook post | `https://bossfxcademy.com/learn/?utm_source=facebook&utm_medium=post&utm_campaign=trend_shorts` |
| X post | `https://bossfxcademy.com/learn/?utm_source=x&utm_medium=post&utm_campaign=trend_shorts` |

### Email (Brevo)
> Already tagged in the campaign builds: `?utm_source=email&utm_medium=broadcast&utm_campaign=activation1`. Keep using `utm_source=email` so Brevo click-tracking stops showing as a "sendib" referral.

---

## Building a new link
1. Pick the **page** (usually `start-here.html` for cold traffic, `learn/` for warm).
2. Add `?utm_source=` + platform, `&utm_medium=` + format, `&utm_campaign=` + the push.
3. Shorten with your link tool if you want a clean display — the UTMs still pass through.

## Where to see the payoff in GA4
- **Reports → Acquisition → Traffic acquisition** → the "(direct)" blob shrinks; `youtube / video`, `instagram / bio`, `whatsapp / broadcast` appear as real rows.
- **Explore → Free-form** → dimension `Session campaign`, metric `Key events` → see which *campaign* drives the most signups.
