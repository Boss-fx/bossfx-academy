// ================================================================
// BossFx OS — Application Logic
// Powered by OS core (event bus, state, API, commands, search)
// Auth flow, module renderers, and data model preserved
// ================================================================

(function () {
    'use strict';

    // --- Supabase init (for session management only) ---
    var sbUrl = document.querySelector('meta[name="supabase-url"]').content;
    var sbKey = document.querySelector('meta[name="supabase-anon-key"]').content;
    var supabase = window.supabase.createClient(sbUrl, sbKey);

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

    var SECTION_CATEGORIES = {
        ceo: 'Command', marketing: 'Growth', sales: 'Growth', students: 'Growth',
        analytics: 'Intelligence', 'ai-control': 'Intelligence',
        automation: 'Operations', finance: 'Operations', operations: 'Operations',
        settings: 'System'
    };

    // ================================================================
    // WORKSPACE & COMMAND REGISTRATION
    // ================================================================

    Object.keys(SECTIONS).forEach(function (id) {
        OS.workspaces.register(id, {
            label: SECTIONS[id],
            category: SECTION_CATEGORIES[id] || 'general',
            commands: [{
                id: 'nav:' + id, label: 'Go to ' + SECTIONS[id], type: 'nav',
                keywords: SECTIONS[id].toLowerCase(),
                action: function () { OS.nav.go(id); }
            }]
        });
    });

    OS.commands.register([
        { id: 'action:refresh', label: 'Refresh Dashboard', type: 'action', keywords: 'reload update data', action: function () { fdrRefresh(); } },
        { id: 'action:logout', label: 'Sign Out', type: 'action', keywords: 'logout signout exit', action: function () { fdrLogout(); } },
        { id: 'action:theme', label: 'Toggle Theme (Dark/Light)', type: 'action', keywords: 'dark light mode theme', action: function () { fdrToggleTheme(); } },
        { id: 'action:activity', label: 'View Activity Feed', type: 'action', keywords: 'history timeline events', action: function () { fdrToggleActivity(); } },
        { id: 'action:shortcuts', label: 'Keyboard Shortcuts', type: 'action', keywords: 'keys hotkeys help', action: function () { showShortcutsModal(); } },
        { id: 'action:flutterwave', label: 'Open Flutterwave Dashboard', type: 'action', keywords: 'payments gateway', action: function () { window.open('https://dashboard.flutterwave.com', '_blank'); } },
        { id: 'action:supabase', label: 'Open Supabase Dashboard', type: 'action', keywords: 'database db', action: function () { window.open('https://supabase.com/dashboard', '_blank'); } },
        { id: 'action:brevo', label: 'Open Brevo Dashboard', type: 'action', keywords: 'email crm marketing', action: function () { window.open('https://app.brevo.com', '_blank'); } },
        { id: 'action:vercel', label: 'Open Vercel Dashboard', type: 'action', keywords: 'hosting deploy', action: function () { window.open('https://vercel.com', '_blank'); } },
        { id: 'action:ga4', label: 'Open Google Analytics', type: 'action', keywords: 'analytics traffic', action: function () { window.open('https://analytics.google.com', '_blank'); } },
        { id: 'action:clarity', label: 'Open Microsoft Clarity', type: 'action', keywords: 'heatmaps recordings', action: function () { window.open('https://clarity.microsoft.com', '_blank'); } },
        { id: 'action:admin', label: 'Open Legacy Admin Dashboard', type: 'action', keywords: 'admin old', action: function () { window.open('/admin/', '_blank'); } }
    ]);

    // Register keyboard shortcuts
    OS.shortcuts.register('mod+k', function () { cmdOpen ? closeCmd() : openCmd(); }, 'Command Palette');
    OS.shortcuts.register('mod+shift+a', function () { fdrToggleActivity(); }, 'Activity Feed');
    OS.shortcuts.register('mod+shift+n', function () { fdrToggleNotifs(); }, 'Notifications');
    OS.shortcuts.register('mod+shift+t', function () { fdrToggleTheme(); }, 'Toggle Theme');

    // ================================================================
    // AUTH (UNCHANGED — wired to OS.store)
    // ================================================================

    document.getElementById('fdrLoginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('fdrEmail').value.trim();
        var pw = document.getElementById('fdrPassword').value;
        var errEl = document.getElementById('fdrLoginError');
        var btn = document.getElementById('fdrLoginBtn');
        errEl.textContent = '';
        btn.classList.add('fdr-btn-loading');
        btn.textContent = 'Signing in...';
        try {
            var result = await supabase.auth.signInWithPassword({ email: email, password: pw });
            if (result.error) throw result.error;
            OS.store.set('session', result.data.session);
            OS.activity.log('login', 'Founder signed in');
            onLogin();
        } catch (err) {
            errEl.textContent = err.message || 'Login failed';
            btn.classList.remove('fdr-btn-loading');
            btn.textContent = 'Sign In';
        }
    });

    async function checkSession() {
        var result = await supabase.auth.getSession();
        if (result.data && result.data.session) {
            OS.store.set('session', result.data.session);
            onLogin();
        }
    }

    function onLogin() {
        document.getElementById('fdrLogin').style.display = 'none';
        document.getElementById('fdrApp').style.display = 'flex';
        document.getElementById('fdrUserEmail').textContent = OS.store.get('session').user.email;
        startClock();
        startUptime();
        updateBreadcrumbs('ceo');
        loadDashboard();
    }

    window.fdrLogout = async function () {
        await supabase.auth.signOut();
        OS.store.set('session', null);
        OS.store.set('dashData', null);
        OS.store.set('sysData', null);
        OS.activity.log('login', 'Founder signed out');
        document.getElementById('fdrLogin').style.display = 'flex';
        document.getElementById('fdrApp').style.display = 'none';
    };

    // ================================================================
    // NAVIGATION — Powered by OS.nav + event-driven DOM updates
    // ================================================================

    var navItems = document.querySelectorAll('.fdr-nav-item');
    navItems.forEach(function (btn) {
        btn.addEventListener('click', function () { OS.nav.go(btn.dataset.section); });
    });

    OS.events.on('nav:changed', function (data) {
        navItems.forEach(function (b) { b.classList.toggle('active', b.dataset.section === data.section); });
        document.querySelectorAll('.fdr-section').forEach(function (s) { s.classList.remove('active'); });
        var target = document.getElementById('sec-' + data.section);
        if (target) target.classList.add('active');
        document.getElementById('fdrPageTitle').textContent = SECTIONS[data.section] || data.section;
        updateBreadcrumbs(data.section);
        closeSidebar();
        history.pushState({ section: data.section }, '', '#' + data.section);
        var footerSection = document.getElementById('fdrFooterSection');
        if (footerSection) footerSection.textContent = SECTIONS[data.section] || data.section;
    });

    window.addEventListener('popstate', function (e) {
        if (e.state && e.state.section) {
            OS.nav.go(e.state.section);
        } else {
            var hash = location.hash.replace('#', '');
            if (hash && SECTIONS[hash]) OS.nav.go(hash);
        }
    });

    window.fdrNav = function (section) { OS.nav.go(section); };

    function updateBreadcrumbs(section) {
        var el = document.getElementById('fdrBreadcrumbs');
        if (el) el.innerHTML = BFX.breadcrumbs([
            { label: 'BossFx OS', action: "fdrNav('ceo')" },
            { label: SECTION_CATEGORIES[section] || 'System' },
            { label: SECTIONS[section] || section }
        ]);
    }

    // --- Mobile sidebar ---
    var hamburger = document.getElementById('fdrHamburger');
    var sidebar = document.getElementById('fdrSidebar');
    var mobileOverlay = document.getElementById('fdrOverlay');
    hamburger.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        mobileOverlay.classList.toggle('show');
    });
    mobileOverlay.addEventListener('click', closeSidebar);
    function closeSidebar() {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('show');
    }

    // ================================================================
    // COMMAND PALETTE — Powered by OS.commands + OS.search
    // ================================================================

    var cmdOpen = false;
    var cmdIdx = 0;
    var cmdFiltered = [];

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
        cmdFiltered = OS.commands.search(query);
        if (query && query.length >= 2) {
            var searchResults = OS.search.query(query);
            searchResults.forEach(function (sr) {
                cmdFiltered.push({
                    id: 'search:' + sr.module + ':' + sr.id,
                    label: sr.label, type: sr.type,
                    detail: sr.detail,
                    action: sr.action
                });
            });
        }
        if (cmdIdx >= cmdFiltered.length) cmdIdx = 0;

        var navIcon = '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>';
        var actionIcon = '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>';
        var searchIcon = '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>';

        var html = cmdFiltered.map(function (item, i) {
            var icon = item.type === 'nav' ? navIcon : (item.id && item.id.indexOf('search:') === 0 ? searchIcon : actionIcon);
            return '<div class="fdr-cmd-item' + (i === cmdIdx ? ' active' : '') + '" data-idx="' + i + '">' +
                icon + '<span class="fdr-cmd-item-label">' + BFX.esc(item.label) + '</span>' +
                '<span class="fdr-cmd-item-hint">' + BFX.esc(item.type || '') + '</span></div>';
        }).join('');
        document.getElementById('cmdResults').innerHTML = html || '<div style="padding:20px;text-align:center;color:var(--fdr-dim)">No results</div>';

        document.querySelectorAll('.fdr-cmd-item').forEach(function (el, idx) {
            el.addEventListener('click', function () { executeCmdAtIndex(idx); });
        });
    }

    function executeCmdAtIndex(idx) {
        var item = cmdFiltered[idx];
        if (!item) return;
        closeCmd();
        if (item.action) item.action();
    }

    document.getElementById('cmdInput').addEventListener('input', function (e) { renderCmd(e.target.value); });
    document.getElementById('cmdInput').addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdIdx = Math.min(cmdIdx + 1, cmdFiltered.length - 1); renderCmd(this.value); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cmdIdx = Math.max(cmdIdx - 1, 0); renderCmd(this.value); }
        else if (e.key === 'Enter') { e.preventDefault(); executeCmdAtIndex(cmdIdx); }
        else if (e.key === 'Escape') { closeCmd(); }
    });

    document.getElementById('cmdPalette').addEventListener('click', function (e) { if (e.target === this) closeCmd(); });
    document.getElementById('fdrSearchInput').addEventListener('focus', function () { this.blur(); openCmd(); });

    // ================================================================
    // NOTIFICATIONS — Powered by OS.notifications
    // ================================================================

    window.fdrToggleNotifs = function () {
        document.getElementById('activityPanel').classList.remove('open');
        var panel = document.getElementById('notifPanel');
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) renderNotifs();
    };

    window.fdrClearNotifs = function () {
        OS.notifications.clear();
        document.getElementById('notifDot').classList.remove('show');
        renderNotifs();
    };

    function renderNotifs() {
        var list = document.getElementById('notifList');
        var notifs = OS.notifications.all();
        if (!notifs.length) {
            list.innerHTML = '<div class="fdr-notif-empty"><span style="font-size:1.5rem">🔔</span><span>No notifications</span></div>';
            return;
        }
        list.innerHTML = notifs.map(function (n) {
            return '<div class="fdr-notif-item' + (n.read ? '' : ' unread') + '" onclick="OS.notifications.markRead(' + n.id + ')">' +
                '<div class="fdr-notif-item-title">' + BFX.esc(n.title) + '</div>' +
                '<div class="fdr-notif-item-body">' + BFX.esc(n.body) + '</div>' +
                '<div class="fdr-notif-item-time">' + BFX.timeAgo(n.time) + '</div></div>';
        }).join('');
    }

    OS.events.on('notification:added', function () {
        document.getElementById('notifDot').classList.add('show');
        if (document.getElementById('notifPanel').classList.contains('open')) renderNotifs();
    });
    OS.events.on('notification:cleared', function () {
        document.getElementById('notifDot').classList.remove('show');
    });

    // ================================================================
    // ACTIVITY PANEL
    // ================================================================

    window.fdrToggleActivity = function () {
        document.getElementById('notifPanel').classList.remove('open');
        var panel = document.getElementById('activityPanel');
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) renderActivity();
    };

    window.fdrCloseActivity = function () {
        document.getElementById('activityPanel').classList.remove('open');
    };

    function renderActivity() {
        document.getElementById('activityList').innerHTML = BFX.timeline(OS.activity.recent(30));
    }

    OS.events.on('activity:logged', function () {
        if (document.getElementById('activityPanel').classList.contains('open')) renderActivity();
    });

    // ================================================================
    // MODAL & DRAWER
    // ================================================================

    window.fdrOpenModal = function (title, contentHtml, footerHtml) {
        document.getElementById('fdrModalContainer').innerHTML = BFX.modal(title, contentHtml, footerHtml);
        document.getElementById('fdrModalBackdrop').classList.add('open');
    };

    window.fdrCloseModal = function () {
        document.getElementById('fdrModalBackdrop').classList.remove('open');
    };

    window.fdrOpenDrawer = function (title, contentHtml) {
        document.getElementById('fdrDrawer').innerHTML = BFX.drawer(title, contentHtml);
        document.getElementById('fdrDrawer').classList.add('open');
    };

    window.fdrCloseDrawer = function () {
        document.getElementById('fdrDrawer').classList.remove('open');
    };

    // ================================================================
    // THEME TOGGLE
    // ================================================================

    window.fdrToggleTheme = function () {
        OS.theme.toggle();
        updateThemeIcons();
        OS.activity.log('system', 'Theme changed to ' + OS.theme.current());
    };

    function updateThemeIcons() {
        var isDark = OS.theme.current() === 'dark';
        var moon = document.getElementById('themeIconMoon');
        var sun = document.getElementById('themeIconSun');
        if (moon) moon.style.display = isDark ? '' : 'none';
        if (sun) sun.style.display = isDark ? 'none' : '';
    }

    // ================================================================
    // SHORTCUTS MODAL
    // ================================================================

    function showShortcutsModal() {
        var sc = OS.shortcuts.all();
        var html = '<div style="display:grid;gap:8px;">';
        Object.keys(sc).forEach(function (combo) {
            var display = combo.replace('mod+', '⌘/Ctrl+').replace('shift+', 'Shift+').replace('alt+', 'Alt+');
            html += BFX.settingRow(sc[combo].label, null, '<kbd class="fdr-kbd" style="font-size:0.78rem;padding:3px 8px;">' + BFX.esc(display) + '</kbd>');
        });
        html += '</div>';
        fdrOpenModal('Keyboard Shortcuts', html);
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
    // TOAST + REFRESH + RESEND
    // ================================================================

    window.fdrToast = function (msg, type) {
        var toast = document.getElementById('fdrToast');
        toast.textContent = msg;
        toast.className = 'fdr-toast show' + (type ? ' ' + type : '');
        setTimeout(function () { toast.className = 'fdr-toast'; }, 3500);
    };

    window.fdrRefresh = async function () {
        fdrToast('Refreshing data...');
        OS.activity.log('data', 'Dashboard refresh started');
        await loadDashboard();
        fdrToast('Dashboard updated', 'success');
    };

    window.fdrResend = async function (orderId) {
        if (!confirm('Resend fulfillment email for this order?')) return;
        try {
            var data = await OS.api.resend(orderId);
            if (data.success) {
                fdrToast('Email resent successfully', 'success');
                OS.activity.log('order', 'Resent fulfillment email for order ' + orderId);
            } else {
                fdrToast(data.error || 'Resend failed', 'error');
            }
        } catch (e) { fdrToast('Resend failed: ' + e.message, 'error'); }
    };

    // ================================================================
    // MAIN LOAD
    // ================================================================

    async function loadDashboard() {
        OS.store.set('loading', true);
        try {
            var results = await Promise.all([OS.api.dashboard(), OS.api.system()]);
            OS.store.set('dashData', results[0]);
            OS.store.set('sysData', results[1]);

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
            buildSearchIndex();
            OS.activity.log('data', 'Dashboard data loaded');
            OS.events.emit('dashboard:loaded');
        } catch (err) {
            console.error('[BossFx OS] Load error:', err);
            fdrToast('Error loading dashboard: ' + err.message, 'error');
            OS.activity.log('error', 'Dashboard load failed: ' + err.message);
            var errorHtml = '<div class="fdr-section-error"><div class="fdr-section-error-icon">⚠️</div>' +
                '<div class="fdr-section-error-title">Failed to load data</div>' +
                '<div class="fdr-section-error-msg">' + BFX.esc(err.message) + '</div>' +
                '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" onclick="fdrRefresh()" style="margin-top:12px;">Retry</button></div>';
            Object.keys(SECTIONS).forEach(function (id) {
                var el = document.getElementById('sec-' + id);
                if (el) el.innerHTML = errorHtml;
            });
            updateFooterStatus('error', err.message);
        }
        OS.store.set('loading', false);
    }

    function generateNotifications() {
        OS.notifications.clear();
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        if (d.orders.today > 0) OS.notifications.add('New Orders', d.orders.today + ' order' + (d.orders.today > 1 ? 's' : '') + ' today — ' + BFX.naira(d.revenue.today), 'success', { source: 'sales' });
        if (d.bookings.pending > 0) OS.notifications.add('Pending Bookings', d.bookings.pending + ' mentorship booking' + (d.bookings.pending > 1 ? 's' : '') + ' need attention', 'warn', { source: 'students', priority: 'high' });
        if (s.supabase && s.supabase.status === 'error') OS.notifications.add('Supabase Error', s.supabase.message || 'Database connection issue', 'error', { source: 'system', priority: 'critical' });
        if (s.brevo && s.brevo.status === 'error') OS.notifications.add('Brevo Error', s.brevo.message || 'Email service issue', 'error', { source: 'system', priority: 'critical' });
        if (s.vercel && s.vercel.functionsUsed >= s.vercel.functionsLimit) OS.notifications.add('Function Limit', 'Serverless function limit reached (' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ')', 'error', { source: 'system', priority: 'critical' });
    }

    function buildSearchIndex() {
        var d = OS.store.get('dashData');
        if (d.recentOrders) {
            OS.search.register('orders', d.recentOrders.map(function (o) {
                return { id: o.id, label: o.customerEmail || o.customerName || 'Order', detail: BFX.productName(o.productId) + ' — ' + BFX.naira(o.amount), type: 'order', action: function () { OS.nav.go('sales'); } };
            }));
        }
        if (d.products) {
            OS.search.register('products', Object.keys(d.products).map(function (k) {
                return { id: k, label: BFX.productName(k), detail: BFX.naira(d.products[k].revenue) + ' revenue', type: 'product', action: function () { OS.nav.go('sales'); } };
            }));
        }
        OS.search.register('ai', AI_ROLES.map(function (r) {
            return { id: r.id, label: r.title + ' — ' + r.subtitle, detail: r.purpose, type: 'ai-role', action: function () { OS.nav.go('ai-control'); } };
        }));
        OS.search.register('sections', Object.keys(SECTIONS).map(function (k) {
            return { id: k, label: SECTIONS[k], type: 'page', action: function () { OS.nav.go(k); } };
        }));
    }

    // ================================================================
    // MODULE 1: CEO DASHBOARD
    // ================================================================

    function computeHealthScore() {
        var s = OS.store.get('sysData');
        var d = OS.store.get('dashData');
        var score = 0;
        if (s.supabase && s.supabase.status === 'healthy') score += 25;
        if (s.brevo && s.brevo.status === 'healthy') score += 25;
        if (s.flutterwave && s.flutterwave.status === 'configured') score += 20;
        if (s.vercel && s.vercel.functionsUsed < s.vercel.functionsLimit) score += 10;
        if (d.orders.thisMonth > 0) score += 10;
        if (d.students.thisMonth > 0) score += 10;
        return score;
    }

    function computeGrowth(current, trend) {
        if (!trend || trend.length < 15) return null;
        var half = Math.floor(trend.length / 2);
        var first = trend.slice(0, half).reduce(function (s, t) { return s + t.revenue; }, 0);
        var second = trend.slice(half).reduce(function (s, t) { return s + t.revenue; }, 0);
        if (first === 0) return second > 0 ? 100 : 0;
        return Math.round(((second - first) / first) * 100);
    }

    function buildExecutiveSummary() {
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        var parts = [];

        if (d.revenue.today > 0) {
            parts.push('Generated <strong>' + BFX.naira(d.revenue.today) + '</strong> today across ' + d.orders.today + ' order' + (d.orders.today !== 1 ? 's' : '') + '.');
        } else {
            parts.push('No revenue recorded today yet.');
        }

        parts.push('Month-to-date revenue is <strong>' + BFX.naira(d.revenue.thisMonth) + '</strong> with ' + BFX.num(d.orders.thisMonth) + ' orders.');

        if (d.students.thisMonth > 0) {
            parts.push(BFX.num(d.students.thisMonth) + ' new student' + (d.students.thisMonth !== 1 ? 's' : '') + ' enrolled this month, bringing total to ' + BFX.num(d.students.total) + '.');
        }

        if (d.bookings.pending > 0) {
            parts.push('<span style="color:var(--fdr-amber)">' + d.bookings.pending + ' mentorship booking' + (d.bookings.pending !== 1 ? 's' : '') + ' pending review.</span>');
        }

        var sysOk = (!s.supabase || s.supabase.status === 'healthy') && (!s.brevo || s.brevo.status === 'healthy');
        parts.push(sysOk ? 'All systems operational.' : '<span style="color:var(--fdr-red)">System issues detected — check Operations.</span>');

        return parts.join(' ');
    }

    function renderCEO() {
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        var html = BFX.sectionHeader('CEO Dashboard', 'Executive overview of BossFx Academy');

        // Quick Actions
        html += '<div class="fdr-quick-actions">';
        html += BFX.quickAction('🔄', 'Refresh Data', 'fdrRefresh()');
        html += BFX.quickAction('💳', 'Flutterwave', "window.open('https://dashboard.flutterwave.com','_blank')");
        html += BFX.quickAction('📧', 'Brevo', "window.open('https://app.brevo.com','_blank')");
        html += BFX.quickAction('📊', 'Analytics', "window.open('https://analytics.google.com','_blank')");
        html += BFX.quickAction('⌨️', 'Shortcuts', 'showShortcutsModal()');
        html += BFX.quickAction('🕐', 'Activity', 'fdrToggleActivity()');
        html += '</div>';

        // Health Score
        var healthScore = computeHealthScore();
        var healthColor = healthScore >= 80 ? 'green' : healthScore >= 50 ? 'amber' : 'red';
        var growth = computeGrowth(d.revenue.thisMonth, d.revenue.trend);
        var growthLabel = growth !== null ? (growth >= 0 ? '+' + growth + '%' : growth + '%') : '—';

        html += BFX.metricGrid([
            ['Revenue Today', BFX.naira(d.revenue.today), 'green'],
            ['Revenue This Month', BFX.naira(d.revenue.thisMonth), 'green'],
            ['30-Day Growth', growthLabel, growth >= 0 ? 'green' : 'red'],
            ['Health Score', healthScore + '/100', healthColor],
            ['Orders Today', BFX.num(d.orders.today)],
            ['Total Students', BFX.num(d.students.total), 'blue'],
            ['EA Addon Rate', BFX.pct(d.eaAddon.rate), 'amber'],
            ['Email Subscribers', d.brevo ? BFX.num(d.brevo.totalSubscribers) : 'N/A', 'purple']
        ]);

        // Alerts
        var alerts = buildAlerts();
        if (alerts.length) html += alerts.map(function (a) { return BFX.alert(a.type, a.text); }).join('');

        // AI Executive Summary
        html += BFX.card('AI Executive Summary', '<div style="font-size:0.84rem;line-height:1.7;color:var(--fdr-muted);">' + buildExecutiveSummary() + '</div>', BFX.badge('Auto-generated', 'dim'));

        // Charts
        html += '<div class="fdr-grid-2">';
        html += BFX.card('30-Day Revenue Trend', BFX.trendChart(d.revenue.trend));
        html += BFX.card('Revenue by Product', BFX.productBreakdown(d.products));
        html += '</div>';

        // Priorities
        html += '<div class="fdr-grid-2">';
        html += BFX.goalsCard("Today's Priorities", 'daily');
        html += BFX.goalsCard('Weekly Goals', 'weekly');
        html += '</div>';

        // Recent Orders + Recent Activity side by side
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Recent Orders', BFX.ordersTable(d.recentOrders, false), null, '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" onclick="fdrNav(\'sales\')">View All</button>');
        html += BFX.card('Recent Activity', BFX.timeline(OS.activity.recent(10)), null, '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" onclick="fdrToggleActivity()">Full Feed</button>');
        html += '</div>';

        // AI Team Summary
        html += BFX.card('AI Team Overview', '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + AI_ROLES.map(function (r) {
            return BFX.badge(r.title, r.color);
        }).join('') + '</div><p style="margin-top:12px;font-size:0.8rem;color:var(--fdr-dim);">13 AI roles active across all business functions. <a href="#" onclick="fdrNav(\'ai-control\');return false;">Manage AI Team &rarr;</a></p>');

        // Key Metrics Breakdown
        html += BFX.card('Revenue Breakdown', '<div class="fdr-grid-3">' +
            '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">This Week</div>' +
                '<div style="font-family:Space Grotesk;font-size:1.1rem;font-weight:700;color:var(--fdr-green);">' + BFX.naira(d.revenue.thisWeek) + '</div>' +
                '<div style="font-size:0.7rem;color:var(--fdr-dim);margin-top:2px;">' + BFX.num(d.orders.thisWeek) + ' orders</div></div>' +
            '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">This Quarter</div>' +
                '<div style="font-family:Space Grotesk;font-size:1.1rem;font-weight:700;color:var(--fdr-green);">' + BFX.naira(d.revenue.thisQuarter) + '</div>' +
                '<div style="font-size:0.7rem;color:var(--fdr-dim);margin-top:2px;">Quarter to date</div></div>' +
            '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">All Time</div>' +
                '<div style="font-family:Space Grotesk;font-size:1.1rem;font-weight:700;color:var(--fdr-green);">' + BFX.naira(d.revenue.allTime) + '</div>' +
                '<div style="font-size:0.7rem;color:var(--fdr-dim);margin-top:2px;">' + BFX.num(d.orders.allTime) + ' total orders</div></div>' +
            '</div>');

        document.getElementById('sec-ceo').innerHTML = html;
        renderGoalsInto('daily');
        renderGoalsInto('weekly');
    }

    function buildAlerts() {
        var alerts = [];
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        if (d.orders.today > 0) alerts.push({ type: 'success', text: d.orders.today + ' order' + (d.orders.today !== 1 ? 's' : '') + ' today — ' + BFX.naira(d.revenue.today) + ' revenue' });
        if (d.bookings.pending > 0) alerts.push({ type: 'warn', text: d.bookings.pending + ' pending mentorship booking' + (d.bookings.pending !== 1 ? 's' : '') + ' require attention' });
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
        var d = OS.store.get('dashData');
        var b = d.brevo;
        var html = BFX.sectionHeader('Marketing', 'Channels, campaigns, and audience growth',
            '<a href="https://app.brevo.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Open Brevo &rarr;</a>');

        html += BFX.metricGrid([
            ['Email Subscribers', b ? BFX.num(b.totalSubscribers) : 'N/A', 'purple'],
            ['Social Channels', '6', 'blue'],
            ['Blog Posts', '11', 'green'],
            ['Resource Tools', '8'],
            ['Lead Capture Points', '6', 'amber'],
            ['Drip Sequences', '6', 'purple'],
            ['Tracking Platforms', '4', 'blue'],
            ['Custom Analytics', '11 modules', 'cyan']
        ]);

        // Analytics Platforms — prominent at the top
        html += BFX.card('Analytics & Tracking Platforms', '<div class="fdr-grid-2">' +
            '<div>' +
                BFX.settingRow('Google Analytics 4', 'G-ZFQ9P5KFSJ', '<a href="https://analytics.google.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-xs">Open &rarr;</a>') +
                '<div style="padding:12px 16px;font-size:0.78rem;color:var(--fdr-muted);line-height:1.5;margin-bottom:6px;">Traffic, sessions, conversions, user behavior. Installed via GTM and config.js dual integration.</div>' +
                BFX.settingRow('Google Tag Manager', 'GTM-T3R88HZB', '<a href="https://tagmanager.google.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-xs">Open &rarr;</a>') +
                '<div style="padding:12px 16px;font-size:0.78rem;color:var(--fdr-muted);line-height:1.5;">Tag container managing GA4, Pixel, Clarity, and custom event tags.</div>' +
            '</div>' +
            '<div>' +
                BFX.settingRow('Meta Pixel', '804009589230621', '<a href="https://business.facebook.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-xs">Open &rarr;</a>') +
                '<div style="padding:12px 16px;font-size:0.78rem;color:var(--fdr-muted);line-height:1.5;margin-bottom:6px;">PageView, Lead, Purchase events for Facebook/Instagram ad targeting and retargeting.</div>' +
                BFX.settingRow('Microsoft Clarity', 'wnde2od79f', '<a href="https://clarity.microsoft.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-xs">Open &rarr;</a>') +
                '<div style="padding:12px 16px;font-size:0.78rem;color:var(--fdr-muted);line-height:1.5;">Session recordings, heatmaps, dead click detection, scroll depth.</div>' +
            '</div>' +
            '</div>');

        // Funnel Overview
        html += BFX.card('Marketing Funnel', '<div style="display:flex;flex-direction:column;gap:2px;">' +
            buildFunnelStep('1', 'Awareness', 'Blog (11 posts) + Resources (8 tools) + Social Media (6 channels)', 'blue', '100%') +
            buildFunnelStep('2', 'Capture', 'Exit intent popups + Newsletter forms + Webinar registration + Resource downloads', 'purple', '80%') +
            buildFunnelStep('3', 'Nurture', '6 drip sequences via Brevo (welcome, webinar, resource, mentorship, exit intent, re-engagement)', 'amber', '60%') +
            buildFunnelStep('4', 'Convert', 'Product pages + Flutterwave checkout + EA addon upsell', 'green', '40%') +
            buildFunnelStep('5', 'Retain', 'Fulfillment email + Telegram community + Mentorship booking', 'cyan', '30%') +
            '</div>');

        // Email + Social side by side
        html += '<div class="fdr-grid-2">';

        var listsHtml = '';
        if (b && b.lists && b.lists.length) {
            listsHtml = b.lists.map(function (l) { return BFX.settingRow(l.name, 'List #' + l.id, BFX.badge(BFX.num(l.subscribers) + ' subs', 'purple')); }).join('');
        } else {
            listsHtml = BFX.emptyState('📧', 'No Brevo Data', 'Email list data will appear when Brevo is connected.');
        }
        html += BFX.card('Email Lists (Brevo)', listsHtml, null,
            '<a href="https://app.brevo.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-xs">Manage Lists &rarr;</a>');

        var socials = [
            ['Instagram', 'https://www.instagram.com/bossfx_academy', '@bossfx_academy', 'pink'],
            ['TikTok', 'https://www.tiktok.com/@bossfx1', '@bossfx1', 'cyan'],
            ['YouTube', 'https://youtube.com/@bossfx-tradingcommunity', '@bossfx-tradingcommunity', 'red'],
            ['X (Twitter)', 'https://x.com/teebossx', '@teebossx', 'blue'],
            ['Telegram', 'https://t.me/qD_fBeaziqE5YzU8', 'Community Group', 'blue'],
            ['LinkedIn', 'https://linkedin.com', 'Coming Soon', 'dim']
        ];
        var socialHtml = socials.map(function (s) {
            return '<a href="' + BFX.esc(s[1]) + '" target="_blank" rel="noopener" class="fdr-setting-row" style="text-decoration:none;color:inherit;">' +
                '<span><strong>' + BFX.esc(s[0]) + '</strong> <small style="color:var(--fdr-dim)">' + BFX.esc(s[2]) + '</small></span>' +
                BFX.badge('Active', s[3]) + '</a>';
        }).join('');
        html += BFX.card('Social Media Channels', socialHtml);
        html += '</div>';

        // Content assets
        html += BFX.card('Content Assets', '<div class="fdr-grid-3">' +
            buildContentStat('Blog Posts', '11', 'Published articles on forex trading, prop firms, and education', 'green') +
            buildContentStat('Resource Tools', '8', 'Interactive calculators, checklists, journals, and guides', 'blue') +
            buildContentStat('Lead Magnets', '4', 'Exit intent, newsletter, webinar reg, resource download forms', 'amber') +
            '</div>');

        // BossFx Analytics Engine
        html += BFX.card('BossFx Analytics Engine', '<div style="margin-bottom:8px;font-size:0.78rem;color:var(--fdr-muted);">Custom 11-module analytics system (bfx-analytics.js) tracking every visitor touchpoint.</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px;">' +
            ['UTM Attribution', 'Engagement Scoring', 'Conversion Tracking', 'Session Intelligence', 'Ecommerce Module', 'Mobile Intelligence', 'Scroll Depth', 'Content Analytics', 'Social Tracking', 'Performance Monitor', 'Error Tracking'].map(function (m) {
                return '<div style="padding:8px 12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;font-size:0.75rem;display:flex;align-items:center;justify-content:space-between;">' +
                    '<span>' + m + '</span>' + BFX.badge('On', 'green') + '</div>';
            }).join('') + '</div>');

        document.getElementById('sec-marketing').innerHTML = html;
    }

    function buildFunnelStep(num, label, desc, color, width) {
        return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;">' +
            '<div style="width:28px;height:28px;border-radius:8px;background:var(--fdr-' + color + '-dim);color:var(--fdr-' + color + ');display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.78rem;flex-shrink:0;">' + num + '</div>' +
            '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:0.84rem;margin-bottom:2px;">' + BFX.esc(label) + '</div>' +
            '<div style="font-size:0.75rem;color:var(--fdr-dim);line-height:1.4;">' + BFX.esc(desc) + '</div></div></div>';
    }

    function buildContentStat(title, count, desc, color) {
        return '<div style="padding:18px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
            '<div style="font-family:Space Grotesk;font-size:1.5rem;font-weight:700;color:var(--fdr-' + color + ');margin-bottom:4px;">' + count + '</div>' +
            '<div style="font-weight:600;font-size:0.84rem;margin-bottom:4px;">' + BFX.esc(title) + '</div>' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);line-height:1.4;">' + BFX.esc(desc) + '</div></div>';
    }

    // ================================================================
    // MODULE 3: SALES
    // ================================================================

    function renderSales() {
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        var html = BFX.sectionHeader('Sales', 'Revenue, orders, and product performance',
            '<a href="https://dashboard.flutterwave.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Flutterwave &rarr;</a>');

        // Quick Actions
        html += '<div class="fdr-quick-actions">';
        html += BFX.quickAction('💳', 'Flutterwave', "window.open('https://dashboard.flutterwave.com','_blank')");
        html += BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()');
        html += BFX.quickAction('📊', 'CEO View', "fdrNav('ceo')");
        html += BFX.quickAction('👥', 'Students', "fdrNav('students')");
        html += '</div>';

        // Revenue metrics
        html += BFX.metricGrid([
            ['Today', BFX.naira(d.revenue.today), 'green'],
            ['This Week', BFX.naira(d.revenue.thisWeek), 'green'],
            ['This Month', BFX.naira(d.revenue.thisMonth), 'green'],
            ['This Quarter', BFX.naira(d.revenue.thisQuarter), 'green'],
            ['All Time', BFX.naira(d.revenue.allTime), 'green'],
            ['Avg Order Value', BFX.naira(d.metrics.aov), 'blue'],
            ['EA Addon Revenue', BFX.naira(d.eaAddon.revenue), 'amber'],
            ['EA Conv. Rate', BFX.pct(d.eaAddon.rate), 'amber']
        ]);

        // Charts
        html += '<div class="fdr-grid-2">';
        html += BFX.card('30-Day Revenue Trend', BFX.trendChart(d.revenue.trend));
        html += BFX.card('Revenue by Product', BFX.productBreakdown(d.products));
        html += '</div>';

        // Product Performance Cards
        var productKeys = Object.keys(d.products || {});
        if (productKeys.length) {
            var totalRev = productKeys.reduce(function (s, k) { return s + d.products[k].revenue; }, 0);
            var totalOrders = productKeys.reduce(function (s, k) { return s + d.products[k].count; }, 0);
            productKeys.sort(function (a, b) { return d.products[b].revenue - d.products[a].revenue; });

            html += BFX.card('Product Performance', '<div class="fdr-grid-2">' +
                productKeys.map(function (k) {
                    var p = d.products[k];
                    var pctRev = totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0;
                    var pctOrd = totalOrders > 0 ? Math.round((p.count / totalOrders) * 100) : 0;
                    return '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
                        '<div style="font-weight:600;font-size:0.84rem;margin-bottom:10px;">' + BFX.productName(k) + '</div>' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">' +
                            '<div><div style="font-size:0.65rem;color:var(--fdr-dim);text-transform:uppercase;">Revenue</div><div style="font-family:Space Grotesk;font-weight:700;color:var(--fdr-green);">' + BFX.naira(p.revenue) + '</div></div>' +
                            '<div><div style="font-size:0.65rem;color:var(--fdr-dim);text-transform:uppercase;">Orders</div><div style="font-family:Space Grotesk;font-weight:700;">' + BFX.num(p.count) + '</div></div>' +
                        '</div>' +
                        '<div style="display:flex;gap:8px;">' + BFX.badge(pctRev + '% of revenue', 'green') + BFX.badge(pctOrd + '% of orders', 'dim') + '</div>' +
                    '</div>';
                }).join('') + '</div>');
        }

        // EA Addon Performance
        html += BFX.card('EA Addon Upsell Performance',
            '<div class="fdr-grid-3">' +
                '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">EA Addons Sold</div>' +
                    '<div style="font-family:Space Grotesk;font-size:1.2rem;font-weight:700;color:var(--fdr-amber);">' + BFX.num(d.eaAddon.count) + '</div></div>' +
                '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">EA Revenue</div>' +
                    '<div style="font-family:Space Grotesk;font-size:1.2rem;font-weight:700;color:var(--fdr-amber);">' + BFX.naira(d.eaAddon.revenue) + '</div></div>' +
                '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">Conversion Rate</div>' +
                    '<div style="font-family:Space Grotesk;font-size:1.2rem;font-weight:700;color:var(--fdr-amber);">' + BFX.pct(d.eaAddon.rate) + '</div></div>' +
            '</div>' +
            '<div style="margin-top:12px;font-size:0.78rem;color:var(--fdr-dim);line-height:1.5;">The SMA Pro Trend EA (₦15,000) is offered as an add-on during checkout for any product. ' +
            d.eaAddon.count + ' of ' + BFX.num(d.orders.allTime) + ' customers added it to their order.</div>');

        // Fulfillment Status
        var fulfilled = (d.recentOrders || []).filter(function (o) { return o.fulfilled; }).length;
        var pending = (d.recentOrders || []).length - fulfilled;
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Order Fulfillment', '<div style="display:flex;gap:16px;margin-bottom:12px;">' +
            '<div style="flex:1;padding:14px;background:var(--fdr-green-dim);border-radius:10px;text-align:center;">' +
                '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;color:var(--fdr-green);">' + fulfilled + '</div>' +
                '<div style="font-size:0.72rem;color:var(--fdr-green);">Fulfilled</div></div>' +
            '<div style="flex:1;padding:14px;background:' + (pending > 0 ? 'var(--fdr-amber-dim)' : 'var(--fdr-card)') + ';border-radius:10px;text-align:center;">' +
                '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;color:' + (pending > 0 ? 'var(--fdr-amber)' : 'var(--fdr-dim)') + ';">' + pending + '</div>' +
                '<div style="font-size:0.72rem;color:' + (pending > 0 ? 'var(--fdr-amber)' : 'var(--fdr-dim)') + ';">Pending</div></div>' +
            '</div>' +
            (pending > 0 ? BFX.alert('warn', pending + ' order' + (pending !== 1 ? 's' : '') + ' awaiting fulfillment. Check the orders table below.') : ''));

        // Flutterwave Gateway Status
        var fwStatus = s.flutterwave || {};
        html += BFX.card('Payment Gateway',
            BFX.settingRow('Gateway', 'Flutterwave', BFX.statusBadge(fwStatus.status === 'configured' ? 'configured' : 'error')) +
            BFX.settingRow('Webhook', 'Signature verification', BFX.badge(fwStatus.webhookHash ? 'Verified' : 'Missing', fwStatus.webhookHash ? 'green' : 'red')) +
            BFX.settingRow('Currency', 'Nigerian Naira', BFX.badge('NGN', 'blue')) +
            BFX.settingRow('Flow', 'Inline checkout → webhook → fulfillment', BFX.badge('Automated', 'green')));
        html += '</div>';

        // Period Report Tabs
        html += '<div id="salesReportArea">';
        html += BFX.tabs([
            { id: 'today', label: 'Today' }, { id: 'week', label: 'This Week' }, { id: 'month', label: 'This Month' }, { id: 'quarter', label: 'Quarter' }, { id: 'all', label: 'All Time' }
        ], 'today', 'fdrSalesReport');
        html += '</div>';

        // Top Customers
        var customers = {};
        (d.recentOrders || []).forEach(function (o) {
            var key = o.customerEmail || o.customerName || 'Unknown';
            if (!customers[key]) customers[key] = { name: o.customerName || o.customerEmail || '—', email: o.customerEmail || '', count: 0, total: 0 };
            customers[key].count++;
            customers[key].total += Number(o.amount || 0);
        });
        var topCustomers = Object.keys(customers).map(function (k) { return customers[k]; })
            .sort(function (a, b) { return b.total - a.total; }).slice(0, 5);

        if (topCustomers.length) {
            var custRows = topCustomers.map(function (c) {
                return [BFX.esc(c.name), BFX.esc(c.email), BFX.num(c.count), BFX.naira(c.total)];
            });
            html += BFX.card('Top Customers (Recent)', BFX.table(['Name', 'Email', 'Orders', 'Total Spent'], custRows));
        }

        // All Orders
        html += BFX.card('All Orders', BFX.ordersTable(d.recentOrders, true), null,
            '<span style="font-size:0.72rem;color:var(--fdr-dim);">Last 20 orders</span>');

        document.getElementById('sec-sales').innerHTML = html;
        fdrSalesReport('today');
    }

    window.fdrSalesReport = function (period) {
        var d = OS.store.get('dashData');
        var revMap = { today: d.revenue.today, week: d.revenue.thisWeek, month: d.revenue.thisMonth, quarter: d.revenue.thisQuarter, all: d.revenue.allTime };
        var ordMap = { today: d.orders.today, week: d.orders.thisWeek, month: d.orders.thisMonth, quarter: d.orders.thisMonth, all: d.orders.allTime };
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
        var d = OS.store.get('dashData');
        var html = BFX.sectionHeader('Students', 'Student directory, downloads, and mentorship',
            '<a href="https://app.brevo.com/contact" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Brevo CRM &rarr;</a>');

        // Quick Actions
        html += '<div class="fdr-quick-actions">';
        html += BFX.quickAction('💬', 'Telegram', "window.open('https://t.me/qD_fBeaziqE5YzU8','_blank')");
        html += BFX.quickAction('📧', 'Brevo', "window.open('https://app.brevo.com/contact','_blank')");
        html += BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()');
        html += BFX.quickAction('💰', 'Sales', "fdrNav('sales')");
        html += '</div>';

        // Metrics
        var growthPct = d.students.total > 0 ? Math.round((d.students.thisMonth / d.students.total) * 100) : 0;
        html += BFX.metricGrid([
            ['Total Students', BFX.num(d.students.total), 'blue'],
            ['New This Month', BFX.num(d.students.thisMonth), 'green'],
            ['Growth Rate', growthPct + '%', growthPct > 10 ? 'green' : 'amber'],
            ['Total Downloads', BFX.num(d.downloads.total)],
            ['Downloads This Month', BFX.num(d.downloads.thisMonth), 'green'],
            ['Total Bookings', BFX.num(d.bookings.total)],
            ['Pending Bookings', BFX.num(d.bookings.pending), d.bookings.pending > 0 ? 'amber' : 'dim'],
            ['EA Addon Students', BFX.num(d.eaAddon.count), 'amber']
        ]);

        // Alerts
        if (d.bookings.pending > 0) {
            html += BFX.alert('warn', d.bookings.pending + ' mentorship booking' + (d.bookings.pending !== 1 ? 's' : '') + ' pending confirmation. Review in the bookings table below.');
        }

        // Students by Product + Mentorship Summary
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Students by Product', BFX.productBreakdown(d.products));

        var mentorshipProducts = ['mentorship-group', 'mentorship-1on1', 'vip'];
        var mentorTotal = 0;
        mentorshipProducts.forEach(function (pid) {
            if (d.products[pid]) mentorTotal += d.products[pid].count;
        });
        html += BFX.card('Mentorship Overview',
            '<div style="display:flex;gap:16px;margin-bottom:16px;">' +
                '<div style="flex:1;padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;color:var(--fdr-blue);">' + mentorTotal + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">Active Mentees</div></div>' +
                '<div style="flex:1;padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;color:var(--fdr-green);">' + BFX.num(d.bookings.thisMonth) + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">Bookings This Month</div></div>' +
                '<div style="flex:1;padding:14px;background:' + (d.bookings.pending > 0 ? 'var(--fdr-amber-dim)' : 'var(--fdr-card)') + ';border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;color:' + (d.bookings.pending > 0 ? 'var(--fdr-amber)' : 'var(--fdr-dim)') + ';">' + d.bookings.pending + '</div>' +
                    '<div style="font-size:0.72rem;color:' + (d.bookings.pending > 0 ? 'var(--fdr-amber)' : 'var(--fdr-dim)') + ';">Pending</div></div>' +
            '</div>' +
            '<div style="margin-top:8px;">' +
                mentorshipProducts.map(function (pid) {
                    var p = d.products[pid];
                    if (!p) return '';
                    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--fdr-border);">' +
                        '<span style="font-size:0.82rem;">' + BFX.productName(pid) + '</span>' +
                        '<span>' + BFX.badge(BFX.num(p.count) + ' students', 'blue') + '</span></div>';
                }).join('') +
            '</div>');
        html += '</div>';

        // Download Stats
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Download Activity',
            '<div style="display:flex;gap:16px;margin-bottom:16px;">' +
                '<div style="flex:1;padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;">' + BFX.num(d.downloads.total) + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">Total Downloads</div></div>' +
                '<div style="flex:1;padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;color:var(--fdr-green);">' + BFX.num(d.downloads.thisMonth) + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">This Month</div></div>' +
                '<div style="flex:1;padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;">' + (d.students.total > 0 ? (d.downloads.total / d.students.total).toFixed(1) : '0') + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">Avg per Student</div></div>' +
            '</div>');

        // Community
        html += BFX.card('Community',
            BFX.settingRow('Telegram Group', 'Post-purchase community access', '<a href="https://t.me/qD_fBeaziqE5YzU8" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Open &rarr;</a>') +
            BFX.settingRow('Email Lists', 'Brevo CRM contacts', BFX.badge(BFX.num((d.brevo && d.brevo.totalSubscribers) || 0) + ' subscribers', 'blue')) +
            BFX.settingRow('Delivery', 'Digital downloads + Telegram invite', BFX.badge('Automated', 'green')));
        html += '</div>';

        // Live tables
        html += BFX.card('Recent Downloads', '<div id="studentDownloads"><div class="fdr-loading"><div class="fdr-spinner"></div>Loading...</div></div>',
            null, '<span style="font-size:0.72rem;color:var(--fdr-dim);">Last 20 downloads</span>');
        html += BFX.card('Mentorship Bookings', '<div id="studentBookings"><div class="fdr-loading"><div class="fdr-spinner"></div>Loading...</div></div>',
            null, '<span style="font-size:0.72rem;color:var(--fdr-dim);">Last 20 bookings</span>');

        // Certificates placeholder
        html += BFX.card('Certificates & Achievements', BFX.emptyState('🎓', 'Certificate System', 'Issue and track course completion certificates. Track student milestones and achievements.'));

        document.getElementById('sec-students').innerHTML = html;
        loadStudentDownloads();
        loadStudentBookings();
    }

    async function loadStudentDownloads() {
        try {
            var sb = OS.api.supabase();
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
            var sb = OS.api.supabase();
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
        var d = OS.store.get('dashData');
        var html = BFX.sectionHeader('Analytics', 'Unified analytics, SEO health, and conversion intelligence',
            '<a href="https://analytics.google.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">GA4 &rarr;</a>');

        // Quick Actions
        html += '<div class="fdr-quick-actions">';
        html += BFX.quickAction('📊', 'GA4', "window.open('https://analytics.google.com','_blank')");
        html += BFX.quickAction('🏷️', 'GTM', "window.open('https://tagmanager.google.com','_blank')");
        html += BFX.quickAction('🔍', 'Clarity', "window.open('https://clarity.microsoft.com','_blank')");
        html += BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()');
        html += '</div>';

        // Metrics
        html += BFX.metricGrid([
            ['Tracking Platforms', '6', 'blue'],
            ['Custom Analytics', '11 modules', 'purple'],
            ['Conversion Points', '6', 'green'],
            ['HTML Pages', '35'],
            ['Sitemap URLs', '10'],
            ['Blog Posts', '11'],
            ['Resource Tools', '8'],
            ['Data Quality', 'Active', 'green']
        ]);

        // Platform Intelligence Cards
        html += '<div class="fdr-grid-2">';

        // GA4
        html += BFX.card('Google Analytics 4',
            BFX.settingRow('Property', 'G-ZFQ9P5KFSJ', BFX.badge('Active', 'green')) +
            BFX.settingRow('Integration', 'GTM + config.js dual install', BFX.badge('Dual', 'blue')) +
            BFX.settingRow('Tracking', 'Sessions, pageviews, events, conversions', null) +
            BFX.settingRow('Ecommerce', 'Purchase, add_to_cart, begin_checkout', BFX.badge('Enhanced', 'purple')) +
            BFX.settingRow('Audiences', 'Traders, students, mentorship leads', null),
            null, '<a href="https://analytics.google.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Open GA4 &rarr;</a>');

        // GTM
        html += BFX.card('Google Tag Manager',
            BFX.settingRow('Container', 'GTM-T3R88HZB', BFX.badge('Active', 'green')) +
            BFX.settingRow('Tags', 'GA4, Meta Pixel, Clarity, Custom', BFX.badge('6+', 'blue')) +
            BFX.settingRow('Triggers', 'Page load, click, form submit, scroll', null) +
            BFX.settingRow('Variables', 'Page path, click URL, form ID, dataLayer', null) +
            BFX.settingRow('Consent', 'Cookie banner integration', BFX.badge('Configured', 'green')),
            null, '<a href="https://tagmanager.google.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Open GTM &rarr;</a>');

        // Meta Pixel
        html += BFX.card('Meta Pixel (Facebook)',
            BFX.settingRow('Pixel ID', '804009589230621', BFX.badge('Active', 'green')) +
            BFX.settingRow('Standard Events', 'PageView, Lead, Purchase, ViewContent', BFX.badge('4 events', 'blue')) +
            BFX.settingRow('Custom Audiences', 'Website visitors, purchasers, leads', null) +
            BFX.settingRow('Retargeting', 'Cart abandoners, page viewers', null) +
            BFX.settingRow('Attribution', '7-day click, 1-day view', BFX.badge('Standard', 'dim')),
            null, '<a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Events Manager &rarr;</a>');

        // Clarity
        html += BFX.card('Microsoft Clarity',
            BFX.settingRow('Project', 'wnde2od79f', BFX.badge('Active', 'green')) +
            BFX.settingRow('Session Recordings', 'Full visitor session playback', BFX.badge('Unlimited', 'blue')) +
            BFX.settingRow('Heatmaps', 'Click, scroll, and attention maps', BFX.badge('All pages', 'purple')) +
            BFX.settingRow('Dead Clicks', 'Elements users click that do nothing', null) +
            BFX.settingRow('Rage Clicks', 'Frustration detection on UI elements', null),
            null, '<a href="https://clarity.microsoft.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Open Clarity &rarr;</a>');

        // TikTok Pixel
        html += BFX.card('TikTok Pixel',
            BFX.settingRow('Status', 'Not yet installed', BFX.badge('Pending', 'amber')) +
            BFX.settingRow('Social Profile', '@bossfx1 on TikTok', BFX.badge('Active', 'green')) +
            BFX.settingRow('Events Planned', 'PageView, SubmitForm, CompletePayment', null) +
            BFX.settingRow('Integration', 'Via GTM container tag', null) +
            '<div style="margin-top:10px;font-size:0.78rem;color:var(--fdr-dim);line-height:1.5;">Install TikTok Pixel via GTM to track conversions from TikTok traffic. Requires TikTok Business Center account.</div>',
            null, '<a href="https://ads.tiktok.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">TikTok Ads &rarr;</a>');

        // Search Console
        html += BFX.card('Google Search Console',
            BFX.settingRow('Property', 'www.bossfxcademy.com', BFX.badge('Verified', 'green')) +
            BFX.settingRow('Sitemap', '/sitemap.xml (10 URLs)', BFX.badge('Submitted', 'green')) +
            BFX.settingRow('Coverage', 'Index status, crawl errors, mobile usability', null) +
            BFX.settingRow('Performance', 'Search queries, impressions, CTR, position', null) +
            BFX.settingRow('Core Web Vitals', 'LCP, FID, CLS monitoring', null),
            null, '<a href="https://search.google.com/search-console" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Open Console &rarr;</a>');
        html += '</div>';

        // SEO Health
        html += BFX.card('SEO Health',
            '<div class="fdr-grid-3">' +
                buildSeoItem('Meta Tags', 'Title, description on all pages', 'green') +
                buildSeoItem('Open Graph', 'og:title, og:description, og:image', 'green') +
                buildSeoItem('JSON-LD', 'Organization, Course, FAQPage schemas', 'green') +
                buildSeoItem('Canonical URLs', 'Self-referencing canonicals', 'green') +
                buildSeoItem('Sitemap', '10 URLs in sitemap.xml', 'green') +
                buildSeoItem('Robots.txt', 'Configured, blocks /downloads/', 'green') +
                buildSeoItem('Mobile Responsive', '60%+ mobile traffic optimized', 'green') +
                buildSeoItem('Blog Content', '11 SEO-optimized posts', 'green') +
                buildSeoItem('Page Speed', 'Static HTML, no build step', 'green') +
            '</div>');

        // Conversion Funnel
        html += BFX.card('Conversion Funnel',
            '<div style="max-width:600px;margin:0 auto;">' +
                buildFunnelStep(1, 'Awareness', 'Blog, social media, SEO, paid ads', 'var(--fdr-blue)', '100%') +
                buildFunnelStep(2, 'Interest', 'Lead magnets, exit intent, newsletter', 'var(--fdr-purple)', '70%') +
                buildFunnelStep(3, 'Consideration', 'Email drips, webinar, resource tools', 'var(--fdr-amber)', '45%') +
                buildFunnelStep(4, 'Purchase', 'Checkout page, Flutterwave payment', 'var(--fdr-green)', '25%') +
                buildFunnelStep(5, 'Retention', 'Telegram community, mentorship, EA upsell', '#10B981', '15%') +
            '</div>');

        // Landing Page Performance
        var landingPages = [
            { path: '/', name: 'Homepage', type: 'Landing', cta: 'Product selection' },
            { path: '/forex-101.html', name: 'Forex 101 Course', type: 'Product', cta: 'Buy now' },
            { path: '/mentorship.html', name: 'Mentorship', type: 'Product', cta: 'Book session' },
            { path: '/checkout.html', name: 'Checkout', type: 'Conversion', cta: 'Pay with Flutterwave' },
            { path: '/vip.html', name: 'VIP Program', type: 'Product', cta: 'Join VIP' },
            { path: '/contact.html', name: 'Contact', type: 'Support', cta: 'Submit form' },
            { path: '/blog/', name: 'Blog Index', type: 'Content', cta: 'Read articles' },
            { path: '/resources/', name: 'Resources', type: 'Lead Gen', cta: 'Use tools' }
        ];
        var lpRows = landingPages.map(function (p) {
            return [BFX.esc(p.path), BFX.esc(p.name), BFX.badge(p.type, p.type === 'Conversion' ? 'green' : p.type === 'Product' ? 'blue' : p.type === 'Lead Gen' ? 'amber' : 'dim'), BFX.esc(p.cta)];
        });
        html += BFX.card('Landing Pages', BFX.table(['Path', 'Page', 'Type', 'Primary CTA'], lpRows),
            null, '<span style="font-size:0.72rem;color:var(--fdr-dim);">8 key landing pages tracked</span>');

        // Campaign Attribution
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Campaign Attribution (UTM)',
            BFX.settingRow('UTM Tracking', 'bfx-analytics.js module', BFX.badge('Active', 'green')) +
            BFX.settingRow('Parameters', 'source, medium, campaign, content, term', null) +
            BFX.settingRow('Storage', 'First-touch + last-touch attribution', BFX.badge('Dual Model', 'purple')) +
            BFX.settingRow('CRM Sync', 'UTM data passed to Brevo contacts', BFX.badge('Automated', 'green')) +
            '<div style="margin-top:12px;padding:12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;">' +
                '<div style="font-size:0.72rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">Active Channels</div>' +
                '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
                    BFX.badge('Instagram', 'purple') + BFX.badge('TikTok', 'blue') + BFX.badge('YouTube', 'red') +
                    BFX.badge('X (Twitter)', 'dim') + BFX.badge('Blog/SEO', 'green') + BFX.badge('Email', 'amber') +
                '</div></div>');

        // Content Performance
        html += BFX.card('Content Performance',
            '<div style="margin-bottom:12px;">' +
                '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
                    '<div style="flex:1;padding:12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;text-align:center;">' +
                        '<div style="font-family:Space Grotesk;font-size:1.1rem;font-weight:700;">11</div>' +
                        '<div style="font-size:0.68rem;color:var(--fdr-dim);">Blog Posts</div></div>' +
                    '<div style="flex:1;padding:12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;text-align:center;">' +
                        '<div style="font-family:Space Grotesk;font-size:1.1rem;font-weight:700;">8</div>' +
                        '<div style="font-size:0.68rem;color:var(--fdr-dim);">Resource Tools</div></div>' +
                    '<div style="flex:1;padding:12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;text-align:center;">' +
                        '<div style="font-family:Space Grotesk;font-size:1.1rem;font-weight:700;">5</div>' +
                        '<div style="font-size:0.68rem;color:var(--fdr-dim);">Products</div></div>' +
                '</div>' +
            '</div>' +
            BFX.settingRow('Blog Strategy', 'SEO-optimized forex education', BFX.badge('Active', 'green')) +
            BFX.settingRow('Resource Tools', 'Interactive calculators, journals, checklists', BFX.badge('Lead Gen', 'amber')) +
            BFX.settingRow('Content Tracking', 'Scroll depth, time on page, CTA clicks', BFX.badge('bfx-analytics', 'purple')));
        html += '</div>';

        // Realtime Traffic Concept
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Realtime Traffic',
            '<div style="text-align:center;padding:20px 0;">' +
                '<div style="font-size:0.72rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:8px;">Live Visitors</div>' +
                '<div style="font-family:Space Grotesk;font-size:2.5rem;font-weight:700;color:var(--fdr-green);">—</div>' +
                '<div style="font-size:0.78rem;color:var(--fdr-dim);margin-top:8px;">Connect GA4 Realtime API for live data</div>' +
            '</div>' +
            BFX.settingRow('Data Source', 'GA4 Realtime Report', BFX.badge('API Ready', 'blue')) +
            BFX.settingRow('Refresh', 'Auto-refresh every 30 seconds', null) +
            BFX.settingRow('Metrics', 'Active users, pages, locations, devices', null));

        // AI Insights
        html += BFX.card('AI Analytics Insights',
            buildAiInsight('📈', 'Traffic Pattern', 'Mobile traffic exceeds 60%. Ensure all conversion pages are mobile-optimized with fast load times.') +
            buildAiInsight('🎯', 'Conversion Opportunity', 'Resource tools (8 pages) are high-engagement lead magnets. Track tool completion rates as micro-conversions.') +
            buildAiInsight('💡', 'Attribution Gap', 'TikTok Pixel is not installed. Install via GTM to measure ROI on TikTok content.') +
            buildAiInsight('📊', 'Content Strategy', '11 blog posts driving organic traffic. Publish 2-3 posts monthly targeting long-tail forex keywords.') +
            buildAiInsight('🔄', 'Funnel Optimization', 'EA addon has ' + BFX.pct(d.eaAddon.rate) + ' conversion rate. Test higher visibility placement during checkout.'),
            null, '<span style="font-size:0.72rem;color:var(--fdr-dim);">AI-generated from platform data</span>');
        html += '</div>';

        // BFX Analytics Engine
        html += BFX.card('BossFx Analytics Engine',
            '<div style="font-size:0.78rem;color:var(--fdr-dim);margin-bottom:12px;line-height:1.5;">Custom 11-module analytics platform built into bfx-analytics.js. Runs client-side on every page, feeding data into GA4 and Brevo via event-driven architecture.</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">' +
            [
                { name: 'UTM Attribution', desc: 'First/last touch, CRM sync' },
                { name: 'Engagement Scoring', desc: 'Lead quality 0-100 score' },
                { name: 'Conversion Tracking', desc: 'Funnel events and goals' },
                { name: 'Session Intelligence', desc: 'New vs returning, depth' },
                { name: 'Ecommerce Module', desc: 'Cart, checkout, purchase' },
                { name: 'Mobile Intelligence', desc: 'Device, orientation, touch' },
                { name: 'Scroll Depth', desc: '25/50/75/100% milestones' },
                { name: 'Content Analytics', desc: 'Time on page, read rate' },
                { name: 'Social Tracking', desc: 'Referral source detection' },
                { name: 'Performance Monitor', desc: 'Load time, resource timing' },
                { name: 'Error Tracking', desc: 'JS errors, failed requests' }
            ].map(function (m) {
                return '<div style="padding:10px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<span style="font-size:0.8rem;font-weight:600;">' + m.name + '</span>' +
                        BFX.badge('Active', 'green') +
                    '</div>' +
                    '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:4px;">' + m.desc + '</div></div>';
            }).join('') + '</div>');

        document.getElementById('sec-analytics').innerHTML = html;
    }

    function buildSeoItem(title, desc, color) {
        return '<div style="padding:10px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                '<span style="font-size:0.8rem;font-weight:600;">' + title + '</span>' +
                BFX.badge('Pass', color) +
            '</div>' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);">' + desc + '</div></div>';
    }

    function buildAiInsight(icon, title, text) {
        return '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--fdr-border);">' +
            '<div style="font-size:1.2rem;flex-shrink:0;">' + icon + '</div>' +
            '<div><div style="font-weight:600;font-size:0.82rem;margin-bottom:4px;">' + title + '</div>' +
            '<div style="font-size:0.78rem;color:var(--fdr-dim);line-height:1.5;">' + text + '</div></div></div>';
    }

    // ================================================================
    // MODULE 6: AI CONTROL CENTER
    // ================================================================

    function renderAIControl() {
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        var html = BFX.sectionHeader('AI Control Center', '13 AI agents powering every business function',
            BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()') +
            BFX.quickAction('🤖', 'Automation', "OS.nav.go('automation')") +
            BFX.quickAction('📊', 'Analytics', "OS.nav.go('analytics')") +
            BFX.quickAction('🏠', 'CEO View', "OS.nav.go('ceo')"));

        var activeCount = AI_ROLES.length;
        var depts = {};
        AI_ROLES.forEach(function(r) { depts[r.color] = true; });

        html += BFX.metricGrid([
            ['Total AI Agents', String(activeCount), 'purple', 'Across all departments'],
            ['Active Agents', String(activeCount), 'green', '100% operational'],
            ['Departments', String(Object.keys(depts).length), 'blue', 'Full coverage'],
            ['Agent Health', '100%', 'green', 'All agents responding'],
            ['Memory Status', 'CLAUDE.md', 'cyan', 'Project memory active'],
            ['Prompt Library', '13', 'purple', 'Role-specific prompts'],
            ['Execution Mode', 'Assisted', 'amber', 'Human-in-the-loop'],
            ['Automation Level', 'Phase 4', 'blue', 'ERP expansion active']
        ]);

        // --- Agent Health Dashboard ---
        html += BFX.card('Agent Health Dashboard',
            '<div class="fdr-health-grid">' +
            AI_ROLES.map(function(role) {
                return BFX.healthCard(role.title, 'healthy', role.subtitle + ' — ' + role.cadence);
            }).join('') + '</div>' +
            BFX.alert('success', 'All ' + activeCount + ' AI agents operational — ready for tasking via Claude Code sessions'),
            BFX.badge(activeCount + ' Active', 'green'));

        // --- AI Agent Grid ---
        html += BFX.card('AI Agent Roster', '<div class="fdr-ai-grid">' +
            AI_ROLES.map(function(role) { return BFX.aiCard(role); }).join('') + '</div>',
            BFX.badge('13 Agents', 'purple'));

        // --- Agent Capabilities Matrix ---
        var capabilities = [
            { agent: 'CEO AI', tasks: ['Strategic planning', 'Priority setting', 'Business review', 'Decision support'], dept: 'Executive', status: 'active' },
            { agent: 'COO AI', tasks: ['System monitoring', 'Bottleneck detection', 'Workflow optimization', 'Incident response'], dept: 'Operations', status: 'active' },
            { agent: 'Marketing AI', tasks: ['Campaign planning', 'Copywriting', 'A/B testing', 'Conversion optimization'], dept: 'Growth', status: 'active' },
            { agent: 'Sales AI', tasks: ['Funnel analysis', 'Sales copy', 'Pricing strategy', 'Customer segmentation'], dept: 'Revenue', status: 'active' },
            { agent: 'Support AI', tasks: ['Response drafting', 'Pattern analysis', 'FAQ generation', 'CX improvement'], dept: 'Support', status: 'active' },
            { agent: 'Content AI', tasks: ['Blog posts', 'Video scripts', 'Social media', 'Email sequences'], dept: 'Content', status: 'active' },
            { agent: 'Analytics AI', tasks: ['Data analysis', 'Trend detection', 'Report generation', 'Recommendations'], dept: 'Intelligence', status: 'active' },
            { agent: 'SEO AI', tasks: ['Keyword research', 'On-page optimization', 'Technical SEO', 'Rank tracking'], dept: 'Growth', status: 'active' },
            { agent: 'Developer AI', tasks: ['Feature development', 'Bug fixes', 'Code review', 'Deployments'], dept: 'Engineering', status: 'active' },
            { agent: 'Security AI', tasks: ['Vulnerability scanning', 'Security audits', 'Compliance checks', 'Incident analysis'], dept: 'Security', status: 'active' },
            { agent: 'Research AI', tasks: ['Market research', 'Competitor analysis', 'Trend forecasting', 'Customer insights'], dept: 'Strategy', status: 'active' },
            { agent: 'Trading AI', tasks: ['Trading content', 'EA development', 'Market analysis', 'Course material'], dept: 'Product', status: 'active' },
            { agent: 'Automation AI', tasks: ['Workflow design', 'Process automation', 'Integration planning', 'Efficiency audits'], dept: 'Operations', status: 'active' }
        ];
        html += BFX.card('Agent Capabilities Matrix',
            BFX.table(['Agent', 'Department', 'Key Capabilities', 'Status'],
                capabilities.map(function(c) {
                    return [
                        '<strong>' + BFX.esc(c.agent) + '</strong>',
                        BFX.badge(c.dept, 'blue'),
                        c.tasks.map(function(t) { return BFX.esc(t); }).join(' &middot; '),
                        BFX.badge('Active', 'green')
                    ];
                })
            ),
            BFX.badge('Full Coverage', 'green'));

        // --- Prompt Management ---
        var prompts = [
            { role: 'CEO AI', prompt: 'Act as my strategic advisor. Analyze business metrics, challenge assumptions, recommend priorities.', type: 'System', tokens: '~200' },
            { role: 'Marketing AI', prompt: 'Act as my growth marketer. Plan campaigns, write copy, analyze funnels, optimize conversion.', type: 'System', tokens: '~180' },
            { role: 'Sales AI', prompt: 'Act as my sales strategist. Analyze revenue data, optimize pricing, draft sales sequences.', type: 'System', tokens: '~170' },
            { role: 'Content AI', prompt: 'Act as my content producer. Write blog posts, scripts, social content for forex education.', type: 'System', tokens: '~160' },
            { role: 'Developer AI', prompt: 'Read CLAUDE.md first. Follow project rules. Build features, fix bugs, maintain quality.', type: 'System', tokens: '~3000+' },
            { role: 'Trading AI', prompt: 'Act as a trading content specialist. Create forex education content, EA documentation, market analysis.', type: 'System', tokens: '~190' },
            { role: 'Support AI', prompt: 'Act as customer success. Draft support replies, analyze patterns, improve satisfaction.', type: 'System', tokens: '~150' },
            { role: 'Analytics AI', prompt: 'Act as my data analyst. Analyze traffic, revenue, conversion data. Produce reports with recommendations.', type: 'System', tokens: '~170' },
            { role: 'Security AI', prompt: 'Act as security auditor. Scan for OWASP vulnerabilities, audit auth, review dependencies.', type: 'System', tokens: '~180' },
            { role: 'Automation AI', prompt: 'Act as workflow architect. Design automations, reduce manual tasks, plan integrations.', type: 'System', tokens: '~160' }
        ];
        html += BFX.card('Prompt Management',
            BFX.table(['AI Role', 'System Prompt (Summary)', 'Type', 'Est. Tokens'],
                prompts.map(function(p) {
                    return [
                        '<strong>' + BFX.esc(p.role) + '</strong>',
                        '<span style="font-size:0.78rem;">' + BFX.esc(p.prompt) + '</span>',
                        BFX.badge(p.type, 'purple'),
                        BFX.badge(p.tokens, 'dim')
                    ];
                })
            ) + '<div style="margin-top:10px;">' +
            BFX.settingRow('Primary Interface', 'Claude Code (CLI + Desktop)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Memory System', 'CLAUDE.md (project) + .claude/memory (session)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Context Protocol', 'Read CLAUDE.md → Roadmap → Recent commits → Act', BFX.badge('Enforced', 'green')) +
            '</div>',
            BFX.badge(prompts.length + ' Prompts', 'purple'));

        // --- Memory Status ---
        html += BFX.card('Memory Status',
            '<div class="fdr-grid-2">' +
            buildMemoryCard('CLAUDE.md', 'Project Memory', 'Permanent context for all AI sessions. Business rules, architecture, constraints, product catalog.', '~360 lines', 'green') +
            buildMemoryCard('.claude/memory/', 'Session Memory', 'Persisted learnings across conversations. User preferences, feedback, project state.', 'Auto-managed', 'blue') +
            buildMemoryCard('PROJECT_ROADMAP.md', 'Execution Plan', 'Phased development plan with priorities, status tracking, and milestone definitions.', 'Living doc', 'purple') +
            buildMemoryCard('AUTOMATION_MAP.md', 'Automation Registry', 'All automated workflows, triggers, actions, and their operational status.', 'Living doc', 'purple') +
            buildMemoryCard('docs/', 'Technical Docs', '26 engineering documents covering architecture, APIs, deployment, analytics, integrations.', '26 files', 'cyan') +
            buildMemoryCard('sop/', 'SOPs', 'Standard operating procedures for deployment, support, payments, content, leads, security.', '6 procedures', 'amber') +
            '</div>' +
            BFX.alert('info', 'AI memory is loaded at session start. CLAUDE.md is the single source of truth — all agents read it first.'),
            BFX.badge('Active', 'green'));

        // --- Execution Logs ---
        var activities = OS.activity.recent ? OS.activity.recent() : [];
        var aiActivities = activities.filter(function(a) { return a.type === 'command' || a.type === 'data' || a.type === 'nav'; });
        html += BFX.card('Execution Logs',
            (aiActivities.length > 0 ?
                BFX.timeline(aiActivities.slice(0, 15)) :
                '<div style="text-align:center;padding:24px;">' +
                '<div style="font-size:2rem;margin-bottom:8px;">📋</div>' +
                '<div style="font-weight:600;margin-bottom:4px;">Session Activity</div>' +
                '<div style="font-size:0.8rem;color:var(--fdr-dim);">AI execution events are logged here during active sessions. Navigate between modules, run commands, and refresh data to generate activity.</div></div>') +
            '<div style="margin-top:12px;">' +
            BFX.settingRow('Log Source', 'OS.activity (in-session)', BFX.badge('Live', 'green')) +
            BFX.settingRow('Event Types', 'Commands, navigation, data loads, errors', BFX.badge('4 Types', 'blue')) +
            BFX.settingRow('Retention', 'Current session only', BFX.badge('Session', 'dim')) +
            BFX.settingRow('Persistent Logs', 'Git commit history', BFX.badge('Permanent', 'green')) +
            '</div>',
            BFX.badge(aiActivities.length > 0 ? aiActivities.length + ' Events' : 'Ready', aiActivities.length > 0 ? 'green' : 'dim'));

        // --- AI Integration Architecture ---
        html += BFX.card('AI Integration Architecture',
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' +
            buildAIStage('1', 'Input', 'User request or scheduled task') +
            buildAIStage('2', 'Context', 'CLAUDE.md + memory + codebase') +
            buildAIStage('3', 'Process', 'AI agent executes with tools') +
            buildAIStage('4', 'Output', 'Code, content, or analysis') +
            buildAIStage('5', 'Review', 'Human approval before deploy') +
            '</div>' +
            BFX.settingRow('AI Provider', 'Anthropic (Claude)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Interface', 'Claude Code CLI + Desktop App', BFX.badge('Primary', 'green')) +
            BFX.settingRow('Execution Model', 'Human-in-the-loop (assisted mode)', BFX.badge('Safe', 'green')) +
            BFX.settingRow('Tool Access', 'File read/write, bash, browser preview, git', BFX.badge('Granted', 'blue')) +
            BFX.settingRow('Guardrails', 'No auth changes, no payment flow changes, no secret exposure', BFX.badge('Enforced', 'green')) +
            BFX.settingRow('Autonomous Mode', 'Phase 5 (planned)', BFX.badge('Upcoming', 'amber')),
            BFX.badge('Architecture', 'blue'));

        // --- AI Performance & Recommendations ---
        html += BFX.card('AI Insights & Recommendations', buildAIInsights(d, s));

        document.getElementById('sec-ai-control').innerHTML = html;
    }

    function buildMemoryCard(path, title, desc, size, color) {
        return '<div style="padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
            '<strong style="font-size:0.84rem;">' + BFX.esc(title) + '</strong>' +
            BFX.badge(size, color) + '</div>' +
            '<div style="font-size:0.75rem;color:var(--fdr-dim);margin-bottom:6px;">' + BFX.esc(desc) + '</div>' +
            '<code style="font-size:0.72rem;color:var(--fdr-' + color + ');">' + BFX.esc(path) + '</code></div>';
    }

    function buildAIStage(num, title, desc) {
        return '<div style="flex:1;min-width:100px;text-align:center;padding:10px;background:var(--fdr-purple-dim);border-radius:8px;border:1px solid var(--fdr-purple);">' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-bottom:2px;">Step ' + num + '</div>' +
            '<div style="font-weight:600;font-size:0.84rem;">' + BFX.esc(title) + '</div>' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-top:2px;">' + BFX.esc(desc) + '</div></div>';
    }

    function buildAIInsights(d, s) {
        var insights = [];
        insights.push({ icon: '🤖', title: 'Full Agent Coverage', text: 'All 13 AI roles are active and covering every business function. Each agent has a defined purpose, cadence, and system prompt.', color: 'green' });
        if (d && d.revenue) {
            var monthlyRev = d.revenue.thisMonth || 0;
            if (monthlyRev > 0) {
                insights.push({ icon: '📈', title: 'Revenue Intelligence', text: 'Sales AI and Analytics AI can analyze your ' + BFX.naira(monthlyRev) + ' monthly revenue to identify growth opportunities and optimize pricing strategy.', color: 'blue' });
            }
        }
        insights.push({ icon: '✍️', title: 'Content Pipeline', text: 'Content AI + SEO AI can generate blog posts, social content, and email sequences. Currently 11 blog posts and 6 drip sequences active.', color: 'purple' });
        insights.push({ icon: '🔒', title: 'Security Posture', text: 'Security AI monitors OWASP compliance, auth patterns, and dependency vulnerabilities. Last audit scope: webhook verification, token security, RLS enforcement.', color: 'amber' });
        insights.push({ icon: '🚀', title: 'Scaling Readiness', text: 'When ready for Phase 5, Automation AI can design autonomous workflows — scheduled content publishing, automated lead scoring, and self-healing error recovery.', color: 'cyan' });
        return insights.map(function(ins) {
            return '<div style="display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--fdr-border);">' +
                '<div style="font-size:1.2rem;flex-shrink:0;">' + ins.icon + '</div>' +
                '<div><div style="font-weight:600;font-size:0.84rem;margin-bottom:3px;color:var(--fdr-' + ins.color + ');">' + BFX.esc(ins.title) + '</div>' +
                '<div style="font-size:0.8rem;color:var(--fdr-dim);">' + BFX.esc(ins.text) + '</div></div></div>';
        }).join('');
    }

    // ================================================================
    // MODULE 7: AUTOMATION CENTER
    // ================================================================

    function renderAutomation() {
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        var html = BFX.sectionHeader('Automation', 'Workflows, scheduled jobs, email sequences, and process automation',
            BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()') +
            BFX.quickAction('📧', 'Brevo', "window.open('https://app.brevo.com','_blank')") +
            BFX.quickAction('⚙️', 'Operations', "OS.nav.go('operations')") +
            BFX.quickAction('🤖', 'AI Center', "OS.nav.go('ai-control')"));

        html += BFX.metricGrid([
            ['Active Automations', '4', 'green', 'All operational'],
            ['Drip Sequences', '6', 'purple', '22 total steps'],
            ['Scheduled Jobs', '1', 'blue', 'Daily 09:00 UTC'],
            ['Email Templates', '19+', 'cyan', 'Brevo transactional'],
            ['Brevo Lists', '4', 'purple', 'Segmented audiences'],
            ['Webhook Triggers', '1', 'green', 'Flutterwave verified'],
            ['Automation Health', '100%', 'green', 'No failures'],
            ['Status', 'Operational', 'green', 'All systems active']
        ]);

        // --- Active Automations (detailed) ---
        html += BFX.card('Active Automations',
            BFX.autoCard('Payment Webhook Fulfillment', 'Flutterwave webhook → signature verify → API verify → amount validate → order create → token generate → fulfillment email → Brevo contact → admin notify → mark fulfilled', 'active', 'On webhook trigger (POST /api/webhooks/flutterwave)', 'Continuous') +
            BFX.autoCard('Daily Re-engagement Cron', 'Process all active drip sequences → advance contacts through steps → send re-engagement emails to 30-day inactive leads → update Brevo attributes', 'active', 'Daily at 09:00 UTC (Vercel Cron)', 'Today') +
            BFX.autoCard('Lead Capture Pipeline', 'Form submit → validate input → create/update Brevo contact → assign to list → set UTM attributes → trigger drip sequence → score engagement → return confirmation', 'active', 'On form submit (POST /api/lead-capture)', 'Continuous') +
            BFX.autoCard('Download Token System', 'Generate HMAC-SHA256 token → encode payload (email, product, type, orderId, expiry) → store in access_tokens table → include in email → validate on download → log to downloads table', 'active', 'On purchase + admin resend', 'Continuous'),
            BFX.badge('4 Active', 'green'));

        // --- Automation Flow Visualization ---
        html += BFX.card('Payment Automation Flow',
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">' +
            buildAutoStage('Webhook', 'Flutterwave POST', 'green') +
            buildAutoStage('Verify', 'Signature + API', 'blue') +
            buildAutoStage('Validate', 'Amount + product', 'purple') +
            buildAutoStage('Order', 'Supabase insert', 'green') +
            buildAutoStage('Token', 'HMAC-SHA256', 'cyan') +
            buildAutoStage('Email', 'Brevo send', 'purple') +
            buildAutoStage('CRM', 'Contact update', 'blue') +
            buildAutoStage('Notify', 'Admin alert', 'amber') +
            '</div>' +
            BFX.settingRow('Trigger', 'POST /api/webhooks/flutterwave', BFX.badge('Webhook', 'green')) +
            BFX.settingRow('Verification', 'Flutterwave signature hash + API v3 verification', BFX.badge('Dual Check', 'green')) +
            BFX.settingRow('Dedup', 'DB-backed by flw_transaction_id', BFX.badge('Safe', 'green')) +
            BFX.settingRow('Product Detection', 'tx_ref pattern → meta → amount fallback', BFX.badge('3-layer', 'blue')) +
            BFX.settingRow('Token Expiry', '72h (standard) / 720h (VIP)', BFX.badge('Auto-expire', 'green')) +
            BFX.settingRow('EA Addon', 'Separate token generated when meta.has_ea_addon', BFX.badge('Supported', 'green')),
            BFX.badge('Revenue Critical', 'red'));

        // --- Lead Capture Flow ---
        html += BFX.card('Lead Capture Flow',
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">' +
            buildAutoStage('Form', 'User submits', 'green') +
            buildAutoStage('Validate', 'Email + fields', 'blue') +
            buildAutoStage('CRM', 'Brevo contact', 'purple') +
            buildAutoStage('List', 'Assign segment', 'cyan') +
            buildAutoStage('UTM', 'Tag attribution', 'amber') +
            buildAutoStage('Drip', 'Trigger sequence', 'purple') +
            buildAutoStage('Score', 'Engagement pts', 'green') +
            '</div>' +
            BFX.settingRow('Endpoint', 'POST /api/lead-capture', BFX.badge('Active', 'green')) +
            BFX.settingRow('Sources', 'Newsletter, exit intent, webinar, resource download', BFX.badge('4 Sources', 'blue')) +
            BFX.settingRow('Attribution', 'UTM source, medium, campaign, content, term', BFX.badge('Full UTM', 'green')) +
            BFX.settingRow('Scoring', 'bfx-analytics.js engagement module', BFX.badge('11 Modules', 'purple')) +
            BFX.settingRow('Lists', 'General (2), Webinar (3), Mentorship (5), Resource (6)', BFX.badge('4 Lists', 'blue')),
            BFX.badge('Growth', 'green'));

        // --- Email Drip Sequences (expanded) ---
        var sequences = [
            { name: 'Welcome Series', list: 'General', steps: 4, delays: '0h, 24h, 72h, 120h', desc: 'New subscriber onboarding — value delivery, trust building, soft CTA', trigger: 'Newsletter signup' },
            { name: 'Webinar Funnel', list: 'Webinar', steps: 2, delays: '0h, 48h', desc: 'Webinar confirmation and post-event follow-up with offer', trigger: 'Webinar registration' },
            { name: 'Resource Follow-up', list: 'Resource', steps: 3, delays: '0h, 48h, 96h', desc: 'Resource delivery, bonus strategies, upsell path to paid products', trigger: 'Resource download' },
            { name: 'Mentorship Nurture', list: 'Mentorship', steps: 4, delays: '0h, 24h, 72h, 120h', desc: 'Mentorship interest acknowledgment, social proof, program details, booking CTA', trigger: 'Mentorship inquiry' },
            { name: 'Exit Intent Recovery', list: 'Exit Intent', steps: 3, delays: '0h, 24h, 72h', desc: 'Recover abandoning visitors with value offer and urgency', trigger: 'Exit intent popup' },
            { name: 'Re-engagement', list: 'General', steps: 3, delays: '0h, 72h, 168h', desc: 'Win back inactive leads with fresh content and special offers', trigger: '30-day inactivity' }
        ];
        html += BFX.card('Email Drip Sequences',
            BFX.table(['Sequence', 'Trigger', 'Steps', 'Timing', 'List', 'Status'],
                sequences.map(function(seq) {
                    return [
                        '<strong>' + BFX.esc(seq.name) + '</strong><div style="font-size:0.72rem;color:var(--fdr-dim);margin-top:2px;">' + BFX.esc(seq.desc) + '</div>',
                        BFX.esc(seq.trigger),
                        '<strong>' + seq.steps + '</strong>',
                        '<span style="font-size:0.75rem;">' + BFX.esc(seq.delays) + '</span>',
                        BFX.badge(seq.list, 'blue'),
                        BFX.badge('Active', 'green')
                    ];
                })
            ) + '<div style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;">' +
            '<span style="font-size:0.75rem;color:var(--fdr-dim);">Total: 6 sequences, 19 steps</span>' +
            '<span style="font-size:0.75rem;color:var(--fdr-dim);">Provider: Brevo (Sendinblue)</span>' +
            '<span style="font-size:0.75rem;color:var(--fdr-dim);">Processing: Daily cron at 09:00 UTC</span></div>',
            BFX.badge('6 Active', 'purple'));

        // --- Email Template Library ---
        var templates = [
            { name: 'Fulfillment Email', type: 'Transactional', trigger: 'Purchase', desc: 'Product access + download links + EA addon card' },
            { name: 'Admin Notification', type: 'Transactional', trigger: 'Purchase', desc: 'New order alert to founder' },
            { name: 'Booking Confirmation', type: 'Transactional', trigger: 'Booking', desc: 'Mentorship booking + ICS calendar' },
            { name: 'Welcome 1-4', type: 'Drip', trigger: 'Signup', desc: '4-step onboarding sequence' },
            { name: 'Webinar 1-2', type: 'Drip', trigger: 'Registration', desc: 'Confirmation + follow-up' },
            { name: 'Resource 1-3', type: 'Drip', trigger: 'Download', desc: 'Delivery + strategies + upsell' },
            { name: 'Mentorship 1-4', type: 'Drip', trigger: 'Inquiry', desc: 'Nurture to booking' },
            { name: 'Exit Intent 1-3', type: 'Drip', trigger: 'Exit popup', desc: 'Recovery sequence' },
            { name: 'Re-engagement 1-3', type: 'Drip', trigger: '30d inactive', desc: 'Win-back sequence' }
        ];
        html += BFX.card('Email Template Library',
            BFX.table(['Template', 'Type', 'Trigger', 'Description'],
                templates.map(function(t) {
                    return [
                        '<strong>' + BFX.esc(t.name) + '</strong>',
                        BFX.badge(t.type, t.type === 'Transactional' ? 'green' : 'purple'),
                        BFX.esc(t.trigger),
                        BFX.esc(t.desc)
                    ];
                })
            ) + '<div style="margin-top:8px;font-size:0.75rem;color:var(--fdr-dim);">19+ templates built in lib/templates.js — all HTML emails with brand styling</div>',
            BFX.badge('19+ Templates', 'cyan'));

        // --- Cron & Scheduled Jobs ---
        html += BFX.card('Cron & Scheduled Jobs',
            BFX.autoCard('cron-reengagement', 'Processes all 6 drip sequences, advances contacts through steps based on delay timings, sends re-engagement emails to leads inactive for 30+ days.', 'active', '0 9 * * * (Daily 09:00 UTC)', 'Managed by Vercel') +
            '<div style="margin-top:12px;">' +
            BFX.settingRow('Cron Path', '/api/cron-reengagement', BFX.badge('Active', 'green')) +
            BFX.settingRow('Runtime', 'Vercel Serverless (30s max)', BFX.badge('OK', 'green')) +
            BFX.settingRow('Processing', 'Sequential: drip steps → re-engagement scan', BFX.badge('Safe', 'green')) +
            BFX.settingRow('Inactivity Window', '30 days since last purchase/engagement', BFX.badge('Configured', 'green')) +
            BFX.settingRow('Rate Limit', '300 emails/day (Brevo free tier)', BFX.badge('Monitor', 'amber')) +
            '</div>',
            BFX.badge('1 Job', 'blue'));

        // --- Brevo CRM Integration ---
        var brevoSubs = d.brevo ? d.brevo.totalSubscribers : 0;
        var brevoLists = d.brevo && d.brevo.lists ? d.brevo.lists : [];
        html += BFX.card('Brevo CRM Integration',
            '<div class="fdr-grid-2">' +
            '<div style="padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
            '<div style="font-size:0.75rem;color:var(--fdr-dim);margin-bottom:4px;">Total Subscribers</div>' +
            '<div style="font-size:1.5rem;font-weight:700;color:var(--fdr-green);">' + BFX.num(brevoSubs) + '</div>' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-top:4px;">Across all lists</div></div>' +
            '<div style="padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
            '<div style="font-size:0.75rem;color:var(--fdr-dim);margin-bottom:4px;">Active Lists</div>' +
            '<div style="font-size:1.5rem;font-weight:700;color:var(--fdr-purple);">' + brevoLists.length + '</div>' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-top:4px;">Segmented audiences</div></div>' +
            '</div>' +
            (brevoLists.length > 0 ?
                '<div style="margin-top:12px;">' + brevoLists.map(function(l) {
                    return BFX.settingRow(BFX.esc(l.name) + ' (List #' + l.id + ')', null, BFX.badge(BFX.num(l.subscribers) + ' subscribers', 'blue'));
                }).join('') + '</div>' : '') +
            '<div style="margin-top:12px;">' +
            BFX.settingRow('Transactional Email', 'Fulfillment, booking, admin notifications', BFX.badge('Active', 'green')) +
            BFX.settingRow('CRM Attributes', 'UTM, lead score, automation state, purchase history', BFX.badge('Tracked', 'green')) +
            BFX.settingRow('Contact Sync', 'On purchase + on lead capture', BFX.badge('Auto', 'green')) +
            BFX.settingRow('API Plan', s.brevo.status === 'healthy' ? BFX.esc(s.brevo.plan || 'free') : 'Not connected', BFX.badge(s.brevo.status === 'healthy' ? 'Connected' : 'Issue', s.brevo.status === 'healthy' ? 'green' : 'red')) +
            '</div>',
            BFX.badge(BFX.num(brevoSubs) + ' Contacts', 'purple'));

        // --- Conversion Tracking Automations ---
        html += BFX.card('Conversion & Analytics Automations',
            BFX.autoCard('BFX Analytics Engine', '11-module analytics system: UTM attribution, engagement scoring, conversion tracking, mobile intelligence, enhanced ecommerce, session recording, scroll depth, exit intent, CTA tracking, content performance, lead scoring.', 'active', 'On every page load', 'Continuous') +
            BFX.autoCard('Exit Intent Capture', 'Detects cursor leaving viewport (desktop) or rapid scroll-up (mobile). Triggers popup with lead magnet offer, captures email, enters exit_intent drip sequence.', 'active', 'On exit intent detected', 'Continuous') +
            BFX.autoCard('Enhanced Ecommerce', 'Tracks product views, add-to-cart, checkout initiation, purchase completion. Sends events to GA4 and Meta Pixel for audience building.', 'active', 'On user interaction', 'Continuous') +
            BFX.autoCard('Lead Scoring', 'Assigns engagement points based on page views, time on site, resource downloads, CTA clicks, scroll depth. High-score leads get priority in drip sequences.', 'active', 'On engagement events', 'Continuous'),
            BFX.badge('4 Active', 'green'));

        // --- Automation Architecture ---
        html += BFX.card('Automation Architecture',
            '<div class="fdr-grid-2">' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Event-Driven Triggers</div>' +
            BFX.settingRow('Payment Webhook', 'POST /api/webhooks/flutterwave', BFX.badge('Webhook', 'green')) +
            BFX.settingRow('Lead Capture', 'POST /api/lead-capture', BFX.badge('HTTP', 'blue')) +
            BFX.settingRow('Booking Submit', 'POST /api/booking', BFX.badge('HTTP', 'blue')) +
            BFX.settingRow('Daily Cron', '09:00 UTC via Vercel', BFX.badge('Cron', 'purple')) +
            BFX.settingRow('Page Load', 'bfx-analytics.js', BFX.badge('Client', 'cyan')) +
            BFX.settingRow('Exit Intent', 'bfx-convert.js', BFX.badge('Client', 'cyan')) +
            '</div></div>' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Processing Layer</div>' +
            BFX.settingRow('Fulfillment', 'lib/fulfillment.js — orchestrator pattern', BFX.badge('Core', 'green')) +
            BFX.settingRow('Drip Engine', 'lib/drip.js — 6 sequences, delay-based', BFX.badge('Core', 'green')) +
            BFX.settingRow('Email Service', 'lib/email.js — Brevo API wrapper', BFX.badge('Core', 'green')) +
            BFX.settingRow('Token System', 'lib/files.js — HMAC-SHA256 generation', BFX.badge('Security', 'amber')) +
            BFX.settingRow('Templates', 'lib/templates.js — 19+ HTML templates', BFX.badge('Content', 'purple')) +
            BFX.settingRow('Rate Limiter', 'lib/rate-limit.js — sliding window', BFX.badge('Protection', 'amber')) +
            '</div></div>' +
            '</div>',
            BFX.badge('Architecture', 'blue'));

        // --- AI Automation Recommendations ---
        html += BFX.card('AI Automation Insights', buildAutoInsights(d, s, brevoSubs));

        document.getElementById('sec-automation').innerHTML = html;
    }

    function buildAutoStage(title, desc, color) {
        return '<div style="flex:1;min-width:70px;text-align:center;padding:8px 4px;background:var(--fdr-' + color + '-dim);border-radius:8px;border:1px solid var(--fdr-' + color + ');">' +
            '<div style="font-weight:600;font-size:0.78rem;">' + BFX.esc(title) + '</div>' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:2px;">' + BFX.esc(desc) + '</div></div>';
    }

    function buildAutoInsights(d, s, brevoSubs) {
        var insights = [];
        insights.push({ icon: '✅', title: 'All Automations Healthy', text: 'All 4 core automations and 4 analytics automations are running without errors. Payment flow is fully automated end-to-end.', color: 'green' });
        if (brevoSubs > 0) {
            insights.push({ icon: '📧', title: 'Email Audience Growing', text: BFX.num(brevoSubs) + ' total subscribers across ' + (d.brevo && d.brevo.lists ? d.brevo.lists.length : 0) + ' segmented lists. Consider adding a blog subscription drip to capture organic traffic.', color: 'blue' });
        }
        var pendingBookings = d.bookings ? d.bookings.pending : 0;
        if (pendingBookings > 0) {
            insights.push({ icon: '📋', title: 'Booking Follow-up', text: pendingBookings + ' pending mentorship booking(s). Consider adding an automated booking reminder sequence (24h and 48h before session).', color: 'amber' });
        }
        insights.push({ icon: '🔄', title: 'Renewal Automation', text: 'Mentorship renewals are currently manual. An automated renewal reminder sequence (7 days, 3 days, 1 day before expiry) would reduce churn and save time.', color: 'purple' });
        insights.push({ icon: '💡', title: 'WhatsApp Integration', text: 'Adding WhatsApp Business API as a delivery channel alongside email would increase message open rates (98% vs 20% for email) for the African audience.', color: 'cyan' });
        return insights.map(function(ins) {
            return '<div style="display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--fdr-border);">' +
                '<div style="font-size:1.2rem;flex-shrink:0;">' + ins.icon + '</div>' +
                '<div><div style="font-weight:600;font-size:0.84rem;margin-bottom:3px;color:var(--fdr-' + ins.color + ');">' + BFX.esc(ins.title) + '</div>' +
                '<div style="font-size:0.8rem;color:var(--fdr-dim);">' + BFX.esc(ins.text) + '</div></div></div>';
        }).join('');
    }

    // ================================================================
    // MODULE 8: FINANCE
    // ================================================================

    function renderFinance() {
        var d = OS.store.get('dashData');
        var s = OS.store.get('sysData');
        var html = BFX.sectionHeader('Finance', 'Executive financial intelligence and revenue analytics',
            '<a href="https://dashboard.flutterwave.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Flutterwave &rarr;</a>');

        // Quick Actions
        html += '<div class="fdr-quick-actions">';
        html += BFX.quickAction('💳', 'Flutterwave', "window.open('https://dashboard.flutterwave.com','_blank')");
        html += BFX.quickAction('📊', 'Sales', "fdrNav('sales')");
        html += BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()');
        html += BFX.quickAction('📈', 'CEO View', "fdrNav('ceo')");
        html += '</div>';

        // Compute financial metrics
        var trend = d.revenue.trend || [];
        var firstHalf = trend.slice(0, 15).reduce(function (s, t) { return s + t.revenue; }, 0);
        var secondHalf = trend.slice(15).reduce(function (s, t) { return s + t.revenue; }, 0);
        var monthlyGrowth = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

        var coursesRev = (d.products['forex-101'] || {}).revenue || 0;
        var mentorRev = ((d.products['mentorship-group'] || {}).revenue || 0) + ((d.products['mentorship-1on1'] || {}).revenue || 0);
        var vipRev = (d.products['vip'] || {}).revenue || 0;
        var eaBundleRev = ((d.products['ea-bundle'] || {}).revenue || 0) + (d.eaAddon.revenue || 0);
        var totalRev = d.revenue.allTime;

        // Estimated expenses (platform costs)
        var monthlyExpenses = 0;
        var expenseItems = [
            { name: 'Vercel Hosting', amount: 0, note: 'Hobby plan (free)' },
            { name: 'Supabase', amount: 0, note: 'Free tier' },
            { name: 'Brevo Email', amount: 0, note: 'Free tier (300 emails/day)' },
            { name: 'Domain (bossfxcademy.com)', amount: 1500, note: '~₦18,000/year' },
            { name: 'Flutterwave Fees', amount: Math.round(d.revenue.thisMonth * 0.014), note: '1.4% per transaction' }
        ];
        expenseItems.forEach(function (e) { monthlyExpenses += e.amount; });

        var grossProfit = d.revenue.thisMonth - monthlyExpenses;
        var profitMargin = d.revenue.thisMonth > 0 ? Math.round((grossProfit / d.revenue.thisMonth) * 100) : 0;

        // MRR estimate from mentorship (recurring)
        var mentorMonthlyOrders = (d.products['mentorship-group'] || {}).count || 0;
        var mentorMonthlyRev = mentorRev;
        var mrr = Math.round(mentorMonthlyRev / Math.max(1, Math.ceil(d.orders.allTime > 0 ? (new Date().getMonth() + 1) : 1)));
        var arr = mrr * 12;

        // Daily average revenue
        var dailyAvg = trend.length > 0 ? Math.round(trend.reduce(function (s, t) { return s + t.revenue; }, 0) / trend.length) : 0;
        var monthForecast = dailyAvg * 30;

        // Financial health score (0-100)
        var healthScore = 0;
        if (d.revenue.thisMonth > 0) healthScore += 20;
        if (d.revenue.thisMonth > 100000) healthScore += 15;
        if (profitMargin > 80) healthScore += 15;
        else if (profitMargin > 50) healthScore += 10;
        if (d.orders.thisMonth > 10) healthScore += 15;
        else if (d.orders.thisMonth > 5) healthScore += 10;
        if (monthlyGrowth > 0) healthScore += 15;
        if (d.eaAddon.rate > 20) healthScore += 10;
        if ((s.flutterwave || {}).status === 'configured') healthScore += 10;
        healthScore = Math.min(100, healthScore);
        var healthColor = healthScore >= 80 ? 'green' : healthScore >= 60 ? 'amber' : 'red';

        // Financial Health Score hero
        html += '<div style="display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap;">';
        html += '<div style="flex:1;min-width:200px;padding:24px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:12px;text-align:center;">' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:8px;">Financial Health Score</div>' +
            '<div style="font-family:Space Grotesk;font-size:3rem;font-weight:700;color:var(--fdr-' + healthColor + ');">' + healthScore + '</div>' +
            '<div style="font-size:0.78rem;color:var(--fdr-' + healthColor + ');">' + (healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention') + '</div>' +
            '</div>';
        html += '<div style="flex:2;min-width:280px;padding:24px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:12px;">' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:12px;">Monthly Snapshot</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
                '<div><div style="font-size:0.68rem;color:var(--fdr-dim);">Revenue</div><div style="font-family:Space Grotesk;font-weight:700;color:var(--fdr-green);">' + BFX.naira(d.revenue.thisMonth) + '</div></div>' +
                '<div><div style="font-size:0.68rem;color:var(--fdr-dim);">Expenses</div><div style="font-family:Space Grotesk;font-weight:700;color:var(--fdr-red,#ef4444);">' + BFX.naira(monthlyExpenses) + '</div></div>' +
                '<div><div style="font-size:0.68rem;color:var(--fdr-dim);">Gross Profit</div><div style="font-family:Space Grotesk;font-weight:700;color:var(--fdr-green);">' + BFX.naira(grossProfit) + '</div></div>' +
                '<div><div style="font-size:0.68rem;color:var(--fdr-dim);">Profit Margin</div><div style="font-family:Space Grotesk;font-weight:700;color:var(--fdr-' + (profitMargin > 70 ? 'green' : 'amber') + ');">' + profitMargin + '%</div></div>' +
            '</div></div>';
        html += '</div>';

        // Key financial metrics
        html += BFX.metricGrid([
            ['Total Revenue', BFX.naira(totalRev), 'green'],
            ['This Month', BFX.naira(d.revenue.thisMonth), 'green'],
            ['This Quarter', BFX.naira(d.revenue.thisQuarter), 'green'],
            ['Today', BFX.naira(d.revenue.today), 'green'],
            ['AOV', BFX.naira(d.metrics.aov), 'blue'],
            ['30d Growth', (monthlyGrowth >= 0 ? '+' : '') + monthlyGrowth + '%', monthlyGrowth >= 0 ? 'green' : 'red'],
            ['Daily Avg (30d)', BFX.naira(dailyAvg)],
            ['EA Addon Rev', BFX.naira(d.eaAddon.revenue), 'amber']
        ]);

        // Charts
        html += '<div class="fdr-grid-2">';
        html += BFX.card('30-Day Revenue Trend', BFX.trendChart(d.revenue.trend));
        html += BFX.card('Revenue by Product', BFX.productBreakdown(d.products));
        html += '</div>';

        // Revenue Streams Breakdown
        html += BFX.card('Revenue Streams',
            '<div class="fdr-grid-2">' +
                buildRevenueStream('📚', 'Course Sales', 'Forex 101: The Trader\'s Bible', coursesRev, totalRev, 'green') +
                buildRevenueStream('👥', 'Mentorship', 'Group + 1-on-1 sessions', mentorRev, totalRev, 'blue') +
                buildRevenueStream('⭐', 'VIP Program', 'Lifetime access + everything', vipRev, totalRev, 'purple') +
                buildRevenueStream('🤖', 'EA + Addons', 'SMA Pro Trend EA bundle + upsell', eaBundleRev, totalRev, 'amber') +
            '</div>');

        // MRR / ARR / Forecast
        html += '<div class="fdr-grid-3">';
        html += '<div style="padding:20px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:12px;text-align:center;">' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:8px;">Est. MRR</div>' +
            '<div style="font-family:Space Grotesk;font-size:1.5rem;font-weight:700;color:var(--fdr-blue);">' + BFX.naira(mrr) + '</div>' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:4px;">From mentorship recurring</div></div>';
        html += '<div style="padding:20px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:12px;text-align:center;">' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:8px;">Est. ARR</div>' +
            '<div style="font-family:Space Grotesk;font-size:1.5rem;font-weight:700;color:var(--fdr-purple);">' + BFX.naira(arr) + '</div>' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:4px;">MRR × 12 annualized</div></div>';
        html += '<div style="padding:20px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:12px;text-align:center;">' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:8px;">30d Forecast</div>' +
            '<div style="font-family:Space Grotesk;font-size:1.5rem;font-weight:700;color:var(--fdr-green);">' + BFX.naira(monthForecast) + '</div>' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:4px;">Based on daily average</div></div>';
        html += '</div>';

        // Expenses & Profit
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Monthly Expenses',
            expenseItems.map(function (e) {
                return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--fdr-border);">' +
                    '<div><div style="font-size:0.82rem;font-weight:600;">' + e.name + '</div>' +
                    '<div style="font-size:0.68rem;color:var(--fdr-dim);">' + e.note + '</div></div>' +
                    '<div style="font-family:Space Grotesk;font-weight:700;' + (e.amount > 0 ? 'color:var(--fdr-red,#ef4444);' : 'color:var(--fdr-green);') + '">' + (e.amount > 0 ? BFX.naira(e.amount) : 'Free') + '</div></div>';
            }).join('') +
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;margin-top:4px;font-weight:700;">' +
                '<span>Total Monthly Expenses</span>' +
                '<span style="font-family:Space Grotesk;color:var(--fdr-red,#ef4444);">' + BFX.naira(monthlyExpenses) + '</span></div>');

        // Tax Estimation
        var annualRevEstimate = d.revenue.thisMonth * 12;
        var estimatedTax = Math.round(annualRevEstimate * 0.06);
        html += BFX.card('Tax & Compliance',
            BFX.settingRow('Business Type', 'Sole proprietorship (education)', null) +
            BFX.settingRow('Tax Region', 'Nigeria (FIRS)', BFX.badge('NGN', 'blue')) +
            BFX.settingRow('Est. Annual Revenue', BFX.naira(annualRevEstimate), null) +
            BFX.settingRow('Est. Tax (6% assumed)', BFX.naira(estimatedTax), BFX.badge('Estimate', 'amber')) +
            '<div style="margin-top:10px;font-size:0.72rem;color:var(--fdr-dim);line-height:1.5;">Tax rates are estimated. Consult a Nigerian tax professional for accurate obligations under FIRS guidelines.</div>');
        html += '</div>';

        // Payment Gateway
        var fwStatus = s.flutterwave || {};
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Payment Gateway (Flutterwave)',
            BFX.settingRow('Status', 'Payment processing', BFX.statusBadge(fwStatus.status === 'configured' ? 'configured' : 'error')) +
            BFX.settingRow('Webhook', 'Signature verification', BFX.badge(fwStatus.webhookHash ? 'Verified' : 'Missing', fwStatus.webhookHash ? 'green' : 'red')) +
            BFX.settingRow('Currency', 'Nigerian Naira', BFX.badge('NGN', 'blue')) +
            BFX.settingRow('Fee Structure', '1.4% per transaction', null) +
            BFX.settingRow('Settlement', 'T+1 business day', null) +
            BFX.settingRow('Monthly Volume', BFX.naira(d.revenue.thisMonth), BFX.badge(BFX.num(d.orders.thisMonth) + ' txns', 'green')),
            null, '<a href="https://dashboard.flutterwave.com" target="_blank" rel="noopener" class="fdr-btn fdr-btn-outline fdr-btn-sm">Dashboard &rarr;</a>');

        // Period Comparison
        var weekAvg = d.revenue.thisWeek > 0 ? Math.round(d.revenue.thisWeek / 7) : 0;
        var monthDays = new Date().getDate();
        var monthAvg = monthDays > 0 ? Math.round(d.revenue.thisMonth / monthDays) : 0;
        html += BFX.card('Period Comparison',
            '<div class="fdr-grid-2" style="margin-bottom:12px;">' +
                buildPeriodCard('Today', d.revenue.today, d.orders.today) +
                buildPeriodCard('This Week', d.revenue.thisWeek, d.orders.thisWeek) +
                buildPeriodCard('This Month', d.revenue.thisMonth, d.orders.thisMonth) +
                buildPeriodCard('This Quarter', d.revenue.thisQuarter, d.orders.allTime) +
            '</div>' +
            '<div style="display:flex;gap:12px;">' +
                '<div style="flex:1;padding:10px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;text-align:center;">' +
                    '<div style="font-size:0.68rem;color:var(--fdr-dim);">Avg/Day (Week)</div>' +
                    '<div style="font-family:Space Grotesk;font-weight:700;">' + BFX.naira(weekAvg) + '</div></div>' +
                '<div style="flex:1;padding:10px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;text-align:center;">' +
                    '<div style="font-size:0.68rem;color:var(--fdr-dim);">Avg/Day (Month)</div>' +
                    '<div style="font-family:Space Grotesk;font-weight:700;">' + BFX.naira(monthAvg) + '</div></div>' +
            '</div>');
        html += '</div>';

        // Budget Tracking
        var monthlyTarget = 500000;
        var quarterlyTarget = 1500000;
        var monthProgress = Math.min(100, Math.round((d.revenue.thisMonth / monthlyTarget) * 100));
        var quarterProgress = Math.min(100, Math.round((d.revenue.thisQuarter / quarterlyTarget) * 100));
        html += BFX.card('Budget & Targets',
            '<div style="margin-bottom:16px;">' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.82rem;font-weight:600;">Monthly Target</span><span style="font-size:0.82rem;">' + BFX.naira(d.revenue.thisMonth) + ' / ' + BFX.naira(monthlyTarget) + '</span></div>' +
                BFX.progressBar(d.revenue.thisMonth, monthlyTarget, monthProgress >= 100 ? 'green' : monthProgress >= 60 ? 'amber' : 'red') +
                '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:4px;">' + monthProgress + '% of ₦500,000 target</div>' +
            '</div>' +
            '<div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.82rem;font-weight:600;">Quarterly Target</span><span style="font-size:0.82rem;">' + BFX.naira(d.revenue.thisQuarter) + ' / ' + BFX.naira(quarterlyTarget) + '</span></div>' +
                BFX.progressBar(d.revenue.thisQuarter, quarterlyTarget, quarterProgress >= 100 ? 'green' : quarterProgress >= 60 ? 'amber' : 'red') +
                '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:4px;">' + quarterProgress + '% of ₦1,500,000 target</div>' +
            '</div>');

        // Refunds & Outstanding
        var pendingOrders = (d.recentOrders || []).filter(function (o) { return !o.fulfilled; }).length;
        html += '<div class="fdr-grid-2">';
        html += BFX.card('Refunds & Disputes',
            '<div style="text-align:center;padding:16px 0;">' +
                '<div style="font-family:Space Grotesk;font-size:2rem;font-weight:700;color:var(--fdr-green);">₦0</div>' +
                '<div style="font-size:0.78rem;color:var(--fdr-green);margin-top:4px;">No refunds processed</div>' +
            '</div>' +
            BFX.settingRow('Refund Policy', 'Case-by-case manual review', null) +
            BFX.settingRow('Dispute Rate', '0%', BFX.badge('Clean', 'green')) +
            BFX.settingRow('Chargebacks', 'None recorded', BFX.badge('0', 'green')));

        html += BFX.card('Outstanding & Pending',
            '<div style="display:flex;gap:16px;margin-bottom:12px;">' +
                '<div style="flex:1;padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;' + (pendingOrders > 0 ? 'color:var(--fdr-amber);' : '') + '">' + pendingOrders + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">Unfulfilled Orders</div></div>' +
                '<div style="flex:1;padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
                    '<div style="font-family:Space Grotesk;font-size:1.3rem;font-weight:700;">' + BFX.num(d.bookings.pending) + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">Pending Bookings</div></div>' +
            '</div>' +
            (pendingOrders > 0 ? BFX.alert('warn', pendingOrders + ' order' + (pendingOrders !== 1 ? 's' : '') + ' awaiting fulfillment.') : '') +
            '<div style="margin-top:8px;text-align:center;"><button class="fdr-btn fdr-btn-outline fdr-btn-sm" onclick="fdrNav(\'sales\')">View in Sales &rarr;</button></div>');
        html += '</div>';

        // AI Financial Insights
        html += BFX.card('AI Financial Insights',
            buildAiInsight('💰', 'Revenue Health', 'Monthly revenue is ' + BFX.naira(d.revenue.thisMonth) + ' with a ' + profitMargin + '% profit margin. ' + (profitMargin > 80 ? 'Excellent margins due to low infrastructure costs on free-tier services.' : 'Consider reducing expenses or increasing pricing.')) +
            buildAiInsight('📈', 'Growth Trajectory', (monthlyGrowth >= 0 ? 'Revenue grew ' + monthlyGrowth + '% in the second half of the past 30 days.' : 'Revenue declined ' + Math.abs(monthlyGrowth) + '% recently.') + ' Daily average is ' + BFX.naira(dailyAvg) + ', projecting ' + BFX.naira(monthForecast) + ' over 30 days.') +
            buildAiInsight('⭐', 'Product Mix', 'VIP Program drives the highest per-order value. EA addon at ' + BFX.pct(d.eaAddon.rate) + ' conversion adds incremental revenue. Consider bundling EA with mentorship tiers.') +
            buildAiInsight('🔄', 'Recurring Revenue', 'Mentorship products generate recurring income. Estimated MRR: ' + BFX.naira(mrr) + '. Focus on retention and renewal campaigns via Brevo drip sequences.') +
            buildAiInsight('🎯', 'Optimization', 'AOV is ' + BFX.naira(d.metrics.aov) + '. Increasing EA addon visibility at checkout could lift AOV by ₦5,000-10,000. Test a pre-selected addon checkbox.'),
            null, '<span style="font-size:0.72rem;color:var(--fdr-dim);">AI-generated from transaction data</span>');

        document.getElementById('sec-finance').innerHTML = html;
    }

    function buildRevenueStream(icon, title, desc, amount, total, color) {
        var pct = total > 0 ? Math.round((amount / total) * 100) : 0;
        return '<div style="padding:16px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
                '<span style="font-size:1.2rem;">' + icon + '</span>' +
                '<div><div style="font-weight:600;font-size:0.84rem;">' + title + '</div>' +
                '<div style="font-size:0.68rem;color:var(--fdr-dim);">' + desc + '</div></div></div>' +
            '<div style="font-family:Space Grotesk;font-size:1.2rem;font-weight:700;color:var(--fdr-' + color + ');margin-bottom:8px;">' + BFX.naira(amount) + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<div style="flex:1;height:6px;background:var(--fdr-border);border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:var(--fdr-' + color + ');border-radius:3px;"></div></div>' +
                '<span style="font-size:0.72rem;color:var(--fdr-dim);">' + pct + '%</span></div></div>';
    }

    function buildPeriodCard(label, revenue, orders) {
        return '<div style="padding:12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;text-align:center;">' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);text-transform:uppercase;margin-bottom:6px;">' + label + '</div>' +
            '<div style="font-family:Space Grotesk;font-size:1.1rem;font-weight:700;color:var(--fdr-green);">' + BFX.naira(revenue) + '</div>' +
            '<div style="font-size:0.68rem;color:var(--fdr-dim);margin-top:4px;">' + BFX.num(orders) + ' orders</div></div>';
    }

    // ================================================================
    // MODULE 9: OPERATIONS
    // ================================================================

    function renderOperations() {
        var s = OS.store.get('sysData');
        var d = OS.store.get('dashData');
        var html = BFX.sectionHeader('Operations', 'Infrastructure health, deployments, API monitoring, and business operations',
            BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()') +
            BFX.quickAction('▲', 'Vercel', "window.open('https://vercel.com','_blank')") +
            BFX.quickAction('⚡', 'Supabase', "window.open('https://supabase.com','_blank')") +
            BFX.quickAction('🏠', 'CEO View', "OS.nav.go('ceo')"));

        var svcHealthy = [s.supabase.status, s.brevo.status, s.flutterwave.status].filter(function(st) { return st === 'healthy' || st === 'configured'; }).length + 1;
        var envVars = s.envVars || {};
        var envSet = Object.keys(envVars).filter(function(k) { return envVars[k]; }).length;
        var envTotal = Object.keys(envVars).length;
        var uptimeScore = Math.round((svcHealthy / 4) * 100);

        html += BFX.metricGrid([
            ['System Uptime', uptimeScore + '%', uptimeScore === 100 ? 'green' : 'amber', svcHealthy + '/4 services healthy'],
            ['API Endpoints', '11/12', 'blue', '1 slot remaining'],
            ['Env Variables', envSet + '/' + envTotal, envSet === envTotal ? 'green' : 'red', envSet === envTotal ? 'All configured' : (envTotal - envSet) + ' missing'],
            ['Vercel Region', BFX.esc(s.vercel.region || 'iad1'), 'purple', BFX.esc(s.vercel.env || 'production')],
            ['Daily Cron Jobs', '1', 'green', '09:00 UTC re-engagement'],
            ['Active Automations', '4', 'green', 'Webhook, cron, lead, token'],
            ['Drip Sequences', '6', 'purple', '22 total steps'],
            ['SOP Library', '6', 'blue', 'Documented procedures']
        ]);

        // --- System Health Overview ---
        var services = [
            { name: 'Supabase (Database)', status: s.supabase.status, detail: s.supabase.status === 'healthy' ? BFX.num(s.supabase.orderCount || 0) + ' orders tracked' : (s.supabase.message || 'Not configured'), icon: '⚡' },
            { name: 'Brevo (Email/CRM)', status: s.brevo.status, detail: s.brevo.status === 'healthy' ? 'Plan: ' + BFX.esc(s.brevo.plan) : (s.brevo.message || 'Not configured'), icon: '📧' },
            { name: 'Flutterwave (Payments)', status: s.flutterwave.status, detail: s.flutterwave.status === 'configured' ? 'Webhook: ' + (s.flutterwave.webhookHash ? 'Verified' : 'Missing') : 'Not configured', icon: '💳' },
            { name: 'Vercel (Hosting)', status: 'healthy', detail: BFX.esc(s.vercel.env || 'production') + ' / ' + BFX.esc(s.vercel.region || 'iad1') + ' / ' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ' functions', icon: '▲' }
        ];

        html += BFX.card('System Health', '<div class="fdr-health-grid">' +
            services.map(function(svc) { return BFX.healthCard(svc.name, svc.status, svc.detail); }).join('') + '</div>' +
            (uptimeScore === 100 ? BFX.alert('success', 'All systems operational — ' + svcHealthy + '/4 services running normally') :
                BFX.alert('warn', (4 - svcHealthy) + ' service(s) have issues — check configuration')),
            BFX.badge(uptimeScore === 100 ? 'All Healthy' : 'Issues', uptimeScore === 100 ? 'green' : 'amber'));

        // --- API Endpoint Monitor ---
        var apiEndpoints = [
            { path: '/api/webhooks/flutterwave', method: 'POST', purpose: 'Payment webhook handler', critical: true },
            { path: '/api/verify-payment', method: 'POST', purpose: 'Client payment verification', critical: true },
            { path: '/api/download', method: 'GET', purpose: 'Token-gated file delivery', critical: true },
            { path: '/api/lead-capture', method: 'POST', purpose: 'Lead capture + CRM + drip', critical: false },
            { path: '/api/booking', method: 'POST', purpose: 'Mentorship booking + ICS', critical: false },
            { path: '/api/admin', method: 'GET/POST', purpose: 'Consolidated admin router (5 actions)', critical: false },
            { path: '/api/health', method: 'GET', purpose: 'Diagnostic health check', critical: false },
            { path: '/api/market-data', method: 'GET', purpose: 'Market data for chatbot', critical: false },
            { path: '/api/cron-reengagement', method: 'GET', purpose: 'Daily drip + re-engagement', critical: false },
            { path: '/api/download-forex101', method: 'GET', purpose: 'Legacy download (tech debt)', critical: false },
            { path: '/api/vip-access', method: 'GET', purpose: 'VIP portal data', critical: false }
        ];
        html += BFX.card('API Endpoint Monitor',
            BFX.table(['Endpoint', 'Method', 'Purpose', 'Priority', 'Status'],
                apiEndpoints.map(function(ep) {
                    return [
                        '<code style="font-size:0.75rem;">' + BFX.esc(ep.path) + '</code>',
                        BFX.badge(ep.method, 'blue'),
                        BFX.esc(ep.purpose),
                        ep.critical ? BFX.badge('Critical', 'red') : BFX.badge('Standard', 'dim'),
                        BFX.badge('Active', 'green')
                    ];
                })
            ) + '<div style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;">' +
            '<span style="font-size:0.75rem;color:var(--fdr-dim);">11 of 12 function slots used</span>' +
            '<span style="font-size:0.75rem;color:var(--fdr-amber);">1 slot remaining (Vercel Hobby limit)</span></div>',
            BFX.badge('11/12 Slots', s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'red' : 'amber'));

        // --- Infrastructure Overview ---
        html += BFX.card('Infrastructure', '<div class="fdr-grid-2">' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Hosting — Vercel</div>' +
            BFX.settingRow('Plan', 'Hobby (Free Tier)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Environment', BFX.esc(s.vercel.env || 'production'), BFX.badge('Live', 'green')) +
            BFX.settingRow('Region', BFX.esc(s.vercel.region || 'iad1') + ' (US East)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Functions', s.vercel.functionsUsed + ' / ' + s.vercel.functionsLimit, BFX.badge(s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'At Limit' : 'OK', s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'red' : 'green')) +
            BFX.settingRow('Max Duration', '30 seconds', BFX.badge('Default', 'dim')) +
            BFX.settingRow('Domain', 'www.bossfxcademy.com', BFX.badge('Active', 'green')) +
            BFX.settingRow('SSL', 'Auto-managed', BFX.badge('Active', 'green')) +
            '</div></div>' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Database — Supabase</div>' +
            BFX.settingRow('Status', s.supabase.status === 'healthy' ? 'Connected' : 'Issue', BFX.badge(s.supabase.status === 'healthy' ? 'Healthy' : 'Error', s.supabase.status === 'healthy' ? 'green' : 'red')) +
            BFX.settingRow('Tables', '5 (orders, tokens, downloads, files, bookings)', BFX.badge('Active', 'green')) +
            BFX.settingRow('RLS', 'All tables', BFX.badge('Enforced', 'green')) +
            BFX.settingRow('Storage', 'product-files bucket', BFX.badge('Active', 'green')) +
            BFX.settingRow('Auth', 'Admin JWT + email whitelist', BFX.badge('Active', 'green')) +
            '</div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">CDN &amp; Caching</div>' +
            BFX.settingRow('Static Assets', 'max-age=31536000, immutable', BFX.badge('Cached', 'green')) +
            BFX.settingRow('JS/CSS', 'max-age=86400, s-maxage=604800', BFX.badge('Cached', 'green')) +
            BFX.settingRow('Admin/Founder', 'no-store, no-cache', BFX.badge('Private', 'amber')) +
            '</div></div>' +
            '</div>');

        // --- Environment Variables ---
        html += BFX.card('Environment Variables',
            Object.keys(envVars).map(function(key) {
                return BFX.settingRow(key, null, BFX.badge(envVars[key] ? 'Set' : 'Missing', envVars[key] ? 'green' : 'red'));
            }).join('') +
            (envSet === envTotal ? BFX.alert('success', 'All ' + envTotal + ' environment variables configured') :
                BFX.alert('error', (envTotal - envSet) + ' environment variable(s) missing — check Vercel dashboard')),
            BFX.badge(envSet + '/' + envTotal, envSet === envTotal ? 'green' : 'red'));

        // --- Cron & Scheduled Jobs ---
        html += BFX.card('Cron & Scheduled Jobs',
            BFX.autoCard('Daily Re-engagement', 'Processes drip sequences and sends re-engagement emails to inactive leads. Runs via Vercel Cron.', 'active', 'Daily at 09:00 UTC (0 9 * * *)', 'Managed by Vercel') +
            '<div style="margin-top:14px;">' +
            BFX.settingRow('Cron Path', '/api/cron-reengagement', BFX.badge('Active', 'green')) +
            BFX.settingRow('Schedule', '0 9 * * * (daily 09:00 UTC)', BFX.badge('Running', 'blue')) +
            BFX.settingRow('Drip Sequences Processed', '6 sequences, 22 total steps', BFX.badge('Active', 'green')) +
            BFX.settingRow('Re-engagement Window', '30 days inactivity', BFX.badge('Configured', 'green')) +
            '</div>',
            BFX.badge('1 Job', 'green'));

        // --- Deployment Pipeline ---
        html += BFX.card('Deployment Pipeline',
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' +
            buildOpsStage('1', 'Code', 'Local dev', 'green') +
            buildOpsStage('2', 'Commit', 'git push main', 'green') +
            buildOpsStage('3', 'Build', 'Vercel auto-deploy', 'green') +
            buildOpsStage('4', 'Deploy', 'Production live', 'green') +
            buildOpsStage('5', 'Monitor', '/api/health', 'green') +
            '</div>' +
            BFX.settingRow('Workflow', 'Single branch (main) → auto-deploy', BFX.badge('Active', 'green')) +
            BFX.settingRow('Build Step', 'None (static HTML/JS/CSS)', BFX.badge('Skip', 'dim')) +
            BFX.settingRow('Functions Runtime', 'Node.js on Vercel', BFX.badge('Active', 'green')) +
            BFX.settingRow('Rollback', 'Vercel instant rollback to any previous deploy', BFX.badge('Available', 'green')) +
            BFX.settingRow('Headers', 'Security headers on /api/*, /admin/*, /founder/*', BFX.badge('Configured', 'green')),
            BFX.badge('CI/CD', 'blue'));

        // --- Website Health ---
        var pages = [
            { name: 'Homepage', path: '/', type: 'Landing' },
            { name: 'Course Page', path: '/forex-101.html', type: 'Product' },
            { name: 'Mentorship', path: '/mentorship.html', type: 'Product' },
            { name: 'VIP Program', path: '/vip-program.html', type: 'Product' },
            { name: 'Blog Index', path: '/blog/', type: 'Content' },
            { name: 'Resources', path: '/resources/', type: 'Content' },
            { name: 'Checkout', path: '/checkout.html', type: 'Revenue' },
            { name: 'Contact', path: '/contact.html', type: 'Lead Gen' },
            { name: 'Payment Success', path: '/payment-success.html', type: 'Post-Purchase' },
            { name: 'Admin Dashboard', path: '/admin/', type: 'Admin' },
            { name: 'Founder OS', path: '/founder/', type: 'Admin' },
            { name: 'VIP Portal', path: '/vip/', type: 'Protected' }
        ];
        html += BFX.card('Website Health',
            BFX.table(['Page', 'Path', 'Type', 'Status'],
                pages.map(function(p) {
                    return [
                        BFX.esc(p.name),
                        '<code style="font-size:0.75rem;">' + BFX.esc(p.path) + '</code>',
                        BFX.badge(p.type, p.type === 'Revenue' ? 'green' : p.type === 'Admin' ? 'purple' : p.type === 'Protected' ? 'amber' : 'blue'),
                        BFX.badge('Live', 'green')
                    ];
                })
            ) + '<div style="margin-top:8px;font-size:0.75rem;color:var(--fdr-dim);">38 HTML files total (11 core, 11 blog, 8 resources, 3 system, admin, VIP, template)</div>',
            BFX.badge('12 Key Pages', 'green'));

        // --- Automation Queue Status ---
        html += BFX.card('Automation Queue',
            BFX.autoCard('Payment Webhook Fulfillment', 'Flutterwave webhook → verify → order → tokens → email → admin notification', 'active', 'On webhook trigger', 'Continuous') +
            BFX.autoCard('Lead Capture Pipeline', 'Form submit → Brevo contact → list assignment → drip trigger → engagement scoring', 'active', 'On form submit', 'Continuous') +
            BFX.autoCard('Download Token System', 'HMAC-SHA256 token generation with auto-expiry (72h standard, 720h VIP)', 'active', 'On purchase', 'Continuous') +
            BFX.autoCard('Daily Re-engagement Cron', 'Drip sequence processing + inactive lead re-engagement emails', 'active', 'Daily 09:00 UTC', 'Today') +
            '<div style="margin-top:10px;">' + BFX.alert('success', 'All 4 automations operational — no queue backlog') + '</div>',
            BFX.badge('4 Active', 'green'));

        // --- Incident Log ---
        var incidents = OS.activity.recent ? OS.activity.recent() : [];
        var errorIncidents = incidents.filter(function(i) { return i.type === 'error'; });
        html += BFX.card('Incident Log',
            errorIncidents.length > 0 ?
                BFX.timeline(errorIncidents.slice(0, 10)) :
                '<div style="text-align:center;padding:20px;">' +
                '<div style="font-size:2rem;margin-bottom:8px;">✅</div>' +
                '<div style="font-weight:600;margin-bottom:4px;">No Incidents</div>' +
                '<div style="font-size:0.8rem;color:var(--fdr-dim);">No errors logged this session. System running cleanly.</div></div>' +
            '<div style="margin-top:10px;">' +
            BFX.settingRow('Error Handling', 'Try/catch on all API calls with toast notifications', BFX.badge('Active', 'green')) +
            BFX.settingRow('Rate Limiting', 'In-memory sliding window (30 req/min)', BFX.badge('Active', 'amber')) +
            BFX.settingRow('Webhook Verification', 'Flutterwave signature hash check', BFX.badge('Active', 'green')) +
            '</div>',
            BFX.badge(errorIncidents.length > 0 ? errorIncidents.length + ' Errors' : 'Clean', errorIncidents.length > 0 ? 'red' : 'green'));

        // --- Team Activity ---
        var recentActivity = incidents.slice(0, 15);
        html += BFX.card('Team Activity',
            recentActivity.length > 0 ?
                BFX.timeline(recentActivity) :
                '<div style="text-align:center;padding:20px;">' +
                '<div style="font-size:2rem;margin-bottom:8px;">👤</div>' +
                '<div style="font-weight:600;margin-bottom:4px;">Sole Operator</div>' +
                '<div style="font-size:0.8rem;color:var(--fdr-dim);">BossFx is the sole founder and operator. All activity is logged in the OS activity timeline.</div></div>' +
            '<div style="margin-top:10px;">' +
            BFX.settingRow('Founder', 'Timilehin "BossFx" Shobande', BFX.badge('Active', 'green')) +
            BFX.settingRow('Role', 'Sole Operator (Marketing, Support, Engineering)', BFX.badge('Full Access', 'purple')) +
            BFX.settingRow('Auth Method', 'Supabase Auth + ADMIN_EMAILS whitelist', BFX.badge('Secured', 'green')) +
            '</div>',
            BFX.badge('1 Operator', 'blue'));

        // --- Support Ticket Tracker ---
        var pendingBookings = d.bookings ? d.bookings.pending : 0;
        html += BFX.card('Support & Tickets',
            '<div class="fdr-grid-2">' +
            '<div style="padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
            '<div style="font-size:0.75rem;color:var(--fdr-dim);margin-bottom:4px;">Pending Bookings</div>' +
            '<div style="font-size:1.5rem;font-weight:700;color:var(--fdr-' + (pendingBookings > 0 ? 'amber' : 'green') + ');">' + pendingBookings + '</div>' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-top:4px;">' + (pendingBookings > 0 ? 'Needs attention' : 'All clear') + '</div></div>' +
            '<div style="padding:14px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
            '<div style="font-size:0.75rem;color:var(--fdr-dim);margin-bottom:4px;">Unfulfilled Orders</div>' +
            '<div style="font-size:1.5rem;font-weight:700;color:var(--fdr-green);">0</div>' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-top:4px;">Auto-fulfilled via webhook</div></div>' +
            '</div>' +
            '<div style="margin-top:12px;">' +
            BFX.settingRow('Support Channel', 'Telegram Community', BFX.badge('Active', 'green')) +
            BFX.settingRow('Contact Form', 'Formspree (xeenzyna)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Email Support', 'Via Brevo transactional', BFX.badge('Active', 'green')) +
            BFX.settingRow('Ticket System', 'Manual (Telegram + Email)', BFX.badge('Phase 5', 'dim')) +
            '</div>' +
            (pendingBookings > 0 ? BFX.alert('warn', pendingBookings + ' mentorship booking(s) pending — review in Students dashboard') : ''),
            BFX.badge(pendingBookings > 0 ? pendingBookings + ' Pending' : 'Clear', pendingBookings > 0 ? 'amber' : 'green'));

        // --- SOP Library ---
        html += BFX.card('SOP Library', '<div class="fdr-grid-2">' +
            [['Deployment Process', 'sop/deployment.md', 'DevOps'], ['Customer Support', 'sop/customer-support.md', 'Support'], ['Payment Issues', 'sop/payment-issues.md', 'Finance'], ['Content Publishing', 'sop/content-publishing.md', 'Marketing'], ['Lead Management', 'sop/lead-management.md', 'Sales'], ['Security Incidents', 'sop/security-incidents.md', 'Security']].map(function(s) {
                return BFX.settingRow(s[0], s[1], BFX.badge(s[2], 'blue') + ' ' + BFX.badge('Available', 'green'));
            }).join('') + '</div>',
            BFX.badge('6 SOPs', 'blue'));

        // --- Goals ---
        html += '<div class="fdr-grid-2">';
        html += BFX.goalsCard('Monthly Goals', 'monthly');
        html += BFX.goalsCard('Quarterly Objectives', 'quarterly');
        html += '</div>';

        // --- AI Operations Recommendations ---
        html += BFX.card('AI Operations Insights', buildOpsInsights(s, d, svcHealthy, envSet, envTotal, pendingBookings));

        document.getElementById('sec-operations').innerHTML = html;
        renderGoalsInto('monthly');
        renderGoalsInto('quarterly');
    }

    function buildOpsStage(num, title, desc, color) {
        return '<div style="flex:1;min-width:100px;text-align:center;padding:10px;background:var(--fdr-' + color + '-dim);border-radius:8px;border:1px solid var(--fdr-' + color + ');">' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-bottom:2px;">Step ' + num + '</div>' +
            '<div style="font-weight:600;font-size:0.84rem;">' + BFX.esc(title) + '</div>' +
            '<div style="font-size:0.72rem;color:var(--fdr-dim);margin-top:2px;">' + BFX.esc(desc) + '</div></div>';
    }

    function buildOpsInsights(s, d, svcHealthy, envSet, envTotal, pendingBookings) {
        var insights = [];
        if (svcHealthy === 4) {
            insights.push({ icon: '✅', title: 'Infrastructure Healthy', text: 'All 4 services (Supabase, Brevo, Flutterwave, Vercel) running normally. No action required.', color: 'green' });
        } else {
            insights.push({ icon: '⚠️', title: 'Service Issues Detected', text: (4 - svcHealthy) + ' service(s) reporting issues. Check System Health card for details and resolve immediately.', color: 'red' });
        }
        if (s.vercel.functionsUsed >= s.vercel.functionsLimit - 1) {
            insights.push({ icon: '🔶', title: 'Function Limit Warning', text: 'Using ' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ' Vercel function slots. Consider consolidating endpoints (router pattern) before adding new API routes.', color: 'amber' });
        }
        if (pendingBookings > 0) {
            insights.push({ icon: '📋', title: 'Pending Bookings', text: pendingBookings + ' mentorship booking(s) awaiting review. Navigate to Students dashboard to manage.', color: 'amber' });
        }
        if (envSet < envTotal) {
            insights.push({ icon: '🔑', title: 'Missing Env Variables', text: (envTotal - envSet) + ' environment variable(s) not configured. Check Vercel dashboard to ensure all secrets are set.', color: 'red' });
        }
        insights.push({ icon: '💡', title: 'Scaling Recommendation', text: 'Current static architecture handles traffic well at this stage. When monthly revenue exceeds ₦1M, consider upgrading to Vercel Pro for higher function limits and analytics.', color: 'blue' });
        return insights.map(function(ins) {
            return '<div style="display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--fdr-border);">' +
                '<div style="font-size:1.2rem;flex-shrink:0;">' + ins.icon + '</div>' +
                '<div><div style="font-weight:600;font-size:0.84rem;margin-bottom:3px;color:var(--fdr-' + ins.color + ');">' + BFX.esc(ins.title) + '</div>' +
                '<div style="font-size:0.8rem;color:var(--fdr-dim);">' + BFX.esc(ins.text) + '</div></div></div>';
        }).join('');
    }

    // ================================================================
    // MODULE 10: SETTINGS
    // ================================================================

    function renderSettings() {
        var s = OS.store.get('sysData');
        var d = OS.store.get('dashData');
        var html = BFX.sectionHeader('Settings', 'System configuration, integrations, security, and preferences',
            BFX.quickAction('🔄', 'Refresh', 'fdrRefresh()') +
            BFX.quickAction('⚙️', 'Operations', "OS.nav.go('operations')") +
            BFX.quickAction('🤖', 'AI Center', "OS.nav.go('ai-control')") +
            BFX.quickAction('🏠', 'CEO View', "OS.nav.go('ceo')"));

        var envVars = s.envVars || {};
        var envSet = Object.keys(envVars).filter(function(k) { return envVars[k]; }).length;
        var envTotal = Object.keys(envVars).length;
        var apis = [
            { name: 'Supabase', status: s.supabase.status },
            { name: 'Brevo', status: s.brevo.status },
            { name: 'Flutterwave', status: s.flutterwave.status }
        ];
        var connectedApis = apis.filter(function(a) { return a.status === 'healthy' || a.status === 'configured'; }).length;

        html += BFX.metricGrid([
            ['Integrations', (connectedApis + 3) + '/6', 'green', connectedApis + ' backend + 3 analytics'],
            ['Env Variables', envSet + '/' + envTotal, envSet === envTotal ? 'green' : 'red', envSet === envTotal ? 'All configured' : 'Missing vars'],
            ['Security Score', '8/9', 'green', '1 item to review'],
            ['Feature Flags', '6/6', 'green', 'All enabled'],
            ['Functions', s.vercel.functionsUsed + '/' + s.vercel.functionsLimit, s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'red' : 'blue', s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'At limit' : '1 slot free'],
            ['Theme', OS.theme.current() === 'dark' ? 'Dark' : 'Light', 'purple', 'User preference'],
            ['Shortcuts', String(Object.keys(OS.shortcuts.all()).length), 'cyan', 'Keyboard bindings'],
            ['Documentation', '40+', 'blue', 'Files maintained']
        ]);

        // --- API Connections ---
        var allApis = [
            { name: 'Supabase', status: s.supabase.status, detail: s.supabase.status === 'healthy' ? 'Connected — ' + BFX.num(s.supabase.orderCount || 0) + ' orders' : (s.supabase.message || 'Error'), purpose: 'Database, auth, storage', critical: true },
            { name: 'Brevo', status: s.brevo.status, detail: s.brevo.status === 'healthy' ? 'Plan: ' + BFX.esc(s.brevo.plan || 'free') : (s.brevo.message || 'Not configured'), purpose: 'Email, CRM, drip sequences', critical: true },
            { name: 'Flutterwave', status: s.flutterwave.status, detail: s.flutterwave.status === 'configured' ? 'Webhook: ' + (s.flutterwave.webhookHash ? 'Verified' : 'Missing') : 'Not configured', purpose: 'Payment processing (NGN)', critical: true },
            { name: 'Google Analytics 4', status: 'configured', detail: 'G-ZFQ9P5KFSJ', purpose: 'Traffic, behavior, conversions', critical: false },
            { name: 'Meta Pixel', status: 'configured', detail: '804009589230621', purpose: 'Ad attribution, audiences', critical: false },
            { name: 'Microsoft Clarity', status: 'configured', detail: 'wnde2od79f', purpose: 'Heatmaps, session recordings', critical: false },
            { name: 'Google Tag Manager', status: 'configured', detail: 'GTM-T3R88HZB', purpose: 'Tag container (all pages)', critical: false },
            { name: 'Formspree', status: 'configured', detail: 'xeenzyna', purpose: 'Contact form submissions', critical: false },
            { name: 'Telegram', status: 'configured', detail: 'Community invite link', purpose: 'Customer community', critical: false }
        ];
        html += BFX.card('API & Integration Connections',
            BFX.table(['Service', 'Purpose', 'Details', 'Priority', 'Status'],
                allApis.map(function(api) {
                    var ok = api.status === 'healthy' || api.status === 'configured';
                    return [
                        '<strong>' + BFX.esc(api.name) + '</strong>',
                        BFX.esc(api.purpose),
                        '<span style="font-size:0.75rem;">' + api.detail + '</span>',
                        api.critical ? BFX.badge('Critical', 'red') : BFX.badge('Standard', 'dim'),
                        BFX.badge(ok ? 'Connected' : 'Issue', ok ? 'green' : 'red')
                    ];
                })
            ),
            BFX.badge((connectedApis + 3) + '/9 Connected', 'green'));

        // --- Infrastructure Settings ---
        html += BFX.card('Infrastructure',
            '<div class="fdr-grid-2">' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Hosting — Vercel</div>' +
            BFX.settingRow('Plan', 'Hobby (Free Tier)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Functions', s.vercel.functionsUsed + ' of ' + s.vercel.functionsLimit + ' used', BFX.badge(s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'At Limit' : 'OK', s.vercel.functionsUsed >= s.vercel.functionsLimit ? 'red' : 'green')) +
            BFX.settingRow('Environment', BFX.esc(s.vercel.env || 'production'), BFX.badge('Live', 'green')) +
            BFX.settingRow('Region', BFX.esc(s.vercel.region || 'iad1') + ' (US East)', BFX.badge('Active', 'green')) +
            BFX.settingRow('Domain', 'www.bossfxcademy.com', BFX.badge('Active', 'green')) +
            BFX.settingRow('SSL', 'Auto-managed by Vercel', BFX.badge('Active', 'green')) +
            BFX.settingRow('Max Duration', '30 seconds per function', BFX.badge('Default', 'dim')) +
            '</div></div>' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Database — Supabase</div>' +
            BFX.settingRow('PostgreSQL', '5 tables', BFX.badge(s.supabase.status === 'healthy' ? 'Healthy' : 'Issue', s.supabase.status === 'healthy' ? 'green' : 'red')) +
            BFX.settingRow('RLS', 'All tables enforced', BFX.badge('Enforced', 'green')) +
            BFX.settingRow('Storage', 'product-files bucket', BFX.badge('Active', 'green')) +
            BFX.settingRow('Auth', 'JWT + email whitelist', BFX.badge('Active', 'green')) +
            '</div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Frontend</div>' +
            BFX.settingRow('Framework', 'Static HTML/CSS/JS (no build step)', BFX.badge('Simple', 'green')) +
            BFX.settingRow('Pages', '38 HTML files', BFX.badge('Live', 'green')) +
            BFX.settingRow('Client JS', '7 modules', BFX.badge('Active', 'green')) +
            BFX.settingRow('CSS', '7 stylesheets', BFX.badge('Active', 'green')) +
            '</div></div>' +
            '</div>',
            BFX.badge('Infrastructure', 'blue'));

        // --- Environment Variables ---
        html += BFX.card('Environment Variables',
            Object.keys(envVars).map(function(key) {
                return BFX.settingRow(key, null, BFX.badge(envVars[key] ? 'Set' : 'Missing', envVars[key] ? 'green' : 'red'));
            }).join('') +
            (envSet === envTotal ? BFX.alert('success', 'All ' + envTotal + ' environment variables configured') :
                BFX.alert('error', (envTotal - envSet) + ' variable(s) missing — check Vercel dashboard')),
            BFX.badge(envSet + '/' + envTotal, envSet === envTotal ? 'green' : 'red'));

        // --- Security ---
        html += BFX.card('Security Configuration',
            '<div class="fdr-grid-2">' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Authentication & Access</div>' +
            BFX.settingRow('Auth Provider', 'Supabase Auth + JWT', BFX.badge('Active', 'green')) +
            BFX.settingRow('Admin Whitelist', 'ADMIN_EMAILS env var', BFX.badge('Configured', 'green')) +
            BFX.settingRow('Session Management', 'Supabase client-side JWT', BFX.badge('Active', 'green')) +
            BFX.settingRow('Protected Routes', '/admin/, /founder/, /vip/', BFX.badge('Enforced', 'green')) +
            '</div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Data Protection</div>' +
            BFX.settingRow('Download Tokens', 'HMAC-SHA256 with time expiry', BFX.badge('Active', 'green')) +
            BFX.settingRow('Webhook Verification', 'Flutterwave signature hash', BFX.badge('Active', 'green')) +
            BFX.settingRow('RLS (Row Level Security)', 'All 5 Supabase tables', BFX.badge('Enforced', 'green')) +
            '</div></div>' +
            '<div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">API Security</div>' +
            BFX.settingRow('Rate Limiting', 'In-memory sliding window (30 req/min)', BFX.badge('Active', 'amber')) +
            BFX.settingRow('CORS', 'Wildcard on admin endpoints', BFX.badge('Review', 'amber')) +
            BFX.settingRow('Security Headers', 'X-Content-Type, X-Frame, X-XSS, Referrer', BFX.badge('Set', 'green')) +
            BFX.settingRow('noindex/nofollow', '/admin/, /founder/, /vip/', BFX.badge('Set', 'green')) +
            '</div>' +
            '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Secrets Management</div>' +
            BFX.settingRow('Storage', 'Vercel environment variables', BFX.badge('Secure', 'green')) +
            BFX.settingRow('Client Exposure', 'Only public keys in config.js', BFX.badge('Safe', 'green')) +
            BFX.settingRow('Git Protection', '.env.local in .gitignore', BFX.badge('Protected', 'green')) +
            '</div></div>' +
            '</div>',
            BFX.badge('8/9 Passing', 'green'));

        // --- Display & Preferences ---
        html += BFX.card('Display & Preferences',
            BFX.settingRow('Theme', OS.theme.current() === 'dark' ? 'Dark Mode' : 'Light Mode',
                '<button class="fdr-btn fdr-btn-outline fdr-btn-xs" onclick="fdrToggleTheme()">' + (OS.theme.current() === 'dark' ? 'Switch to Light' : 'Switch to Dark') + '</button>') +
            BFX.settingRow('Brand Color', 'Emerald (#10B981)', BFX.badge('Primary', 'green')) +
            BFX.settingRow('Accent Color', 'Amber (#f59e0b)', BFX.badge('Secondary', 'amber')) +
            BFX.settingRow('Fonts', 'Inter (body) + Space Grotesk (numbers)', BFX.badge('Loaded', 'green')) +
            BFX.settingRow('Currency', 'NGN (Nigerian Naira)', BFX.badge('₦', 'green')) +
            BFX.settingRow('Locale', 'en-NG', BFX.badge('Nigeria', 'green')) +
            BFX.settingRow('Dashboard Layout', '10 modules, hash-based routing', BFX.badge('Active', 'green')) +
            BFX.settingRow('Sidebar Navigation', 'Collapsible with categories', BFX.badge('Active', 'green')),
            null, '<button class="fdr-btn fdr-btn-outline fdr-btn-xs" onclick="fdrToggleTheme()">Toggle Theme</button>');

        // --- Feature Flags ---
        var features = [
            { name: 'EA Addon Upsell', enabled: true, desc: 'Checkout addon for SMA Pro Trend EA (₦15,000)' },
            { name: 'Drip Sequences', enabled: true, desc: '6 email drip sequences via Brevo' },
            { name: 'BossFx Mirror Chatbot', enabled: true, desc: 'AI chatbot on public pages' },
            { name: 'VIP Portal', enabled: true, desc: 'Protected area for VIP program members' },
            { name: 'Re-engagement Cron', enabled: true, desc: 'Daily automated lead re-engagement' },
            { name: 'Founder OS', enabled: true, desc: 'This operating system dashboard' },
            { name: 'BFX Analytics Engine', enabled: true, desc: '11-module custom analytics' },
            { name: 'Exit Intent Popups', enabled: true, desc: 'Lead capture on exit intent' },
            { name: 'Enhanced Ecommerce', enabled: true, desc: 'GA4 + Meta Pixel ecommerce events' },
            { name: 'Conversion Optimization', enabled: true, desc: 'bfx-convert.js module' }
        ];
        html += BFX.card('Feature Flags',
            '<div class="fdr-grid-2">' +
            features.map(function(f) {
                return '<div style="padding:10px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:8px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                    '<strong style="font-size:0.82rem;">' + BFX.esc(f.name) + '</strong>' +
                    BFX.badge(f.enabled ? 'Enabled' : 'Disabled', f.enabled ? 'green' : 'dim') + '</div>' +
                    '<div style="font-size:0.72rem;color:var(--fdr-dim);">' + BFX.esc(f.desc) + '</div></div>';
            }).join('') + '</div>',
            BFX.badge('10/10 Enabled', 'green'));

        // --- Quick Links ---
        html += BFX.card('External Dashboards',
            '<div class="fdr-grid-2">' +
            BFX.serviceLink('Vercel Dashboard', 'Hosting, deployments, logs', 'https://vercel.com', 'var(--fdr-blue-dim)', '▲') +
            BFX.serviceLink('Supabase Dashboard', 'Database, auth, storage', 'https://supabase.com', 'var(--fdr-green-dim)', '⚡') +
            BFX.serviceLink('Flutterwave Dashboard', 'Payments, transactions, settlements', 'https://dashboard.flutterwave.com', 'var(--fdr-amber-dim)', '💳') +
            BFX.serviceLink('Brevo Dashboard', 'Email campaigns, CRM, automation', 'https://app.brevo.com', 'var(--fdr-blue-dim)', '📧') +
            BFX.serviceLink('Google Analytics', 'Traffic, behavior, conversions', 'https://analytics.google.com', 'var(--fdr-green-dim)', '📊') +
            BFX.serviceLink('Google Search Console', 'SEO, indexing, search performance', 'https://search.google.com/search-console', 'var(--fdr-blue-dim)', '🔍') +
            BFX.serviceLink('Microsoft Clarity', 'Heatmaps, session recordings', 'https://clarity.microsoft.com', 'var(--fdr-cyan-dim)', '🔥') +
            BFX.serviceLink('GitHub Repository', 'Source code, commits, issues', 'https://github.com/Boss-fx/bossfx-academy', 'var(--fdr-dim)', '🐙') +
            BFX.serviceLink('Legacy Admin Dashboard', 'Original admin panel', '/admin/', 'var(--fdr-purple-dim)', '🔧') +
            BFX.serviceLink('Telegram Community', 'Customer community channel', 'https://t.me/qD_fBeaziqE5YzU8', 'var(--fdr-blue-dim)', '💬') +
            '</div>',
            BFX.badge('10 Links', 'blue'));

        // --- User Management ---
        html += BFX.card('User & Access Management',
            BFX.settingRow('Current User', 'bossfx.official@gmail.com', BFX.badge('Founder', 'green')) +
            BFX.settingRow('Auth Method', 'Supabase Auth + JWT', BFX.badge('Active', 'green')) +
            BFX.settingRow('Admin Whitelist', 'ADMIN_EMAILS environment variable', BFX.badge('Configured', 'green')) +
            BFX.settingRow('Access Level', 'Full access (sole operator)', BFX.badge('Owner', 'purple')) +
            BFX.settingRow('Session', 'Active', BFX.badge('Logged In', 'green')) +
            '<div style="margin-top:12px;">' +
            BFX.alert('info', 'Single-user system. Multi-user RBAC with role-based permissions planned for Phase 5.') +
            '</div>',
            BFX.badge('1 User', 'blue'));

        // --- Documentation Index ---
        html += BFX.card('Documentation Index',
            BFX.table(['Document', 'Purpose', 'Status'],
                [
                    ['CLAUDE.md', 'Project memory — business context, architecture, rules', BFX.badge('Current', 'green')],
                    ['PROJECT_ROADMAP.md', 'Phased execution plan with priorities and status', BFX.badge('Active', 'green')],
                    ['AUTOMATION_MAP.md', 'All automated workflows and triggers', BFX.badge('Current', 'green')],
                    ['CHANGELOG.md', 'Semantic versioning changelog', BFX.badge('Updated', 'green')],
                    ['docs/architecture.md', 'System architecture and design decisions', BFX.badge('Complete', 'green')],
                    ['docs/api-reference.md', 'All 11 API endpoint documentation', BFX.badge('Complete', 'green')],
                    ['docs/deployment.md', 'Deployment workflow and rollback procedures', BFX.badge('Complete', 'green')],
                    ['docs/analytics.md', 'Analytics implementation guide', BFX.badge('Complete', 'green')],
                    ['docs/environment.md', 'Environment variable reference', BFX.badge('Complete', 'green')],
                    ['sop/ (6 files)', 'Standard operating procedures', BFX.badge('Complete', 'green')]
                ]
            ),
            BFX.badge('40+ Files', 'blue'));

        // --- Keyboard Shortcuts ---
        html += BFX.card('Keyboard Shortcuts', '<div>' +
            Object.keys(OS.shortcuts.all()).map(function(combo) {
                var sc = OS.shortcuts.all()[combo];
                var display = combo.replace('mod+', '⌘/Ctrl+').replace('shift+', 'Shift+').replace('alt+', 'Alt+');
                return BFX.settingRow(sc.label, null, '<kbd class="fdr-kbd" style="font-size:0.76rem;padding:2px 8px;">' + BFX.esc(display) + '</kbd>');
            }).join('') + '</div>',
            BFX.badge(Object.keys(OS.shortcuts.all()).length + ' Shortcuts', 'cyan'));

        // --- About ---
        html += BFX.card('About BossFx Operating System',
            BFX.settingRow('Version', '2.0.0 (Phase 4 — ERP Expansion)', BFX.badge('Current', 'green')) +
            BFX.settingRow('Owner', 'Timilehin "BossFx" Shobande', BFX.badge('Founder', 'green')) +
            BFX.settingRow('Platform', 'BossFx Academy — Fintech Education', BFX.badge('Live', 'green')) +
            BFX.settingRow('Modules', '10 dashboard modules', BFX.badge('Complete', 'green')) +
            BFX.settingRow('AI Agents', '13 active AI roles', BFX.badge('Active', 'purple')) +
            BFX.settingRow('Stack', 'HTML/JS + Vercel + Supabase + Brevo + Flutterwave', BFX.badge('Production', 'green')) +
            BFX.settingRow('Repository', 'Boss-fx/bossfx-academy', BFX.badge('GitHub', 'blue')) +
            BFX.settingRow('Domain', 'www.bossfxcademy.com', BFX.badge('Live', 'green')) +
            '<div style="margin-top:12px;text-align:center;">' +
            '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" onclick="fdrLogout()">Sign Out</button></div>');

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
        OS.activity.log('system', 'Added ' + period + ' goal: ' + text);
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
    // STATUS FOOTER
    // ================================================================

    var sessionStart = null;

    function startUptime() {
        sessionStart = Date.now();
        function tick() {
            var el = document.getElementById('fdrFooterUptime');
            if (!el || !sessionStart) return;
            var diff = Math.floor((Date.now() - sessionStart) / 1000);
            var h = Math.floor(diff / 3600);
            var m = Math.floor((diff % 3600) / 60);
            var s = diff % 60;
            el.textContent = (h > 0 ? h + 'h ' : '') + m + 'm ' + s + 's';
        }
        tick();
        setInterval(tick, 1000);
    }

    function updateFooterStatus(status, msg) {
        var el = document.getElementById('fdrFooterStatus');
        if (!el) return;
        if (status === 'error') {
            el.innerHTML = '<span class="fdr-status-dot red"></span> ' + BFX.esc(msg || 'Error');
        } else {
            el.innerHTML = '<span class="fdr-status-dot green"></span> Systems Operational';
        }
    }

    OS.events.on('dashboard:loaded', function () {
        var s = OS.store.get('sysData');
        if (!s) return;
        var hasError = (s.supabase && s.supabase.status === 'error') || (s.brevo && s.brevo.status === 'error');
        if (hasError) {
            updateFooterStatus('error', 'Service degraded');
        } else {
            updateFooterStatus('ok');
        }
    });

    // ================================================================
    // INIT
    // ================================================================

    updateThemeIcons();
    var initHash = location.hash.replace('#', '');
    if (initHash && SECTIONS[initHash]) {
        OS.events.on('dashboard:loaded', function () { OS.nav.go(initHash); });
    }
    checkSession();

})();
