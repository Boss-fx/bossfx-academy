function generateICS(booking) {
    const days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    const dayNum = days[(booking.preferred_day || 'monday').toLowerCase()] || 1;

    const now = new Date();
    let sessionDate = new Date();
    const currentDay = sessionDate.getDay();
    let daysUntil = dayNum - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    sessionDate.setDate(sessionDate.getDate() + daysUntil);

    const [hours, minutes] = (booking.preferred_time || '10:00').split(':').map(Number);
    sessionDate.setHours(hours || 10, minutes || 0, 0, 0);

    const duration = booking.product_id === 'mentorship-1on1' ? 60 : 90;
    const endDate = new Date(sessionDate.getTime() + duration * 60000);

    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const uid = `bfx-${booking.id || Date.now()}@bossfxcademy.com`;

    const commMethod = (booking.communication || 'telegram').toLowerCase();
    let location = 'Telegram - BossFx Academy';
    if (commMethod === 'zoom') location = 'Zoom (link will be sent before session)';
    if (commMethod === 'google_meet') location = 'Google Meet (link will be sent before session)';

    const title = booking.product_id === 'mentorship-1on1'
        ? '1-on-1 Mentorship — BossFx Academy'
        : 'Group Mentorship Session — BossFx Academy';

    const description = [
        `Mentorship Session with BossFx Academy`,
        `Focus: ${booking.focus_area || 'General Trading'}`,
        `Experience Level: ${booking.experience || 'Not specified'}`,
        `Communication: ${booking.communication || 'Telegram'}`,
        '',
        'Prepare:',
        '- Review your recent trades',
        '- Note questions or challenges',
        '- Have your trading platform open',
        '',
        'Contact: hello@bossfxcademy.com'
    ].join('\\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//BossFx Academy//Mentorship//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${formatDate(sessionDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `DTSTAMP:${formatDate(now)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `ORGANIZER;CN=BossFx Academy:mailto:hello@bossfxcademy.com`,
        `ATTENDEE;CN=${booking.customer_name || 'Student'}:mailto:${booking.customer_email}`,
        'STATUS:CONFIRMED',
        `RRULE:FREQ=WEEKLY;BYDAY=${['SU','MO','TU','WE','TH','FR','SA'][dayNum]}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Mentorship session in 30 minutes',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

module.exports = { generateICS };
