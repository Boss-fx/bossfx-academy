// ================================================================
// Admin API Router — /api/admin?action=stats|resend|token|founder|system
// Consolidates admin endpoints into single function (Vercel Hobby limit)
// ================================================================

const { verifyAdmin } = require('../lib/admin-auth');
const { getSupabaseClient } = require('../lib/supabase');
const { getProduct } = require('../lib/products');
const { fulfillOrder } = require('../lib/fulfillment');
const { generateAccessToken, storeAccessToken } = require('../lib/files');
const { applyRateLimit } = require('../lib/rate-limit');
const { setCors } = require('../lib/cors');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (applyRateLimit(req, res, { windowMs: 60000, max: 30 })) return;

    const admin = await verifyAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const action = req.query.action || (req.method === 'GET' ? 'stats' : '');

    switch (action) {
        case 'stats': return handleStats(req, res);
        case 'resend': return handleResend(req, res);
        case 'token': return handleToken(req, res);
        case 'founder': return handleFounder(req, res);
        case 'system': return handleSystem(req, res);
        default: return res.status(400).json({ error: 'Unknown action. Use: stats, resend, token, founder, system' });
    }
};

async function handleStats(req, res) {
    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        const [ordersRes, downloadsRes, bookingsRes, recentRes] = await Promise.all([
            sb.from('orders').select('product_id, amount, currency, status, fulfilled, created_at, meta'),
            sb.from('downloads').select('id', { count: 'exact', head: true }),
            sb.from('mentorship_bookings').select('id, status', { count: 'exact' }),
            sb.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
        ]);

        const orders = ordersRes.data || [];
        const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
        const productBreakdown = {};
        let eaAddonCount = 0;
        let eaAddonRevenue = 0;
        orders.forEach(function(o) {
            var pid = o.product_id || 'unknown';
            if (!productBreakdown[pid]) productBreakdown[pid] = { count: 0, revenue: 0 };
            productBreakdown[pid].count++;
            productBreakdown[pid].revenue += parseFloat(o.amount) || 0;

            // Track EA addon stats from JSONB meta
            var meta = o.meta || {};
            if (meta.has_ea_addon === true || meta.ea_bundle === 'yes') {
                eaAddonCount++;
                eaAddonRevenue += meta.ea_addon_price || 15000;
            }
        });

        return res.status(200).json({
            totalOrders: orders.length,
            totalRevenue,
            totalDownloads: downloadsRes.count || 0,
            totalBookings: bookingsRes.count || 0,
            eaAddonStats: {
                count: eaAddonCount,
                revenue: eaAddonRevenue,
                conversionRate: orders.length > 0 ? Math.round((eaAddonCount / orders.length) * 100) : 0
            },
            productBreakdown,
            recentOrders: (recentRes.data || []).map(o => ({
                id: o.id,
                txRef: o.tx_ref,
                productId: o.product_id,
                amount: o.amount,
                currency: o.currency,
                customerEmail: o.customer_email,
                customerName: o.customer_name,
                status: o.status,
                fulfilled: o.fulfilled,
                hasEaAddon: !!(o.meta && (o.meta.has_ea_addon || o.meta.ea_bundle === 'yes')),
                createdAt: o.created_at
            }))
        });
    } catch (err) {
        console.error('[Admin Stats] Error:', err.message);
        return res.status(500).json({ error: 'Failed to load stats' });
    }
}

async function handleResend(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        const { data: order, error } = await sb.from('orders')
            .select('*').eq('id', orderId).single();
        if (error || !order) return res.status(404).json({ error: 'Order not found' });

        const product = getProduct(order.product_id);
        if (!product) return res.status(400).json({ error: 'Unknown product' });

        await fulfillOrder({
            id: order.flw_transaction_id,
            tx_ref: order.tx_ref,
            amount: order.amount,
            currency: order.currency,
            meta: order.meta || {},
            customer: {
                email: order.customer_email,
                name: order.customer_name,
                phone_number: order.customer_phone
            }
        });

        return res.status(200).json({ success: true, message: 'Email resent successfully' });
    } catch (err) {
        console.error('[Admin Resend] Error:', err.message);
        return res.status(500).json({ error: 'Failed to resend email' });
    }
}

