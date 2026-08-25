// ================================================================
// BossFx Academy — Student learning area (PoC)
// Client-side Supabase auth + RLS-gated progress. No serverless
// functions: the browser talks to Supabase directly with the public
// anon key; RLS ensures a student only ever touches their own rows.
// ================================================================
(function () {
    'use strict';

    var COURSES = {
        'forex-101': {
            title: "Forex 101 — The Trader's Bible",
            lessons: [
                { id: 'module-01', title: 'What is the Forex Market?' },
                { id: 'module-02', title: 'Charts, Candlesticks & Price Action' },
                { id: 'module-03', title: 'Currency Pairs, Pips & Lot Sizes' },
                { id: 'module-04', title: 'Brokers, Platforms & Account Setup' },
                { id: 'module-05', title: 'Market Structure & Smart Money Concepts' },
                { id: 'module-06', title: 'Liquidity, Order Blocks & Fair Value Gaps' },
                { id: 'module-07', title: 'Risk Management & Position Sizing' },
                { id: 'module-08', title: 'Building Your Trading Plan' }
            ]
        }
    };
    window.BFX_COURSES = COURSES;

    function $(id) { return document.getElementById(id); }
    function show(el) { if (el) el.classList.remove('hidden'); }
    function hide(el) { if (el) el.classList.add('hidden'); }

    // Never hang on a slow/unreachable Supabase — resolve to `fallback` after ms.
    function withTimeout(promise, ms, fallback) {
        return Promise.race([
            Promise.resolve(promise).catch(function () { return fallback; }),
            new Promise(function (resolve) { setTimeout(function () { resolve(fallback); }, ms); })
        ]);
    }

    var configured = window.BFX && BFX.auth && BFX.auth.isConfigured && BFX.auth.isConfigured();

    // ---------- Progress data (RLS-gated) ----------
    function loadProgress(courseId) {
        var db = BFX.auth.db();
        if (!db) return Promise.resolve({});
        return db.from('lesson_progress').select('lesson_id, completed')
            .eq('course_id', courseId)
            .then(function (res) {
                var map = {};
                (res.data || []).forEach(function (r) { if (r.completed) map[r.lesson_id] = true; });
                return map;
            }).catch(function () { return {}; });
    }

    function setComplete(courseId, lessonId, done) {
        var db = BFX.auth.db();
        if (!db) return Promise.reject(new Error('not ready'));
        return BFX.auth.getUser().then(function (user) {
            if (!user) return Promise.reject(new Error('not signed in'));
            if (done) {
                return db.from('lesson_progress').upsert({
                    user_id: user.id, course_id: courseId, lesson_id: lessonId,
                    completed: true, completed_at: new Date().toISOString()
                }, { onConflict: 'user_id,course_id,lesson_id' });
            }
            return db.from('lesson_progress').delete()
                .eq('course_id', courseId).eq('lesson_id', lessonId);
        });
    }

    // ================= DASHBOARD PAGE =================
    function initDashboard() {
        var loadingView = $('loadingView'), authView = $('authView'), dashView = $('dashView');

        if (!configured) {
            hide(loadingView);
            show(authView);
            $('authTitle').textContent = 'Learning area not configured';
            $('authSub').textContent = 'Supabase auth is not set up yet. See the activation steps.';
            $('authForm').style.display = 'none';
            document.querySelector('.auth-toggle').style.display = 'none';
            return;
        }

        // Auth form toggle (login <-> signup)
        var mode = 'login';
        function applyMode() {
            var signup = mode === 'signup';
            $('authTitle').textContent = signup ? 'Create your account' : 'Welcome back, Trader';
            $('authSub').textContent = signup ? 'Free — track your progress across every lesson.' : 'Log in to continue your learning.';
            $('nameField').style.display = signup ? 'block' : 'none';
            $('authSubmit').textContent = signup ? 'Create account' : 'Log in';
            $('toggleText').textContent = signup ? 'Already have an account?' : 'New to BossFx?';
            $('toggleLink').textContent = signup ? 'Log in' : 'Create an account';
            $('fPassword').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
        }
        $('toggleLink').addEventListener('click', function (e) { e.preventDefault(); mode = mode === 'login' ? 'signup' : 'login'; applyMode(); msg(''); });

        function msg(text, kind) {
            var m = $('authMsg'); m.className = 'auth-msg' + (kind ? ' ' + kind : '');
            m.textContent = text; if (!text) m.style.display = 'none';
        }

        $('authForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var email = $('fEmail').value.trim(), pw = $('fPassword').value, name = $('fName').value.trim();
            var btn = $('authSubmit'); btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Please wait…';
            var op = mode === 'signup'
                ? BFX.auth.signUp(email, pw, { full_name: name })
                : BFX.auth.signInWithPassword(email, pw);
            op.then(function (res) {
                if (res && res.error) throw res.error;
                if (mode === 'signup' && res && res.data && res.data.user && !res.data.session) {
                    msg('Account created — check your email to confirm, then log in.', 'ok');
                    mode = 'login'; applyMode(); btn.disabled = false; btn.textContent = 'Log in'; return;
                }
                renderDashboard();
            }).catch(function (err) {
                msg((err && err.message) || 'Something went wrong. Try again.', 'err');
                btn.disabled = false; btn.textContent = orig;
            });
        });

        // Decide view based on session (falls back to login if Supabase is slow/unreachable)
        withTimeout(BFX.auth.getUser(), 6000, null).then(function (user) {
            hide(loadingView);
            if (user) renderDashboard(user); else { applyMode(); show(authView); }
        });

        function renderDashboard(user) {
            hide(loadingView); hide(authView); show(dashView);
            (user ? Promise.resolve(user) : BFX.auth.getUser()).then(function (u) {
                if (u && u.email) { $('userEmail').textContent = u.email; show($('userEmail')); }
                show($('logoutBtn'));
            });
            var course = COURSES['forex-101'];
            loadProgress('forex-101').then(function (done) {
                var list = $('lessonList'); list.innerHTML = '';
                var count = 0;
                course.lessons.forEach(function (lsn, i) {
                    var isDone = !!done[lsn.id]; if (isDone) count++;
                    var a = document.createElement('a');
                    a.className = 'lesson' + (isDone ? ' done' : '');
                    a.href = 'lesson.html?c=forex-101&l=' + encodeURIComponent(lsn.id);
                    a.innerHTML = '<div class="lesson-check">' + (isDone ? '✓' : '') + '</div>' +
                        '<div class="lesson-title">' + lsn.title + '</div>' +
                        '<div class="lesson-num">Lesson ' + (i + 1) + '</div>';
                    list.appendChild(a);
                });
                $('progressText').textContent = count + ' of ' + course.lessons.length + ' lessons complete';
                $('progressFill').style.width = Math.round((count / course.lessons.length) * 100) + '%';
            });
        }

        $('logoutBtn').addEventListener('click', function () {
            BFX.auth.signOut().then(function () { location.reload(); });
        });
    }

    // ================= LESSON PAGE =================
    function initLesson() {
        var params = new URLSearchParams(location.search);
        var courseId = params.get('c') || 'forex-101';
        var lessonId = params.get('l') || 'module-01';
        var course = COURSES[courseId];
        var lesson = course && course.lessons.filter(function (x) { return x.id === lessonId; })[0];
        var idx = course ? course.lessons.map(function (x) { return x.id; }).indexOf(lessonId) : -1;

        if (!configured) { location.href = 'index.html'; return; }

        withTimeout(BFX.auth.getUser(), 6000, null).then(function (user) {
            if (!user) { location.href = 'index.html'; return; } // gate: must be signed in
            hide($('lessonLoading'));
            show($('lessonMount'));
            if (lesson) {
                $('lessonTitle').textContent = lesson.title;
                $('lessonEyebrow').textContent = 'Forex 101 · Lesson ' + (idx + 1) + ' of ' + course.lessons.length;
            }
            // next-lesson link
            if (course && idx > -1 && idx < course.lessons.length - 1) {
                var n = course.lessons[idx + 1];
                var nl = $('nextLesson');
                nl.href = 'lesson.html?c=' + courseId + '&l=' + n.id;
                nl.textContent = 'Next: ' + n.title + ' →';
                show(nl);
            }
            // completion state
            loadProgress(courseId).then(function (done) {
                paintComplete(!!done[lessonId]);
            });
            $('completeBtn').addEventListener('click', function () {
                var btn = $('completeBtn'); btn.disabled = true;
                var currentlyDone = btn.dataset.done === '1';
                setComplete(courseId, lessonId, !currentlyDone).then(function (res) {
                    if (res && res.error) throw res.error;
                    paintComplete(!currentlyDone);
                }).catch(function () { btn.disabled = false; });
            });
        });

        function paintComplete(done) {
            var btn = $('completeBtn');
            btn.disabled = false; btn.dataset.done = done ? '1' : '0';
            btn.textContent = done ? '✓ Completed — mark incomplete' : 'Mark lesson complete';
            btn.className = 'btn ' + (done ? 'btn-ghost' : 'btn-primary');
            var badge = $('doneBadge'); if (badge) badge.style.display = done ? 'inline-flex' : 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('dashView')) initDashboard();
        else if (document.getElementById('lessonMount')) initLesson();
    });
})();
