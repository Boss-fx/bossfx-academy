# BossFx Analytics & Attribution System — Operations Guide

## Quick Reference

| Tool       | ID                   | Status |
|------------|----------------------|--------|
| GA4        | G-ZFQ9P5KFSJ         | Active |
| GTM        | GTM-T3R88HZB         | Active |
| Clarity    | wnde2od79f           | Active |
| Meta Pixel | 804009589230621      | Active |

---

## 1. UTM NAMING CONVENTIONS

### Required format
```
?utm_source={platform}&utm_medium={format}&utm_campaign={campaign_name}
```

### Standard UTM values

| Platform   | utm_source    | utm_medium options                               |
|------------|---------------|--------------------------------------------------|
| Instagram  | `instagram`   | `bio`, `story`, `reel`, `post`, `dm`, `ad`       |
| TikTok     | `tiktok`      | `bio`, `video`, `comment`, `ad`                  |
| Telegram   | `telegram`    | `group`, `dm`, `channel`, `post`                 |
| YouTube    | `youtube`     | `description`, `community`, `short`, `ad`        |
| WhatsApp   | `whatsapp`    | `group`, `dm`, `status`, `broadcast`             |
| X/Twitter  | `x`           | `bio`, `tweet`, `reply`, `dm`, `ad`              |
| Facebook   | `facebook`    | `post`, `group`, `story`, `ad`, `messenger`      |
| Email      | `email`       | `newsletter`, `transactional`, `drip`, `blast`   |
| Influencer | `influencer`  | `post`, `story`, `collab`, `affiliate`           |
| Paid Search| `google`      | `cpc`, `display`, `pmax`                         |
| Referral   | `{site_name}` | `referral`                                       |

### Campaign naming
```
utm_campaign={product}_{purpose}_{month_year}
```
Examples:
- `forex101_launch_may2026`
- `webinar_promo_june2026`
- `ea_sale_q3_2026`
- `mentorship_testimonials_may2026`

### Complete UTM examples
```
# Instagram bio link
https://bossfxcademy.com?utm_source=instagram&utm_medium=bio&utm_campaign=homepage_traffic

# Instagram reel CTA
https://bossfxcademy.com/courses.html?utm_source=instagram&utm_medium=reel&utm_campaign=forex101_promo_may2026

# Telegram group pinned
https://bossfxcademy.com/mentorship.html?utm_source=telegram&utm_medium=group&utm_campaign=mentorship_promo

# YouTube video description
https://bossfxcademy.com?utm_source=youtube&utm_medium=description&utm_campaign=weekly_analysis

# TikTok bio
https://bossfxcademy.com?utm_source=tiktok&utm_medium=bio&utm_campaign=homepage_traffic

# X/Twitter post
https://bossfxcademy.com/live.html?utm_source=x&utm_medium=tweet&utm_campaign=webinar_invite

# WhatsApp broadcast
https://bossfxcademy.com/courses.html?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=forex101_launch_may2026

# Email newsletter
https://bossfxcademy.com/mentorship.html?utm_source=email&utm_medium=newsletter&utm_campaign=mentorship_may2026

# Influencer collaboration
https://bossfxcademy.com?utm_source=influencer&utm_medium=collab&utm_campaign=trader_xyz_may2026&utm_content=youtube_mention

# Google Ads
https://bossfxcademy.com/courses.html?utm_source=google&utm_medium=cpc&utm_campaign=forex_course_nigeria&utm_term=forex+course+nigeria
```

---

## 2. GA4 KEY EVENTS TO MARK

Go to **GA4 Admin → Events** and mark these as Key Events (conversions):

| Event Name            | What It Tracks                    | Expected Volume |
|-----------------------|-----------------------------------|-----------------|
| `webinar_signup`      | Webinar form registration         | Medium          |
| `mentorship_apply`    | Mentorship application click      | Low-Medium      |
| `email_signup`        | Any email capture                 | High            |
| `telegram_join_click` | Telegram link click               | High            |
| `toolkit_download`    | Starter pack / resource download  | Medium          |
| `broker_signup_click` | Broker referral link click        | Low             |
| `purchase`            | Payment completion                | Low             |
| `generate_lead`       | Auto-fired on all lead captures   | High            |

### How to mark events as Key Events:
1. Go to GA4 → Admin → Data Display → Events
2. Find the event name in the list
3. Toggle the "Mark as key event" switch
4. Events may take 24-48 hours to appear after first fire

---

## 3. COMPLETE EVENT TAXONOMY

### Acquisition Events
| Event                   | Fires When                                | Key Params              |
|-------------------------|-------------------------------------------|-------------------------|
| `campaign_landing`      | User arrives with UTM parameters          | utm_source, utm_medium, utm_campaign |
| `returning_visitor`     | Returning user visits                     | visit_number, days_since_first |

