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

        html += BFX.card('Active Automations',
            BFX.autoCard('Payment Webhook Fulfillment', 'Processes Flutterwave webhooks: verify payment, create order, generate tokens, send email, notify admin.', 'active', 'On webhook trigger', 'Continuous') +
            BFX.autoCard('Daily Re-engagement Cron', 'Processes drip sequences and sends re-engagement emails to inactive leads.', 'active', 'Daily at 09:00 UTC', 'Today') +
            BFX.autoCard('Lead Capture Pipeline', 'Captures leads from forms, assigns to Brevo lists, triggers drip sequences, scores engagement.', 'active', 'On form submit', 'Continuous') +
            BFX.autoCard('Download Token System', 'Generates HMAC-SHA256 tokens for secure file access with automatic expiry.', 'active', 'On purchase', 'Continuous')
        );

        html += BFX.card('Email Drip Sequences', '<div class="fdr-grid-2">' +
            ['Welcome Series', 'Webinar Funnel', 'Resource Follow-up', 'Mentorship Nurture', 'Exit Intent Recovery', 'Re-engagement'].map(function (name, i) {
                var steps = [5, 4, 3, 4, 3, 3];
                return '<div style="padding:12px;background:var(--fdr-card);border:1px solid var(--fdr-border);border-radius:10px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><strong style="font-size:0.84rem;">' + name + '</strong>' + BFX.badge('Active', 'green') + '</div>' +
                    '<div style="font-size:0.75rem;color:var(--fdr-dim);">' + steps[i] + ' steps &middot; Managed by Brevo</div></div>';
            }).join('') + '</div>');

        html += BFX.card('Job Queue', BFX.emptyState('⚡', 'Job Queue', 'Real-time job monitoring and queue management. Available in Phase 4.'));
        html += BFX.card('Workflow Builder', BFX.emptyState('🔧', 'Visual Workflow Builder', 'Design custom automation workflows with triggers, conditions, and actions. Coming in Phase 4.', '<button class="fdr-btn fdr-btn-outline fdr-btn-sm" disabled>Coming in Phase 4</button>'));

        document.getElementById('sec-automation').innerHTML = html;
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
        var html = BFX.sectionHeader('Operations', 'System health, projects, and business processes');

        var services = [
            { name: 'Supabase', status: s.supabase.status, detail: s.supabase.status === 'healthy' ? (s.supabase.orderCount || 0) + ' orders tracked' : (s.supabase.message || 'Not configured') },
            { name: 'Brevo', status: s.brevo.status, detail: s.brevo.status === 'healthy' ? 'Plan: ' + s.brevo.plan : (s.brevo.message || 'Not configured') },
            { name: 'Flutterwave', status: s.flutterwave.status, detail: s.flutterwave.status === 'configured' ? 'Webhook: ' + (s.flutterwave.webhookHash ? 'Verified' : 'Missing') : 'Not configured' },
            { name: 'Vercel', status: 'configured', detail: (s.vercel.env || 'production') + ' / ' + (s.vercel.region || 'iad1') + ' / ' + s.vercel.functionsUsed + '/' + s.vercel.functionsLimit + ' functions' }
        ];

        html += BFX.card('System Health', '<div class="fdr-health-grid">' +
            services.map(function (svc) { return BFX.healthCard(svc.name, svc.status, svc.detail); }).join('') + '</div>');

        var envVars = s.envVars || {};
        html += BFX.card('Environment Variables', Object.keys(envVars).map(function (key) {
            return BFX.settingRow(key, null, BFX.badge(envVars[key] ? 'Set' : 'Missing', envVars[key] ? 'green' : 'red'));
        }).join(''));

        html += '<div class="fdr-grid-2">';
        html += BFX.goalsCard('Monthly Goals', 'monthly');
        html += BFX.goalsCard('Quarterly Objectives', 'quarterly');
        html += '</div>';

        html += BFX.card('SOP Library', '<div class="fdr-grid-2">' +
            [['Deployment Process', 'sop/deployment.md'], ['Customer Support', 'sop/customer-support.md'], ['Payment Issues', 'sop/payment-issues.md'], ['Content Publishing', 'sop/content-publishing.md'], ['Lead Management', 'sop/lead-management.md'], ['Security Incidents', 'sop/security-incidents.md']].map(function (s) {
                return BFX.settingRow(s[0], s[1], BFX.badge('Available', 'green'));
            }).join('') + '</div>');

        html += BFX.card('Projects & Tasks', BFX.emptyState('📋', 'Project Management', 'Track projects, tasks, and milestones. Integration with Linear or custom task system coming in Phase 4.'));
        html += BFX.card('Company Calendar', BFX.emptyState('📅', 'Business Calendar', 'Weekly reviews, quarterly planning, and key dates. Calendar integration coming in Phase 4.'));

        document.getElementById('sec-operations').innerHTML = html;
        renderGoalsInto('monthly');
        renderGoalsInto('quarterly');
    }

    // ================================================================
    // MODULE 10: SETTINGS
    // ================================================================

    function renderSettings() {
        var s = OS.store.get('sysData');
        var html = BFX.sectionHeader('Settings', 'System configuration, integrations, and security');

        html += '<div class="fdr-grid-2">';

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

        html += '<div class="fdr-setting-group"><div class="fdr-setting-group-title">Display</div>' +
            BFX.settingRow('Theme', OS.theme.current() === 'dark' ? 'Dark Mode' : 'Light Mode', '<button class="fdr-btn fdr-btn-outline fdr-btn-xs" onclick="fdrToggleTheme()">' + (OS.theme.current() === 'dark' ? 'Switch to Light' : 'Switch to Dark') + '</button>') +
            '</div>';
        html += '</div>';

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

        html += BFX.card('User Management', BFX.emptyState('👤', 'User Management', 'Manage admin users, roles, and permissions. Currently using ADMIN_EMAILS whitelist. Advanced RBAC coming in Phase 5.'));

        html += BFX.card('Feature Flags', '<div class="fdr-grid-2">' +
            [['EA Addon Upsell', true], ['Drip Sequences', true], ['BossFx Mirror Chatbot', true], ['VIP Portal', true], ['Re-engagement Cron', true], ['Founder OS', true]].map(function (f) {
                return BFX.settingRow(f[0], null, BFX.badge(f[1] ? 'Enabled' : 'Disabled', f[1] ? 'green' : 'dim'));
            }).join('') + '</div>');

        html += BFX.card('Security', '<div>' +
            BFX.settingRow('Authentication', 'Supabase Auth + JWT', BFX.badge('Active', 'green')) +
            BFX.settingRow('Admin Whitelist', 'ADMIN_EMAILS env var', BFX.badge('Configured', 'green')) +
            BFX.settingRow('Download Tokens', 'HMAC-SHA256 with expiry', BFX.badge('Active', 'green')) +
            BFX.settingRow('Webhook Verification', 'Flutterwave signature check', BFX.badge('Active', 'green')) +
            BFX.settingRow('Rate Limiting', 'In-memory sliding window', BFX.badge('Active', 'amber')) +
            BFX.settingRow('RLS (Row Level Security)', 'All Supabase tables', BFX.badge('Enforced', 'green')) +
            BFX.settingRow('CORS', 'Admin endpoints', BFX.badge('Review', 'amber')) +
            '</div>');

        html += BFX.card('Keyboard Shortcuts', '<div>' +
            Object.keys(OS.shortcuts.all()).map(function (combo) {
                var sc = OS.shortcuts.all()[combo];
                var display = combo.replace('mod+', '⌘/Ctrl+').replace('shift+', 'Shift+').replace('alt+', 'Alt+');
                return BFX.settingRow(sc.label, null, '<kbd class="fdr-kbd" style="font-size:0.76rem;padding:2px 8px;">' + BFX.esc(display) + '</kbd>');
            }).join('') + '</div>');

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
