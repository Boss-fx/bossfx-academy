// ================================================================
// lib/chart-image.js — branded BossFx chart snapshots for Telegram
// Draws an SVG candlestick chart from the same TwelveData candles the
// bot already fetches (no extra API calls), then rasterises it to PNG
// with resvg. Levels, sessions and trade positions are drawn on top.
// Fonts: Inter (OFL) bundled in assets/fonts/chart.
// ================================================================
'use strict';

const path = require('path');
const fs = require('fs');

const W = 1280, H = 720;
const PLOT = { x0: 36, x1: 1110, y0: 132, y1: 628 };   // right gutter = price tags
const C = {
    bg: '#0B0B0B', panel: '#111111', grid: '#1D1D1D', text: '#F2F2F2', muted: '#7C807D',
    green: '#00B450', red: '#F02828', blue: '#3B82F6', amber: '#F59E0B', white: '#F2F2F2'
};
const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts', 'chart');
const FONT_FILES = ['Inter-Regular.otf', 'Inter-SemiBold.otf', 'Inter-Bold.otf'].map(f => path.join(FONT_DIR, f));

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function fmt(n) {
    if (n == null || isNaN(n)) return '—';
    const abs = Math.abs(n);
    const dp = abs >= 1000 ? 2 : abs >= 10 ? 3 : 5;
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dp });
}
const watTime = (d, opts) => new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'Africa/Lagos', hourCycle: 'h23' }, opts)).format(d);

