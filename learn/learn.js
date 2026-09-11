// ================================================================
// BFX.learn — Student area (auth + course progress + entitlement)
// Client-side Supabase via BFX.auth. Progress in `lesson_progress`
// and paid access in `enrollments` — both RLS-gated per user.
// Forex 101 = free intro (modules 01-03) + paid full (04-12).
// No serverless functions used on the read path.
// ================================================================
var BFX = window.BFX || {};

BFX.learn = (function () {
    'use strict';

    // Course catalog — Forex 101's 12 modules mirror courses.html
    // (the public curriculum). `free:true` = open to any signed-in
    // student; the rest unlock with an active `forex-101` enrollment.
    // `video` holds a YouTube video ID (unlisted) once uploaded.
    var COURSES = {
        'forex-101': {
            title: 'Forex 101 — The Trader\'s Bible',
            blurb: 'Your 12-module foundation, from market basics to a complete trading plan.',
            priceNGN: 25000,
            enrollUrl: '/courses.html#forex101',
            freeCount: 3,
            lessons: [
                { id: 'module-01', n: '01', title: 'Introduction to Forex', blurb: 'What forex is, how it works, and why it matters', video: '/media/lessons/module-01.mp4', free: true,
                  summary: "Forex is the global marketplace where currencies are traded in pairs — the largest, most liquid market on earth, with over $7 trillion changing hands daily. You profit from changes in the exchange rate, and with the right education and risk management you can trade it from anywhere, including right here in Africa.",
                  keyPoints: ["Forex means trading one currency against another — always in pairs", "It's the biggest, most liquid market in the world, open 24 hours, 5 days a week", "Your profit or loss comes from the change in the exchange rate", "Sessions follow the sun: Sydney → Tokyo → London → New York", "Forex is a skill, not a shortcut — master the fundamentals first"] },
                { id: 'module-02', n: '02', title: 'Currency Pairs & Quotes', blurb: 'Understanding majors, minors, and exotics', video: '/media/lessons/module-02.mp4', free: true,
                  summary: "Every pair has a base currency and a quote currency; the price tells you how much of the quote it takes to buy one unit of the base. Pairs split into majors, minors and exotics, and every quote has a bid, an ask and a spread — with movement measured in pips.",
                  keyPoints: ["First currency = base, second = quote (e.g. EUR/USD)", "Majors (all involve the US Dollar) are the most liquid with the tightest spreads", "Minors/crosses have no Dollar; exotics carry higher risk and cost", "Bid = the price you sell at, Ask = the price you buy at; the gap is the spread", "A pip is the standard unit for measuring profit, loss and risk"] },
                { id: 'module-03', n: '03', title: 'Market Structure 101', blurb: 'How price moves and market phases', video: '/media/lessons/module-03.mp4', free: true,
                  summary: "Price moves in waves of highs and lows, and reading those swings tells you who is in control. A market is trending up, trending down, or ranging — and a 'break of structure' is an early clue the trend may be reversing.",
                  keyPoints: ["Price moves in waves, not straight lines", "Uptrend = higher highs and higher lows (buyers in control)", "Downtrend = lower highs and lower lows (sellers in control)", "Range = sideways between clear support and resistance", "A break of structure warns the trend may be ending or reversing", "Read structure first, then trade with it — never against it"] },
                { id: 'module-04', n: '04', title: 'Market Sessions & Volatility', blurb: 'Trading the right sessions at the right time', video: '/media/lessons/module-04.mp4', free: false,
                  summary: "The market runs 24/5 across four sessions, but not every hour is worth trading. The London–New York overlap (afternoon in West Africa) is the most active window. Match your strategy to the volatility of the session you trade.",
                  keyPoints: ["Four sessions follow the sun; each has different volatility", "London is the most liquid; the London–New York overlap has the biggest moves", "That overlap falls conveniently in the West African afternoon/evening", "Don't trade a quiet Asian range with a London breakout strategy", "Pick 2–3 hours that fit your life and learn how they behave"] },
                { id: 'module-05', n: '05', title: 'Risk Management', blurb: 'Protect your capital — the #1 rule', video: '/media/lessons/module-05.mp4', free: false,
                  summary: "Risk management — not strategy — decides who survives. Risk only 1–2% of your account per trade, place your stop where your idea is proven wrong, size your position so a loss stays within that risk, and always aim for at least 1:2 reward-to-risk.",
                  keyPoints: ["Never risk more than 1–2% of your account on a single trade", "Your stop-loss goes where your trade idea is proven wrong", "Size your lot so a stop-out only costs your planned risk", "Use the free Position Size Calculator to do the maths for you", "Aim for 1:2+ reward-to-risk — then you can lose most trades and still profit"] },
                { id: 'module-06', n: '06', title: 'Trading Psychology', blurb: 'Master your mindset and emotions', video: '/media/lessons/module-06.mp4', free: false,
                  summary: "Most traders fail on psychology, not strategy. Fear, greed, hope and revenge quietly destroy accounts. The fix isn't to be emotionless — it's to decide your entry, stop and target in advance, risk only what you can afford, and journal every trade.",
                  keyPoints: ["Most losses come from mindset, not a bad system", "The four account-killers: fear, greed, hope and revenge", "Decide entry, stop and target BEFORE you enter — then follow them", "Risk small enough that no single loss can rattle you", "Journaling builds the self-awareness that beats emotional trading"] },
                { id: 'module-07', n: '07', title: 'Technical Analysis Foundations', blurb: 'Reading charts like a professional', video: '', free: false,
                  summary: "Technical analysis is reading price to make probability-based decisions. Start with candles and timeframes, work top-down (higher timeframe for direction, lower for entry), trade with the trend, and use indicators to confirm — never to predict.",
                  keyPoints: ["Each candle shows the open, close, high and low for its period", "Check the higher timeframe first for direction, then drop down to time entries", "Trade with the trend, not against it", "Indicators like MA and RSI describe what price is doing — they don't predict", "Never take a trade on an indicator alone"] },
                { id: 'module-08', n: '08', title: 'Candlestick Patterns', blurb: 'Price action and pattern recognition', video: '', free: false,
                  summary: "Candlesticks map the battle between buyers and sellers. The doji signals indecision, the pin bar/hammer signals rejection, and engulfing candles signal a shift in control — and they matter most when they appear at a key level.",
                  keyPoints: ["Doji = indecision; the trend may pause or turn", "Pin bar / hammer = a long wick rejecting price", "Bullish/bearish engulfing = one side has taken control", "A pattern in the middle of nowhere is just noise", "Pattern + location (at support or resistance) is where the edge lives"] },
                { id: 'module-09', n: '09', title: 'Support & Resistance', blurb: 'Key levels and zones that matter', video: '', free: false,
                  summary: "Support is a floor where buyers step in; resistance is a ceiling where sellers take over. Draw them where price reversed at least twice, treat them as zones, and remember broken levels flip roles. Combine a level with a candle signal to trade it.",
                  keyPoints: ["Support = floor (buyers step in); Resistance = ceiling (sellers take over)", "Draw a level where price reversed at least twice", "Think in zones, not razor-thin lines", "Broken resistance becomes support — and broken support becomes resistance", "Level + candlestick signal = a high-probability entry"] },
                { id: 'module-10', n: '10', title: 'Trading Strategies', blurb: 'Fibonacci, moving averages, and intraday setups', video: '', free: false,
                  summary: "Combine your skills into repeatable setups: the moving-average trend strategy, Fibonacci retracements (the 50%–61.8% pullback zone), and the intraday session breakout. Every strong setup stacks confluence — trend, level and signal agreeing. Master one before adding more.",
                  keyPoints: ["A moving-average cross shows momentum shifting; use the MA as dynamic support", "Fibonacci 50% and 61.8% mark the high-quality pullback entry zone", "Session breakout: trade the London break of the Asian range with the trend", "Confluence (trend + level + signal) beats any single indicator", "Pick one strategy and master it before touching the rest"] },
                { id: 'module-11', n: '11', title: 'Building Your Trading Plan', blurb: 'Your personal roadmap to execution', video: '/media/lessons/module-11.mp4', free: false,
                  summary: "A trading plan is your personal rulebook that removes guesswork and emotion. It defines your markets and sessions, your exact strategy, your risk rules, your trade management and your review routine. Write it down, keep it to one page, and read it before every session.",
                  keyPoints: ["A plan in your head is a wish — write it down", "Cover: markets/sessions, strategy, risk rules, trade management, review routine", "Every decision is made in advance, while you're calm", "Keep it to one page and read it before each session", "Consistency comes from following rules, not feelings"] },
                { id: 'module-12', n: '12', title: 'Live Trading & Journaling', blurb: 'Execute, track, and improve every trade', video: '', free: false,
                  summary: "Put it all together: check the higher-timeframe trend, wait for price at a key level, take the signal, set entry/stop/target at 1:2, size to 1% risk, then let the trade run your plan. A trade isn't finished until it's journaled — that's what builds a real edge.",
                  keyPoints: ["Top-down: trend first, then a level, then a signal", "No level, no trade — wait for your setup", "Enter with stop and target set (1:2), risking only 1%", "Once you're in, do nothing — follow the plan, don't fear-manage", "Journal every trade: pair, reason, screenshot and how you felt", "Your journal turns random trades into a repeatable edge"] }
            ]
        }
    };

    function ready() {
        return !!(BFX.auth && BFX.auth.isConfigured && BFX.auth.isConfigured());
    }

    function currentUser() {
        if (!BFX.auth) return Promise.resolve(null);
        // Race the session lookup against a timeout so a slow/unreachable
        // Supabase falls back to the logged-out view instead of hanging.
        var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 8000); });
        return Promise.race([BFX.auth.getUser(), timeout]);
    }

    // ---- entitlement (RLS: users only see their own enrollment rows) ----
    // Resolves true when the signed-in user has an active enrollment for the
    // course. Fails safe to false so a hiccup never leaks paid content.
    function isEnrolled(courseId) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.resolve(false);
        return db.from('enrollments')
            .select('course_id, status')
            .eq('course_id', courseId)
            .eq('status', 'active')
            .limit(1)
            .then(function (res) { return !!(res.data && res.data.length); })
            .catch(function () { return false; });
    }

    // A lesson is accessible if it's free, or the student is enrolled.
    function canAccess(lesson, enrolled) {
        return !!(lesson && (lesson.free || enrolled));
    }

    // ---- progress (RLS: users only see/write their own rows) ----
    function getProgress(courseId) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.resolve({});
        return db.from('lesson_progress')
            .select('lesson_id, completed')
            .eq('course_id', courseId)
            .then(function (res) {
                var map = {};
                (res.data || []).forEach(function (r) { if (r.completed) map[r.lesson_id] = true; });
                return map;
            });
    }

    function markComplete(userId, courseId, lessonId, completed) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.reject(new Error('Not configured'));
        if (completed) {
            return db.from('lesson_progress').upsert({
                user_id: userId, course_id: courseId, lesson_id: lessonId,
                completed: true, completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,course_id,lesson_id' });
        }
        return db.from('lesson_progress').delete()
            .eq('course_id', courseId).eq('lesson_id', lessonId);
    }

    // Fire a lightweight event to the Brevo pipeline via /api/lead-capture.
    // Powers the LMS lifecycle automations (signup, free-completed, progress,
    // checkout intent). opts: { once, noSeq, email, name }.
    // - once  → send at most once per (source,email) in this browser
    // - noSeq → attribute update only, never starts an email sequence
    function syncBrevo(source, attrs, opts) {
        opts = opts || {};
        function post(email, name) {
            if (!email) return;
            if (opts.once) {
                var k = 'bfx_sync_' + source + '_' + email;
                try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) {}
            }
            var payload = { email: email, source: source, name: name || '', attributes: attrs || {}, no_sequence: !!opts.noSeq };
            try {
                fetch('/api/lead-capture', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload), keepalive: true
                }).catch(function () {});
            } catch (e) {}
        }
        if (opts.email) { post(opts.email, opts.name); return Promise.resolve(); }
        return currentUser().then(function (user) {
            if (user && user.email) post(user.email, (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '');
        }).catch(function () {});
    }

    return {
        COURSES: COURSES,
        ready: ready,
        currentUser: currentUser,
        isEnrolled: isEnrolled,
        canAccess: canAccess,
        getProgress: getProgress,
        markComplete: markComplete,
        syncBrevo: syncBrevo,
        course: function (id) { return COURSES[id] || null; },
        lesson: function (courseId, lessonId) {
            var c = COURSES[courseId];
            if (!c) return null;
            for (var i = 0; i < c.lessons.length; i++) {
                if (c.lessons[i].id === lessonId) {
                    return { lesson: c.lessons[i], index: i, next: c.lessons[i + 1] || null, prev: c.lessons[i - 1] || null, course: c };
                }
            }
            return null;
        }
    };
})();