### Engagement Events
| Event                   | Fires When                                | Key Params              |
|-------------------------|-------------------------------------------|-------------------------|
| `scroll_depth`          | 25%, 50%, 75%, 100% scroll milestones     | depth, page             |
| `section_view`          | Page section enters viewport              | section                 |
| `page_engagement`       | On page exit                              | time_seconds, engagement_level |
| `page_exit_scroll`      | On page exit                              | max_depth               |
| `engagement_score`      | On page exit                              | score, level            |
| `session_flow`          | On page exit                              | steps, pages_visited    |
| `chatbot_interaction`   | Chatbot opened or message sent            | page                    |
| `pricing_view`          | Pricing section enters viewport           | page, section           |
| `video_watch`           | YouTube video play/pause/complete         | action, video_title     |
| `cta_button_click`      | Any CTA button click                      | text, location, page    |
| `page_nav_click`        | Floating nav section click                | section, label          |

### Conversion Events (Key Events)
| Event                   | Fires When                                | Key Params              |
|-------------------------|-------------------------------------------|-------------------------|
| `email_signup`          | Newsletter, lead bar, or form email capture| source, location       |
| `webinar_signup`        | Webinar registration form submit          | webinar, experience     |
| `mentorship_apply`      | Mentorship apply button click             | tier                    |
| `telegram_join_click`   | Any Telegram link click                   | location                |
| `toolkit_download`      | Starter pack or resource download         | method                  |
| `strategy_download`     | Specific resource PDF download            | magnet                  |
| `broker_signup_click`   | Broker referral link click                | broker_url, location    |
| `funded_interest`       | Prop firm / funded account link click     | element_text, location  |
| `contact_form_submit`   | Contact page form submission              | page, source, channel   |

### Revenue Events
| Event                   | Fires When                                | Key Params              |
|-------------------------|-------------------------------------------|-------------------------|
| `checkout_initiated`    | Pay button click                          | product, amount         |
| `payment_success`       | Flutterwave callback success              | product, reference, amount |
| `payment_cancelled`     | Flutterwave modal closed                  | product                 |
| `purchase`              | Payment success page loads                | transaction_id, value, items |

### Social & Outbound Events
| Event                   | Fires When                                | Key Params              |
|-------------------------|-------------------------------------------|-------------------------|
| `outbound_link_click`   | Any external link click                   | link_url, link_type, link_location |
| `instagram_click`       | Instagram link click                      | url, location           |
| `youtube_click`         | YouTube link click                        | url, location           |
| `tiktok_click`          | TikTok link click                         | url, location           |
| `x_twitter_click`       | X/Twitter link click                      | url, location           |
| `whatsapp_click`        | WhatsApp link click                       | location, url           |
| `social_gate_follow`    | Social gate platform click                | platform, magnet        |
| `social_gate_complete`  | Social gate requirements met              | magnet, follows         |

### Funnel Events
| Event                   | Fires When                                | Key Params              |
|-------------------------|-------------------------------------------|-------------------------|
| `funnel_progress`       | User advances funnel stage                | from_stage, to_stage    |
| `funnel_v2_pageview`    | Any page view with stage classification   | stage, page             |

### Mobile Events
| Event                   | Fires When                                | Key Params              |
|-------------------------|-------------------------------------------|-------------------------|
| `mobile_orientation_change` | Device rotated                        | from, to                |
| `mobile_tap_zones`      | On page exit (mobile only)                | top_pct, middle_pct, bottom_pct |
| `mobile_ux_elements`    | Page load (mobile only)                   | has_sticky_cta, viewport_height |

---

## 4. CLARITY CUSTOM TAGS

These tags are auto-set and can be used to filter recordings in Clarity:

| Tag                | Values                                      |
|--------------------|---------------------------------------------|
| `user_type`        | `new`, `returning`                          |
| `visit_count`      | `1`, `2`, `3`, ...                          |
| `device`           | `mobile`, `desktop`                         |
| `device_class`     | `mobile`, `desktop`                         |
| `screen_bucket`    | `xs`, `sm`, `md`, `lg`, `xl`                |
| `page_type`        | `homepage`, `product_listing`, `events`, `community`, `contact`, `about`, `conversion`, `product_access`, `blog`, `page` |
| `traffic_source`   | `google`, `instagram`, `telegram`, `(direct)`, ... |
| `traffic_channel`  | `organic_search`, `organic_social`, `direct`, `paid`, `referral`, `email`, `affiliate` |
| `utm_source`       | UTM source or `(none)`                      |
| `utm_medium`       | UTM medium or `(none)`                      |
| `utm_campaign`     | UTM campaign or `(none)`                    |
| `landing_page`     | First page URL user landed on               |
| `funnel_stage`     | `homepage`, `starter_pack`, `telegram`, `webinar`, `mentorship`, `pricing`, `checkout` |
| `session_pageviews`| `1`, `2`, `3`, ...                          |
| `engagement_level` | `low`, `medium`, `high`                     |
| `engagement_score` | Numeric score on page exit                  |
| `engagement_tier`  | `low`, `medium`, `high`, `very_high`        |
| `is_converter`     | `true` (on conversion pages only)           |
| `purchased_product`| Product name (payment success pages only)   |
| `is_buyer`         | `true` (payment success pages only)         |

