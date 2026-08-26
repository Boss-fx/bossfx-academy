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
                { id: 'module-01', n: '01', title: 'Introduction to Forex', blurb: 'What forex is, how it works, and why it matters', video: '', free: true },
                { id: 'module-02', n: '02', title: 'Currency Pairs & Quotes', blurb: 'Understanding majors, minors, and exotics', video: '', free: true },
                { id: 'module-03', n: '03', title: 'Market Structure 101', blurb: 'How price moves and market phases', video: '', free: true },
                { id: 'module-04', n: '04', title: 'Market Sessions & Volatility', blurb: 'Trading the right sessions at the right time', video: '', free: false },
                { id: 'module-05', n: '05', title: 'Risk Management', blurb: 'Protect your capital — the #1 rule', video: '', free: false },
                { id: 'module-06', n: '06', title: 'Trading Psychology', blurb: 'Master your mindset and emotions', video: '', free: false },
                { id: 'module-07', n: '07', title: 'Technical Analysis Foundations', blurb: 'Reading charts like a professional', video: '', free: false },
                { id: 'module-08', n: '08', title: 'Candlestick Patterns', blurb: 'Price action and pattern recognition', video: '', free: false },
                { id: 'module-09', n: '09', title: 'Support & Resistance', blurb: 'Key levels and zones that matter', video: '', free: false },
                { id: 'module-10', n: '10', title: 'Trading Strategies', blurb: 'Fibonacci, moving averages, and intraday setups', video: '', free: false },
                { id: 'module-11', n: '11', title: 'Building Your Trading Plan', blurb: 'Your personal roadmap to execution', video: '', free: false },
                { id: 'module-12', n: '12', title: 'Live Trading & Journaling', blurb: 'Execute, track, and improve every trade', video: '', free: false }
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

    return {
        COURSES: COURSES,
        ready: ready,
        currentUser: currentUser,
        isEnrolled: isEnrolled,
        canAccess: canAccess,
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
