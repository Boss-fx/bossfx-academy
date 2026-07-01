// ================================================================
// BossFx OS — Shared Component Library
// Reusable UI builders for all dashboard modules
// ================================================================

var BFX = (function () {
    'use strict';

    function esc(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    function naira(n) { return '₦' + Number(n || 0).toLocaleString('en-NG'); }
    function num(n) { return Number(n || 0).toLocaleString('en-NG'); }
    function pct(n) { return (n || 0) + '%'; }

    function shortDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function timeAgo(iso) {
        if (!iso) return '—';
        var diff = Date.now() - new Date(iso).getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + 'm ago';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h ago';
        return Math.floor(hrs / 24) + 'd ago';
    }

    var PRODUCT_NAMES = {
        'forex-101': "Forex 101: The Trader’s Bible",
        'mentorship-group': 'Group Mentorship',
        'mentorship-1on1': '1-on-1 Mentorship',
        'vip': 'VIP Program',
        'ea-bundle': 'SMA Pro Trend EA'
    };

    function productName(pid) { return PRODUCT_NAMES[pid] || pid || 'Unknown'; }

    // --- Component: Section Header ---
    function sectionHeader(title, subtitle, actionsHtml) {
        return '<div class="fdr-section-head"><div><h2 class="fdr-section-title">' + esc(title) + '</h2>' +
            (subtitle ? '<p class="fdr-section-subtitle">' + esc(subtitle) + '</p>' : '') +
            '</div>' + (actionsHtml ? '<div class="fdr-section-actions">' + actionsHtml + '</div>' : '') + '</div>';
    }

    // --- Component: Metric Card ---
    function metric(label, value, color, sub) {
        return '<div class="fdr-metric"><div class="fdr-metric-label">' + esc(label) + '</div>' +
            '<div class="fdr-metric-value' + (color ? ' ' + color : '') + '">' + value + '</div>' +
            (sub ? '<div class="fdr-metric-sub">' + esc(sub) + '</div>' : '') + '</div>';
    }

    function metricGrid(items) {
        return '<div class="fdr-metrics">' + items.map(function (m) {
            return metric(m[0], m[1], m[2], m[3]);
        }).join('') + '</div>';
    }

    // --- Component: Card ---
    function card(title, contentHtml, badgeHtml, actionsHtml) {
        var header = '';
        if (title) {
            header = '<div class="fdr-card-header"><span class="fdr-card-title">' + esc(title) + '</span>' +
                (badgeHtml || actionsHtml ? '<div style="display:flex;align-items:center;gap:8px;">' + (badgeHtml || '') + (actionsHtml || '') + '</div>' : '') + '</div>';
        }
        return '<div class="fdr-card">' + header + contentHtml + '</div>';
    }

    // --- Component: Badge ---
    function badge(text, color) {
        return '<span class="fdr-badge fdr-badge-' + (color || 'dim') + '">' + esc(text) + '</span>';
    }

    function statusBadge(status) {
        var colors = { fulfilled: 'green', completed: 'green', active: 'green', healthy: 'green', configured: 'green', connected: 'green', pending: 'amber', warning: 'amber', running: 'blue', scheduled: 'blue', cancelled: 'red', failed: 'red', error: 'red', inactive: 'dim', idle: 'dim', paused: 'dim' };
        return badge(status, colors[status] || 'blue');
    }

    // --- Component: Table ---
    function table(headers, rows, emptyMsg) {
        var html = '<div class="fdr-table-wrap"><table class="fdr-table"><thead><tr>';
        headers.forEach(function (h) { html += '<th>' + esc(h) + '</th>'; });
        html += '</tr></thead><tbody>';
        if (!rows || !rows.length) {
            html += '<tr><td colspan="' + headers.length + '" class="fdr-table-empty">' + esc(emptyMsg || 'No data available') + '</td></tr>';
        } else {
            rows.forEach(function (row) {
                html += '<tr>';
                row.forEach(function (cell) { html += '<td>' + cell + '</td>'; });
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    }

    // --- Component: Trend Chart ---
    function trendChart(trend) {
        if (!trend || !trend.length) return '<div class="fdr-table-empty">No trend data</div>';
        var maxRev = Math.max.apply(null, trend.map(function (t) { return t.revenue; }));
        if (maxRev === 0) maxRev = 1;
        return '<div class="fdr-trend"><div class="fdr-trend-chart">' + trend.map(function (t) {
            var h = Math.max(2, Math.round((t.revenue / maxRev) * 120));
            var label = t.date.substring(5);
            return '<div class="fdr-trend-bar-wrap" title="' + label + ': ' + naira(t.revenue) + '"><div class="fdr-trend-bar" style="height:' + h + 'px"></div><span class="fdr-trend-label">' + label + '</span></div>';
        }).join('') + '</div></div>';
    }

    // --- Component: Product Breakdown ---
    function productBreakdown(products) {
        var keys = Object.keys(products || {});
        if (!keys.length) return '<div class="fdr-table-empty">No product data</div>';
        var totalRev = keys.reduce(function (s, k) { return s + products[k].revenue; }, 0);
        keys.sort(function (a, b) { return products[b].revenue - products[a].revenue; });
        return keys.map(function (k) {
            var p = products[k];
            var pctVal = totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0;
            return '<div class="fdr-product-bar"><div class="fdr-product-bar-header"><span class="fdr-product-bar-name">' + productName(k) + ' <span style="color:var(--fdr-dim)">(' + num(p.count) + ')</span></span><span class="fdr-product-bar-value">' + naira(p.revenue) + '</span></div><div class="fdr-product-bar-track"><div class="fdr-product-bar-fill" style="width:' + pctVal + '%;background:var(--fdr-green)"></div></div></div>';
        }).join('');
    }

    // --- Component: Orders Table ---
    function ordersTable(orders, showRef) {
        var headers = showRef ? ['Reference', 'Customer', 'Product', 'Amount', 'Status', 'Date', 'Actions'] : ['Customer', 'Product', 'Amount', 'Status', 'Date', 'Actions'];
        if (!orders || !orders.length) return table(headers, [], 'No orders yet');
        var rows = orders.map(function (o) {
            var cells = [];
            if (showRef) cells.push(esc((o.txRef || '').substring(0, 20)));
            cells.push(esc(o.customerName || o.customerEmail || '—'));
            cells.push(productName(o.productId) + (o.hasEa ? ' <span class="fdr-badge fdr-badge-ea">+EA</span>' : ''));
            cells.push(naira(o.amount));
            cells.push(statusBadge(o.fulfilled ? 'fulfilled' : (o.status || 'pending')));
            cells.push(timeAgo(o.createdAt));
            cells.push('<button class="fdr-btn fdr-btn-outline fdr-btn-xs" onclick="fdrResend(\'' + o.id + '\')">Resend</button>');
            return cells;
        });
        return table(headers, rows);
    }

    // --- Component: Empty State ---
    function emptyState(icon, title, desc, btnHtml) {
        return '<div class="fdr-empty"><div class="fdr-empty-icon">' + icon + '</div><div class="fdr-empty-title">' + esc(title) + '</div><div class="fdr-empty-desc">' + esc(desc) + '</div>' + (btnHtml || '') + '</div>';
    }

    // --- Component: Service Link ---
    function serviceLink(name, detail, url, iconBg, iconChar) {
        return '<a href="' + esc(url) + '" target="_blank" rel="noopener" class="fdr-service"><div class="fdr-service-icon" style="background:' + iconBg + '">' + iconChar + '</div><div class="fdr-service-info"><div class="fdr-service-name">' + esc(name) + '</div><div class="fdr-service-detail">' + esc(detail) + '</div></div><span class="fdr-service-arrow">&rarr;</span></a>';
    }

    // --- Component: Setting Row ---
    function settingRow(label, sublabel, rightHtml) {
        return '<div class="fdr-setting-row"><span class="fdr-setting-row-label"><strong>' + esc(label) + '</strong>' + (sublabel ? '<small>' + esc(sublabel) + '</small>' : '') + '</span>' + (rightHtml || '') + '</div>';
    }

    // --- Component: Health Card ---
    function healthCard(name, status, detail) {
        var dotClass = (status === 'healthy' || status === 'configured' || status === 'connected') ? 'green' : (status === 'error' ? 'red' : 'amber');
        var statusLabel = status === 'healthy' ? 'Healthy' : status === 'configured' ? 'Configured' : status === 'error' ? 'Error' : status === 'connected' ? 'Connected' : status;
        return '<div class="fdr-health-card"><div class="fdr-health-card-name"><span class="fdr-status-dot ' + dotClass + '"></span>' + esc(name) + '</div><div class="fdr-health-card-status" style="color:var(--fdr-' + dotClass + ')">' + esc(statusLabel) + '</div><div class="fdr-health-card-detail">' + esc(detail) + '</div></div>';
    }

    // --- Component: AI Role Card ---
    function aiCard(role) {
        return '<div class="fdr-ai-card"><div class="fdr-ai-card-header"><div class="fdr-ai-card-icon ' + role.color + '">' + role.title.charAt(0) + '</div><div><div class="fdr-ai-card-title">' + esc(role.title) + '</div><div class="fdr-ai-card-subtitle">' + esc(role.subtitle) + '</div></div></div><p class="fdr-ai-card-purpose">' + esc(role.purpose) + '</p><div class="fdr-ai-card-footer">' + badge('Active', role.color) + '<span style="color:var(--fdr-dim);font-size:12px;">' + esc(role.cadence) + '</span></div></div>';
    }

    // --- Component: Alert ---
    function alert(type, text) {
        var icons = { success: '✓', warn: '⚠', error: '✗', info: 'ℹ' };
        return '<div class="fdr-alert fdr-alert-' + type + '"><span>' + (icons[type] || '') + '</span><span>' + esc(text) + '</span></div>';
    }

    // --- Component: Activity Item ---
    function activityItem(color, text, time) {
        return '<li class="fdr-activity-item"><span class="fdr-activity-dot" style="background:var(--fdr-' + color + ')"></span><div class="fdr-activity-content"><div class="fdr-activity-text">' + text + '</div><div class="fdr-activity-time">' + esc(time) + '</div></div></li>';
    }

    // --- Component: Automation Card ---
    function autoCard(name, desc, status, schedule, lastRun) {
        return '<div class="fdr-auto-card"><div class="fdr-auto-header"><span class="fdr-auto-name"><span class="fdr-status-dot ' + (status === 'active' ? 'green' : status === 'error' ? 'red' : 'dim') + '"></span>' + esc(name) + '</span>' + statusBadge(status) + '</div><div class="fdr-auto-desc">' + esc(desc) + '</div><div class="fdr-auto-meta"><span>Schedule: ' + esc(schedule) + '</span>' + (lastRun ? '<span>Last run: ' + esc(lastRun) + '</span>' : '') + '</div></div>';
    }

    // --- Component: Tabs ---
    function tabs(items, activeId, onclickFn) {
        return '<div class="fdr-tabs">' + items.map(function (item) {
            return '<button class="fdr-tab' + (item.id === activeId ? ' active' : '') + '" onclick="' + onclickFn + '(\'' + item.id + '\')">' + esc(item.label) + '</button>';
        }).join('') + '</div>';
    }

    // --- Component: Progress Bar ---
    function progressBar(value, max, color) {
        var pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
        return '<div class="fdr-progress"><div class="fdr-progress-fill ' + (color || 'green') + '" style="width:' + pctVal + '%"></div></div>';
    }

    // --- Component: Goals List ---
    function goalsList(period, goals) {
        if (!goals.length) return '<ul class="fdr-goals"><li class="fdr-goal-empty">No goals set. Add one below.</li></ul>';
        return '<ul class="fdr-goals">' + goals.map(function (g, i) {
            return '<li class="fdr-goal-item' + (g.done ? ' done' : '') + '"><label><input type="checkbox" ' + (g.done ? 'checked' : '') + ' onchange="fdrToggleGoal(\'' + period + '\',' + i + ')"><span>' + esc(g.text) + '</span></label><button class="fdr-goal-del" onclick="fdrDeleteGoal(\'' + period + '\',' + i + ')">&times;</button></li>';
        }).join('') + '</ul>';
    }

    function goalsCard(title, period) {
        return '<div class="fdr-card"><div class="fdr-card-header"><span class="fdr-card-title">' + esc(title) + '</span></div><div id="goals-' + period + '"></div><div class="fdr-goal-add"><input type="text" id="goalInput-' + period + '" placeholder="Add ' + period + ' goal..."><button class="fdr-btn fdr-btn-primary fdr-btn-sm" onclick="fdrAddGoal(\'' + period + '\')">Add</button></div></div>';
    }

    // --- Component: Modal ---
    function modal(title, contentHtml, footerHtml) {
        return '<div class="fdr-modal-header"><span class="fdr-modal-title">' + esc(title) + '</span>' +
            '<button class="fdr-modal-close" onclick="fdrCloseModal()">&times;</button></div>' +
            '<div class="fdr-modal-body">' + contentHtml + '</div>' +
            (footerHtml ? '<div class="fdr-modal-footer">' + footerHtml + '</div>' : '');
    }

    // --- Component: Drawer ---
    function drawer(title, contentHtml) {
        return '<div class="fdr-drawer-header"><span class="fdr-drawer-title">' + esc(title) + '</span>' +
            '<button class="fdr-drawer-close" onclick="fdrCloseDrawer()">&times;</button></div>' +
            '<div class="fdr-drawer-body">' + contentHtml + '</div>';
    }

    // --- Component: Timeline ---
    function timeline(items) {
        if (!items || !items.length) return '<div class="fdr-timeline-empty">No activity yet</div>';
        var colors = { order: 'green', download: 'blue', login: 'purple', system: 'amber', error: 'red', command: 'cyan', nav: 'dim', data: 'green' };
        return '<ul class="fdr-timeline">' + items.map(function (item) {
            var c = colors[item.type] || 'dim';
            return '<li class="fdr-timeline-item"><span class="fdr-timeline-dot" style="background:var(--fdr-' + c + ')"></span>' +
                '<div class="fdr-timeline-content"><div class="fdr-timeline-text">' + esc(item.text) + '</div>' +
                '<div class="fdr-timeline-time">' + timeAgo(item.time) + '</div></div></li>';
        }).join('') + '</ul>';
    }

    // --- Component: Breadcrumbs ---
    function breadcrumbs(items) {
        return '<nav class="fdr-breadcrumbs">' + items.map(function (item, i) {
            var sep = i < items.length - 1 ? '<span class="fdr-crumb-sep">/</span>' : '';
            if (item.action) return '<a class="fdr-crumb" href="#" onclick="' + item.action + ';return false;">' + esc(item.label) + '</a>' + sep;
            return '<span class="fdr-crumb active">' + esc(item.label) + '</span>';
        }).join('') + '</nav>';
    }

    // --- Component: Filter Bar ---
    function filterBar(filters, activeId, onclickFn) {
        return '<div class="fdr-filters">' + filters.map(function (f) {
            return '<button class="fdr-filter' + (f.id === activeId ? ' active' : '') + '" onclick="' + onclickFn + '(\'' + f.id + '\')">' +
                esc(f.label) + (f.count !== undefined ? ' <span class="fdr-filter-count">' + f.count + '</span>' : '') + '</button>';
        }).join('') + '</div>';
    }

    // --- Component: Quick Action ---
    function quickAction(icon, label, onclick) {
        return '<button class="fdr-quick-action" onclick="' + onclick + '">' +
            '<span class="fdr-quick-icon">' + icon + '</span><span class="fdr-quick-label">' + esc(label) + '</span></button>';
    }

    // --- Component: Search Result ---
    function searchResult(item) {
        return '<div class="fdr-search-result" data-id="' + esc(item.id || '') + '" data-module="' + esc(item.module || '') + '">' +
            '<div class="fdr-search-result-badge">' + badge(item.type || 'item', 'dim') + '</div>' +
            '<div class="fdr-search-result-content"><div class="fdr-search-result-label">' + esc(item.label) + '</div>' +
            (item.detail ? '<div class="fdr-search-result-detail">' + esc(item.detail) + '</div>' : '') + '</div></div>';
    }

    // --- Component: Keyboard Hint ---
    function kbdHint(key) {
        return '<kbd class="fdr-kbd">' + esc(key) + '</kbd>';
    }

    // Public API
    return {
        esc: esc, naira: naira, num: num, pct: pct, shortDate: shortDate, timeAgo: timeAgo,
        productName: productName, PRODUCT_NAMES: PRODUCT_NAMES,
        sectionHeader: sectionHeader, metric: metric, metricGrid: metricGrid,
        card: card, badge: badge, statusBadge: statusBadge, table: table,
        trendChart: trendChart, productBreakdown: productBreakdown,
        ordersTable: ordersTable, emptyState: emptyState, serviceLink: serviceLink,
        settingRow: settingRow, healthCard: healthCard, aiCard: aiCard,
        alert: alert, activityItem: activityItem, autoCard: autoCard,
        tabs: tabs, progressBar: progressBar, goalsList: goalsList, goalsCard: goalsCard,
        modal: modal, drawer: drawer, timeline: timeline, breadcrumbs: breadcrumbs,
        filterBar: filterBar, quickAction: quickAction, searchResult: searchResult, kbdHint: kbdHint
    };
})();