async function handleToken(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        const { data: order, error } = await sb.from('orders')
            .select('*').eq('id', orderId).single();
        if (error || !order) return res.status(404).json({ error: 'Order not found' });

        const product = getProduct(order.product_id);
        if (!product) return res.status(400).json({ error: 'Unknown product' });

        const token = generateAccessToken(order.customer_email, order.product_id, product.type, order.id);
        const expiryMs = { course: 72, ea: 72, mentorship: 72, vip: 720 };
        const expiresAt = Date.now() + ((expiryMs[product.type] || 72) * 60 * 60 * 1000);

        await storeAccessToken(order.id, token, order.customer_email, order.product_id, product.type, expiresAt);

        return res.status(200).json({
            success: true,
            token,
            downloadUrl: '/api/download?token=' + encodeURIComponent(token),
            expiresAt: new Date(expiresAt).toISOString()
        });
    } catch (err) {
        console.error('[Admin Token] Error:', err.message);
        return res.status(500).json({ error: 'Failed to generate token' });
    }
}

async function handleFounder(req, res) {
    const sb = getSupabaseClient();
    if (!sb) return res.status(500).json({ error: 'Database unavailable' });

    try {
        var now = new Date();
        var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        var dow = now.getDay();
        var weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dow === 0 ? 6 : dow - 1)).toISOString();
        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        var qMonth = Math.floor(now.getMonth() / 3) * 3;
        var quarterStart = new Date(now.getFullYear(), qMonth, 1).toISOString();
        var thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

        var [allOrdersRes, downloadsRes, bookingsRes, recentOrdersRes] = await Promise.all([
            sb.from('orders').select('product_id, amount, status, fulfilled, created_at, customer_email, customer_name, meta'),
            sb.from('downloads').select('id, product_id, customer_email, downloaded_at'),
            sb.from('mentorship_bookings').select('id, status, created_at, product_id'),
            sb.from('orders').select('*').order('created_at', { ascending: false }).limit(20)
        ]);

        var orders = allOrdersRes.data || [];
        var downloads = downloadsRes.data || [];
        var bookings = bookingsRes.data || [];

        var rev = { today: 0, week: 0, month: 0, quarter: 0, all: 0 };
        var ord = { today: 0, week: 0, month: 0, all: orders.length };
        var products = {};
        var dailyRev = {};
        var customers = new Set();
        var monthCustomers = new Set();
        var eaCount = 0, eaRevenue = 0;

        orders.forEach(function(o) {
            var amt = parseFloat(o.amount) || 0;
            var ts = o.created_at;
            var pid = o.product_id || 'unknown';
            var email = (o.customer_email || '').toLowerCase();

            rev.all += amt;
            customers.add(email);

            if (ts >= todayStart) { rev.today += amt; ord.today++; }
            if (ts >= weekStart) { rev.week += amt; ord.week++; }
            if (ts >= monthStart) { rev.month += amt; ord.month++; monthCustomers.add(email); }
            if (ts >= quarterStart) { rev.quarter += amt; }

            if (!products[pid]) products[pid] = { count: 0, revenue: 0 };
            products[pid].count++;
            products[pid].revenue += amt;

            if (ts >= thirtyDaysAgo) {
                var day = ts.substring(0, 10);
                dailyRev[day] = (dailyRev[day] || 0) + amt;
            }

            var meta = o.meta || {};
            if (meta.has_ea_addon === true || meta.ea_bundle === 'yes') {
                eaCount++;
                eaRevenue += meta.ea_addon_price || 15000;
            }
        });

        var trend = [];
        for (var i = 29; i >= 0; i--) {
            var d = new Date(now.getTime() - i * 86400000);
            var key = d.toISOString().substring(0, 10);
            trend.push({ date: key, revenue: dailyRev[key] || 0 });
        }

        var dlThisMonth = downloads.filter(function(d) { return d.downloaded_at >= monthStart; }).length;
        var pendingBookings = bookings.filter(function(b) { return b.status === 'pending' || b.status === 'confirmed'; }).length;
        var bookingsMonth = bookings.filter(function(b) { return b.created_at >= monthStart; }).length;

        var brevoStats = null;
        if (process.env.BREVO_API_KEY) {
            try {
                var brevo = require('@getbrevo/brevo');
                var contactsApi = new brevo.ContactsApi();
                contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
                var lists = await contactsApi.getLists();
                var listData = lists.lists || lists.body?.lists || [];
                brevoStats = {
                    totalSubscribers: listData.reduce(function(s, l) { return s + (l.totalSubscribers || l.uniqueSubscribers || 0); }, 0),
                    lists: listData.map(function(l) { return { id: l.id, name: l.name, subscribers: l.totalSubscribers || l.uniqueSubscribers || 0 }; })
                };
            } catch (e) {
                brevoStats = { error: e.message, totalSubscribers: 0, lists: [] };
            }
        }

        return res.status(200).json({
            revenue: { today: rev.today, thisWeek: rev.week, thisMonth: rev.month, thisQuarter: rev.quarter, allTime: rev.all, trend: trend },
            orders: { today: ord.today, thisWeek: ord.week, thisMonth: ord.month, allTime: ord.all },
            products: products,
            eaAddon: { count: eaCount, revenue: eaRevenue, rate: orders.length > 0 ? Math.round((eaCount / orders.length) * 100) : 0 },
            students: { total: customers.size, thisMonth: monthCustomers.size },
            downloads: { total: downloads.length, thisMonth: dlThisMonth },
            bookings: { total: bookings.length, pending: pendingBookings, thisMonth: bookingsMonth },
            metrics: { aov: orders.length > 0 ? Math.round(rev.all / orders.length) : 0 },
            brevo: brevoStats,
            recentOrders: (recentOrdersRes.data || []).map(function(o) {
                return {
                    id: o.id, txRef: o.tx_ref, productId: o.product_id, amount: o.amount,
                    customerEmail: o.customer_email, customerName: o.customer_name,
                    status: o.status, fulfilled: o.fulfilled,
                    hasEa: !!(o.meta && (o.meta.has_ea_addon || o.meta.ea_bundle === 'yes')),
                    createdAt: o.created_at
                };
            }),
            generatedAt: now.toISOString()
        });
    } catch (err) {
        console.error('[Founder Dashboard] Error:', err.message);
        return res.status(500).json({ error: 'Failed to load dashboard data' });
    }
}

