// ================================================================
// BossFx OS — Application Logic
// Modular dashboard with 10 modules, command palette, notifications
// Auth flow, API calls, and data model preserved from Phase 3B
// ================================================================

(function () {
    'use strict';

    // --- Supabase init (UNCHANGED) ---
    var sbUrl = document.querySelector('meta[name="supabase-url"]').content;
    var sbKey = document.querySelector('meta[name="supabase-anon-key"]').content;
    var supabase = window.supabase.createClient(sbUrl, sbKey);
    var session = null;
    var dashData = null;
    var sysData = null;

    // --- AI Team definitions ---
    var AI_ROLES = [
        { id: 'ceo-ai', title: 'CEO AI', subtitle: 'Strategic Advisor', purpose: 'Provide strategic analysis, help prioritize, challenge assumptions', cadence: 'Quarterly + ad-hoc', color: 'green' },
        { id: 'coo-ai', title: 'COO AI', subtitle: 'Operations Manager', purpose: 'Keep systems running, identify bottlenecks, optimize workflows', cadence: 'Monthly + incidents', color: 'blue' },
        { id: 'marketing-ai', title: 'Marketing AI', subtitle: 'Growth Marketer', purpose: 'Plan marketing campaigns, write copy, optimize conversion', cadence: 'Monthly + weekly', color: 'purple' },
        { id: 'sales-ai', title: 'Sales AI', subtitle: 'Sales Strategist', purpose: 'Optimize the sales funnel, draft sales copy, analyze conversion data', cadence: 'Monthly + ad-hoc', color: 'amber' },
        { id: 'support-ai', title: 'Support AI', subtitle: 'Customer Success', purpose: 'Draft support responses, analyze support patterns, improve CX', cadence: 'As needed', color: 'cyan' },
        { id: 'content-ai', title: 'Content AI', subtitle: 'Content Producer', purpose: 'Create educational content, blog posts, video scripts, social media', cadence: 'Weekly batch + monthly', color: 'pink' },
        { id: 'analytics-ai', title: 'Analytics AI', subtitle: 'Data Analyst', purpose: 'Analyze data, identify trends, produce reports, recommend actions', cadence: 'Monthly + quarterly', color: 'blue' },
        { id: 'seo-ai', title: 'SEO AI', subtitle: 'Search Optimizer', purpose: 'Improve organic search rankings and traffic', cadence: 'Monthly + per post', color: 'green' },
        { id: 'developer-ai', title: 'Developer AI', subtitle: 'Software Engineer', purpose: 'Build features, fix bugs, maintain code quality, deploy changes', cadence: 'Per session', color: 'cyan' },
        { id: 'security-ai', title: 'Security AI', subtitle: 'Security Auditor', purpose: 'Identify vulnerabilities, recommend fixes, audit security posture', cadence: 'Quarterly + per deploy', color: 'amber' },
        { id: 'research-ai', title: 'Research AI', subtitle: 'Market Researcher', purpose: 'Research competitors, market trends, customer needs', cadence: 'Quarterly', color: 'purple' },
        { id: 'trading-ai', title: 'Trading AI', subtitle: 'Trading Content Specialist', purpose: 'Trading-specific expertise for content and product development', cadence: 'Per request', color: 'green' },
        { id: 'automation-ai', title: 'Automation AI', subtitle: 'Workflow Architect', purpose: 'Design and implement automated workflows, reduce manual tasks', cadence: 'Monthly + per project', color: 'pink' }
    ];

    // --- Section config ---
    var SECTIONS = {
        'ceo': 'CEO Dashboard',
        'marketing': 'Marketing',
        'sales': 'Sales',
        'students': 'Students',
        'analytics': 'Analytics',
        'ai-control': 'AI Control Center',
        'automation': 'Automation',
        'finance': 'Finance',
        'operations': 'Operations',
        'settings': 'Settings'
    };

    // ================================================================
    // AUTH (UNCHANGED from Phase 3B)
    // ================================================================

    document.getElementById('fdrLoginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('fdrEmail').value.trim();
        var pw = document.getElementById('fdrPassword').value;
        var errEl = document.getElementById('fdrLoginError');
        errEl.textContent = '';
        try {
            var result = await supabase.auth.signInWithPassword({ email: email, password: pw });
            if (result.error) throw result.error;
            session = result.data.session;
            onLogin();
        } catch (err) {
            errEl.textContent = err.message || 'Login failed';
        }
    });

    async function checkSession() {
        var result = await supabase.auth.getSession();
        if (result.data && result.data.session) {
            session = result.data.session;
            onLogin();
        }
    }

    function onLogin() {
        document.getElementById('fdrLogin').style.display = 'none';
        document.getElementById('fdrApp').style.display = 'flex';
        document.getElementById('fdrUserEmail').textContent = session.user.email;
        startClock();
        loadDashboard();
    }

    window.fdrLogout = async function () {
        await supabase.auth.signOut();
        session = null;
        dashData = null;
        sysData = null;
        document.getElementById('fdrLogin').style.display = 'flex';
        document.getElementById('fdrApp').style.display = 'none';
    };

    // ================================================================
    // NAVIGATION
    // ================================================================

    var navItems = document.querySelectorAll('.fdr-nav-item');
    navItems.forEach(function (btn) {
        btn.addEventListener('click', function () { fdrNav(btn.dataset.section); });
    });

    window.fdrNav = function (section) {
        navItems.forEach(function (b) { b.classList.toggle('active', b.dataset.section === section); });
        document.querySelectorAll('.fdr-section').forEach(function (s) { s.classList.remove('active'); });
        var target = document.getElementById('sec-' + section);
        if (target) target.classList.add('active');
        document.getElementById('fdrPageTitle').textContent = SECTIONS[section] || section;
        closeSidebar();
    };

    // --- Mobile sidebar ---
    var hamburger = document.getElementById('fdrHamburger');
    var sidebar = document.getElementById('fdrSidebar');
    var overlay = document.getElementById('fdrOverlay');
    hamburger.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', closeSidebar);
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    }

    // ================================================================
    // COMMAND PALETTE
    // ================================================================

    var cmdOpen = false;
    var cmdIdx = 0;
    var cmdItems = Object.keys(SECTIONS).map(function (k) { return { id: k, label: SECTIONS[k], type: 'nav' }; });
    cmdItems.push({ id: 'refresh', label: 'Refresh Dashboard', type: 'action' });
    cmdItems.push({ id: 'logout', label: 'Sign Out', type: 'action' });

    function openCmd() {
        cmdOpen = true;
        document.getElementById('cmdPalette').classList.add('open');
        var input = document.getElementById('cmdInput');
        input.value = '';
        input.focus();
        cmdIdx = 0;
        renderCmd('');
    }

    function closeCmd() {
        cmdOpen = false;
        document.getElementById('cmdPalette').classList.remove('open');
    }

    function renderCmd(query) {
        var q = query.toLowerCase();
        var filtered = cmdItems.filter(function (item) { return item.label.toLowerCase().indexOf(q) >= 0; });
        if (cmdIdx >= filtered.length) cmdIdx = 0;
        var html = filtered.map(function (item, i) {
            var icon = item.type === 'nav' ? '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>' : '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>';
            return '<div class="fdr-cmd-item' + (i === cmdIdx ? ' active' : '') + '" data-idx="' + i + '" data-id="' + item.id + '" data-type="' + item.type + '">' + icon + '<span class="fdr-cmd-item-label">' + BFX.esc(item.label) + '</span><span class="fdr-cmd-item-hint">' + item.type + '</span></div>';
        }).join('');
        document.getElementById('cmdResults').innerHTML = html || '<div style="padding:20px;text-align:center;color:var(--fdr-dim)">No results</div>';

        document.querySelectorAll('.fdr-cmd-item').forEach(function (el) {
            el.addEventListener('click', function () { executeCmd(el.dataset.id, el.dataset.type); });
        });
    }

    function executeCmd(id, type) {
        closeCmd();
        if (type === 'nav') fdrNav(id);
        else if (id === 'refresh') fdrRefresh();
        else if (id === 'logout') fdrLogout();
    }

    document.getElementById('cmdInput').addEventListener('input', function (e) { renderCmd(e.target.value); });
    document.getElementById('cmdInput').addEventListener('keydown', function (e) {
        var items = document.querySelectorAll('.fdr-cmd-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdIdx = Math.min(cmdIdx + 1, items.length - 1); renderCmd(this.value); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cmdIdx = Math.max(cmdIdx - 1, 0); renderCmd(this.value); }
        else if (e.key === 'Enter') { e.preventDefault(); var active = items[cmdIdx]; if (active) executeCmd(active.dataset.id, active.dataset.type); }
        else if (e.key === 'Escape') { closeCmd(); }
    });

    document.getElementById('cmdPalette').addEventListener('click', function (e) { if (e.target === this) closeCmd(); });

    document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); cmdOpen ? closeCmd() : openCmd(); }
        if (e.key === 'Escape' && cmdOpen) closeCmd();
    });

    document.getElementById('fdrSearchInput').addEventListener('focus', function () { this.blur(); openCmd(); });

    // ================================================================
    // NOTIFICATIONS
    // ================================================================

    var notifications = [];

    window.fdrToggleNotifs = function () {
        var panel = document.getElementById('notifPanel');
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) renderNotifs();
    };

    window.fdrClearNotifs = function () {
        notifications = [];
        document.getElementById('notifDot').classList.remove('show');
        renderNotifs();
    };

    function addNotification(title, body, type) {
        notifications.unshift({ title: title, body: body, type: type || 'info', time: new Date().toISOString(), read: false });
        if (notifications.length > 50) notifications.pop();
        document.getElementById('notifDot').classList.add('show');
    }

    function renderNotifs() {
        var list = document.getElementById('notifList');
        if (!notifications.length) {
            list.innerHTML = '<div class="fdr-notif-empty"><span style="font-size:1.5rem">🔔</span><span>No notifications</span></div>';
            return;
        }
        list.innerHTML = notifications.map(function (n) {
            return '<div class="fdr-notif-item' + (n.read ? '' : ' unread') + '"><div class="fdr-notif-item-title">' + BFX.esc(n.title) + '</div><div class="fdr-notif-item-body">' + BFX.esc(n.body) + '</div><div class="fdr-notif-item-time">' + BFX.timeAgo(n.time) + '</div></div>';
        }).join('');
    }

    // ================================================================
    // API (UNCHANGED)
    // ================================================================

    function authHeaders() {
        return { 'Authorization': 'Bearer ' + (session ? session.access_token : ''), 'Content-Type': 'application/json' };
    }

    async function fetchFounderData() {
        var resp = await fetch('/api/admin?action=founder', { headers: authHeaders() });
        if (!resp.ok) throw new Error('Failed to load dashboard: ' + resp.status);
        return resp.json();
    }

    async function fetchSystemData() {
        var resp = await fetch('/api/admin?action=system', { headers: authHeaders() });
        if (!resp.ok) throw new Error('Failed to load system: ' + resp.status);
        return resp.json();
    }

    function getAuthClient() {
        return window.supabase.createClient(sbUrl, sbKey, {
            global: { headers: { Authorization: 'Bearer ' + session.access_token } }
        });
    }

    // ================================================================
    // CLOCK
    // ================================================================

    function startClock() {
        function tick() {
            var el = document.getElementById('fdrClock');
            if (el) el.textContent = new Date().toLocaleString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        }
        tick(); setInterval(tick, 1000);
    }

    // ================================================================
    // TOAST + REFRESH (UNCHANGED)
    // ================================================================

    window.fdrToast = function (msg, type) {
        var toast = document.getElementById('fdrToast');
        toast.textContent = msg;
        toast.className = 'fdr-toast show' + (type ? ' ' + type : '');
        setTimeout(function () { toast.className = 'fdr-toast'; }, 3500);
    };

    window.fdrRefresh = async function () {
        fdrToast('Refreshing data...');
        await loadDashboard();
        fdrToast('Dashboard updated', 'success');
    };

    window.fdrResend = async function (orderId) {
        if (!confirm('Resend fulfillment email for this order?')) return;
        try {
            var resp = await fetch('/api/admin?action=resend', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ orderId: orderId }) });
            var data = await resp.json();
            if (data.success) fdrToast('Email resent successfully', 'success');
            else fdrToast(data.error || 'Resend failed', 'error');
        } catch (e) { fdrToast('Resend failed: ' + e.message, 'error'); }
    };

    // ================================================================
    // MAIN LOAD
    // ================================================================

    async function loadDashboard() {
        try {
            var results = await Promise.all([fetchFounderData(), fetchSystemData()]);
            dashData = results[0];
            sysData = results[1];

            renderCEO();
            renderMarketing();
            renderSales();
            renderStudents();
            renderAnalytics();
            renderAIControl();
            renderAutomation();
            renderFinance();
            renderOperations();
            renderSettings();

            generateNotifications();
        } catch (err) {
            console.error('[BossFx OS] Load error:', err);
            fdrToast('Error loading dashboard: ' + err.message, 'error');
        }
    }

    function generateNotifications() {
        notifications = [];
        var d = dashData;
        if (d.orders.today > 0) addNotification('New Orders', d.orders.today + ' order' + (d.orders.today > 1 ? 's' : '') + ' today — ' + BFX.naira(d.revenue.today), 'success');
        if (d.bookings.pending > 0) addNotification('Pending Bookings', d.bookings.pending + ' mentorship booking' + (d.bookings.pending > 1 ? 's' : '') + ' need attention', 'warn');
        var s = sysData;
        if (s.supabase && s.supabase.status === 'error') addNotification('Supabase Error', s.supabase.message || 'Database connection issue', 'error');
        if (s.brevo && s.brevo.status === 'error') addNotification('Brevo Error', s.brevo.message || 'Email service issue', 'error');
        if (s.vercel && s.vercel.functionsUsed >= s.vercel.functionsLimit) addNotification('Function Limit', 'Serverless function limit reached (' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ')', 'error');
        if (notifications.length) document.getElementById('notifDot').classList.add('show');
    }

    // ================================================================
    // MODULE 1: CEO DASHBOARD
    // ================================================================

    function renderCEO() {
        var d = dashData;
        var html = BFX.sectionHeader('CEO Dashboard', 'Executive overview of BossFx Academy');

        html += BFX.metricGrid([
            ['Revenue Today', BFX.naira(d.revenue.today), 'green'],
            ['Revenue This Month', BFX.naira(d.revenue.thisMonth), 'green'],
            ['Orders Today', BFX.num(d.orders.today)],
            ['Total Students', BFX.num(d.students.total), 'blue'],
            ['Downloads', BFX.num(d.downloads.total)],
            ['Bookings', BFX.num(d.bookings.total)],
            ['EA Addon Rate', BFX.pct(d.eaAddon.rate), 'amber'],
            ['Email Subscribers', d.brevo ? BFX.num(d.brevo.totalSubscribers) : 'N/A', 'purple']
        ]);

        // Alerts
        var alerts = buildAlerts();
        if (alerts.length) html += alerts.map(function (a) { return BFX.alert(a.type, a.text); }).join('');

        // Trend + Products
        html += '<div class="fdr-grid-2">';
        html += BFX.card('30-Day Revenue Trend', BFX.trendChart(d.revenue.trend));
        html += BFX.card('Revenue by Product', BFX.productBreakdown(d.products));
        html += '</div>';

        // Goals
        html += '<div class="fdr-grid-2">';
        html += BFX.goalsCard("Today's Priorities", 'daily');
        html += BFX.goalsCard('Weekly Goals', 'weekly');
        html += '</div>';

        // Recent Orders
        html += BFX.card('Recent Orders', BFX.ordersTable(d.recentOrders, false), null, '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" onclick="fdrNav(\'sales\')">View All</button>');

        // AI Summary
        html += BFX.card('AI Team Summary', '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + AI_ROLES.map(function (r) {
            return BFX.badge(r.title, r.color);
        }).join('') + '</div><p style="margin-top:12px;font-size:0.8rem;color:var(--fdr-dim);">13 AI roles active across all business functions. <a href="#" onclick="fdrNav(\'ai-control\');return false;">Manage AI Team &rarr;</a></p>');

        document.getElementById('sec-ceo').innerHTML = html;
        renderGoalsInto('daily');
        renderGoalsInto('weekly');
    }

    function buildAlerts() {
        var alerts = [];
        var d = dashData;
        var s = sysData;
        if (d.orders.today > 0) alerts.push({ type: 'success', text: d.orders.today + ' order' + (d.orders.today > 1 ? 's' : '') + ' today — ' + BFX.naira(d.revenue.today) + ' revenue' });
        if (d.bookings.pending > 0) alerts.push({ type: 'warn', text: d.bookings.pending + ' pending mentorship booking' + (d.bookings.pending > 1 ? 's' : '') + ' require attention' });
        if (s.supabase && s.supabase.status === 'error') alerts.push({ type: 'error', text: 'Supabase: ' + (s.supabase.message || 'Error') });
        if (s.brevo && s.brevo.status === 'error') alerts.push({ type: 'error', text: 'Brevo: ' + (s.brevo.message || 'Error') });
        if (s.vercel && s.vercel.functionsUsed >= s.vercel.functionsLimit) alerts.push({ type: 'error', text: 'Serverless function limit reached' });
        if (!alerts.length) alerts.push({ type: 'success', text: 'All systems operational. No critical alerts.' });
        return alerts;
    }

    // ================================================================
    // MODULE 2: MARKETING
    // ================================================================

    function renderMarketing() {
        var d = dashData;
        var b = d.brevo;
        var html = BFX.sectionHeader('Marketing', 'Channels, campaigns, and audience growth');

        html += BFX.metricGrid([
            ['Email Subscribers', b ? BFX.num(b.totalSubscribers) : 'N/A', 'purple'],
            ['Blog Posts', '11'],
            ['Resource Tools', '8'],
            ['Lead Capture Points', '6']
        ]);

        html += '<div class="fdr-grid-2">';

        // Email Lists
        var listsHtml = '';
        if (b && b.lists && b.lists.length) {
            listsHtml = b.lists.map(function (l) { return BFX.settingRow(l.name, 'List #' + l.id, BFX.badge(BFX.num(l.subscribers) + ' subscribers', 'purple')); }).join('');
        } else {
            listsHtml = BFX.emptyState('📧', 'No Brevo Data', 'Email list data will appear when Brevo is connected.');
        }
        html += BFX.card('Email Lists (Brevo)', listsHtml);

        // Social Channels
        var socials = [
            ['Instagram', 'https://www.instagram.com/bossfx_academy', '@bossfx_academy'],
            ['TikTok', 'https://www.tiktok.com/@bossfx1', '@bossfx1'],
            ['YouTube', 'https://youtube.com/@bossfx-tradingcommunity', '@bossfx-tradingcommunity'],
            ['X (Twitter)', 'https://x.com/teebossx', '@teebossx'],
            ['Telegram', 'https://t.me/qD_fBeaziqE5YzU8', 'Community Group'],
            ['LinkedIn', 'https://linkedin.com', 'Coming Soon']
        ];
        var socialHtml = socials.map(function (s) {
            return '<a href="' + BFX.esc(s[1]) + '" target="_blank" rel="noopener" class="fdr-setting-row" style="text-decoration:none;color:inherit;"><span>' + BFX.esc(s[0]) + '</span>' + BFX.badge('Active', 'green') + '</a>';
        }).join('');
        html += BFX.card('Social Media Channels', socialHtml);
        html += '</div>';

        // Analytics Platforms
        html += BFX.card('Analytics & Tracking', '<div class="fdr-grid-2">' +
            BFX.serviceLink('Google Analytics 4', 'G-ZFQ9P5KFSJ', 'https://analytics.google.com', 'var(--fdr-blue-dim)', '📊') +
            BFX.serviceLink('Google Tag Manager', 'GTM-T3R88HZB', 'https://tagmanager.google.com', 'var(--fdr-blue-dim)', '🏷️') +
            BFX.serviceLink('Meta Pixel', '804009589230621', 'https://business.facebook.com', 'var(--fdr-blue-dim)', '📱') +
            BFX.serviceLink('Microsoft Clarity', 'wnde2od79f', 'https://clarity.microsoft.com', 'var(--fdr-purple-dim)', '🔍') +
            '</div>');

        // Content Calendar
        html += BFX.card('Content Calendar', BFX.emptyState('📅', 'Content Calendar', 'Plan and schedule content across all channels. Connect in Phase 4.', '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" disabled>Coming Soon</button>'));

        // Campaign Performance
        html += BFX.card('Campaign Performance', BFX.emptyState('📈', 'Campaign Analytics', 'Track campaign ROI, click-through rates, and conversions. Connect marketing tools in Phase 4.', '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" disabled>Coming Soon</button>'));

        document.getElementById('sec-marketing').innerHTML = html;
    }

    // ================================================================
    // MODULE 3: SALES
    // ================================================================

    function renderSales() {
        var d = dashData;
        var html = BFX.sectionHeader('Sales', 'Revenue, orders, and product performance');

        html += BFX.metricGrid([
            ['Today', BFX.naira(d.revenue.today), 'green'],
            ['This Week', BFX.naira(d.revenue.thisWeek), 'green'],
            ['This Month', BFX.naira(d.revenue.thisMonth), 'green'],
            ['This Quarter', BFX.naira(d.revenue.thisQuarter), 'green'],
            ['All Time', BFX.naira(d.revenue.allTime), 'green'],
            ['Avg Order Value', BFX.naira(d.metrics.aov)],
            ['EA Addon Revenue', BFX.naira(d.eaAddon.revenue), 'amber'],
            ['EA Conv. Rate', BFX.pct(d.eaAddon.rate), 'amber']
        ]);

        html += '<div class="fdr-grid-2">';
        html += BFX.card('Revenue by Product', BFX.productBreakdown(d.products));
        html += BFX.card('30-Day Trend', BFX.trendChart(d.revenue.trend));
        html += '</div>';

        // Flutterwave Overview
        var fwStatus = sysData.flutterwave || {};
        html += BFX.card('Flutterwave Payment Gateway',
            '<div class="fdr-grid-3">' +
            BFX.settingRow('Gateway Status', null, BFX.statusBadge(fwStatus.status === 'configured' ? 'configured' : 'error')) +
            BFX.settingRow('Webhook Hash', null, BFX.badge(fwStatus.webhookHash ? 'Verified' : 'Missing', fwStatus.webhookHash ? 'green' : 'red')) +
            BFX.settingRow('Currency', null, BFX.badge('NGN', 'blue')) +
            '</div>',
            null, '<a href="https://dashboard.flutterwave.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Flutterwave Dashboard &rarr;</a>');

        // Report tabs
        html += '<div id="salesReportArea">';
        html += BFX.tabs([
            { id: 'today', label: 'Today' }, { id: 'week', label: 'This Week' }, { id: 'month', label: 'This Month' }, { id: 'quarter', label: 'Quarter' }, { id: 'all', label: 'All Time' }
        ], 'today', 'fdrSalesReport');
        html += '</div>';

        // Orders
        html += BFX.card('All Orders', BFX.ordersTable(d.recentOrders, true));

        document.getElementById('sec-sales').innerHTML = html;
        fdrSalesReport('today');
    }

    window.fdrSalesReport = function (period) {
        var d = dashData;
        var revMap = { today: d.revenue.today, week: d.revenue.thisWeek, month: d.revenue.thisMonth, quarter: d.revenue.thisQuarter, all: d.revenue.allTime };
        var ordMap = { today: d.orders.today, week: d.orders.thisWeek, month: d.orders.thisMonth, quarter: d.orders.allTime, all: d.orders.allTime };
        var rev = revMap[period] || 0;
        var ord = ordMap[period] || 0;

        var area = document.getElementById('salesReportArea');
        area.innerHTML = BFX.tabs([
            { id: 'today', label: 'Today' }, { id: 'week', label: 'This Week' }, { id: 'month', label: 'This Month' }, { id: 'quarter', label: 'Quarter' }, { id: 'all', label: 'All Time' }
        ], period, 'fdrSalesReport');

        area.innerHTML += '<div class="fdr-report"><div class="fdr-metrics" style="margin-bottom:16px;">' +
            BFX.metric('Revenue', BFX.naira(rev), 'green') +
            BFX.metric('Orders', BFX.num(ord)) +
            BFX.metric('AOV', BFX.naira(ord > 0 ? Math.round(rev / ord) : 0)) +
            BFX.metric('EA Revenue', BFX.naira(d.eaAddon.revenue), 'amber') +
            '</div></div>';
    };

    // ================================================================
    // MODULE 4: STUDENTS
    // ================================================================

    function renderStudents() {
        var d = dashData;
        var html = BFX.sectionHeader('Students', 'Student directory, downloads, and mentorship');

        html += BFX.metricGrid([
            ['Total Students', BFX.num(d.students.total), 'blue'],
            ['New This Month', BFX.num(d.students.thisMonth)],
            ['Total Downloads', BFX.num(d.downloads.total)],
            ['Mentorship Bookings', BFX.num(d.bookings.total)]
        ]);

        html += '<div class="fdr-grid-2">';
        html += BFX.card('Students by Product', BFX.productBreakdown(d.products));

        // Certificates
        html += BFX.card('Certificates', BFX.emptyState('🎓', 'Certificate System', 'Issue and track course completion certificates. Coming in Phase 4.'));
        html += '</div>';

        // Downloads table
        html += BFX.card('Recent Downloads', '<div id="studentDownloads"><div class="fdr-loading"><div class="fdr-spinner"></div>Loading...</div></div>');

        // Bookings table
        html += BFX.card('Mentorship Bookings', '<div id="studentBookings"><div class="fdr-loading"><div class="fdr-spinner"></div>Loading...</div></div>');

        // Support Tickets
        html += BFX.card('Support Tickets', BFX.emptyState('🎫', 'Support System', 'Track and resolve student support requests. Connect support channels in Phase 4.'));

        document.getElementById('sec-students').innerHTML = html;
        loadStudentDownloads();
        loadStudentBookings();
    }

    async function loadStudentDownloads() {
        try {
            var sb = getAuthClient();
            var res = await sb.from('downloads').select('*').order('downloaded_at', { ascending: false }).limit(20);
            var rows = (res.data || []).map(function (r) {
                return [BFX.esc(r.customer_email), BFX.productName(r.product_id), BFX.shortDate(r.downloaded_at)];
            });
            document.getElementById('studentDownloads').innerHTML = BFX.table(['Email', 'Product', 'Date'], rows, 'No downloads yet');
        } catch (e) {
            document.getElementById('studentDownloads').innerHTML = '<div class="fdr-table-empty">Failed to load downloads</div>';
        }
    }

    async function loadStudentBookings() {
        try {
            var sb = getAuthClient();
            var res = await sb.from('mentorship_bookings').select('*').order('created_at', { ascending: false }).limit(20);
            var rows = (res.data || []).map(function (r) {
                return [BFX.esc(r.customer_name || '—'), BFX.esc(r.customer_email || '—'), BFX.productName(r.product_id), BFX.statusBadge(r.status || 'pending'), BFX.shortDate(r.created_at)];
            });
            document.getElementById('studentBookings').innerHTML = BFX.table(['Name', 'Email', 'Program', 'Status', 'Date'], rows, 'No bookings yet');
        } catch (e) {
            document.getElementById('studentBookings').innerHTML = '<div class="fdr-table-empty">Failed to load bookings</div>';
        }
    }

    // ================================================================
    // MODULE 5: ANALYTICS
    // ================================================================

    function renderAnalytics() {
        var html = BFX.sectionHeader('Analytics', 'Unified analytics across all platforms');

        html += BFX.metricGrid([
            ['Tracking Platforms', '4', 'blue'],
            ['Custom Events', '11 modules', 'purple'],
            ['Conversion Points', '6'],
            ['Data Quality', 'Active', 'green']
        ]);

        // Platform cards
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Google Analytics 4', '<div style="margin-bottom:12px;">' +
            BFX.settingRow('Property ID', 'G-ZFQ9P5KFSJ', BFX.badge('Active', 'green')) +
            BFX.settingRow('Integration', 'Via GTM + config.js', BFX.badge('Dual', 'blue')) +
            '</div>' +
            BFX.emptyState('📊', 'View Full Analytics', 'Traffic, sessions, conversions, and user behavior data.', '<a href="https://analytics.google.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-primary fdr-btn-sm">Open GA4 Dashboard &rarr;</a>'));

        html += BFX.card('Google Tag Manager', '<div style="margin-bottom:12px;">' +
            BFX.settingRow('Container ID', 'GTM-T3R88HZB', BFX.badge('Active', 'green')) +
            BFX.settingRow('Tags', 'GA4, Pixel, Clarity, Custom', BFX.badge('4+', 'blue')) +
            '</div>' +
            BFX.emptyState('🏷️', 'Manage Tags', 'Configure tracking tags, triggers, and variables.', '<a href="https://tagmanager.google.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-primary fdr-btn-sm">Open GTM &rarr;</a>'));

        html += BFX.card('Meta Pixel', '<div style="margin-bottom:12px;">' +
            BFX.settingRow('Pixel ID', '804009589230621', BFX.badge('Active', 'green')) +
            BFX.settingRow('Events', 'PageView, Lead, Purchase', BFX.badge('Standard', 'blue')) +
            '</div>' +
            BFX.emptyState('📱', 'View Pixel Analytics', 'Ad performance, audience insights, and conversion tracking.', '<a href="https://business.facebook.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-primary fdr-btn-sm">Open Meta Business &rarr;</a>'));

        html += BFX.card('Microsoft Clarity', '<div style="margin-bottom:12px;">' +
            BFX.settingRow('Project ID', 'wnde2od79f', BFX.badge('Active', 'green')) +
            BFX.settingRow('Features', 'Heatmaps, Recordings, Funnels', BFX.badge('Full', 'purple')) +
            '</div>' +
            BFX.emptyState('🔍', 'View Clarity Insights', 'Session recordings, heatmaps, and user behavior analysis.', '<a href="https://clarity.microsoft.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-primary fdr-btn-sm">Open Clarity &rarr;</a>'));
        html += '</div>';

        // Custom Analytics Engine
        html += BFX.card('BossFx Analytics Engine (bfx-analytics.js)', '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">' +
            ['UTM Attribution', 'Engagement Scoring', 'Conversion Tracking', 'Session Intelligence', 'Ecommerce Module', 'Mobile Intelligence', 'Scroll Depth', 'Content Analytics', 'Social Tracking', 'Performance Monitor', 'Error Tracking'].map(function (m) {
                return BFX.settingRow(m, null, BFX.badge('Active', 'green'));
            }).join('') + '</div>');

        // Conversion Funnels
        html += BFX.card('Conversion Funnels', BFX.emptyState('🔄', 'Funnel Analysis', 'Visualize visitor-to-customer conversion paths. Data aggregation coming in Phase 4.'));

        document.getElementById('sec-analytics').innerHTML = html;
    }

    // ================================================================
    // MODULE 6: AI CONTROL CENTER
    // ================================================================

    function renderAIControl() {
        var html = BFX.sectionHeader('AI Control Center', '13 AI roles operating across all business functions');

        html += BFX.metricGrid([
            ['Total AI Roles', '13', 'purple'],
            ['Active Roles', '13', 'green'],
            ['Departments Covered', '10', 'blue'],
            ['Automation Level', 'Phase 3', 'amber']
        ]);

        html += BFX.alert('info', 'AI roles are management interfaces only. Autonomous execution will be enabled in Phase 5 (AI Operations).');

        html += '<div class="fdr-ai-grid">';
        AI_ROLES.forEach(function (role) { html += BFX.aiCard(role); });
        html += '</div>';

        // Activity Log
        html += '<div style="margin-top:20px;">';
        html += BFX.card('AI Activity Log', BFX.emptyState('📋', 'Activity Tracking', 'AI role activity and task completion logs will be tracked here. Connect in Phase 5.'));
        html += '</div>';

        document.getElementById('sec-ai-control').innerHTML = html;
    }

    // ================================================================
    // MODULE 7: AUTOMATION CENTER
    // ================================================================

    function renderAutomation() {
        var html = BFX.sectionHeader('Automation', 'Workflows, scheduled jobs, and email sequences');

        html += BFX.metricGrid([
            ['Active Automations', '4', 'green'],
            ['Drip Sequences', '6', 'purple'],
            ['Scheduled Jobs', '1', 'blue'],
            ['Status', 'Operational', 'green']
        ]);

        html += BFX.alert('info', 'Phase 3C provides the automation management interface. Workflow builder and advanced automation will be enabled in Phase 4.');

        // Active Automations
        html += BFX.card('Active Automations',
            BFX.autoCard('Payment Webhook Fulfillment', 'Processes Flutterwave webhooks: verify payment, create order, generate tokens, send email, notify admin.', 'active', 'On webhook trigger', 'Continuous') +
            BFX.autoCard('Daily Re-engagement Cron', 'Processes drip sequences and sends re-engagement emails to inactive leads.', 'active', 'Daily at 09:00 UTC', 'Today') +
            BFX.autoCard('Lead Capture Pipeline', 'Captures leads from forms, assigns to Brevo lists, triggers drip sequences, scores engagement.', 'active', 'On form submit', 'Continuous') +
            BFX.autoCard('Download Token System', 'Generates HMAC-SHA256 tokens for secure file access with automatic expiry.', 'active', 'On purchase', 'Continuous')
        );

        // Drip Sequences
        html += BFX.card('Email Drip Sequences', '<div class="fdr-grid-2">' +
            ['Welcome Series', 'Webinar Funnel', 'Resource Follow-up', 'Mentorship Nurture', 'Exit Intent Recovery', 'Re-engagement'].map(function (name, i) {
                var steps = [5, 4, 3, 4, 3, 3];
                return '<div style="padding:12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><strong style="font-size:0.84rem;">' + name + '</strong>' + BFX.badge('Active', 'green') + '</div>' +
                    '<div style="font-size:0.75rem;color:var(--fdr-dim);">' + steps[i] + ' steps &middot; Managed by Brevo</div></div>';
            }).join('') + '</div>');

        // Job Queue
        html += BFX.card('Job Queue', BFX.emptyState('⚡', 'Job Queue', 'Real-time job monitoring and queue management. Available in Phase 4.'));

        // Workflow Builder
        html += BFX.card('Workflow Builder', BFX.emptyState('🔧', 'Visual Workflow Builder', 'Design custom automation workflows with triggers, conditions, and actions. Coming in Phase 4.', '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" disabled>Coming in Phase 4</button>'));

        document.getElementById('sec-automation').innerHTML = html;
    }

    // ================================================================
    // MODULE 8: FINANCE
    // ================================================================

    function renderFinance() {
        var d = dashData;
        var html = BFX.sectionHeader('Finance', 'Revenue, expenses, and financial overview');

        html += BFX.metricGrid([
            ['Total Revenue', BFX.naira(d.revenue.allTime), 'green'],
            ['This Month', BFX.naira(d.revenue.thisMonth), 'green'],
            ['This Quarter', BFX.naira(d.revenue.thisQuarter), 'green'],
            ['Avg Order Value', BFX.naira(d.metrics.aov), 'blue']
        ]);

        html += '<div class="fdr-grid-2">';

        // Revenue Breakdown
        html += BFX.card('Revenue by Product', BFX.productBreakdown(d.products));

        // Monthly Revenue
        html += BFX.card('30-Day Revenue', BFX.trendChart(d.revenue.trend));
        html += '</div>';

        // Revenue Streams
        html += BFX.card('Revenue Streams', '<div class="fdr-grid-3">' +
            '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;"><div style="font-size:0.7rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">Course Sales</div><div style="font-family:Space Grotesk;font-size:1.2rem;font-weight:700;color:var(--fdr-green);">' + BFX.naira((d.products['forex-101'] || {}).revenue || 0) + '</div></div>' +
            '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;"><div style="font-size:0.7rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">Mentorship</div><div style="font-family:Space Grotesk;font-size:1.2rem;font-weight:700;color:var(--fdr-blue);">' + BFX.naira(((d.products['mentorship-group'] || {}).revenue || 0) + ((d.products['mentorship-1on1'] || {}).revenue || 0)) + '</div></div>' +
            '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;"><div style="font-size:0.7rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">VIP + EA</div><div style="font-family:Space Grotesk;font-size:1.2rem;font-weight:700;color:var(--fdr-amber);">' + BFX.naira(((d.products['vip'] || {}).revenue || 0) + ((d.products['ea-bundle'] || {}).revenue || 0) + (d.eaAddon.revenue || 0)) + '</div></div>' +
            '</div>');

        // Expenses
        html += BFX.card('Expenses', BFX.emptyState('💰', 'Expense Tracking', 'Track operational expenses, subscriptions, and costs. Manual entry or integration coming in Phase 4.'));

        // Cash Flow
        html += BFX.card('Cash Flow & Forecasting', BFX.emptyState('📊', 'Financial Forecasting', 'Revenue projections, cash flow analysis, and financial planning. Coming in Phase 4.'));

        document.getElementById('sec-finance').innerHTML = html;
    }

    // ================================================================
    // MODULE 9: OPERATIONS
    // ================================================================

    function renderOperations() {
        var s = sysData;
        var html = BFX.sectionHeader('Operations', 'System health, projects, and business processes');

        // System Health
        var services = [
            { name: 'Supabase', status: s.supabase.status, detail: s.supabase.status === 'healthy' ? (s.supabase.orderCount || 0) + ' orders tracked' : (s.supabase.message || 'Not configured') },
            { name: 'Brevo', status: s.brevo.status, detail: s.brevo.status === 'healthy' ? 'Plan: ' + s.brevo.plan : (s.brevo.message || 'Not configured') },
            { name: 'Flutterwave', status: s.flutterwave.status, detail: s.flutterwave.status === 'configured' ? 'Webhook: ' + (s.flutterwave.webhookHash ? 'Verified' : 'Missing') : 'Not configured' },
            { name: 'Vercel', status: 'configured', detail: (s.vercel.env || 'production') + ' / ' + (s.vercel.region || 'iad1') + ' / ' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ' functions' }
        ];

        html += BFX.card('System Health', '<div class="fdr-health-grid">' +
            services.map(function (svc) { return BFX.healthCard(svc.name, svc.status, svc.detail); }).join('') + '</div>');

        // Environment Variables
        var envVars = s.envVars || {};
        html += BFX.card('Environment Variables', Object.keys(envVars).map(function (key) {
            return BFX.settingRow(key, null, BFX.badge(envVars[key] ? 'Set' : 'Missing', envVars[key] ? 'green' : 'red'));
        }).join(''));

        html += '<div class="fdr-grid-2">';

        // Decision Log (goals)
        html += BFX.goalsCard('Monthly Goals', 'monthly');
        html += BFX.goalsCard('Quarterly Objectives', 'quarterly');
        html += '</div>';

        // SOP Library
        html += BFX.card('SOP Library', '<div class="fdr-grid-2">' +
            [['Deployment Process', 'sop/deployment.md'], ['Customer Support', 'sop/customer-support.md'], ['Payment Issues', 'sop/payment-issues.md'], ['Content Publishing', 'sop/content-publishing.md'], ['Lead Management', 'sop/lead-management.md'], ['Security Incidents', 'sop/security-incidents.md']].map(function (s) {
                return BFX.settingRow(s[0], s[1], BFX.badge('Available', 'green'));
            }).join('') + '</div>');

        // Projects
        html += BFX.card('Projects & Tasks', BFX.emptyState('📋', 'Project Management', 'Track projects, tasks, and milestones. Integration with Linear or custom task system coming in Phase 4.'));

        // Calendar
        html += BFX.card('Company Calendar', BFX.emptyState('📅', 'Business Calendar', 'Weekly reviews, quarterly planning, and key dates. Calendar integration coming in Phase 4.'));

        document.getElementById('sec-operations').innerHTML = html;
        renderGoalsInto('monthly');
        renderGoalsInto('quarterly');
    }

    // ================================================================
    // MODULE 10: SETTINGS
    // ================================================================

    function renderSettings() {
        var s = sysData;
        var html = BFX.sectionHeader('Settings', 'System configuration, integrations, and security');

        html += '<div class="fdr-grid-2">';

        // API Connections
        var apis = [
            { name: 'Supabase', status: s.supabase.status, detail: s.supabase.status === 'healthy' ? 'Connected' : 'Error' },
            { name: 'Brevo', status: s.brevo.status, detail: s.brevo.status === 'healthy' ? 'Plan: ' + s.brevo.plan : (s.brevo.message || 'Not configured') },
            { name: 'Flutterwave', status: s.flutterwave.status, detail: s.flutterwave.status === 'configured' ? 'Webhook verified' : 'Missing API key' },
            { name: 'Google Analytics', status: 'configured', detail: 'G-ZFQ9P5KFSJ' },
            { name: 'Meta Pixel', status: 'configured', detail: '804009589230621' },
            { name: 'Microsoft Clarity', status: 'configured', detail: 'wnde2od79f' }
        ];

        html += '<div>';
        html += '<div class="fdr-setting-group"><div class="fdr-setting-group-title">API Connections</div>' +
            apis.map(function (api) {
                var ok = api.status === 'healthy' || api.status === 'configured';
                return BFX.settingRow(api.name, api.detail, BFX.badge(ok ? 'Connected' : 'Issue', ok ? 'green' : 'red'));
            }).join('') + '</div>';

        html += '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Infrastructure</div>' +
            BFX.settingRow('Vercel Plan', 'Hobby (Free Tier)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Serverless Functions', s.vercel.functionsUsed + ' of ' + s.vercel.functionsLimit + ' used', BFX.badge(s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'At Limit' : 'OK', s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'red' : 'green')) +
            BFX.settingRow('Domain', 'www.bossfxcademy.com', BFX.badge('Active', 'green')) +
            BFX.settingRow('SSL', 'Auto-managed by Vercel', BFX.badge('Active', 'green')) +
            '</div>';
        html += '</div>';

        // Quick Links + Docs
        html += '<div>';
        html += '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Quick Links</div>' +
            BFX.serviceLink('Vercel Dashboard', 'Hosting & deployments', 'https://vercel.com', 'var(--fdr-blue-dim)', '▲') +
            BFX.serviceLink('Supabase Dashboard', 'Database & auth', 'https://supabase.com', 'var(--fdr-green-dim)', '⚡') +
            BFX.serviceLink('Flutterwave Dashboard', 'Payment processing', 'https://dashboard.flutterwave.com', 'var(--fdr-amber-dim)', '💳') +
            BFX.serviceLink('Brevo Dashboard', 'Email & CRM', 'https://app.brevo.com', 'var(--fdr-blue-dim)', '📧') +
            BFX.serviceLink('Legacy Admin Dashboard', 'Original admin panel', '/admin/', 'var(--fdr-purple-dim)', '🔧') +
            '</div>';

        html += '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Documentation</div>' +
            BFX.settingRow('CLAUDE.md', 'Project memory', BFX.badge('Current', 'green')) +
            BFX.settingRow('Business OS', '40 files', BFX.badge('Complete', 'green')) +
            BFX.settingRow('Technical Docs', '26 files', BFX.badge('Complete', 'green')) +
            BFX.settingRow('SOPs', '9 procedures', BFX.badge('Complete', 'green')) +
            '</div>';
        html += '</div>';

        html += '</div>';

        // User Management
        html += BFX.card('User Management', BFX.emptyState('👤', 'User Management', 'Manage admin users, roles, and permissions. Currently using ADMIN_EMAILS whitelist. Advanced RBAC coming in Phase 5.'));

        // Feature Flags
        html += BFX.card('Feature Flags', '<div class="fdr-grid-2">' +
            [['EA Addon Upsell', true], ['Drip Sequences', true], ['BossFx Mirror Chatbot', true], ['VIP Portal', true], ['Re-engagement Cron', true], ['Founder OS', true]].map(function (f) {
                return BFX.settingRow(f[0], null, BFX.badge(f[1] ? 'Enabled' : 'Disabled', f[1] ? 'green' : 'dim'));
            }).join('') + '</div>');

        // Security
        html += BFX.card('Security', '<div>' +
            BFX.settingRow('Authentication', 'Supabase Auth + JWT', BFX.badge('Active', 'green')) +
            BFX.settingRow('Admin Whitelist', 'ADMIN_EMAILS env var', BFX.badge('Configured', 'green')) +
            BFX.settingRow('Download Tokens', 'HMAC-SHA256 with expiry', BFX.badge('Active', 'green')) +
            BFX.settingRow('Webhook Verification', 'Flutterwave signature check', BFX.badge('Active', 'green')) +
            BFX.settingRow('Rate Limiting', 'In-memory sliding window', BFX.badge('Active', 'amber')) +
            BFX.settingRow('RLS (Row Level Security)', 'All Supabase tables', BFX.badge('Enforced', 'green')) +
            BFX.settingRow('CORS', 'Admin endpoints', BFX.badge('Review', 'amber')) +
            '</div>');

        document.getElementById('sec-settings').innerHTML = html;
    }

    // ================================================================
    // GOALS (localStorage — UNCHANGED logic)
    // ================================================================

    function getGoals(period) {
        try { return JSON.parse(localStorage.getItem('fdr_goals_' + period)) || []; }
        catch (e) { return []; }
    }

    function saveGoals(period, goals) {
        localStorage.setItem('fdr_goals_' + period, JSON.stringify(goals));
    }

    function renderGoalsInto(period) {
        var container = document.getElementById('goals-' + period);
        if (!container) return;
        container.innerHTML = BFX.goalsList(period, getGoals(period));
    }

    window.fdrAddGoal = function (period) {
        var input = document.getElementById('goalInput-' + period);
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        var goals = getGoals(period);
        goals.push({ text: text, done: false, createdAt: new Date().toISOString() });
        saveGoals(period, goals);
        input.value = '';
        renderGoalsInto(period);
    };

    window.fdrToggleGoal = function (period, idx) {
        var goals = getGoals(period);
        if (goals[idx]) goals[idx].done = !goals[idx].done;
        saveGoals(period, goals);
        renderGoalsInto(period);
    };

    window.fdrDeleteGoal = function (period, idx) {
        var goals = getGoals(period);
        goals.splice(idx, 1);
        saveGoals(period, goals);
        renderGoalsInto(period);
    };

    // ================================================================
    // INIT
    // ================================================================

    checkSession();

})();
