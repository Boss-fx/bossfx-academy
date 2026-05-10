// ================================================================
// BFX.config — Centralized site constants
// ================================================================
var BFX = window.BFX || {};

BFX.config = {
    // Endpoints
    formspree: 'https://formspree.io/f/xeenzyna',

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
        publicKey: 'FLWPUBK-ef7ae0ec39bd837e57a4a4bb28378fad-X',
        currency: 'NGN',
        logo: 'https://www.bossfxcademy.com/assets/logo.png'
    },

    // Products
    ea: {
        url: 'https://www.mql5.com/en/market/product/174970',
        price: '$49.99'
    },

    // Email provider (placeholder — configure when Brevo/ConvertKit is set up)
    email: {
        provider: 'none', // 'brevo' | 'convertkit' | 'mailchimp'
        apiEndpoint: '',
        publicKey: '',
        lists: {
            general: '',
            webinar: '',
            mentorship: '',
            resource: ''
        }
    },

    // Site info
    site: {
        name: 'BossFx Academy',
        url: 'https://www.bossfxcademy.com',
        founder: 'Timilehin \'BossFx\' Shobande',
        email: 'bossfx.official@gmail.com'
    }
};
