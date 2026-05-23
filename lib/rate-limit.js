const rateMap = new Map();
const CLEANUP_INTERVAL = 60000;

let lastCleanup = Date.now();

function rateLimit(req, { windowMs = 60000, max = 30, keyFn } = {}) {
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL) {
        for (const [key, entry] of rateMap) {
            if (now - entry.start > windowMs * 2) rateMap.delete(key);
        }
        lastCleanup = now;
    }

    const key = keyFn
        ? keyFn(req)
        : (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

    let entry = rateMap.get(key);
    if (!entry || now - entry.start > windowMs) {
        entry = { count: 0, start: now };
        rateMap.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
        return { limited: true, remaining: 0, retryAfter: Math.ceil((entry.start + windowMs - now) / 1000) };
    }

    return { limited: false, remaining: max - entry.count };
}

function applyRateLimit(req, res, opts) {
    const result = rateLimit(req, opts);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    if (result.limited) {
        res.setHeader('Retry-After', result.retryAfter);
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return true;
    }
    return false;
}

module.exports = { rateLimit, applyRateLimit };
