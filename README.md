# BossFX Academy

Static website for BossFX Academy — Forex trading education and the BossFx SMA Pro Trend EA.

**Live:** https://bossfx-academy.vercel.app  
**EA Product:** https://www.mql5.com/en/market/product/174970

## Stack

- Static HTML / CSS / vanilla JS (no framework)
- Vercel for hosting
- Formspree for email capture
- Google Analytics 4 + Microsoft Clarity for tracking

## Pages

| Page | File |
|------|------|
| Homepage | `index.html` |
| About | `about.html` |
| Courses | `courses.html` |
| Mentorship | `mentorship.html` |
| Community | `community.html` |
| Contact | `contact.html` |
| Thank You | `thank-you.html` |
| Blog Index | `blog/index.html` |
| Blog Posts | `blog/*.html` |

## Setup TODOs

Before going live with a custom domain, complete these items:

- [ ] Replace `G-XXXXXXXXXX` with your real GA4 Measurement ID (all HTML files)
- [ ] Replace `XXXXXXXXXX` Clarity project ID with your real ID (all HTML files)
- [ ] Replace `YOUR_FORM_ID` in `script.js` with your Formspree form ID
- [ ] Replace `founder-placeholder.png` with a real founder photo
- [ ] Add backtest screenshot images to the EA dashboard card on homepage
- [ ] Write full content for blog post stubs (replace placeholder text)
- [ ] Connect custom domain (see `DOMAIN_SETUP.md`)

## Deploy

```bash
npx vercel --yes --prod
```

## Project Structure

```
bossfx-academy/
├── index.html
├── about.html
├── courses.html
├── mentorship.html
├── community.html
├── contact.html
├── thank-you.html
├── styles.css
├── script.js
├── blog/
│   ├── index.html
│   ├── why-i-built-the-sma-pro-ea.html
│   ├── 21-validation-errors.html
│   └── spot-a-scam-forex-ea.html
└── assets/
    ├── logo.png
    ├── og-banner.png
    ├── favicon.ico
    ├── favicon-16.png
    ├── favicon-32.png
    ├── favicon-192.png
    ├── founder-placeholder.png
    └── site.webmanifest
```
