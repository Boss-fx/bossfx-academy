// ================================================================
// Product Catalog — Single source of truth for all BossFx products
// ================================================================

const PRODUCTS = {
    'forex-101': {
        name: "Forex 101: The Trader's Bible",
        type: 'course',
        amountNGN: 25000,
        brevoTemplateId: 1, // Set in Brevo dashboard
        deliverables: [
            '12-module structured forex course',
            'Lifetime access to course materials',
            'Telegram community access',
            'Free Forex Starter Pack'
        ],
        telegramInvite: 'https://t.me/qD_fBeaziqE5YzU8',
        onboardingUrl: '/courses.html',
        category: 'education'
    },
    'mentorship-group': {
        name: 'Group Mentorship (Monthly)',
        type: 'mentorship',
        amountNGN: 60000,
        brevoTemplateId: 2,
        deliverables: [
            'Weekly live trading sessions',
            'Private mentorship community access',
            'Weekly market breakdowns',
            'Peer accountability group',
            'Direct mentor support'
        ],
        telegramInvite: 'https://t.me/qD_fBeaziqE5YzU8',
        onboardingUrl: '/mentorship.html',
        category: 'mentorship'
    },
    'mentorship-1on1': {
        name: '1-on-1 Mentorship (Monthly)',
        type: 'mentorship',
        amountNGN: 150000,
        brevoTemplateId: 3,
        deliverables: [
            'Weekly 1-on-1 sessions with mentor',
            'Personalized trade reviews',
            'Direct access to Timilehin Shobande',
            'Custom trading plan',
            'All Group Mentorship benefits'
        ],
        telegramInvite: 'https://t.me/qD_fBeaziqE5YzU8',
        onboardingUrl: '/mentorship.html',
        category: 'mentorship'
    },
    'vip': {
        name: 'VIP Program (Lifetime)',
        type: 'vip',
        amountNGN: 350000,
        brevoTemplateId: 4,
        deliverables: [
            'Lifetime access to everything',
            'SMA Pro Trend EA included',
            'Priority 1-on-1 support',
            'All future courses & updates',
            'VIP Telegram channel'
        ],
        telegramInvite: 'https://t.me/qD_fBeaziqE5YzU8',
        onboardingUrl: '/mentorship.html',
        category: 'vip'
    },
    'ea-bundle': {
        name: 'SMA Pro Trend EA (Bundle)',
        type: 'ea',
        amountNGN: 15000,
        brevoTemplateId: 5,
        deliverables: [
            'SMA Pro Trend EA for MT5',
            'Installation guide',
            'Recommended settings',
            'Lifetime updates'
        ],
        telegramInvite: 'https://t.me/qD_fBeaziqE5YzU8',
        onboardingUrl: 'https://www.mql5.com/en/market/product/174970',
        category: 'tool'
    }
};

function getProduct(productId) {
    return PRODUCTS[productId] || null;
}

function getProductByAmount(amountNGN) {
    return Object.entries(PRODUCTS).find(([_, p]) => p.amountNGN === amountNGN);
}

module.exports = { PRODUCTS, getProduct, getProductByAmount };
