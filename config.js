// ================================================================
// BFX.config — Centralized site constants
// ================================================================
var BFX = window.BFX || {};

BFX.config = {
    // Endpoints
    formspree: 'https://formspree.io/f/xeenzyna',

    // BossFx AI Platform (ADR-012) — consumed ONLY via the vendored @bossfx/sdk
    // bundle through the Application Service Layer (services/). Feature-flagged.
    aiPlatform: {
        url: 'http://localhost:3100/v1',   // TODO: production platform URL at deploy
        enabled: false                      // flip to true to enable SDK-backed AI
    },

    // Supabase client auth (Session E) — powers BFX.auth's session source for
    // AI requests. The anon key is PUBLIC by design (RLS enforces access);
    // never put service keys here. Fill at deploy to enable client sessions.
    supabase: {
        url: '',        // e.g. https://<project>.supabase.co
        anonKey: ''     // the project's anon/public key
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
