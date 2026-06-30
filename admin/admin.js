// ================================================================
// Admin Dashboard — Client-side Logic
// ================================================================

(function() {
    var SUPABASE_URL = '';
    var SUPABASE_ANON_KEY = '';
    var sb = null;
    var session = null;

    function init() {
        var metaUrl = document.querySelector('meta[name="supabase-url"]');
        var metaKey = document.querySelector('meta[name="supabase-anon-key"]');
        SUPABASE_URL = metaUrl ? metaUrl.content : '';
        SUPABASE_ANON_KEY = metaKey ? metaKey.content : '';

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            showLogin();
            return;
        }

        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        sb.auth.getSession().then(function(res) {
            if (res.data.session) {
                session = res.data.session;
                showDashboard();
            } else {
                showLogin();
            }
        });
    }

    function showLogin() {
        document.getElementById('admLogin').style.display = '';
        document.getElementById('admDashboard').style.display = 'none';
    }

    function showDashboard() {
        document.getElementById('admLogin').style.display = 'none';
        document.getElementById('admDashboard').style.display = '';
        var userEl = document.getElementById('admUser');
        if (userEl && session) userEl.textContent = session.user.email;
        loadStats();
        loadOrders();
    }

    // Login
    var loginForm = document.getElementById('admLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('admEmail').value;
            var password = document.getElementById('admPassword').value;
            var errEl = document.getElementById('admLoginError');

            if (!sb) {
                errEl.textContent = 'Supabase not configured. Set meta tags.';
                errEl.style.display = '';
                return;
            }

            sb.auth.signInWithPassword({ email: email, password: password })
                .then(function(res) {
                    if (res.error) {
                        errEl.textContent = res.error.message;
                        errEl.style.display = '';
                        return;
                    }
                    session = res.data.session;
                    showDashboard();
                });
        });
    }

    // Logout
    window.admLogout = function() {
        if (sb) sb.auth.signOut();
        session = null;
        showLogin();
    };

    // Tabs
    document.querySelectorAll('.adm-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.adm-tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.adm-panel').forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            var panel = document.getElementById('panel-' + tab.dataset.panel);
            if (panel) panel.classList.add('active');

            if (tab.dataset.panel === 'downloads') loadDownloads();
            if (tab.dataset.panel === 'bookings') loadBookings();
        });
    });

    function authHeaders() {
        return { 'Authorization': 'Bearer ' + (session ? session.access_token : ''), 'Content-Type': 'application/json' };
    }

    function loadStats() {
        fetch('/api/admin?action=stats', { headers: authHeaders() })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                setText('statOrders', data.totalOrders || 0);
                setText('statRevenue', formatCurrency(data.totalRevenue || 0));
                setText('statDownloads', data.totalDownloads || 0);
                setText('statBookings', data.totalBookings || 0);

                // EA addon stats
                var ea = data.eaAddonStats || {};
                setText('statEaAddons', ea.count || 0);
                setText('statEaRevenue', formatCurrency(ea.revenue || 0));
                setText('statEaRate', (ea.conversionRate || 0) + '%');
            })
            .catch(function() {});
    }

    function loadOrders() {
        if (!sb) return;
        sb.from('orders').select('*').order('created_at', { ascending: false }).limit(50)
            .then(function(res) {
                var orders = res.data || [];
                var tbody = document.getElementById('ordersBody');
                if (!tbody) return;
                if (orders.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="adm-empty">No orders yet</td></tr>';
                    return;
                }
                tbody.innerHTML = orders.map(function(o) {
                    var meta = o.meta || {};
                    var eaTag = (meta.has_ea_addon || meta.ea_bundle === 'yes')
                        ? ' <span class="adm-badge adm-badge-warning" style="font-size:0.65rem;padding:1px 6px;">+EA</span>'
                        : '';
                    return '<tr>' +
                        '<td>' + esc(o.tx_ref || '-') + '</td>' +
                        '<td>' + esc(o.customer_email || '-') + '</td>' +
                        '<td>' + esc(o.product_id || '-') + eaTag + '</td>' +
                        '<td>' + formatCurrency(o.amount) + '</td>' +
                        '<td>' + badge(o.status) + '</td>' +
                        '<td>' + formatDate(o.created_at) + '</td>' +
                        '<td>' +
                            '<button class="adm-btn adm-btn-sm adm-btn-outline" onclick="admResend(\'' + o.id + '\')">Resend</button> ' +
                            '<button class="adm-btn adm-btn-sm adm-btn-outline" onclick="admGenToken(\'' + o.id + '\')">Token</button>' +
                        '</td>' +
                        '</tr>';
                }).join('');
            });
    }

    function loadDownloads() {
        if (!sb) return;
        sb.from('downloads').select('*').order('downloaded_at', { ascending: false }).limit(50)
            .then(function(res) {
                var downloads = res.data || [];
                var tbody = document.getElementById('downloadsBody');
                if (!tbody) return;
                if (downloads.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="adm-empty">No downloads yet</td></tr>';
                    return;
                }
                tbody.innerHTML = downloads.map(function(d) {
                    return '<tr>' +
                        '<td>' + esc(d.customer_email || '-') + '</td>' +
                        '<td>' + esc(d.product_id || '-') + '</td>' +
                        '<td>' + esc(d.file_name || d.file_key || '-') + '</td>' +
                        '<td>' + esc(d.ip_address || '-') + '</td>' +
                        '<td>' + formatDate(d.downloaded_at) + '</td>' +
                        '</tr>';
                }).join('');
            });
    }

    function loadBookings() {
        if (!sb) return;
        sb.from('mentorship_bookings').select('*').order('created_at', { ascending: false }).limit(50)
            .then(function(res) {
                var bookings = res.data || [];
                var tbody = document.getElementById('bookingsBody');
                if (!tbody) return;
                if (bookings.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="adm-empty">No bookings yet</td></tr>';
                    return;
                }
                tbody.innerHTML = bookings.map(function(b) {
                    return '<tr>' +
                        '<td>' + esc(b.customer_name || '-') + '</td>' +
                        '<td>' + esc(b.customer_email || '-') + '</td>' +
                        '<td>' + esc(b.product_id || '-') + '</td>' +
                        '<td>' + esc((b.preferred_day || '') + ' ' + (b.preferred_time || '')) + '</td>' +
                        '<td>' + badge(b.status) + '</td>' +
                        '<td>' + formatDate(b.created_at) + '</td>' +
                        '</tr>';
                }).join('');
            });
    }

    // Actions
    window.admResend = function(orderId) {
        if (!confirm('Resend fulfillment email for this order?')) return;
        fetch('/api/admin?action=resend', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ orderId: orderId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            alert(data.success ? 'Email resent!' : ('Error: ' + (data.error || 'Unknown')));
        })
        .catch(function() { alert('Network error'); });
    };

    window.admGenToken = function(orderId) {
        fetch('/api/admin?action=token', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ orderId: orderId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                prompt('Download link (copy):', window.location.origin + data.downloadUrl);
            } else {
                alert('Error: ' + (data.error || 'Unknown'));
            }
        })
        .catch(function() { alert('Network error'); });
    };

    // Search
    var searchInput = document.getElementById('admSearchInput');
    if (searchInput) {
        var debounce = null;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounce);
            debounce = setTimeout(function() {
                var q = searchInput.value.trim().toLowerCase();
                var rows = document.querySelectorAll('#ordersBody tr');
                rows.forEach(function(row) {
                    row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
            }, 200);
        });
    }

    // Helpers
    function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
    function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }
    function formatCurrency(n) { return '₦' + Number(n || 0).toLocaleString(); }
    function formatDate(d) { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); } catch(e) { return d; } }
    function badge(status) {
        var cls = 'adm-badge-neutral';
        var s = (status || 'unknown').toLowerCase();
        if (s === 'successful' || s === 'confirmed' || s === 'completed') cls = 'adm-badge-success';
        else if (s === 'pending') cls = 'adm-badge-warning';
        else if (s === 'failed' || s === 'cancelled') cls = 'adm-badge-error';
        return '<span class="adm-badge ' + cls + '">' + esc(status || 'Unknown') + '</span>';
    }

    init();
})();
