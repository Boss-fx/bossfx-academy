// ================================================================
// VIP Portal Access Endpoint
// GET /api/vip-access?token=xxx
// ================================================================

const { verifyAccessToken, getProductFiles } = require('../lib/files');
const { getSupabaseClient } = require('../lib/supabase');
const { applyRateLimit } = require('../lib/rate-limit');
const { setCors } = require('../lib/cors');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (applyRateLimit(req, res, { windowMs: 60000, max: 10 })) return;

    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Missing access token' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(403).json({
            error: 'Invalid or expired token',
            message: 'This VIP access link has expired. Please contact support at hello@bossfxcademy.com for a new link.'
        });
    }

    if (payload.type !== 'vip') {
        return res.status(403).json({ error: 'This token does not grant VIP access.' });
    }

    try {
        const allProducts = ['forex-101', 'ea-bundle', 'vip'];
        const filesByProduct = {};

        for (const pid of allProducts) {
            const files = await getProductFiles(pid);
            if (files.length > 0) {
                filesByProduct[pid] = files.map(f => ({
                    id: f.id,
                    name: f.file_name,
                    type: f.file_type,
                    size: f.file_size,
                    key: f.file_key
                }));
            }
        }

        let bookings = [];
        const sb = getSupabaseClient();
        if (sb) {
            const { data } = await sb.from('mentorship_bookings')
                .select('*')
                .eq('customer_email', payload.email)
                .order('created_at', { ascending: false })
                .limit(5);
            bookings = (data || []).map(b => ({
                id: b.id,
                productId: b.product_id,
                preferredDay: b.preferred_day,
                preferredTime: b.preferred_time,
                status: b.status,
                sessionDate: b.session_date
            }));
        }

        return res.status(200).json({
            success: true,
            email: payload.email,
            token,
            filesByProduct,
            bookings,
            telegramInvite: 'https://t.me/qD_fBeaziqE5YzU8'
        });

    } catch (error) {
        console.error('[VIP Access] Error:', error.message);
        return res.status(500).json({ error: 'Failed to load VIP portal data.' });
    }
};
