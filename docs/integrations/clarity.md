# Microsoft Clarity Integration — BossFx Academy

> **Last Updated:** 2026-06-30
> **Owner:** Engineering

---

## Purpose

Microsoft Clarity provides free heatmaps, session recordings, and rage click detection for UX analysis.

---

## Configuration

| Setting | Value | Location |
|---|---|---|
| Project ID | wnde2od79f | `config.js → BFX.config.clarityId` |

No environment variables — the ID is public and client-side.

---

## Dashboard Settings

### Clarity Dashboard (clarity.microsoft.com)
- **Project:** wnde2od79f
- **Recordings:** Session recordings filtered by page, device, country
- **Heatmaps:** Click heatmaps and scroll heatmaps per page
- **Insights:** Rage clicks, dead clicks, excessive scrolling, quick backs

---

## How It Works

### Loading
Clarity is loaded via its tracking script on all pages. The script tag references the project ID from `config.js`.

### Enhanced Tracking (bfx-analytics.js Module 5)
`bfx-analytics.js` pushes custom tags to Clarity for better session segmentation:
- Traffic source (utm_source value)
- Device type (mobile/desktop)
- User engagement level (based on engagement score)

```javascript
if (window.clarity) {
    clarity('set', 'traffic_source', utmSource);
    clarity('set', 'device_type', deviceType);
    clarity('set', 'engagement', engagementLevel);
}
```

---

## Testing

1. Visit `https://www.bossfxcademy.com`
2. Browse a few pages, click around
3. Wait 5-10 minutes
4. Check Clarity Dashboard → Recordings — your session should appear
5. Check Heatmaps for the pages you visited

---

## Common Failures

| Failure | Cause | Fix |
|---|---|---|
| No recordings appearing | Clarity script blocked by ad blocker | Expected for some visitors |
| Custom tags not showing | `window.clarity` not defined when tags pushed | Check load order — Clarity must load before bfx-analytics.js |
| Sessions missing | Clarity free tier sampling | Normal — Clarity samples sessions at scale |

---

## Future Improvements
- [ ] Custom Clarity events for funnel step tracking
- [ ] Clarity integration with GA4 for cross-platform analysis
- [ ] Automated rage click alerts