---

## 5. ATTRIBUTION MODEL

The system implements **dual attribution**:

- **First Touch** — The first source/medium that brought the user. Stored permanently in localStorage. Never overwritten.
- **Last Touch** — The most recent non-direct source/medium. Updated when user arrives with UTM params or from an external referrer.

Both are attached to every form submission as hidden fields.

### Form hidden fields (auto-injected)
| Field                | Description                            |
|----------------------|----------------------------------------|
| `_bfx_source`        | Last touch source                     |
| `_bfx_medium`        | Last touch medium                     |
| `_bfx_channel`       | Last touch channel classification     |
| `_bfx_campaign`      | Last touch campaign                   |
| `_bfx_utm_source`    | Raw UTM source                        |
| `_bfx_utm_medium`    | Raw UTM medium                        |
| `_bfx_utm_campaign`  | Raw UTM campaign                      |
| `_bfx_utm_content`   | Raw UTM content                       |
| `_bfx_utm_term`      | Raw UTM term                          |
| `_bfx_landing_page`  | First landing page URL                |
| `_bfx_referrer`      | HTTP referrer                         |
| `_bfx_ft_source`     | First touch source                    |
| `_bfx_ft_medium`     | First touch medium                    |

---

## 6. DEBUG MODE

Add `?debug_tracking=1` to any page URL to enable:
- Console logging of all dataLayer pushes
- Visual debug panel (bottom-right corner)
- Analytics health check in console
- Attribution data inspection

---

## 7. GA4 REPORTS TO BUILD

### Custom Explorations
1. **Acquisition → Source Performance**: Users by traffic source, with conversion rates
2. **Funnel Exploration**: homepage → telegram → webinar → mentorship → checkout
3. **Content Performance**: page_engagement by page, sorted by engagement_level
4. **CTA Heatmap**: cta_button_click events by location and text

### Suggested Dashboards
1. **Traffic Dashboard**: Sessions by source/medium, landing pages, countries
2. **Conversion Dashboard**: Key events by day, conversion rates, funnel drop-off
3. **Engagement Dashboard**: Scroll depth, time on page, pages/session
4. **Revenue Dashboard**: Purchase events, AOV, payment success rate

---

## 8. ARCHITECTURE

```
[Browser]
  ├── GA4 gtag (G-ZFQ9P5KFSJ) ← direct events
  ├── GTM (GTM-T3R88HZB) ← dataLayer events
  ├── Clarity (wnde2od79f) ← events + custom tags
  ├── Meta Pixel (804009589230621) ← mapped events
  │
  ├── script.js
  │   ├── BFX.analytics.track() ← core event dispatcher
  │   ├── BFX.funnel ← stage tracking
  │   ├── BFX.scrollDepth ← scroll milestones
  │   ├── BFX.cta ← CTA click tracking
  │   ├── BFX.conversions ← conversion events
  │   ├── BFX.engagement ← time + section tracking
  │   └── BFX.perf ← page load metrics
  │
  ├── tracking.js
  │   ├── BFX.tracking ← dataLayer + Meta Pixel bridge
  │   ├── Outbound link tracking
  │   ├── WhatsApp tracking
  │   ├── generate_lead events
  │   └── Page context classification
  │
  └── bfx-analytics.js ← NEW
      ├── BFX.attribution ← UTM parsing + persistence
      ├── BFX.formInject ← hidden field injection
      ├── BFX.eventStandard ← event aliasing
      ├── BFX.extraEvents ← missing event trackers
      ├── BFX.clarityEnhance ← advanced Clarity tags
      ├── BFX.mobileTrack ← mobile intelligence
      ├── BFX.engagementScore ← composite scoring
      ├── BFX.conversionFlow ← session flow tracking
      ├── BFX.socialOutbound ← platform-specific clicks
      ├── BFX.ecommerce ← GA4 purchase events
      └── BFX.analyticsHealth ← debug health check
```
