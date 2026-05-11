// ================================================================
// Secure Forex 101 PDF Download Endpoint
// GET /api/download-forex101?token=xxx
//
// Security layers:
// 1. Time-limited tokens (24h expiry)
// 2. Token is HMAC-signed with server secret
// 3. No direct file path exposed to public
// 4. Rate limiting via Vercel (automatic)
// ================================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.DOWNLOAD_SECRET || process.env.FLUTTERWAVE_SECRET_KEY || 'bfx-download-fallback-key';
const TOKEN_EXPIRY_HOURS = 72; // 3-day access window

/**
 * Generate a download token (called internally by fulfillment/access page)
 */
function generateToken(email, product = 'forex-101') {
    const payload = {
        email: email || 'customer',
        product,
        exp: Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    return `${data}.${sig}`;
}

/**
 * Verify a download token
 */
function verifyToken(token) {
    if (!token || !token.includes('.')) return null;
    const [data, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
        if (payload.exp < Date.now()) return null; // Expired
        return payload;
    } catch {
        return null;
    }
}

module.exports = function handler(req, res) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, generate, email } = req.query;

    // --- Internal token generation (called by verify-payment endpoint) ---
    if (generate === 'true' && email) {
        const internalKey = req.headers['x-internal-key'];
        if (internalKey !== SECRET) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const newToken = generateToken(email);
        return res.status(200).json({ token: newToken });
    }

    // --- Public download with token ---
    if (!token) {
        return res.status(400).json({
            error: 'Missing download token',
            message: 'This download link has expired or is invalid. Please check your email for the correct link, or contact support at hello@bossfxcademy.com'
        });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({
            error: 'Invalid or expired token',
            message: 'This download link has expired. Please contact support at hello@bossfxcademy.com for a new download link.'
        });
    }

    // Serve the PDF
    const filePath = path.join(process.cwd(), 'downloads', 'Forex_101_Beginner_Starter_Pack.pdf');

    if (!fs.existsSync(filePath)) {
        console.error('[Download] PDF file not found at:', filePath);
        return res.status(500).json({ error: 'File not found. Please contact support.' });
    }

    const fileBuffer = fs.readFileSync(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Forex_101_Beginner_Starter_Pack_BossFx.pdf"');
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');

    return res.status(200).send(fileBuffer);
};

// Export helpers for use by other API routes
module.exports.generateToken = generateToken;
module.exports.verifyToken = verifyToken;
