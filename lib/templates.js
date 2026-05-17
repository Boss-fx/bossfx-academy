// ================================================================
// Brevo Email Template System — BossFx Academy
// ================================================================
// Generates branded HTML email templates for all automation flows.
// Dark/luxury fintech aesthetic, mobile-first, BossFx green (#10b981)
// ================================================================

const BRAND = {
    name: 'BossFx Academy',
    url: 'https://www.bossfxcademy.com',
    color: '#10b981',
    colorDark: '#059669',
    bg: '#0a0f0c',
    bgCard: '#111816',
    telegram: 'https://t.me/qD_fBeaziqE5YzU8',
    instagram: 'https://www.instagram.com/bossfx_academy',
    tiktok: 'https://www.tiktok.com/@bossfx1',
    youtube: 'https://youtube.com/@bossfx-tradingcommunity',
    whatsapp: 'https://wa.me/2349155008539',
    email: 'hello@bossfxcademy.com',
    sender: { name: 'BossFx Academy', email: 'hello@bossfxcademy.com' }
};

// ----------------------------------------------------------------
// Base wrapper — all emails use this shell
// ----------------------------------------------------------------
function wrap(content, preheader) {
    const preheaderHtml = preheader
        ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>`
        : '';
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>BossFx Academy</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
${preheaderHtml}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BRAND.bg};padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:${BRAND.bgCard};border-radius:16px;overflow:hidden;border:1px solid rgba(16,185,129,0.12);max-width:560px;width:100%;">
${content}
${footer()}
</table>
</td></tr>
</table>
</body></html>`;
}

function header(title, subtitle) {
    return `<tr><td style="background:linear-gradient(135deg,${BRAND.color},${BRAND.colorDark});padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${title}</h1>
    ${subtitle ? `<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${subtitle}</p>` : ''}
  </td></tr>`;
}

function body(html) {
    return `<tr><td style="padding:32px;">${html}</td></tr>`;
}

function greeting(name) {
    return `<p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 18px;">Hey ${name || '{{ contact.FIRSTNAME | default: "Trader" }}'},</p>`;
}

function text(t) {
    return `<p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 16px;">${t}</p>`;
}

function cta(label, url, secondary) {
    const bg = secondary ? 'transparent' : BRAND.color;
    const border = secondary ? `2px solid ${BRAND.color}` : 'none';
    const color = secondary ? BRAND.color : '#fff';
    const shadow = secondary ? 'none' : `0 2px 12px rgba(16,185,129,0.3)`;
    return `<div style="text-align:center;margin:20px 0;">
      <a href="${url}" style="display:inline-block;background:${bg};color:${color};padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;border:${border};box-shadow:${shadow};">${label}</a>
    </div>`;
}

function divider() {
    return `<div style="border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;"></div>`;
}

