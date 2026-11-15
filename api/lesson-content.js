// ================================================================
// GET /api/lesson-content?course=xxx&lesson=xxx
// Returns lesson content (summary, keyPoints, video, body) after
// verifying authentication and enrollment for paid lessons.
// Free lessons return content without enrollment check.
// ================================================================
const { getSupabaseClient } = require('../lib/supabase');
const { setCors } = require('../lib/cors');
const { applyRateLimit } = require('../lib/rate-limit');
const { CONTENT, COURSE_META } = require('../lib/lesson-content-data');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (applyRateLimit(req, res, { windowMs: 60000, max: 60 })) return;

    const { course, lesson } = req.query;
    if (!course || !lesson) {
        return res.status(400).json({ error: 'Missing course or lesson parameter' });
    }

    const key = course + '/' + lesson;
    const data = CONTENT[key];
    if (!data) {
        return res.status(404).json({ error: 'Lesson not found' });
    }

    const meta = COURSE_META[course];
    const lessonNum = parseInt((lesson.match(/\d+$/) || ['0'])[0], 10);
    const isFree = meta && lessonNum <= meta.freeCount;

    if (isFree) {
        return res.status(200).json({ success: true, content: data });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const sb = getSupabaseClient();
    if (!sb) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        const { data: { user }, error: userError } = await sb.auth.getUser(token);
        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const { data: rows, error: enrollError } = await sb
            .from('enrollments')
            .select('course_id')
            .eq('user_id', user.id)
            .eq('course_id', course)
            .eq('status', 'active')
            .limit(1);

        if (enrollError || !rows || !rows.length) {
            return res.status(403).json({
                error: 'Enrollment required',
                enrollUrl: meta ? meta.enrollUrl : '/courses.html'
            });
        }

        return res.status(200).json({ success: true, content: data });
    } catch (err) {
        console.error('[lesson-content] Error:', err.message);
        return res.status(500).json({ error: 'Server error' });
    }
};
