// ================================================================
// Founder Command Center — app.js
// Production dashboard for BossFx Academy CEO
// ================================================================

(function () {
    'use strict';

    // --- Supabase init ---
    var sbUrl = document.querySelector('meta[name="supabase-url"]').content;
    var sbKey = document.querySelector('meta[name="supabase-anon-key"]').content;
    var supabase = window.supabase.createClient(sbUrl, sbKey);
    var session = null;
    var dashData = null;
    var sysData = null;

    // --- Product map (mirrors lib/products.js) ---
    var PRODUCT_NAMES = {
        'forex-101': "Forex 101: The Trader's Bible",
        'mentorship-group': 'Group Mentorship',
        'mentorship-1on1': '1-on-1 Mentorship',
        'vip': 'VIP Program',
        'ea-bundle': 'SMA Pro Trend EA'
    };

    // --- AI Team definitions (from business/AI_ROLES.md) ---
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

    // --- Section titles ---
    var SECTION_TITLES = {
        'overview': 'Executive Overview',
        'revenue': 'Revenue & Sales',
        'students': 'Student Overview',
        'marketing': 'Marketing Overview',
        'operations': 'Operations & System Health',
        'ai-team': 'AI Team',
        'decisions': 'Decision Center',
        'reports': 'Reports',
        'settings': 'Settings'
    };

    // --- Auth ---

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

    // --- Navigation ---

    var navItems = document.querySelectorAll('.fdr-nav-item');
    navItems.forEach(function (btn) {
        btn.addEventListener('click', function () {
            fdrNav(btn.dataset.section);
        });
    });

    window.fdrNav = function (section) {
        navItems.forEach(function (b) { b.classList.toggle('active', b.dataset.section === section); });
        document.querySelectorAll('.fdr-section').forEach(function (s) { s.classList.remove('active'); });
        var target = document.getElementById('sec-' + section);
        if (target) target.classList.add('active');
        document.getElementById('fdrPageTitle').textContent = SECTION_TITLES[section] || section;
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

    // --- Clock ---
    function startClock() {
        function tick() {
            var el = document.getElementById('fdrClock');
            if (el) el.textContent = new Date().toLocaleString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        }
        tick();
        setInterval(tick, 1000);
    }

    // --- API helpers ---

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

    // --- Formatting ---

    function naira(n) { return '₦' + Number(n || 0).toLocaleString('en-NG'); }
    function pct(n) { return (n || 0) + '%'; }
    function num(n) { return Number(n || 0).toLocaleString('en-NG'); }
    function shortDate(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    function timeAgo(iso) {
        if (!iso) return '—';
        var diff = Date.now() - new Date(iso).getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + 'm ago';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h ago';
        var days = Math.floor(hrs / 24);
        return days + 'd ago';
    }
    function productName(pid) { return PRODUCT_NAMES[pid] || pid || 'Unknown'; }

    // --- Toast ---

    window.fdrToast = function (msg, type) {
        var toast = document.getElementById('fdrToast');
        toast.textContent = msg;
        toast.className = 'fdr-toast show' + (type ? ' ' + type : '');
        setTimeout(function () { toast.className = 'fdr-toast'; }, 3500);
    };

    // --- Refresh ---

    window.fdrRefresh = async function () {
        fdrToast('Refreshing data...');
        await loadDashboard();
        fdrToast('Dashboard updated', 'success');
    };

    // --- Main load ---

    async function loadDashboard() {
        try {
            var results = await Promise.all([fetchFounderData(), fetchSystemData()]);
            dashData = results[0];
            sysData = results[1];
            renderOverview();
            renderRevenue();
            renderStudents();
            renderMarketing();
            renderOperations();
            renderAITeam();
            renderDecisions();
            renderReports('today');
            renderSettings();
        } catch (err) {
            console.error('[Founder] Load error:', err);
            fdrToast('Error loading dashboard: ' + err.message, 'error');
        }
    }

    // ===== OVERVIEW =====

    function renderOverview() {
        var d = dashData;
        setText('mRevToday', naira(d.revenue.today));
        setText('mRevMonth', naira(d.revenue.thisMonth));
        setText('mOrdToday', num(d.orders.today));
        setText('mStudents', num(d.students.total));
        setText('mDownloads', num(d.downloads.total));
        setText('mBookings', num(d.bookings.total));
        setText('mEaRate', pct(d.eaAddon.rate));
        setText('mEmailSubs', d.brevo ? num(d.brevo.totalSubscribers) : 'N/A');

        renderTrend('overviewTrend', d.revenue.trend);
        renderProductBreakdown('overviewProducts', d.products);
        renderOrdersTable('overviewOrders', d.recentOrders, false);
    }

    // ===== REVENUE =====

    function renderRevenue() {
        var d = dashData;
        setText('rRevToday', naira(d.revenue.today));
        setText('rRevWeek', naira(d.revenue.thisWeek));
        setText('rRevMonth', naira(d.revenue.thisMonth));
        setText('rRevQuarter', naira(d.revenue.thisQuarter));
        setText('rRevAll', naira(d.revenue.allTime));
        setText('rAOV', naira(d.metrics.aov));
        setText('rEaRev', naira(d.eaAddon.revenue));
        setText('rEaConv', pct(d.eaAddon.rate));

        renderProductBreakdown('revProducts', d.products);
        renderTrend('revTrend', d.revenue.trend);
        renderOrdersTable('revOrders', d.recentOrders, true);
    }

    // ===== STUDENTS =====

    function renderStudents() {
        var d = dashData;
        setText('sTotal', num(d.students.total));
        setText('sMonth', num(d.students.thisMonth));
        setText('sDl', num(d.downloads.total));
        setText('sBook', num(d.bookings.total));

        renderProductBreakdown('studentsByProduct', d.products);
        loadStudentDownloads();
        loadStudentBookings();
    }

    async function loadStudentDownloads() {
        try {
            var sb = window.supabase.createClient(sbUrl, sbKey, {
                global: { headers: { Authorization: 'Bearer ' + session.access_token } }
            });
            var res = await sb.from('downloads').select('*').order('downloaded_at', { ascending: false }).limit(20);
            var rows = res.data || [];
            var tbody = document.getElementById('studentDownloads');
            if (!rows.length) { tbody.innerHTML = '<tr><td colspan="3" class="fdr-table-empty">No downloads yet</td></tr>'; return; }
            tbody.innerHTML = rows.map(function (r) {
                return '<tr><td>' + esc(r.customer_email) + '</td><td>' + productName(r.product_id) + '</td><td>' + shortDate(r.downloaded_at) + '</td></tr>';
            }).join('');
        } catch (e) {
            document.getElementById('studentDownloads').innerHTML = '<tr><td colspan="3" class="fdr-table-empty">Failed to load</td></tr>';
        }
    }

    async function loadStudentBookings() {
        try {
            var sb = window.supabase.createClient(sbUrl, sbKey, {
                global: { headers: { Authorization: 'Bearer ' + session.access_token } }
            });
            var res = await sb.from('mentorship_bookings').select('*').order('created_at', { ascending: false }).limit(20);
            var rows = res.data || [];
            var tbody = document.getElementById('studentBookings');
            if (!rows.length) { tbody.innerHTML = '<tr><td colspan="5" class="fdr-table-empty">No bookings yet</td></tr>'; return; }
            tbody.innerHTML = rows.map(function (r) {
                return '<tr><td>' + esc(r.customer_name || '—') + '</td><td>' + esc(r.customer_email || '—') + '</td><td>' + productName(r.product_id) + '</td><td>' + badge(r.status) + '</td><td>' + shortDate(r.created_at) + '</td></tr>';
            }).join('');
        } catch (e) {
            document.getElementById('studentBookings').innerHTML = '<tr><td colspan="5" class="fdr-table-empty">Failed to load</td></tr>';
        }
    }

    // ===== MARKETING =====

    function renderMarketing() {
        var b = dashData.brevo;
        setText('mkSubs', b ? num(b.totalSubscribers) : 'N/A');

        var container = document.getElementById('mkLists');
        if (!b || !b.lists || !b.lists.length) {
            container.innerHTML = '<div class="fdr-table-empty">No Brevo data available</div>';
            return;
        }
        container.innerHTML = b.lists.map(function (l) {
            return '<div class="fdr-setting-row"><span class="fdr-setting-row-label"><strong>' + esc(l.name) + '</strong><small>List #' + l.id + '</small></span><span class="fdr-badge fdr-badge-purple">' + num(l.subscribers) + ' subscribers</span></div>';
        }).join('');
    }

    // ===== OPERATIONS =====

    function renderOperations() {
        var s = sysData;
        var grid = document.getElementById('opsHealth');
        var services = [
            { name: 'Supabase', data: s.supabase, detail: s.supabase.status === 'healthy' ? s.supabase.orderCount + ' orders tracked' : (s.supabase.message || 'Not configured') },
            { name: 'Brevo', data: s.brevo, detail: s.brevo.status === 'healthy' ? 'Plan: ' + s.brevo.plan : (s.brevo.message || 'Not configured') },
            { name: 'Flutterwave', data: s.flutterwave, detail: s.flutterwave.status === 'configured' ? 'Webhook hash: ' + (s.flutterwave.webhookHash ? 'Set' : 'Missing') : 'Not configured' },
            { name: 'Vercel', data: s.vercel, detail: s.vercel.env + ' / ' + s.vercel.region + ' / ' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ' functions' }
        ];

        grid.innerHTML = services.map(function (svc) {
            var st = svc.data.status;
            var dotClass = st === 'healthy' || st === 'configured' ? 'green' : (st === 'error' ? 'red' : 'amber');
            return '<div class="fdr-health-card"><div class="fdr-health-card-name"><span class="fdr-status-dot ' + dotClass + '"></span>' + svc.name + '</div><div class="fdr-health-card-status">' + statusText(st) + '</div><div class="fdr-health-card-detail">' + esc(svc.detail) + '</div></div>';
        }).join('');

        var envContainer = document.getElementById('opsEnvVars');
        var envVars = s.envVars || {};
        envContainer.innerHTML = Object.keys(envVars).map(function (key) {
            var ok = envVars[key];
            return '<div class="fdr-setting-row"><span>' + key + '</span><span class="fdr-badge ' + (ok ? 'fdr-badge-green' : 'fdr-badge-red') + '">' + (ok ? 'Set' : 'Missing') + '</span></div>';
        }).join('');
    }

    function statusText(s) {
        switch (s) {
            case 'healthy': return '<span style="color:var(--fdr-green)">Healthy</span>';
            case 'configured': return '<span style="color:var(--fdr-green)">Configured</span>';
            case 'error': return '<span style="color:var(--fdr-red)">Error</span>';
            case 'not_configured': return '<span style="color:var(--fdr-amber)">Not Configured</span>';
            default: return s;
        }
    }

    // ===== AI TEAM =====

    function renderAITeam() {
        var grid = document.getElementById('aiTeamGrid');
        grid.innerHTML = AI_ROLES.map(function (role) {
            return '<div class="fdr-ai-card"><div class="fdr-ai-card-header"><div class="fdr-ai-card-icon ' + role.color + '">' + role.title.charAt(0) + '</div><div><div class="fdr-ai-card-title">' + esc(role.title) + '</div><div class="fdr-ai-card-subtitle">' + esc(role.subtitle) + '</div></div></div><p class="fdr-ai-card-purpose">' + esc(role.purpose) + '</p><div class="fdr-ai-card-footer"><span class="fdr-badge fdr-badge-' + role.color + '">Active</span><span style="color:var(--fdr-dim);font-size:12px;">' + esc(role.cadence) + '</span></div></div>';
        }).join('');
    }

    // ===== DECISIONS =====

    function renderDecisions() {
        renderAlerts();
        ['daily', 'weekly', 'monthly', 'quarterly'].forEach(function (period) {
            renderGoals(period);
        });
    }

    function renderAlerts() {
        var alerts = [];
        var d = dashData;

        if (d.orders.today > 0) alerts.push({ type: 'success', text: d.orders.today + ' order' + (d.orders.today > 1 ? 's' : '') + ' today — ' + naira(d.revenue.today) + ' revenue' });
        if (d.bookings.pending > 0) alerts.push({ type: 'warn', text: d.bookings.pending + ' pending mentorship booking' + (d.bookings.pending > 1 ? 's' : '') + ' require attention' });

        var s = sysData;
        if (s.supabase && s.supabase.status === 'error') alerts.push({ type: 'error', text: 'Supabase is reporting errors: ' + (s.supabase.message || 'Unknown') });
        if (s.brevo && s.brevo.status === 'error') alerts.push({ type: 'error', text: 'Brevo is reporting errors: ' + (s.brevo.message || 'Unknown') });
        if (s.vercel && s.vercel.functionsUsed >= s.vercel.functionsLimit) alerts.push({ type: 'error', text: 'Serverless function limit reached (' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ')' });
        if (s.flutterwave && !s.flutterwave.webhookHash) alerts.push({ type: 'warn', text: 'Flutterwave webhook hash is not configured' });

        var container = document.getElementById('decAlerts');
        if (!alerts.length) {
            container.innerHTML = '<div class="fdr-card" style="border-left:3px solid var(--fdr-green);"><div style="padding:8px 0;">All systems operational. No critical alerts.</div></div>';
            return;
        }
        container.innerHTML = alerts.map(function (a) {
            var borderColor = a.type === 'error' ? 'var(--fdr-red)' : a.type === 'warn' ? 'var(--fdr-amber)' : 'var(--fdr-green)';
            return '<div class="fdr-card" style="border-left:3px solid ' + borderColor + ';margin-bottom:8px;"><div style="padding:4px 0;">' + esc(a.text) + '</div></div>';
        }).join('');
    }

    // --- Goals (localStorage persistence) ---

    function getGoals(period) {
        try { return JSON.parse(localStorage.getItem('fdr_goals_' + period)) || []; }
        catch (e) { return []; }
    }

    function saveGoals(period, goals) {
        localStorage.setItem('fdr_goals_' + period, JSON.stringify(goals));
    }

    function renderGoals(period) {
        var goals = getGoals(period);
        var ul = document.getElementById('dec' + period.charAt(0).toUpperCase() + period.slice(1));
        if (!goals.length) {
            ul.innerHTML = '<li class="fdr-goal-empty">No goals set. Add one below.</li>';
            return;
        }
        ul.innerHTML = goals.map(function (g, i) {
            return '<li class="fdr-goal-item' + (g.done ? ' done' : '') + '"><label><input type="checkbox" ' + (g.done ? 'checked' : '') + ' onchange="fdrToggleGoal(\'' + period + '\',' + i + ')"><span>' + esc(g.text) + '</span></label><button class="fdr-goal-del" onclick="fdrDeleteGoal(\'' + period + '\',' + i + ')">&times;</button></li>';
        }).join('');
    }

    window.fdrAddGoal = function (period) {
        var input = document.getElementById('dec' + period.charAt(0).toUpperCase() + period.slice(1) + 'Input');
        var text = input.value.trim();
        if (!text) return;
        var goals = getGoals(period);
        goals.push({ text: text, done: false, createdAt: new Date().toISOString() });
        saveGoals(period, goals);
        input.value = '';
        renderGoals(period);
    };

    window.fdrToggleGoal = function (period, idx) {
        var goals = getGoals(period);
        if (goals[idx]) goals[idx].done = !goals[idx].done;
        saveGoals(period, goals);
        renderGoals(period);
    };

    window.fdrDeleteGoal = function (period, idx) {
        var goals = getGoals(period);
        goals.splice(idx, 1);
        saveGoals(period, goals);
        renderGoals(period);
    };

    // ===== REPORTS =====

    document.getElementById('reportPeriodTabs').addEventListener('click', function (e) {
        if (!e.target.classList.contains('fdr-period-tab')) return;
        document.querySelectorAll('.fdr-period-tab').forEach(function (t) { t.classList.remove('active'); });
        e.target.classList.add('active');
        renderReports(e.target.dataset.period);
    });

    function renderReports(period) {
        var d = dashData;
        var revMap = { today: d.revenue.today, week: d.revenue.thisWeek, month: d.revenue.thisMonth, quarter: d.revenue.thisQuarter, all: d.revenue.allTime };
        var ordMap = { today: d.orders.today, week: d.orders.thisWeek, month: d.orders.thisMonth, quarter: d.orders.allTime, all: d.orders.allTime };
        var rev = revMap[period] || 0;
        var ord = ordMap[period] || 0;

        var html = '<div class="fdr-report-section"><h3>Revenue Summary — ' + periodLabel(period) + '</h3>' +
            '<div class="fdr-metrics" style="margin:12px 0;">' +
            '<div class="fdr-metric"><div class="fdr-metric-label">Revenue</div><div class="fdr-metric-value green">' + naira(rev) + '</div></div>' +
            '<div class="fdr-metric"><div class="fdr-metric-label">Orders</div><div class="fdr-metric-value">' + num(ord) + '</div></div>' +
            '<div class="fdr-metric"><div class="fdr-metric-label">Avg Order Value</div><div class="fdr-metric-value">' + naira(ord > 0 ? Math.round(rev / ord) : 0) + '</div></div>' +
            '<div class="fdr-metric"><div class="fdr-metric-label">EA Addon Revenue</div><div class="fdr-metric-value amber">' + naira(d.eaAddon.revenue) + '</div></div>' +
            '</div></div>';

        html += '<div class="fdr-report-section"><h3>Product Breakdown</h3>';
        var products = d.products || {};
        var pKeys = Object.keys(products);
        if (pKeys.length) {
            html += '<table class="fdr-table"><thead><tr><th>Product</th><th>Orders</th><th>Revenue</th><th>Share</th></tr></thead><tbody>';
            var totalRev = pKeys.reduce(function (s, k) { return s + products[k].revenue; }, 0);
            pKeys.sort(function (a, b) { return products[b].revenue - products[a].revenue; });
            pKeys.forEach(function (k) {
                var p = products[k];
                var share = totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0;
                html += '<tr><td>' + productName(k) + '</td><td>' + num(p.count) + '</td><td>' + naira(p.revenue) + '</td><td>' + share + '%</td></tr>';
            });
            html += '</tbody></table>';
        }
        html += '</div>';

        html += '<div class="fdr-report-section"><h3>Key Metrics</h3>' +
            '<div class="fdr-metrics" style="margin:12px 0;">' +
            '<div class="fdr-metric"><div class="fdr-metric-label">Total Students</div><div class="fdr-metric-value blue">' + num(d.students.total) + '</div></div>' +
            '<div class="fdr-metric"><div class="fdr-metric-label">Downloads</div><div class="fdr-metric-value">' + num(d.downloads.total) + '</div></div>' +
            '<div class="fdr-metric"><div class="fdr-metric-label">Bookings</div><div class="fdr-metric-value">' + num(d.bookings.total) + '</div></div>' +
            '<div class="fdr-metric"><div class="fdr-metric-label">Email Subscribers</div><div class="fdr-metric-value purple">' + (d.brevo ? num(d.brevo.totalSubscribers) : 'N/A') + '</div></div>' +
            '</div></div>';

        html += '<div class="fdr-report-section" style="margin-top:12px;color:var(--fdr-dim);font-size:13px;">Report generated at ' + new Date().toLocaleString('en-NG') + ' from live data.</div>';

        document.getElementById('reportContent').innerHTML = html;
    }

    function periodLabel(p) {
        switch (p) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'quarter': return 'This Quarter';
            case 'all': return 'All Time';
            default: return p;
        }
    }

    // ===== SETTINGS =====

    function renderSettings() {
        var s = sysData;
        var container = document.getElementById('settingsAPIs');
        var apis = [
            { name: 'Supabase', status: s.supabase.status, detail: s.supabase.status === 'healthy' ? 'Connected' : 'Error' },
            { name: 'Brevo', status: s.brevo.status, detail: s.brevo.status === 'healthy' ? 'Plan: ' + s.brevo.plan : (s.brevo.message || 'Not configured') },
            { name: 'Flutterwave', status: s.flutterwave.status, detail: s.flutterwave.status === 'configured' ? 'Webhook: ' + (s.flutterwave.webhookHash ? 'Verified' : 'No hash') : 'Missing API key' },
            { name: 'Google Analytics', status: 'configured', detail: 'G-ZFQ9P5KFSJ' },
            { name: 'Meta Pixel', status: 'configured', detail: '804009589230621' },
            { name: 'Microsoft Clarity', status: 'configured', detail: 'wnde2od79f' }
        ];
        container.innerHTML = apis.map(function (api) {
            var ok = api.status === 'healthy' || api.status === 'configured';
            return '<div class="fdr-setting-row"><span class="fdr-setting-row-label"><strong>' + api.name + '</strong><small>' + esc(api.detail) + '</small></span><span class="fdr-badge ' + (ok ? 'fdr-badge-green' : 'fdr-badge-red') + '">' + (ok ? 'Connected' : 'Issue') + '</span></div>';
        }).join('');
    }

    // ===== SHARED RENDERERS =====

    function renderTrend(containerId, trend) {
        if (!trend || !trend.length) return;
        var maxRev = Math.max.apply(null, trend.map(function (t) { return t.revenue; }));
        if (maxRev === 0) maxRev = 1;
        var container = document.getElementById(containerId);
        container.innerHTML = '<div class="fdr-trend-chart">' + trend.map(function (t) {
            var h = Math.max(2, Math.round((t.revenue / maxRev) * 120));
            var label = t.date.substring(5);
            return '<div class="fdr-trend-bar-wrap" title="' + label + ': ' + naira(t.revenue) + '"><div class="fdr-trend-bar" style="height:' + h + 'px"></div><span class="fdr-trend-label">' + label + '</span></div>';
        }).join('') + '</div>';
    }

    function renderProductBreakdown(containerId, products) {
        var container = document.getElementById(containerId);
        var keys = Object.keys(products || {});
        if (!keys.length) { container.innerHTML = '<div class="fdr-table-empty">No product data</div>'; return; }
        var totalRev = keys.reduce(function (s, k) { return s + products[k].revenue; }, 0);
        keys.sort(function (a, b) { return products[b].revenue - products[a].revenue; });
        container.innerHTML = keys.map(function (k) {
            var p = products[k];
            var pctVal = totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0;
            return '<div class="fdr-setting-row"><span class="fdr-setting-row-label"><strong>' + productName(k) + '</strong><small>' + num(p.count) + ' orders</small></span><span><strong>' + naira(p.revenue) + '</strong> <span style="color:var(--fdr-dim);font-size:12px;">(' + pctVal + '%)</span></span></div>';
        }).join('');
    }

    function renderOrdersTable(tbodyId, orders, showRef) {
        var tbody = document.getElementById(tbodyId);
        if (!orders || !orders.length) {
            tbody.innerHTML = '<tr><td colspan="' + (showRef ? 7 : 6) + '" class="fdr-table-empty">No orders yet</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(function (o) {
            var cells = '';
            if (showRef) cells += '<td title="' + esc(o.txRef || '') + '">' + esc((o.txRef || '').substring(0, 20)) + '</td>';
            cells += '<td>' + esc(o.customerName || o.customerEmail || '—') + '</td>';
            cells += '<td>' + productName(o.productId) + (o.hasEa ? ' <span class="fdr-badge fdr-badge-amber" style="font-size:10px;">+EA</span>' : '') + '</td>';
            cells += '<td>' + naira(o.amount) + '</td>';
            cells += '<td>' + badge(o.fulfilled ? 'fulfilled' : (o.status || 'pending')) + '</td>';
            cells += '<td>' + timeAgo(o.createdAt) + '</td>';
            cells += '<td><button class="fdr-btn fdr-btn-outline fdr-btn-sm" onclick="fdrResend(\'' + o.id + '\')">Resend</button></td>';
            return '<tr>' + cells + '</tr>';
        }).join('');
    }

    window.fdrResend = async function (orderId) {
        if (!confirm('Resend fulfillment email for this order?')) return;
        try {
            var resp = await fetch('/api/admin?action=resend', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ orderId: orderId })
            });
            var data = await resp.json();
            if (data.success) fdrToast('Email resent successfully', 'success');
            else fdrToast(data.error || 'Resend failed', 'error');
        } catch (e) {
            fdrToast('Resend failed: ' + e.message, 'error');
        }
    };

    // --- Utils ---

    function badge(status) {
        var colors = { fulfilled: 'green', completed: 'green', pending: 'amber', confirmed: 'blue', cancelled: 'red', failed: 'red' };
        var c = colors[status] || 'blue';
        return '<span class="fdr-badge fdr-badge-' + c + '">' + esc(status) + '</span>';
    }

    function setText(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function esc(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    // --- Init ---
    checkSession();

})();
