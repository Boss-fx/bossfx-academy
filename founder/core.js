// ================================================================
// BossFx OS — Core Infrastructure
// Event Bus, State Store, API Layer, Search, Commands,
// Notifications, Activity, Workspaces, Permissions, Theme, Nav
// ================================================================

var OS = (function () {
    'use strict';

    // ============================================================
    // EVENT BUS — Pub/sub for decoupled module communication
    // ============================================================

    var _listeners = {};

    function on(evt, fn) {
        if (!_listeners[evt]) _listeners[evt] = [];
        _listeners[evt].push(fn);
        return function () { off(evt, fn); };
    }

    function off(evt, fn) {
        var list = _listeners[evt];
        if (list) _listeners[evt] = list.filter(function (f) { return f !== fn; });
    }

    function emit(evt, data) {
        (_listeners[evt] || []).forEach(function (fn) {
            try { fn(data); } catch (e) { console.error('[OS] Event error:', evt, e); }
        });
        (_listeners['*'] || []).forEach(function (fn) {
            try { fn(evt, data); } catch (e) {}
        });
    }

    // ============================================================
    // STATE STORE — Centralized application state with watchers
    // ============================================================

    var _state = {
        session: null,
        dashData: null,
        sysData: null,
        activeSection: 'ceo',
        theme: 'dark',
        recentPages: [],
        favorites: [],
        loading: false
    };
    var _watchers = {};

    try { _state.recentPages = JSON.parse(localStorage.getItem('bfx_recent') || '[]'); } catch (e) {}
    try { _state.favorites = JSON.parse(localStorage.getItem('bfx_favorites') || '[]'); } catch (e) {}
    _state.theme = localStorage.getItem('bfx_theme') || 'dark';

    function storeGet(key) { return _state[key]; }

    function storeSet(key, val) {
        var prev = _state[key];
        _state[key] = val;
        emit('state:' + key, { value: val, prev: prev });
        (_watchers[key] || []).forEach(function (fn) {
            try { fn(val, prev); } catch (e) { console.error('[OS] Watcher error:', key, e); }
        });
    }

    function storeWatch(key, fn) {
        if (!_watchers[key]) _watchers[key] = [];
        _watchers[key].push(fn);
        return function () {
            _watchers[key] = (_watchers[key] || []).filter(function (f) { return f !== fn; });
        };
    }

    // ============================================================
    // API LAYER — Shared data fetching with standardized responses
    // ============================================================

    function apiHeaders() {
        var s = _state.session;
        return {
            'Authorization': 'Bearer ' + (s ? s.access_token : ''),
            'Content-Type': 'application/json'
        };
    }

    function apiGet(action) {
        return fetch('/api/admin?action=' + action, { headers: apiHeaders() })
            .then(function (r) {
                if (!r.ok) throw new Error('API ' + action + ': ' + r.status);
                return r.json();
            });
    }

    function apiPost(action, body) {
        return fetch('/api/admin?action=' + action, {
            method: 'POST', headers: apiHeaders(), body: JSON.stringify(body)
        }).then(function (r) {
            if (!r.ok) throw new Error('API ' + action + ': ' + r.status);
            return r.json();
        });
    }

    function apiSupabase() {
        var url = document.querySelector('meta[name="supabase-url"]').content;
        var key = document.querySelector('meta[name="supabase-anon-key"]').content;
        return window.supabase.createClient(url, key, {
            global: { headers: { Authorization: 'Bearer ' + _state.session.access_token } }
        });
    }

    var api = {
        headers: apiHeaders,
        get: apiGet,
        post: apiPost,
        supabase: apiSupabase,
        dashboard: function () { return apiGet('founder'); },
        system: function () { return apiGet('system'); },
        resend: function (id) { return apiPost('resend', { orderId: id }); }
    };

    // ============================================================
    // DATA ADAPTERS — Normalize external service data
    // ============================================================

    var adapters = {
        orders: function (raw) {
            return (raw || []).map(function (o) {
                return {
                    id: o.id, txRef: o.tx_ref || o.txRef || '',
                    customerEmail: o.customer_email || o.customerEmail || '',
                    customerName: o.customer_name || o.customerName || '',
                    productId: o.product_id || o.productId || '',
                    amount: Number(o.amount || 0),
                    status: o.status || 'pending',
                    fulfilled: !!o.fulfilled,
                    hasEa: !!(o.meta && o.meta.has_ea_addon) || !!o.hasEa,
                    createdAt: o.created_at || o.createdAt || '',
                    meta: o.meta || {}
                };
            });
        },
        downloads: function (raw) {
            return (raw || []).map(function (d) {
                return { id: d.id, email: d.customer_email || '', productId: d.product_id || '', downloadedAt: d.downloaded_at || '' };
            });
        },
        bookings: function (raw) {
            return (raw || []).map(function (b) {
                return { id: b.id, name: b.customer_name || '', email: b.customer_email || '', productId: b.product_id || '', status: b.status || 'pending', createdAt: b.created_at || '' };
            });
        },
        brevo: function (raw) {
            if (!raw) return { status: 'unknown', lists: [], totalSubscribers: 0, plan: '' };
            return {
                status: raw.status || 'unknown', plan: raw.plan || '',
                totalSubscribers: raw.totalSubscribers || 0,
                lists: (raw.lists || []).map(function (l) {
                    return { id: l.id, name: l.name, subscribers: l.subscribers || l.totalSubscribers || 0 };
                })
            };
        },
        health: function (sys) {
            if (!sys) return [];
            var sb = sys.supabase || {}, br = sys.brevo || {}, fw = sys.flutterwave || {}, vc = sys.vercel || {};
            return [
                { name: 'Supabase', status: sb.status || 'unknown', detail: sb.status === 'healthy' ? (sb.orderCount || 0) + ' orders' : (sb.message || 'N/A') },
                { name: 'Brevo', status: br.status || 'unknown', detail: br.status === 'healthy' ? 'Plan: ' + br.plan : (br.message || 'N/A') },
                { name: 'Flutterwave', status: fw.status || 'unknown', detail: fw.status === 'configured' ? 'Webhook: ' + (fw.webhookHash ? 'OK' : 'Missing') : 'N/A' },
                { name: 'Vercel', status: 'configured', detail: (vc.env || 'production') + ' / ' + vc.functionsUsed + '/' + vc.functionsLimit + ' fn' }
            ];
        }
    };

    // ============================================================
    // SEARCH ENGINE — Global search across all entities
    // ============================================================

    var _idx = {};

    var search = {
        register: function (mod, items) { _idx[mod] = items; },
        query: function (term) {
            if (!term || term.length < 2) return [];
            var q = term.toLowerCase(), results = [];
            Object.keys(_idx).forEach(function (mod) {
                (_idx[mod] || []).forEach(function (item) {
                    if ((item.label + ' ' + (item.detail || '')).toLowerCase().indexOf(q) >= 0) {
                        results.push({ module: mod, id: item.id, label: item.label, detail: item.detail, type: item.type || mod, action: item.action });
                    }
                });
            });
            return results.slice(0, 25);
        },
        clear: function (mod) { if (mod) delete _idx[mod]; else _idx = {}; }
    };

    // ============================================================
    // COMMAND REGISTRY — Centralized command system
    // ============================================================

    var _cmds = [];

    var commands = {
        register: function (items) {
            items.forEach(function (item) {
                var i = _cmds.findIndex(function (c) { return c.id === item.id; });
                if (i >= 0) _cmds[i] = item; else _cmds.push(item);
            });
        },
        search: function (q) {
            if (!q) return _cmds.slice(0, 25);
            var ql = q.toLowerCase();
            return _cmds.filter(function (c) {
                return c.label.toLowerCase().indexOf(ql) >= 0 || (c.keywords || '').toLowerCase().indexOf(ql) >= 0;
            }).slice(0, 25);
        },
        execute: function (id) {
            var cmd = _cmds.find(function (c) { return c.id === id; });
            if (cmd && cmd.action) {
                cmd.action();
                activity.log('command', cmd.label);
                emit('command:executed', cmd);
            }
        },
        all: function () { return _cmds; }
    };

    // ============================================================
    // NOTIFICATION SERVICE — Centralized with read/unread, priority
    // ============================================================

    var _nid = 0, _notifs = [];

    var notifications = {
        add: function (title, body, type, opts) {
            opts = opts || {};
            var n = {
                id: ++_nid, title: title, body: body, type: type || 'info',
                time: new Date().toISOString(), read: false,
                priority: opts.priority || 'normal', source: opts.source || 'system'
            };
            _notifs.unshift(n);
            if (_notifs.length > 100) _notifs = _notifs.slice(0, 100);
            emit('notification:added', n);
            return n.id;
        },
        markRead: function (id) {
            var n = _notifs.find(function (x) { return x.id === id; });
            if (n) { n.read = true; emit('notification:read', n); }
        },
        markAllRead: function () {
            _notifs.forEach(function (n) { n.read = true; });
            emit('notification:allRead');
        },
        clear: function () { _notifs = []; emit('notification:cleared'); },
        unreadCount: function () { return _notifs.filter(function (n) { return !n.read; }).length; },
        all: function () { return _notifs; }
    };

    // ============================================================
    // ACTIVITY FEED — Unified timeline of all events
    // ============================================================

    var _aid = 0, _acts = [];

    var activity = {
        log: function (type, text, meta) {
            var e = { id: ++_aid, type: type, text: text, time: new Date().toISOString(), meta: meta || {} };
            _acts.unshift(e);
            if (_acts.length > 200) _acts = _acts.slice(0, 200);
            emit('activity:logged', e);
            return e.id;
        },
        all: function () { return _acts; },
        recent: function (n) { return _acts.slice(0, n || 20); },
        byType: function (type) { return _acts.filter(function (a) { return a.type === type; }); },
        clear: function () { _acts = []; emit('activity:cleared'); }
    };

    // ============================================================
    // WORKSPACE REGISTRY — Module registration system
    // ============================================================

    var _ws = {};

    var workspaces = {
        register: function (id, cfg) {
            _ws[id] = {
                id: id, label: cfg.label || id, icon: cfg.icon || '',
                category: cfg.category || 'general',
                permissions: cfg.permissions || ['founder']
            };
            if (cfg.commands) commands.register(cfg.commands);
            emit('workspace:registered', _ws[id]);
        },
        get: function (id) { return _ws[id]; },
        all: function () { return _ws; },
        list: function () { return Object.keys(_ws).map(function (k) { return _ws[k]; }); }
    };

    // ============================================================
    // PERMISSION ARCHITECTURE — Role-based access (future-ready)
    // ============================================================

    var ROLES = {
        founder: { level: 100, modules: '*' },
        ceo: { level: 90, modules: '*' },
        coo: { level: 80, modules: ['operations', 'automation', 'finance', 'analytics', 'settings'] },
        marketing: { level: 50, modules: ['marketing', 'analytics', 'students'] },
        sales: { level: 50, modules: ['sales', 'students', 'finance'] },
        support: { level: 40, modules: ['students', 'sales'] },
        instructor: { level: 40, modules: ['students'] },
        finance: { level: 50, modules: ['finance', 'sales'] },
        administrator: { level: 95, modules: '*' }
    };
    var _role = 'founder';

    var permissions = {
        ROLES: ROLES,
        canAccess: function (mod) {
            var r = ROLES[_role];
            return r && (r.modules === '*' || r.modules.indexOf(mod) >= 0);
        },
        getRole: function () { return _role; },
        setRole: function (r) { if (ROLES[r]) { _role = r; emit('role:changed', r); } }
    };

    // ============================================================
    // THEME SYSTEM — Dark/light mode with CSS custom properties
    // ============================================================

    var theme = {
        set: function (mode) {
            document.documentElement.setAttribute('data-theme', mode);
            localStorage.setItem('bfx_theme', mode);
            storeSet('theme', mode);
            emit('theme:changed', mode);
        },
        toggle: function () {
            theme.set(_state.theme === 'dark' ? 'light' : 'dark');
        },
        current: function () { return _state.theme; }
    };

    document.documentElement.setAttribute('data-theme', _state.theme);

    // ============================================================
    // NAVIGATION — Enhanced with history, recents, favorites
    // ============================================================

    var nav = {
        go: function (section) {
            var prev = _state.activeSection;
            storeSet('activeSection', section);
            var recent = _state.recentPages.filter(function (r) { return r !== section; });
            recent.unshift(section);
            _state.recentPages = recent.slice(0, 10);
            localStorage.setItem('bfx_recent', JSON.stringify(_state.recentPages));
            activity.log('nav', 'Opened ' + section);
            emit('nav:changed', { section: section, prev: prev });
        },
        toggleFavorite: function (section) {
            var f = _state.favorites, i = f.indexOf(section);
            if (i >= 0) f.splice(i, 1); else f.push(section);
            localStorage.setItem('bfx_favorites', JSON.stringify(f));
            emit('nav:favorites', f);
        },
        isFavorite: function (s) { return _state.favorites.indexOf(s) >= 0; },
        recent: function () { return _state.recentPages; },
        favorites: function () { return _state.favorites; }
    };

    // ============================================================
    // KEYBOARD SHORTCUTS — Global shortcut manager
    // ============================================================

    var _sc = {};

    var shortcuts = {
        register: function (combo, fn, label) {
            _sc[combo] = { handler: fn, label: label || combo };
        },
        all: function () { return _sc; }
    };

    document.addEventListener('keydown', function (e) {
        var combo = '';
        if (e.metaKey || e.ctrlKey) combo += 'mod+';
        if (e.shiftKey) combo += 'shift+';
        if (e.altKey) combo += 'alt+';
        combo += e.key.toLowerCase();
        var sc = _sc[combo];
        if (sc) { e.preventDefault(); sc.handler(e); }
    });

    // ============================================================
    // PUBLIC API
    // ============================================================

    return {
        events: { on: on, off: off, emit: emit },
        store: { get: storeGet, set: storeSet, watch: storeWatch },
        api: api,
        adapters: adapters,
        search: search,
        commands: commands,
        notifications: notifications,
        activity: activity,
        workspaces: workspaces,
        permissions: permissions,
        theme: theme,
        nav: nav,
        shortcuts: shortcuts
    };
})();
