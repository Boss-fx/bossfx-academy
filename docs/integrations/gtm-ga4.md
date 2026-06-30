# Google Tag Manager & GA4 Integration — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering / Marketing

---

## Purpose

Google Tag Manager (GTM) manages all Google tags and serves as the routing layer for event data. Google Analytics 4 (GA4) provides traffic analysis, behavior tracking, conversion measurement, and audience insights.

---

## Configuration

| Service | ID | Location |
|---|---|---|
| GTM Container | GTM-T3R88HZB | Inline script in `<head>` of all HTML pages |
| GA4 Property | G-ZFQ9P5KFSJ | `config.js → BFX.config.ga4Id` |

No environment variables — both IDs are public and client-side.

---

## Dashboard Settings

### GTM (tagmanager.google.com)
- **Container:** GTM-T3R88HZB
- **Tags to configure:** GA4 Configuration tag, GA4 Event tags, Meta Pixel tag (optional — currently loaded directly)
- **Triggers:** Page View (all pages), Custom Events (from dataLayer pushes)
- **Variables:** dataLayer variables for event parameters

### GA4 (analytics.google.com)
- **Property:** G-ZFQ9P5KFSJ
- **Conversions:** Mark `purchase`, `generate_lead`, `begin_checkout` as conversion events
- **Audiences:** Create audiences based on UTM source, product interest, engagement level
- **Data Retention:** Set to 14 months

---

## How It Works

### GTM Loading
Every HTML page includes the GTM container script in `<head>`:
```html
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T3R88HZB');</script>
```

### Event Tracking
`tracking.js` and `bfx-analytics.js` push events to the dataLayer:
```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
    event: 'generate_lead',
    source: 'newsletter_footer',
    // ... parameters
});
```

GTM routes these events to GA4 via configured tags.

### Enhanced Ecommerce
`bfx-analytics.js` Module 10 pushes GA4 ecommerce events:
- `view_item` — when product pricing section scrolls into view
- `add_to_cart` — when EA addon checkbox is selected
- `begin_checkout` — when checkout button is clicked
- `purchase` — on payment success page load

---

## Testing

### GTM Preview Mode
1. Go to tagmanager.google.com → Your Container
2. Click "Preview" (top right)
3. Enter `https://www.bossfxcademy.com`
4. The Tag Assistant panel shows which tags fired on each page

### GA4 Realtime
1. Go to analytics.google.com → Your Property
2. Click "Realtime" in the left sidebar
3. Navigate the live site in another tab
4. Events should appear within seconds

### Debug View
1. GA4 → Admin → DebugView
2. Install Google Analytics Debugger Chrome extension
3. Events appear with full parameter detail

---

## Common Failures

| Failure | Cause | Fix |
|---|---|---|
| GTM not loading | Ad blocker or script blocked | Normal for some visitors — analytics code degrades gracefully |
| Events not appearing in GA4 | GTM tags not configured or misconfigured | Check GTM Preview mode for tag firing status |
| Duplicate events | Multiple tracking scripts pushing same event | Check for duplicate `dataLayer.push()` calls |
| GA4 shows "(not set)" for parameters | Parameter name mismatch between push and GA4 config | Verify parameter names match in GTM variable configuration |

---

## Recovery Steps

### Events Stopped Appearing
1. Check GTM Preview mode — are tags firing?
2. Check if GTM container was accidentally modified
3. Verify GTM script is in page `<head>` (search for GTM-T3R88HZB)
4. Check GA4 property data stream is active

### Wrong GTM Container
1. Verify GTM-T3R88HZB is correct container ID
2. Search all HTML files: `grep -r 'GTM-' *.html blog/*.html`
3. All should reference GTM-T3R88HZB

---

## Future Improvements
- [ ] GA4 Measurement Protocol for server-side event tracking
- [ ] GA4 Conversions API integration
- [ ] Looker Studio dashboard connected to GA4
- [ ] GTM server-side tagging container