async function handleSystem(req, res) {
    var checks = { checkedAt: new Date().toISOString() };

    var sb = getSupabaseClient();
    if (sb) {
        try {
            var r = await sb.from('orders').select('*', { count: 'exact', head: true });
            checks.supabase = r.error ? { status: 'error', message: r.error.message } : { status: 'healthy', orderCount: r.count };
        } catch (e) { checks.supabase = { status: 'error', message: e.message }; }
    } else {
        checks.supabase = { status: 'not_configured' };
    }

    if (process.env.BREVO_API_KEY) {
        try {
            var brevo = require('@getbrevo/brevo');
            var acctApi = new brevo.AccountApi();
            acctApi.setApiKey(brevo.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);
            var acct = await acctApi.getAccount();
            var plan = acct.plan || acct.body?.plan || [];
            checks.brevo = { status: 'healthy', plan: plan[0]?.type || 'unknown', credits: plan[0]?.credits };
        } catch (e) { checks.brevo = { status: 'error', message: e.message }; }
    } else {
        checks.brevo = { status: 'not_configured' };
    }

    checks.flutterwave = { status: process.env.FLUTTERWAVE_SECRET_KEY ? 'configured' : 'not_configured', webhookHash: !!process.env.FLUTTERWAVE_WEBHOOK_HASH };
    checks.vercel = { status: 'healthy', env: process.env.VERCEL_ENV || 'development', region: process.env.VERCEL_REGION || 'unknown', functionsUsed: 11, functionsLimit: 12 };
    checks.envVars = {
        FLUTTERWAVE_SECRET_KEY: !!process.env.FLUTTERWAVE_SECRET_KEY,
        BREVO_API_KEY: !!process.env.BREVO_API_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        DOWNLOAD_SECRET: !!process.env.DOWNLOAD_SECRET,
        ADMIN_EMAIL: !!process.env.ADMIN_EMAIL
    };

    return res.status(200).json(checks);
}
