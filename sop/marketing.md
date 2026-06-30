# SOP: Marketing Campaigns — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Marketing

---

## Purpose

Step-by-step guide for running marketing campaigns with proper tracking and attribution.

---

## UTM Link Creation

Every marketing link must include UTM parameters for attribution tracking.

### Format
```
https://www.bossfxcademy.com/{page}?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}&utm_content={content}
```

### Source Values
| Platform | utm_source |
|---|---|
| Instagram | `instagram` |
| Facebook | `facebook` |
| TikTok | `tiktok` |
| YouTube | `youtube` |
| X (Twitter) | `twitter` |
| Google Ads | `google` |
| Email | `email` |
| Telegram | `telegram` |

### Medium Values
| Type | utm_medium |
|---|---|
| Organic social | `social` |
| Paid social | `paid_social` |
| Google paid | `cpc` |
| Email campaign | `email` |
| Referral | `referral` |

### Campaign Naming
Format: `{year}-{month}-{campaign-slug}`
Example: `2026-07-mentorship-launch`

### Content (Ad Variant)
Use to distinguish variants: `carousel-1`, `video-2`, `story-3`, `reel-1`

---

## Social Media Campaign

### Step 1: Create Content
- Design visual assets (Canva, Figma, or video editor)
- Write caption with clear CTA
- Include UTM link in bio or swipe-up

### Step 2: Set Up Tracking
1. Create UTM link for the campaign
2. Verify Meta Pixel is active on the landing page
3. Set up conversion event in Facebook Ads Manager (if paid)

### Step 3: Publish
- Post across platforms with platform-specific formatting
- Pin important posts in Telegram community
- Cross-promote between platforms

### Step 4: Monitor
- Check GA4 Realtime for incoming traffic
- Monitor lead capture form submissions (Vercel logs)
- Track conversion funnel in GA4: page view → lead → checkout → purchase

---

## Email Campaign

### Step 1: Segment Audience
Use Brevo contact lists:
- List 2 (General): All subscribers
- List 3 (Webinar): Webinar registrants
- List 5 (Mentorship): Mentorship inquiries
- List 6 (Resource): Resource downloaders

### Step 2: Create Email
- Use Brevo dashboard campaign editor, or
- Create HTML template and send via Brevo API

### Step 3: Add Tracking
- Use UTM params on all links in the email:
  ```
  ?utm_source=email&utm_medium=email&utm_campaign={campaign-name}
  ```

### Step 4: Send
- Test with a single recipient first
- Schedule for optimal time (10 AM WAT for Nigerian audience)
- Monitor open rate and click rate in Brevo dashboard

---

## Paid Ad Campaign

### Step 1: Set Up
1. Create campaign in Meta Ads Manager or Google Ads
2. Set pixel tracking (Meta Pixel 804009589230621)
3. Create custom audience (if retargeting)
4. Set budget and schedule

### Step 2: Landing Page
- Ensure landing page has all tracking scripts (GTM, Pixel, Clarity)
- Include lead capture form or direct checkout CTA
- Test page loads under 3 seconds on mobile

### Step 3: UTM Parameters
- Set UTM params in ad URL parameters
- Facebook: use URL Parameters field in ad setup
- Google: use final URL suffix

### Step 4: Monitor
- Check Meta Pixel events in Events Manager
- Track cost per lead and cost per acquisition
- A/B test ad variants using utm_content

---

## Campaign Performance Review

After each campaign:
1. Check GA4 → Acquisition → Traffic acquisition (filter by campaign)
2. Check Brevo → Contacts (filter by UTM_CAMPAIGN attribute)
3. Check Admin Dashboard → Orders (filter by date range)
4. Calculate:
   - Cost per lead (ad spend / leads captured)
   - Cost per acquisition (ad spend / purchases)
   - ROI (revenue - ad spend) / ad spend
5. Document learnings for future campaigns

---

## Campaign Checklist

- [ ] UTM parameters on all links
- [ ] Landing page has GTM, Pixel, GA4, Clarity
- [ ] Lead capture form works and reaches Brevo
- [ ] Checkout flow tested
- [ ] Ad creative reviewed and approved
- [ ] Budget and schedule confirmed
- [ ] Post-campaign review scheduled
