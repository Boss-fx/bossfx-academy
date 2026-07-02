// ================================================================
// Mentorship Booking Endpoint
// POST /api/booking
// ================================================================

const { getSupabaseClient } = require('../lib/supabase');
const { getOrderByTxRef } = require('../lib/orders');
const { generateICS } = require('../lib/calendar');
const { applyRateLimit } = require('../lib/rate-limit');
const { setCors } = require('../lib/cors');
const brevo = require('@getbrevo/brevo');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (applyRateLimit(req, res, { windowMs: 60000, max: 5 })) return;

    const {
        txRef, email, name, productId,
        preferredDay, preferredTime, timezone,
        communication, focusArea, experience, notes
    } = req.body || {};

    if (!email || !productId) {
        return res.status(400).json({ error: 'Missing required fields: email, productId' });
    }

    if (!['mentorship-group', 'mentorship-1on1'].includes(productId)) {
        return res.status(400).json({ error: 'Invalid product for booking' });
    }

    try {
        let orderId = null;
        if (txRef) {
            const order = await getOrderByTxRef(txRef);
            if (order) orderId = order.id;
        }

        const booking = {
            order_id: orderId,
            customer_email: email.toLowerCase(),
            customer_name: name || 'Student',
            product_id: productId,
            preferred_day: preferredDay || null,
            preferred_time: preferredTime || null,
            timezone: timezone || 'Africa/Lagos',
            communication: communication || 'telegram',
            focus_area: focusArea || null,
            experience: experience || null,
            notes: notes || null,
            status: 'pending'
        };

        const sb = getSupabaseClient();
        let bookingId = null;
        if (sb) {
            const { data, error } = await sb.from('mentorship_bookings')
                .insert(booking).select().single();
            if (error) throw error;
            bookingId = data.id;
            booking.id = data.id;
        }

        const icsContent = generateICS(booking);

        await sendBookingEmails(booking, icsContent).catch(err => {
            console.error('[Booking] Email failed:', err.message);
        });

        return res.status(200).json({
            success: true,
            bookingId,
            message: 'Booking submitted! Check your email for confirmation and calendar invite.'
        });

    } catch (error) {
        console.error('[Booking] Error:', error.message);
        return res.status(500).json({ error: 'Booking failed. Please contact support.' });
    }
};

async function sendBookingEmails(booking, icsContent) {
    if (!process.env.BREVO_API_KEY) return;

    const client = new brevo.TransactionalEmailsApi();
    client.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const senderEmail = process.env.SENDER_EMAIL || 'hello@bossfxcademy.com';
    const programName = booking.product_id === 'mentorship-1on1'
        ? '1-on-1 Mentorship' : 'Group Mentorship';

    const customerEmail = new brevo.SendSmtpEmail();
    customerEmail.sender = { name: 'BossFx Academy', email: senderEmail };
    customerEmail.to = [{ email: booking.customer_email, name: booking.customer_name }];
    customerEmail.subject = `Booking Confirmed — ${programName} | BossFx Academy`;
    customerEmail.htmlContent = bookingEmailHtml(booking, programName);
    customerEmail.attachment = [{
        content: Buffer.from(icsContent).toString('base64'),
        name: 'BossFx_Mentorship_Session.ics'
    }];
    customerEmail.tags = ['booking', 'mentorship', 'automated'];

    await client.sendTransacEmail(customerEmail);

    const adminEmail = new brevo.SendSmtpEmail();
    adminEmail.sender = { name: 'BossFx System', email: senderEmail };
    adminEmail.to = [{ email: process.env.ADMIN_EMAIL || senderEmail }];
    adminEmail.subject = `New Booking: ${programName} — ${booking.customer_name}`;
    adminEmail.htmlContent = adminBookingHtml(booking, programName);
    adminEmail.tags = ['admin', 'booking-notification'];

    await client.sendTransacEmail(adminEmail);
}

function bookingEmailHtml(booking, programName) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f0c;font-family:'Inter',sans-serif;color:#e2e8f0">
<div style="max-width:600px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px">
<h1 style="color:#10B981;font-size:28px;margin:0">Booking Confirmed</h1>
<p style="color:#94a3b8;margin-top:8px">${programName} — BossFx Academy</p>
</div>
<div style="background:#111816;border-radius:16px;padding:32px;border:1px solid #1e293b">
<p style="margin:0 0 20px">Hey ${(booking.customer_name || 'there').split(' ')[0]},</p>
<p style="margin:0 0 20px">Your mentorship session preferences have been received. Here are your booking details:</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0">
<tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8">Program</td><td style="padding:10px 0;border-bottom:1px solid #1e293b;text-align:right;font-weight:600">${programName}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8">Preferred Day</td><td style="padding:10px 0;border-bottom:1px solid #1e293b;text-align:right">${booking.preferred_day || 'Flexible'}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8">Preferred Time</td><td style="padding:10px 0;border-bottom:1px solid #1e293b;text-align:right">${booking.preferred_time || 'Flexible'}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8">Timezone</td><td style="padding:10px 0;border-bottom:1px solid #1e293b;text-align:right">${booking.timezone}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8">Communication</td><td style="padding:10px 0;border-bottom:1px solid #1e293b;text-align:right">${booking.communication}</td></tr>
<tr><td style="padding:10px 0;color:#94a3b8">Focus Area</td><td style="padding:10px 0;text-align:right">${booking.focus_area || 'General'}</td></tr>
</table>
<p style="margin:20px 0;color:#94a3b8;font-size:14px">A calendar invite (.ics) is attached to this email. Add it to your calendar to get reminders.</p>
<div style="text-align:center;margin:28px 0">
<a href="https://t.me/qD_fBeaziqE5YzU8" style="display:inline-block;background:#10B981;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600">Join the Community</a>
</div>
<p style="margin:20px 0 0;font-size:14px;color:#94a3b8">Timilehin will confirm your session time within 24 hours. If you need to reschedule, reply to this email.</p>
</div>
<div style="text-align:center;margin-top:32px;color:#475569;font-size:12px">
<p>BossFx Academy — hello@bossfxcademy.com</p>
</div>
</div></body></html>`;
}

function adminBookingHtml(booking, programName) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:sans-serif;background:#f8fafc">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0">
<h2 style="color:#0f172a;margin:0 0 16px">New Mentorship Booking</h2>
<table style="width:100%;border-collapse:collapse">
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Program</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${programName}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Student</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.customer_name}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Email</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.customer_email}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Day</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.preferred_day || 'Flexible'}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Time</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.preferred_time || 'Flexible'}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Timezone</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.timezone}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Communication</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.communication}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Focus</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.focus_area || 'General'}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600">Experience</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${booking.experience || 'Not specified'}</td></tr>
<tr><td style="padding:8px 0;font-weight:600">Notes</td><td style="padding:8px 0">${booking.notes || 'None'}</td></tr>
</table>
<p style="margin:16px 0 0;color:#64748b;font-size:13px">Confirm the session time and reply to the student.</p>
</div></body></html>`;
}
