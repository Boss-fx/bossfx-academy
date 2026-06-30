# Meta Pixel Integration — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering / Marketing

---

## Purpose

Meta Pixel tracks visitor behavior for Facebook and Instagram ad attribution, retargeting audiences, and conversion measurement.

---

## Configuration

| Setting | Value | Location |
|---|---|---|
| Pixel ID | 804009589230621 | `tracking.js` (loaded programmatically) |

No environment variables — the Pixel ID is public and client-side.

---

## Dashboard Settings

### Facebook Events Manager (business.facebook.com)
- **Pixel:** 804009589230621
- **Events:** PageView, Lead, InitiateCheckout, Purchase, ViewContent
- **Custom Conversions:** Create based on URL rules or event parameters
- **Aggregated Event Measurement:** Configure priority events (Purchase > InitiateCheckout > Lead > ViewContent)

---

## How It Works

### Pixel Loading (tracking.js)
The Meta Pixel is loaded via `tracking.js` on all pages:
```javascript
!function(f,b,e,v,n,t,s){...}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '804009589230621');
fbq('track', 'PageView');
```

### Standard Events Tracked
| Event | Trigger | Parameters |
|---|---|---|
| PageView | Every page load | Automatic |
| Lead | Form submission (lead capture) | content_name: source |
| InitiateCheckout | Checkout button click | content_ids, value, currency: NGN |
| Purchase | Payment success page | value, currency: NGN, content_ids |
| ViewContent | Product section scroll into view | content_name, content_ids |

### Custom Audiences
Create retargeting audiences in Facebook Ads Manager based on:
- Visited pricing page but didn't purchase
- Viewed specific product pages
- Submitted lead form
- Purchased (for lookalike audiences)

---

## Testing

### Pixel Helper Extension
1. Install "Meta Pixel Helper" Chrome extension
2. Visit `www.bossfxcademy.com`
3. Extension shows Pixel fires and parameters

### Test Events (Facebook Events Manager)
1. Go to Events Manager → Test Events tab
2. Enter website URL
3. Browse the site — events appear in real-time

---

## Common Failures

| Failure | Cause | Fix |
|---|---|---|
| Pixel not firing | Ad blocker or tracking.js not loaded | Expected for some visitors — non-blocking |
| Events not matching ads | Event parameters don't match conversion configuration | Verify event parameters in Events Manager Test Events |
| "Pixel not found" warning | Wrong Pixel ID | Verify 804009589230621 in tracking.js |
| Duplicate PageView events | Pixel initialized twice on same page | Check for duplicate fbq('init') calls |

---

## Recovery Steps

### Pixel Stopped Firing
1. Check if tracking.js is loaded: browser DevTools → Network → search "fbevents.js"
2. Check console for Pixel errors
3. Verify Pixel ID in tracking.js matches Events Manager

---

## Future Improvements
- [ ] Conversions API (server-side) to bypass ad blockers and improve match rate
- [ ] Custom conversion events for specific funnel stages
- [ ] Dynamic product catalog for Instagram Shopping
