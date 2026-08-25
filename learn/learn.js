// ================================================================
// BFX.learn — Student area (auth + course progress) PoC
// Client-side Supabase via BFX.auth; progress in `lesson_progress`
// (RLS-gated per user). No serverless functions used.
// ================================================================
var BFX = window.BFX || {};

BFX.learn = (function () {
    'use strict';

    // Course catalog (Forex 101 — mirrors the 8 downloadable modules).
    var COURSES = {
        'forex-101': {
            title: 'Forex 101 — The Trader\'s Bible',
            blurb: 'Your 8-module foundation, from market basics to a complete trading plan.',
            lessons: [
                { id: 'module-01', n: '01', title: 'Welcome to Forex — Market Foundations', video: '' },
                { id: 'module-02', n: '02', title: 'Charts, Candlesticks & Price Action', video: '' },
                { id: 'module-03', n: '03', title: 'Currency Pairs, Pips & Lot Sizes', video: '' },
                { id: 'module-04', n: '04', title: 'Brokers, Platforms & Account Setup', video: '' },
                { id: 'module-05', n: '05', title: 'Market Structure & Smart Money Concepts', video: '' },
                { id: 'module-06', n: '06', title: 'Liquidity, Order Blocks & Fair Value Gaps', video: '' },
                { id: 'module-07', n: '07', title: 'Risk Management & Position Sizing', video: '' },
                { id: 'module-08', n: '08', title: 'Building Your Trading Plan', video: '' }
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

    return {
        COURSES: COURSES,
        ready: ready,
        currentUser: currentUser,
        getProgress: getProgress,
        markComplete: markComplete,
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
