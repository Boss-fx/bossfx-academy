const PRODUCTION_ORIGINS = [
    'https://www.bossfxcademy.com',
    'https://bossfxcademy.com'
];

const DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:3456',
    'http://localhost:5173'
];

function setCors(req, res) {
    const allowed = process.env.VERCEL_ENV === 'production'
        ? PRODUCTION_ORIGINS
        : PRODUCTION_ORIGINS.concat(DEV_ORIGINS);

    const origin = req.headers.origin || '';
    const match = allowed.includes(origin) ? origin : PRODUCTION_ORIGINS[0];

    res.setHeader('Access-Control-Allow-Origin', match);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
}

module.exports = { setCors };
