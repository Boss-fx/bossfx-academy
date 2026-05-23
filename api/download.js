// ================================================================
// Universal Download Endpoint
// GET /api/download?token=xxx&file=file-key
// ================================================================

const fs = require('fs');
const path = require('path');
const { verifyAccessToken, getProductFiles, getSignedDownloadUrl, recordDownload } = require('../lib/files');
const { applyRateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (applyRateLimit(req, res, { windowMs: 60000, max: 20 })) return;

    const { token, file } = req.query;

    if (!token) {
        return res.status(400).json({
            error: 'Missing download token',
            message: 'This download link is invalid. Please check your email for the correct link, or contact support at hello@bossfxcademy.com'
        });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(403).json({
            error: 'Invalid or expired token',
            message: 'This download link has expired. Please contact support at hello@bossfxcademy.com for a new download link.'
        });
    }

    const productId = payload.product;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    try {
        const files = await getProductFiles(productId);

        if (files.length === 0) {
            return serveLegacyFile(req, res, payload, ip, ua);
        }

        const targetFile = file
            ? files.find(f => f.file_key === file || f.id === file)
            : files[0];

        if (!targetFile) {
            return res.status(404).json({ error: 'File not found for this product.' });
        }

        const signedUrl = await getSignedDownloadUrl(targetFile.file_key);
        if (!signedUrl) {
            return serveLegacyFile(req, res, payload, ip, ua);
        }

        await recordDownload(
            payload.orderId, null, payload.email,
            productId, targetFile.file_key, targetFile.file_name,
            ip, ua
        ).catch(err => console.error('[Download] Record failed:', err.message));

        return res.redirect(302, signedUrl);

    } catch (err) {
        console.error('[Download] Error:', err.message);
        return serveLegacyFile(req, res, payload, ip, ua);
    }
};

function serveLegacyFile(req, res, payload, ip, ua) {
    if (payload.product !== 'forex-101') {
        return res.status(404).json({
            error: 'File not available',
            message: 'This product\'s files are not yet available for download. Please contact support at hello@bossfxcademy.com'
        });
    }

    const filePath = path.join(process.cwd(), 'downloads', 'Forex_101_Beginner_Starter_Pack.pdf');
    if (!fs.existsSync(filePath)) {
        return res.status(500).json({ error: 'File not found. Please contact support.' });
    }

    recordDownload(
        payload.orderId, null, payload.email,
        'forex-101', 'legacy/Forex_101_Beginner_Starter_Pack.pdf',
        'Forex 101 Starter Pack', ip, ua
    ).catch(() => {});

    const fileBuffer = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Forex_101_Beginner_Starter_Pack_BossFx.pdf"');
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(200).send(fileBuffer);
}
