// ================================================================
// Universal Download Endpoint
// GET /api/download?token=xxx&file=file-key
// ================================================================

const fs = require('fs');
const path = require('path');
const { verifyAccessToken, getProductFiles, getSignedDownloadUrl, recordDownload } = require('../lib/files');
const { getOrderByFlwId } = require('../lib/orders');
const { applyRateLimit } = require('../lib/rate-limit');
const { setCors } = require('../lib/cors');

module.exports = async function handler(req, res) {
    setCors(req, res);
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

    // EA entitlement check: token must explicitly grant EA access
    // Tokens for ea-bundle product are only generated when:
    // 1. Standalone ea-bundle purchase (product.type === 'ea')
    // 2. EA addon was purchased with another product (separate ea-bundle token)
    // 3. VIP purchases (which include everything)
    // This prevents accessing EA files with a course-only token
    if (productId === 'ea-bundle' && payload.type !== 'ea' && payload.type !== 'vip') {
        return res.status(403).json({
            error: 'EA access not included',
            message: 'Your purchase does not include the SMA Pro Trend EA. Purchase it separately or add it to your next order.'
        });
    }

    try {
        const files = await getProductFiles(productId);

        if (files.length === 0) {
            return serveLegacyFile(req, res, payload, ip, ua);
        }

        // No specific file requested: for multi-file products, show a library
        // index listing every file. Single-file products keep the direct redirect
        // so existing links (EA, legacy) behave exactly as before.
        if (!file && files.length > 1) {
            return serveLibraryPage(res, token, files, productId);
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

function serveLibraryPage(res, token, files, productId) {
    const esc = (s) => String(s || '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
    const fmtSize = (n) => !n ? '' : (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB');

    const rows = files.map((f, i) => {
        const url = `/api/download?token=${encodeURIComponent(token)}&file=${encodeURIComponent(f.file_key || f.id)}`;
        const meta = [(f.file_type || '').toUpperCase(), fmtSize(f.file_size)].filter(Boolean).join(' · ');
        return `
      <a class="row" href="${esc(url)}" target="_blank" rel="noopener">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="info"><span class="name">${esc(f.file_name)}</span><span class="meta">${esc(meta)}</span></span>
        <span class="dl">Download &darr;</span>
      </a>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Your Library — BossFx Academy</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0f172a;color:#e2e8f0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;padding:32px 16px;line-height:1.5}
  .wrap{max-width:640px;margin:0 auto}
  .head{text-align:center;margin-bottom:28px}
  .brand{background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;font-weight:800;font-size:13px;letter-spacing:1px;display:inline-block;padding:6px 14px;border-radius:6px}
  h1{font-size:24px;margin:16px 0 6px;color:#f8fafc}
  .sub{color:#94a3b8;font-size:14px}
  .row{display:flex;align-items:center;gap:14px;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 18px;margin:10px 0;text-decoration:none;color:inherit;transition:border-color .15s,transform .15s}
  .row:hover{border-color:#10b981;transform:translateY(-1px)}
  .num{color:#10b981;font-weight:800;font-size:18px;min-width:28px}
  .info{flex:1;display:flex;flex-direction:column}
  .name{color:#f1f5f9;font-weight:600;font-size:15px}
  .meta{color:#64748b;font-size:12px;margin-top:2px}
  .dl{color:#10b981;font-weight:700;font-size:13px;white-space:nowrap}
  .foot{text-align:center;color:#64748b;font-size:12px;margin-top:28px;line-height:1.7}
  .foot a{color:#f59e0b;text-decoration:none}
</style></head>
<body><div class="wrap">
  <div class="head">
    <span class="brand">BOSSFX ACADEMY</span>
    <h1>Your Library</h1>
    <p class="sub">${files.length} files · tap any item to download</p>
  </div>
  ${rows}
  <div class="foot">
    Downloads are personal to your purchase. Links expire periodically — revisit this page from your email for fresh access.<br>
    Need help? <a href="mailto:hello@bossfxcademy.com">hello@bossfxcademy.com</a> · <a href="https://t.me/qD_fBeaziqE5YzU8">Telegram</a>
  </div>
</div></body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(200).send(html);
}

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