function bulletCard(emoji, title, desc) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
      <tr><td style="padding:12px 14px;background:#0a0f0c;border-radius:10px;border:1px solid rgba(16,185,129,0.08);">
        <table><tr>
          <td style="width:32px;vertical-align:top;font-size:18px;">${emoji}</td>
          <td>
            <p style="margin:0;color:#f1f5f9;font-weight:600;font-size:13px;">${title}</p>
            <p style="margin:3px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">${desc}</p>
          </td>
        </tr></table>
      </td></tr>
    </table>`;
}

function socialRow() {
    return `<div style="text-align:center;margin:20px 0 0;">
      <span style="color:#64748b;font-size:11px;font-weight:500;">Connect with us</span><br>
      <a href="${BRAND.telegram}" style="color:${BRAND.color};font-size:12px;text-decoration:none;margin:0 8px;">Telegram</a>
      <a href="${BRAND.instagram}" style="color:${BRAND.color};font-size:12px;text-decoration:none;margin:0 8px;">Instagram</a>
      <a href="${BRAND.tiktok}" style="color:${BRAND.color};font-size:12px;text-decoration:none;margin:0 8px;">TikTok</a>
      <a href="${BRAND.youtube}" style="color:${BRAND.color};font-size:12px;text-decoration:none;margin:0 8px;">YouTube</a>
    </div>`;
}

function footer() {
    return `<tr><td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="margin:0 0 6px;color:#475569;font-size:11px;">BossFx Academy &bull;
      <a href="${BRAND.url}?utm_source=email&utm_medium=automation" style="color:${BRAND.color};text-decoration:none;">Website</a> &bull;
      <a href="${BRAND.instagram}" style="color:${BRAND.color};text-decoration:none;">Instagram</a> &bull;
      <a href="${BRAND.tiktok}" style="color:${BRAND.color};text-decoration:none;">TikTok</a>
    </p>
    <p style="margin:0;color:#334155;font-size:10px;">You received this because you signed up at BossFx Academy.<br>
      <a href="{{ unsubscribe }}" style="color:#475569;text-decoration:underline;">Unsubscribe</a>
    </p>
  </td></tr>`;
}

// ================================================================
// TEMPLATE DEFINITIONS — All Flows
// ================================================================

const TEMPLATES = {

    // ============================================================
    // WELCOME FLOW (general list)
    // ============================================================
    welcome_1: {
        name: 'BFX Welcome 1 — Welcome to the Academy',
        subject: 'Welcome to BossFx, {{ contact.FIRSTNAME | default: "Trader" }} — your journey starts now',
        tags: ['welcome', 'automated', 'day_0'],
        html: () => wrap(
            header('Welcome to BossFx Academy', 'Your forex education starts here') +
            body(
                greeting() +
                text(`You just joined <strong style="color:${BRAND.color};">5,200+ traders</strong> who are building real skills in the forex market. No hype, no shortcuts — just structured education that works.`) +
                text(`Here's what you now have access to:`) +
                bulletCard('📚', 'Forex 101 Course (Free)', 'A 12-module course that takes you from zero to structured trader.') +
                bulletCard('💬', 'Telegram Community', 'Daily setups, live analysis, and real trader conversations with 5,200+ members.') +
                bulletCard('📦', 'Free Trading Resources', '8 professional tools — risk blueprint, pre-trade checklist, strategy guides.') +
                bulletCard('📺', 'Weekly Webinars', 'Live market prep sessions every week. Free for all members.') +
                cta('Start Forex 101 — Free', `${BRAND.url}/courses.html?utm_source=email&utm_medium=welcome&utm_campaign=welcome_1`) +
                cta('Join Telegram Community', BRAND.telegram, true) +
                divider() +
                text(`Over the next few days, I'll share some essential trading insights that have helped thousands of traders avoid common mistakes. Keep an eye on your inbox.`) +
                text(`Talk soon,<br><strong style="color:#f1f5f9;">Timilehin 'BossFx' Shobande</strong><br><span style="color:#64748b;font-size:12px;">Founder, BossFx Academy</span>`)
            ),
            'Welcome to BossFx Academy — your forex journey starts now'
        )
    },

    welcome_2: {
        name: 'BFX Welcome 2 — Beginner Survival Guide',
        subject: '5 mistakes that destroy beginner traders (and how to avoid them)',
        tags: ['welcome', 'automated', 'day_1'],
        html: () => wrap(
            header('Forex Beginner Survival Guide', 'Day 2 of your BossFx journey') +
            body(
                greeting() +
                text(`Most beginners lose money in their first year. Not because forex is "impossible" — but because they make the same 5 predictable mistakes.`) +
                text(`Here's the cheat code:`) +
                bulletCard('❌', 'Trading without a plan', 'Every trade should have an entry, stop loss, and take profit BEFORE you click buy.') +
                bulletCard('❌', 'Risking too much per trade', 'Professional traders risk 1-2% max. Beginners blow accounts risking 10%+.') +
                bulletCard('❌', 'Chasing losses', 'Revenge trading after a loss is the #1 account killer. Walk away.') +
                bulletCard('❌', 'No journaling', 'If you don\'t track your trades, you can\'t improve. Period.') +
                bulletCard('❌', 'Skipping education', 'YouTube isn\'t a curriculum. Structured learning beats random videos.') +
                divider() +
                text(`<strong style="color:#f1f5f9;">The fix?</strong> Start with our free Forex 101 course. It covers all of this and more — in 12 structured modules.`) +
                cta('Start Forex 101 — Free', `${BRAND.url}/courses.html?utm_source=email&utm_medium=welcome&utm_campaign=welcome_2`) +
                text(`P.S. If you want personalized guidance, our <a href="${BRAND.url}/mentorship.html?utm_source=email&utm_medium=welcome&utm_campaign=welcome_2" style="color:${BRAND.color};">mentorship program</a> pairs you directly with experienced traders.`)
            ),
            '5 beginner mistakes that destroy trading accounts'
        )
    },

    welcome_3: {
        name: 'BFX Welcome 3 — Social Proof & Webinar',
        subject: 'How Ade went from confused to consistent in 6 weeks',
        tags: ['welcome', 'automated', 'day_3'],
        html: () => wrap(
            header('Real Trader, Real Results', 'Day 4 of your BossFx journey') +
            body(
                greeting() +
                text(`Let me tell you about Ade from Lagos.`) +
                text(`6 weeks ago, Ade was scrolling TikTok watching "get rich from forex" videos. He'd already lost ₦50,000 on signal groups. He was about to quit trading forever.`) +
                text(`Then he found BossFx. Here's what changed:`) +
                bulletCard('✅', 'Week 1-2: Forex 101', 'He unlearned bad habits and built a proper foundation.') +
                bulletCard('✅', 'Week 3-4: Telegram Community', 'He started analyzing charts with real traders, not influencers.') +
                bulletCard('✅', 'Week 5-6: Live Webinars', 'He joined our weekly market prep and started seeing setups in real time.') +
                `<div style="background:#0a0f0c;border-left:3px solid ${BRAND.color};padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
                  <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;font-style:italic;">"I went from losing money to actually understanding WHY price moves. BossFx didn't give me signals — they gave me skills."</p>
                  <p style="color:#64748b;font-size:12px;margin:8px 0 0;">— Ade, BossFx Mentorship Graduate</p>
                </div>` +
                divider() +
                text(`Want results like Ade? Start here:`) +
                cta('Join Our Next Webinar — Free', `${BRAND.url}/live.html?utm_source=email&utm_medium=welcome&utm_campaign=welcome_3`) +
                cta('Explore Mentorship', `${BRAND.url}/mentorship.html?utm_source=email&utm_medium=welcome&utm_campaign=welcome_3`, true)
            ),
            'How Ade went from confused to profitable in 6 weeks'
        )
    },

    welcome_4: {
        name: 'BFX Welcome 4 — Final CTA Push',
        subject: '{{ contact.FIRSTNAME | default: "Trader" }}, your next move matters',
        tags: ['welcome', 'automated', 'day_5'],
        html: () => wrap(
            header('Your Next Move', 'Day 6 of your BossFx journey') +
            body(
                greeting() +
                text(`It's been a few days since you joined BossFx. Let me be direct:`) +
                text(`<strong style="color:#f1f5f9;">The traders who succeed are the ones who take action.</strong> Not tomorrow. Not "when I'm ready." Now.`) +
                text(`Here are the 3 things you should do today:`) +
                bulletCard('1️⃣', 'Start Forex 101', 'Free. 12 modules. Takes you from zero to structured trader.') +
                bulletCard('2️⃣', 'Join Telegram', '5,200+ traders. Daily setups. Live analysis. Free.') +
                bulletCard('3️⃣', 'Attend a Webinar', 'Weekly live sessions. Learn how pros read the market.') +
                cta('Start Forex 101 Now', `${BRAND.url}/courses.html?utm_source=email&utm_medium=welcome&utm_campaign=welcome_4`) +
                cta('Join Telegram Community', BRAND.telegram, true) +
                cta('Register for Webinar', `${BRAND.url}/live.html?utm_source=email&utm_medium=welcome&utm_campaign=welcome_4`, true) +
                divider() +
                text(`This is the last email in our welcome series. From here, you'll get weekly market insights and community updates.`) +
                text(`Your trading future is in your hands. Let's build it together.`) +
                text(`— <strong style="color:#f1f5f9;">BossFx Team</strong>`) +
                socialRow()
            ),
            'Your next move in forex matters — here are 3 things to do today'
        )
    },

    // ============================================================
    // WEBINAR FLOW
    // ============================================================
    webinar_1: {
        name: 'BFX Webinar 1 — Registration Confirmed',
        subject: 'You\'re registered! Webinar details inside',
        tags: ['webinar', 'automated', 'confirmation'],
        html: () => wrap(
            header('Webinar Registration Confirmed', 'You\'re in!') +
            body(
                greeting() +
                text(`Your spot is confirmed for our upcoming <strong style="color:${BRAND.color};">live webinar</strong>.`) +
                bulletCard('📅', 'When', 'Check the BossFx Telegram for the next session date and time.') +
                bulletCard('📍', 'Where', 'Live on Telegram — link will be shared in the group.') +
                bulletCard('📝', 'What to Prepare', 'Open mind, trading journal, and your charts ready.') +
                cta('Join Telegram for Updates', BRAND.telegram) +
                divider() +
                text(`<strong style="color:#f1f5f9;">What to expect:</strong>`) +
                text(`Our webinars cover live market analysis, trade setup identification, risk management in real-time, and Q&A with experienced traders.`) +
                text(`Don't miss it — traders who attend consistently improve 3x faster than those who don't.`)
            ),
            'Your webinar registration is confirmed — details inside'
        )
    },

    webinar_2: {
        name: 'BFX Webinar 2 — Reminder (24h)',
        subject: 'Tomorrow: Live webinar with BossFx',
        tags: ['webinar', 'automated', 'reminder'],
        html: () => wrap(
            header('Webinar Tomorrow', 'Don\'t forget!') +
            body(
                greeting() +
                text(`Quick reminder — our <strong style="color:${BRAND.color};">live webinar</strong> is happening tomorrow.`) +
                text(`Here's what we'll cover:`) +
                bulletCard('📊', 'Live Market Analysis', 'We\'ll break down current setups across major pairs.') +
                bulletCard('🎯', 'Trade Setup Workshop', 'Watch how we identify and plan real trades.') +
                bulletCard('💡', 'Q&A Session', 'Get your trading questions answered live.') +
                cta('Make Sure You\'re in Telegram', BRAND.telegram) +
                divider() +
                text(`<strong style="color:${BRAND.color};">Pro tip:</strong> Have your charts open during the session. Traders who follow along learn 2x more.`)
            ),
            'Reminder: Live webinar tomorrow with BossFx'
        )
    },

    webinar_3: {
        name: 'BFX Webinar 3 — Starting Soon',
        subject: 'LIVE NOW — Join the webinar',
        tags: ['webinar', 'automated', 'live'],
        html: () => wrap(
            header('We\'re Going Live!', 'Join now') +
            body(
                greeting() +
                text(`The webinar is starting <strong style="color:${BRAND.color};">right now</strong>. Don't miss this.`) +
                text(`200+ traders are already in the room. Join them.`) +
                cta('JOIN WEBINAR NOW', BRAND.telegram) +
                text(`<span style="color:#64748b;font-size:12px;">Can't make it? A replay will be shared in the Telegram group.</span>`)
            ),
            'The BossFx webinar is LIVE — join now'
        )
    },

    webinar_4: {
        name: 'BFX Webinar 4 — Post-Webinar',
        subject: 'Webinar replay + what\'s next for you',
        tags: ['webinar', 'automated', 'follow_up'],
        html: () => wrap(
            header('Thanks for Joining', 'Here\'s what\'s next') +
            body(
                greeting() +
                text(`Thanks for being part of the webinar. Whether you attended live or are catching the replay — here's how to keep the momentum going.`) +
                bulletCard('🔄', 'Replay', 'The replay is available in our Telegram group. Watch it again to catch what you missed.') +
                bulletCard('📚', 'Forex 101', 'Continue your learning with our structured 12-module course.') +
                bulletCard('🎯', 'Mentorship', 'Ready for personalized guidance? Our mentorship program accelerates your growth.') +
                cta('Continue Learning — Forex 101', `${BRAND.url}/courses.html?utm_source=email&utm_medium=webinar&utm_campaign=post_webinar`) +
                cta('Explore Mentorship', `${BRAND.url}/mentorship.html?utm_source=email&utm_medium=webinar&utm_campaign=post_webinar`, true) +
                divider() +
                text(`The next webinar is coming soon. Stay in <a href="${BRAND.telegram}" style="color:${BRAND.color};">Telegram</a> for the announcement.`)
            ),
            'Webinar replay and your next steps'
        )
    },

    // ============================================================
    // RESOURCE DOWNLOAD FLOW
    // ============================================================
    resource_1: {
        name: 'BFX Resource 1 — Delivery',
        subject: 'Your free trading resources are ready',
        tags: ['resource', 'automated', 'delivery'],
        html: () => wrap(
            header('Your Resources Are Ready', 'Download your free trading tools') +
            body(
                greeting() +
                text(`Your free trading resources are ready to download. These are the same tools used by our mentorship students and community traders.`) +
                cta('Access Your Resources', `${BRAND.url}/community.html?utm_source=email&utm_medium=resource&utm_campaign=resource_delivery#resources`) +
                divider() +
                text(`<strong style="color:#f1f5f9;">What's included:</strong>`) +
                bulletCard('📋', 'Pre-Trade Checklist', 'Never enter a bad trade again.') +
                bulletCard('📐', 'Risk Management Blueprint', 'Calculate position sizes like a pro.') +
                bulletCard('📈', 'Strategy Templates', 'Plug-and-play frameworks for your trading.') +
                bulletCard('📓', 'Trading Journal Template', 'Track and improve every single trade.') +
                divider() +
                text(`Want even more value? Join our Telegram community for daily setups and live analysis.`) +
                cta('Join Telegram — Free', BRAND.telegram, true)
            ),
            'Your free BossFx trading resources are ready to download'
        )
    },

    resource_2: {
        name: 'BFX Resource 2 — Additional Value',
        subject: 'Bonus: 3 beginner strategies that actually work',
        tags: ['resource', 'automated', 'day_2'],
        html: () => wrap(
            header('Bonus Trading Strategies', '3 approaches that work for beginners') +
            body(
                greeting() +
                text(`Since you downloaded our trading resources, here are 3 additional strategies that work especially well for beginners:`) +
                bulletCard('📊', 'Trend Following', 'Trade WITH the trend, not against it. Simple, effective, and forgiving for new traders.') +
                bulletCard('🔑', 'Support & Resistance', 'Price bounces off key levels. Learn to identify them and you\'ll see the market differently.') +
                bulletCard('⏰', 'Session Trading', 'Trade during high-volume sessions (London, New York) for better setups and tighter spreads.') +
                divider() +
                text(`All three are covered in detail in our <strong style="color:#f1f5f9;">Forex 101 course</strong> — free for all BossFx members.`) +
                cta('Start Forex 101 — Free', `${BRAND.url}/courses.html?utm_source=email&utm_medium=resource&utm_campaign=resource_2`)
            ),
            '3 bonus beginner trading strategies from BossFx'
        )
    },

    resource_3: {
        name: 'BFX Resource 3 — Case Study + Upsell',
        subject: 'From resources to results — here\'s the path',
        tags: ['resource', 'automated', 'day_4'],
        html: () => wrap(
            header('Resources → Results', 'The proven path') +
            body(
                greeting() +
                text(`You've got the resources. Now let's talk about what separates traders who <em>have</em> tools from traders who <em>use</em> them.`) +
                text(`The most successful BossFx traders follow this path:`) +
                bulletCard('1️⃣', 'Resources → Foundation', 'Use the tools to structure your approach.') +
                bulletCard('2️⃣', 'Forex 101 → Knowledge', 'Build real understanding of how markets work.') +
                bulletCard('3️⃣', 'Telegram → Community', 'Learn alongside other traders. Faster feedback loops.') +
                bulletCard('4️⃣', 'Mentorship → Mastery', 'Personalized guidance to accelerate your growth.') +
                divider() +
                text(`Ready to take the next step?`) +
                cta('Join Next Webinar', `${BRAND.url}/live.html?utm_source=email&utm_medium=resource&utm_campaign=resource_3`) +
                cta('Explore Mentorship', `${BRAND.url}/mentorship.html?utm_source=email&utm_medium=resource&utm_campaign=resource_3`, true)
            ),
            'The proven path from resources to real trading results'
        )
    },

    // ============================================================
    // MENTORSHIP FLOW
    // ============================================================
    mentorship_1: {
        name: 'BFX Mentorship 1 — Inquiry Received',
        subject: 'Your mentorship inquiry — here\'s what happens next',
        tags: ['mentorship', 'automated', 'inquiry'],
        html: () => wrap(
            header('Mentorship Inquiry Received', 'We got your message') +
            body(
                greeting() +
                text(`Thanks for your interest in BossFx Mentorship. This tells me you're serious about your trading — and that's already rare.`) +
                text(`<strong style="color:#f1f5f9;">Here's what our mentorship includes:</strong>`) +
                bulletCard('🎯', 'Structured Curriculum', 'Not random tips — a proven system to build consistent trading skills.') +
                bulletCard('👤', '1-on-1 or Group Sessions', 'Choose the format that works for your schedule and budget.') +
                bulletCard('📊', 'Live Trade Reviews', 'Get direct feedback on your entries, exits, and risk management.') +
                bulletCard('💬', 'Private Telegram Access', 'Direct line to your mentor and other mentorship students.') +
                divider() +
                text(`<strong style="color:${BRAND.color};">Next step:</strong> Reply to this email or message us on WhatsApp to discuss which program fits you best.`) +
                cta('Chat on WhatsApp', BRAND.whatsapp) +
                cta('View Mentorship Programs', `${BRAND.url}/mentorship.html?utm_source=email&utm_medium=mentorship&utm_campaign=inquiry`, true)
            ),
            'Your BossFx mentorship inquiry has been received'
        )
    },

    mentorship_2: {
        name: 'BFX Mentorship 2 — Social Proof',
        subject: 'What our mentorship students are saying',
        tags: ['mentorship', 'automated', 'day_1'],
        html: () => wrap(
            header('Mentorship Results', 'Real traders, real transformations') +
            body(
                greeting() +
                text(`Still thinking about mentorship? Let me show you what's possible.`) +
                `<div style="background:#0a0f0c;border-left:3px solid ${BRAND.color};padding:14px;border-radius:0 8px 8px 0;margin:14px 0;">
                  <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0;font-style:italic;">"Before BossFx, I was gambling. After 4 weeks of mentorship, I finally understand risk management and I'm consistently following my plan."</p>
                  <p style="color:#64748b;font-size:11px;margin:6px 0 0;">— Chinedu, Group Mentorship</p>
                </div>` +
                `<div style="background:#0a0f0c;border-left:3px solid ${BRAND.color};padding:14px;border-radius:0 8px 8px 0;margin:14px 0;">
                  <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0;font-style:italic;">"The 1-on-1 sessions changed everything. Having someone review my trades and correct my mistakes in real-time — you can't get that from YouTube."</p>
                  <p style="color:#64748b;font-size:11px;margin:6px 0 0;">— Amara, 1-on-1 Mentorship</p>
                </div>` +
                divider() +
                text(`Mentorship isn't for everyone. It's for traders who are done guessing and ready to get serious.`) +
                text(`<strong style="color:${BRAND.color};">Spots are limited</strong> — we keep groups small for quality.`) +
                cta('Reserve Your Spot', `${BRAND.url}/mentorship.html?utm_source=email&utm_medium=mentorship&utm_campaign=social_proof`)
            ),
            'See what BossFx mentorship students are achieving'
        )
    },

    mentorship_3: {
        name: 'BFX Mentorship 3 — Conversion Push',
        subject: '{{ contact.FIRSTNAME | default: "Trader" }}, ready to level up?',
        tags: ['mentorship', 'automated', 'day_3'],
        html: () => wrap(
            header('Ready to Level Up?', 'Your decision matters') +
            body(
                greeting() +
                text(`Let me be honest with you.`) +
                text(`You can keep trading the way you've been trading — watching random videos, following signal groups, hoping something clicks.`) +
                text(`Or you can get a <strong style="color:${BRAND.color};">structured path with direct guidance</strong> from someone who's already walked the road.`) +
                text(`Our mentorship program has helped traders:`) +
                bulletCard('✅', 'Stop revenge trading', 'Build emotional discipline with a proven framework.') +
                bulletCard('✅', 'Develop a trading plan', 'Know exactly what to trade, when, and why.') +
                bulletCard('✅', 'Manage risk properly', 'Protect your capital like a professional.') +
                bulletCard('✅', 'Trade with confidence', 'Execute without second-guessing every entry.') +
                divider() +
                text(`<strong style="color:#f1f5f9;">The question isn't whether mentorship works. It's whether you're ready to commit to your growth.</strong>`) +
                cta('Start Your Mentorship Journey', `${BRAND.url}/mentorship.html?utm_source=email&utm_medium=mentorship&utm_campaign=conversion`) +
                text(`<span style="color:#64748b;font-size:12px;">Have questions? Reply to this email or WhatsApp us at any time.</span>`)
            ),
            'Are you ready to level up your trading?'
        )
    },

    // ============================================================
    // EXIT INTENT RECOVERY
    // ============================================================
    exit_recovery_1: {
        name: 'BFX Exit Recovery 1 — You Almost Missed This',
        subject: 'You almost missed this, {{ contact.FIRSTNAME | default: "Trader" }}',
        tags: ['exit_intent', 'automated', 'recovery'],
        html: () => wrap(
            header('You Almost Missed This', 'Come back for your free resources') +
            body(
                greeting() +
                text(`You were browsing BossFx Academy and signed up before leaving. Smart move — here's what you unlocked:`) +
                bulletCard('📦', 'Free Starter Pack', '8 professional trading tools ready to download.') +
                bulletCard('📚', 'Forex 101 Course', 'Free 12-module beginner course.') +
                bulletCard('💬', 'Telegram Community', '5,200+ traders sharing daily setups.') +
                cta('Access Your Free Resources', `${BRAND.url}/community.html?utm_source=email&utm_medium=exit_recovery&utm_campaign=recovery_1#resources`) +
                cta('Join Telegram', BRAND.telegram, true)
            ),
            'You almost missed your free BossFx trading resources'
        )
    },

    exit_recovery_2: {
        name: 'BFX Exit Recovery 2 — Educational Value',
        subject: 'The #1 thing holding beginner traders back',
        tags: ['exit_intent', 'automated', 'day_1'],
        html: () => wrap(
            header('The #1 Trading Mistake', 'And how to fix it') +
            body(
                greeting() +
                text(`The number one thing holding beginner traders back isn't strategy. It's not capital. It's not even discipline.`) +
                text(`<strong style="color:${BRAND.color};">It's structure.</strong>`) +
                text(`Most traders jump from strategy to strategy, video to video, signal group to signal group — never building a real foundation.`) +
                text(`BossFx exists to fix that. We give you:`) +
                bulletCard('📚', 'Structured Learning', 'Forex 101 walks you through everything, step by step.') +
                bulletCard('📊', 'Real Analysis', 'Not signals — education on HOW to analyze.') +
                bulletCard('💬', 'Community Support', 'Learn faster with 5,200+ traders beside you.') +
                cta('Start Learning Now', `${BRAND.url}/courses.html?utm_source=email&utm_medium=exit_recovery&utm_campaign=recovery_2`) +
                socialRow()
            ),
            'The #1 thing holding beginner traders back'
        )
    },

    // ============================================================
    // RE-ENGAGEMENT
    // ============================================================
    reengagement_1: {
        name: 'BFX Re-engagement 1 — Miss You',
        subject: 'Still interested in forex, {{ contact.FIRSTNAME | default: "Trader" }}?',
        tags: ['reengagement', 'automated'],
        html: () => wrap(
            header('We Miss You', 'It\'s been a while') +
            body(
                greeting() +
                text(`It's been a minute since we've heard from you. No pressure — just wanted to let you know we're still here, and there's a lot happening at BossFx.`) +
                bulletCard('🆕', 'New Content', 'Fresh lessons, market analysis, and trading insights.') +
                bulletCard('📺', 'Upcoming Webinars', 'Free live sessions every week.') +
                bulletCard('💬', 'Active Community', '5,200+ traders sharing setups daily.') +
                cta('See What\'s New', `${BRAND.url}?utm_source=email&utm_medium=reengagement&utm_campaign=reengagement_1`) +
                text(`<span style="color:#64748b;font-size:12px;">If you no longer want to hear from us, no hard feelings — <a href="{{ unsubscribe }}" style="color:#64748b;">unsubscribe here</a>.</span>`)
            ),
            'We miss you at BossFx — here\'s what you\'re missing'
        )
    },

    reengagement_2: {
        name: 'BFX Re-engagement 2 — Webinar Invite',
        subject: 'Free webinar this week — your spot is open',
        tags: ['reengagement', 'automated', 'webinar_invite'],
        html: () => wrap(
            header('Free Webinar This Week', 'Your spot is open') +
            body(
                greeting() +
                text(`We have a <strong style="color:${BRAND.color};">free live webinar</strong> coming up this week and we'd love to see you there.`) +
                text(`It's a great way to get back into the trading mindset — no commitment, just learning.`) +
                cta('Register for Free', `${BRAND.url}/live.html?utm_source=email&utm_medium=reengagement&utm_campaign=webinar_invite`) +
                divider() +
                text(`Can't make the live session? Join Telegram and we'll share the replay.`) +
                cta('Join Telegram', BRAND.telegram, true)
            ),
            'Free webinar this week — rejoin the BossFx community'
        )
    },

    reengagement_3: {
        name: 'BFX Re-engagement 3 — Final',
        subject: 'Last check-in — should we keep you on the list?',
        tags: ['reengagement', 'automated', 'final'],
        html: () => wrap(
            header('Last Check-In', 'Should we stay in touch?') +
            body(
                greeting() +
                text(`This is our last email in this series. We respect your inbox.`) +
                text(`If you're still interested in forex education, just click below and we'll keep sending you value:`) +
                cta('Yes, Keep Me Updated', `${BRAND.url}?utm_source=email&utm_medium=reengagement&utm_campaign=stay_subscribed`) +
                divider() +
                text(`If we don't hear from you, we'll assume you're no longer interested and reduce our emails. No hard feelings — you can always come back.`) +
                text(`Wishing you success on your journey,<br><strong style="color:#f1f5f9;">BossFx Team</strong>`)
            ),
            'Should we keep sending you forex education?'
        )
    }
};

module.exports = { TEMPLATES, BRAND, wrap, header, body, greeting, text, cta, divider, bulletCard, socialRow };