// opts: { symbol, title, bars:[{t,o,h,l,c}], levels:[{price,label,color,dash}], asia:{start,end},
//         position:{dir,entry,sl,tp,tp2}, badges:[{text,color}], footer }
function buildSvg(opts) {
    const bars = (opts.bars || []).slice(-60);
    if (bars.length < 5) throw new Error('not enough candles to draw');
    const levels = (opts.levels || []).filter(l => l && l.price != null && !isNaN(l.price));
    const pos = opts.position;

    // ---- price scale (candles + every drawn level stays on screen) ----
    let lo = Math.min(...bars.map(b => b.l)), hi = Math.max(...bars.map(b => b.h));
    const extra = levels.map(l => l.price).concat(pos ? [pos.entry, pos.sl, pos.tp, pos.tp2].filter(v => v != null && !isNaN(v)) : []);
    extra.forEach(p => { lo = Math.min(lo, p); hi = Math.max(hi, p); });
    const padP = (hi - lo) * 0.08 || 1; lo -= padP; hi += padP;
    const y = p => PLOT.y0 + (hi - p) / (hi - lo) * (PLOT.y1 - PLOT.y0);

    // Leave room on the right of the last candle for a trade position box.
    const slots = bars.length + (pos ? 10 : 2);
    const cw = (PLOT.x1 - PLOT.x0) / slots;
    const xc = i => PLOT.x0 + cw * (i + 0.5);
    const out = [];

    out.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`);
    // header
    out.push(`<text x="36" y="58" font-family="Inter" font-weight="700" font-size="34" fill="${C.text}">${esc(opts.symbol || 'XAU/USD')}<tspan dx="12" fill="${C.muted}" font-weight="400" font-size="22">· 1H</tspan></text>`);
    out.push(`<text x="36" y="96" font-family="Inter" font-weight="600" font-size="22" fill="${C.green}">${esc(opts.title || 'Key Levels to Watch')}</text>`);
    out.push(`<text x="${W - 36}" y="54" text-anchor="end" font-family="Inter" font-weight="700" font-size="20" letter-spacing="4" fill="${C.text}">BOSSFX ACADEMY</text>`);
    out.push(`<text x="${W - 36}" y="84" text-anchor="end" font-family="Inter" font-size="17" fill="${C.muted}">${esc(watTime(new Date(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))} WAT</text>`);

    // plot panel + watermark
    out.push(`<rect x="${PLOT.x0}" y="${PLOT.y0 - 12}" width="${PLOT.x1 - PLOT.x0}" height="${PLOT.y1 - PLOT.y0 + 24}" rx="10" fill="${C.panel}"/>`);
    out.push(`<text x="${(PLOT.x0 + PLOT.x1) / 2}" y="${(PLOT.y0 + PLOT.y1) / 2 + 40}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="120" letter-spacing="12" fill="#FFFFFF" fill-opacity="0.03">BOSSFX</text>`);

    // grid + price axis (labels drawn after the tags, skipping any a tag would cover)
    const gridLabels = [];
    for (let i = 0; i <= 5; i++) {
        const p = lo + (hi - lo) * i / 5, yy = y(p).toFixed(1);
        out.push(`<line x1="${PLOT.x0}" x2="${PLOT.x1}" y1="${yy}" y2="${yy}" stroke="${C.grid}" stroke-width="1"/>`);
        gridLabels.push({ y: +yy, text: fmt(p) });
    }

    // Asia session band
    if (opts.asia) {
        const s = new Date(opts.asia.start).getTime(), e = new Date(opts.asia.end).getTime();
        const idx = bars.map((b, i) => (new Date(b.t).getTime() >= s && new Date(b.t).getTime() < e) ? i : -1).filter(i => i >= 0);
        if (idx.length) {
            const xa = xc(idx[0]) - cw / 2, xb = xc(idx[idx.length - 1]) + cw / 2;
            out.push(`<rect x="${xa.toFixed(1)}" y="${PLOT.y0 - 12}" width="${(xb - xa).toFixed(1)}" height="${PLOT.y1 - PLOT.y0 + 24}" fill="${C.amber}" fill-opacity="0.06"/>`);
            out.push(`<text x="${((xa + xb) / 2).toFixed(1)}" y="${PLOT.y0 + 10}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="13" letter-spacing="3" fill="${C.amber}" fill-opacity="0.8">ASIA</text>`);
        }
    }

    // time axis (WAT), every 6 candles
    bars.forEach((b, i) => {
        if (i % 6 !== 0) return;
        out.push(`<text x="${xc(i).toFixed(1)}" y="${PLOT.y1 + 36}" text-anchor="middle" font-family="Inter" font-size="13" fill="${C.muted}">${esc(watTime(new Date(b.t), { hour: '2-digit', minute: '2-digit' }))}</text>`);
    });

    // candles
    const bw = Math.max(2, cw * 0.62);
    bars.forEach((b, i) => {
        const col = b.c >= b.o ? C.green : C.red, x = xc(i);
        out.push(`<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y(b.h).toFixed(1)}" y2="${y(b.l).toFixed(1)}" stroke="${col}" stroke-width="${Math.max(1, cw * 0.1).toFixed(1)}"/>`);
        const top = y(Math.max(b.o, b.c)), bot = Math.max(top + 1.5, y(Math.min(b.o, b.c)));
        out.push(`<rect x="${(x - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(bot - top).toFixed(1)}" fill="${col}"/>`);
    });

    // trade position box (signal)
    const tags = [];
    if (pos && pos.entry != null) {
        const xs = xc(bars.length - 1) + cw, xe = PLOT.x1 - 4;
        const box = (a, b, col) => `<rect x="${xs.toFixed(1)}" y="${Math.min(y(a), y(b)).toFixed(1)}" width="${(xe - xs).toFixed(1)}" height="${Math.abs(y(a) - y(b)).toFixed(1)}" fill="${col}" fill-opacity="0.16"/>`;
        if (pos.tp != null) out.push(box(pos.entry, pos.tp, C.green));
        if (pos.sl != null) out.push(box(pos.entry, pos.sl, C.red));
        [[pos.tp2, 'TP2', C.green, true], [pos.tp, 'TP', C.green], [pos.entry, (String(pos.dir).toUpperCase() || 'ENTRY') + ' ENTRY', C.white], [pos.sl, 'SL', C.red]].forEach(([p, lab, col, dash]) => {
            if (p == null || isNaN(p)) return;
            out.push(`<line x1="${xs.toFixed(1)}" x2="${PLOT.x1}" y1="${y(p).toFixed(1)}" y2="${y(p).toFixed(1)}" stroke="${col}" stroke-width="2"${dash ? ' stroke-dasharray="8 6"' : ''}/>`);
            tags.push({ y: y(p), text: `${lab} ${fmt(p)}`, color: col });
        });
    }

    // horizontal levels
    levels.forEach(l => {
        const yy = y(l.price).toFixed(1);
        out.push(`<line x1="${PLOT.x0}" x2="${PLOT.x1}" y1="${yy}" y2="${yy}" stroke="${l.color}" stroke-width="2" stroke-opacity="0.9"${l.dash ? ` stroke-dasharray="${l.dash}"` : ''}/>`);
        tags.push({ y: +yy, text: `${l.label} ${fmt(l.price)}`, color: l.color });
    });

    // current price
    const last = bars[bars.length - 1].c;
    out.push(`<line x1="${xc(bars.length - 1).toFixed(1)}" x2="${PLOT.x1}" y1="${y(last).toFixed(1)}" y2="${y(last).toFixed(1)}" stroke="${C.white}" stroke-width="1" stroke-dasharray="3 4" stroke-opacity="0.7"/>`);
    tags.push({ y: y(last), text: `NOW ${fmt(last)}`, color: C.white, now: true });

    // price tags in the right gutter, pushed apart so they never overlap
    tags.sort((a, b) => a.y - b.y);
    const gap = 26;
    for (let i = 1; i < tags.length; i++) if (tags[i].y - tags[i - 1].y < gap) tags[i].y = tags[i - 1].y + gap;
    const overflow = tags.length ? tags[tags.length - 1].y - (PLOT.y1 + 8) : 0;
    if (overflow > 0) tags.forEach(t => { t.y -= overflow; });
    tags.forEach(t => {
        const tw = Math.max(110, t.text.length * 8.6 + 18);
        out.push(`<rect x="${PLOT.x1 + 4}" y="${(t.y - 12).toFixed(1)}" width="${tw.toFixed(0)}" height="24" rx="5" fill="${t.color}"/>`);
        out.push(`<text x="${PLOT.x1 + 13}" y="${(t.y + 5).toFixed(1)}" font-family="Inter" font-weight="700" font-size="13.5" fill="${C.bg}">${esc(t.text)}</text>`);
    });

    gridLabels.filter(g => !tags.some(t => Math.abs(t.y - g.y) < 16)).forEach(g => {
        out.push(`<text x="${PLOT.x1 + 12}" y="${g.y + 5}" font-family="Inter" font-size="14" fill="${C.muted}">${g.text}</text>`);
    });

    // badges — in the header, right after the title
    let bx = 36 + String(opts.title || 'Key Levels to Watch').length * 11.6 + 18;
    (opts.badges || []).forEach(bd => {
        const tw = bd.text.length * 9.7 + 24;
        out.push(`<rect x="${bx.toFixed(0)}" y="76" width="${tw.toFixed(0)}" height="26" rx="13" fill="${bd.color || C.green}" fill-opacity="0.16" stroke="${bd.color || C.green}" stroke-opacity="0.7"/>`);
        out.push(`<text x="${(bx + 11).toFixed(0)}" y="94" font-family="Inter" font-weight="700" font-size="13" letter-spacing="1" fill="${bd.color || C.green}">${esc(bd.text)}</text>`);
        bx += tw + 10;
    });

    // footer
    out.push(`<text x="36" y="${H - 22}" font-family="Inter" font-size="15" fill="${C.muted}">${esc(opts.footer || 'Reference levels, not signals · Educational only — not financial advice')}</text>`);
    out.push(`<text x="${W - 36}" y="${H - 22}" text-anchor="end" font-family="Inter" font-weight="600" font-size="15" fill="${C.green}">bossfxcademy.com</text>`);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
}

function toPng(svg) {
    const { Resvg } = require('@resvg/resvg-js');
    const fontFiles = FONT_FILES.filter(f => fs.existsSync(f));
    const r = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' } });
    return r.render().asPng();
}

// ---- presets ----
function levelLines(lv) {
    return [
        { price: lv.pdh, label: 'PDH', color: C.blue, dash: '10 6' },
        { price: lv.pdl, label: 'PDL', color: C.blue, dash: '10 6' },
        { price: lv.asiaH, label: 'ASIA H', color: C.amber },
        { price: lv.asiaM, label: 'ASIA M', color: C.amber, dash: '3 5' },
        { price: lv.asiaL, label: 'ASIA L', color: C.amber }
    ];
}
function levelsPng(lv, title) {
    const badge = /above/.test(lv.context) ? { text: 'BREAKING ABOVE PRIOR-DAY HIGH', color: C.green }
        : /below/.test(lv.context) ? { text: 'BREAKING BELOW PRIOR-DAY LOW', color: C.red } : { text: 'INSIDE PRIOR-DAY RANGE', color: C.muted };
    return toPng(buildSvg({ symbol: lv.symbol, title: title || 'Key Levels to Watch', bars: lv.bars, asia: lv.asia, levels: levelLines(lv), badges: [badge] }));
}
function reviewPng(lv) {
    const badges = [];
    if (lv.asiaH != null && lv.todayH > lv.asiaH) badges.push({ text: 'SWEPT ASIA HIGH', color: C.amber });
    if (lv.asiaL != null && lv.todayL < lv.asiaL) badges.push({ text: 'SWEPT ASIA LOW', color: C.amber });
    if (lv.pdh != null && lv.todayH > lv.pdh) badges.push({ text: 'TOOK PDH', color: C.blue });
    if (lv.pdl != null && lv.todayL < lv.pdl) badges.push({ text: 'TOOK PDL', color: C.blue });
    if (!badges.length) badges.push({ text: 'LEVELS HELD', color: C.muted });
    return toPng(buildSvg({ symbol: lv.symbol, title: 'Daily Review', bars: lv.bars, asia: lv.asia, levels: levelLines(lv), badges, footer: 'How price behaved at the levels · Educational only — not financial advice' }));
}
function signalPng(o, bars) {
    const dir = String(o.direction || '').toLowerCase().startsWith('b') ? 'BUY' : 'SELL';
    return toPng(buildSvg({
        symbol: o.symbolLabel, title: `${dir} setup${o.session ? ' · ' + o.session : ''}`, bars,
        position: { dir, entry: +o.entry, sl: +o.sl, tp: +o.tp, tp2: o.tp2 != null && o.tp2 !== '' ? +o.tp2 : null },
        badges: [{ text: dir, color: dir === 'BUY' ? C.green : C.red }],
        footer: 'BossFx setup · Educational only — not financial advice · Risk 1–2% max'
    }));
}

module.exports = { buildSvg, toPng, levelsPng, reviewPng, signalPng };
