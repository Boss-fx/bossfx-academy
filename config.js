// ================================================================
// BFX.config — Centralized site constants
// ================================================================
var BFX = window.BFX || {};

BFX.config = {
    // Endpoints
    formspree: 'https://formspree.io/f/xeenzyna',

    // BossFx AI Platform (ADR-012) — consumed ONLY via the vendored @bossfx/sdk
    // bundle through the Application Service Layer (services/). Feature-flagged.
    // `url` is the DEFAULT; a <meta name="ai-platform-url" content="..."> tag,
    // when present, overrides it per-deployment (buildless env-config pattern,
    // mirrors admin.js's Supabase meta tags). Custom-domain migration = edit the
    // meta tag, no application-code change.
    aiPlatform: {
        url: 'https://ai-platform-web-eight.vercel.app/v1',  // default production Platform (public endpoint; auth via user JWT)
        enabled: false                                        // flip to true to enable SDK-backed AI
    },

    // Supabase client auth (Session E) — powers BFX.auth's session source for
    // AI requests. The anon key is PUBLIC by design (RLS enforces access);
    // never put service keys here. Fill at deploy to enable client sessions.
    supabase: {
        url: 'https://kklwvzpwgpcwxjmgikfq.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbHd2enB3Z3Bjd3hqbWdpa2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzk3MTYsImV4cCI6MjA5NTExNTcxNn0.cJZkXzogx0TKXg9fht7fP_iH_qjhxbka9nzIRwKumXg'
        // Same project + anon key already embedded client-side in admin/admin.js
        // and founder/app.js. Public by design — RLS enforces access server-side.
    },

    // Analytics
    ga4Id: 'G-ZFQ9P5KFSJ',
    clarityId: 'wnde2od79f',

    // Social links
    socials: {
        telegram: 'https://t.me/qD_fBeaziqE5YzU8',
        instagram: 'https://www.instagram.com/bossfx_academy',
        youtube: 'https://youtube.com/@bossfx-tradingcommunity',
        x: 'https://x.com/teebossx',
        tiktok: 'https://www.tiktok.com/@bossfx1'
    },

    // Payment (Flutterwave)
    flutterwave: {
        publicKey: 'FLWPUBK-bce48ede719bb5397228ffedb549c38b-X',
        currency: 'NGN',
        logo: 'https://www.bossfxcademy.com/assets/logo.png'
    },

    // Products
    ea: {
        url: 'https://www.mql5.com/en/market/product/174970',
        price: '$49.99'
    },

    // Email provider (frontend subscribe forms)
    // 'server' routes through /api/lead-capture → Brevo (secure, no API key exposure)
    email: {
        provider: 'server',
        lists: {
            general: 2,
            webinar: 3,
            mentorship: 5,
            resource: 6
        }
    },

    // Site info
    site: {
        name: 'BossFx Academy',
        url: 'https://www.bossfxcademy.com',
        founder: 'Timilehin \'BossFx\' Shobande',
        email: 'hello@bossfxcademy.com'
    }
};
