// ================================================================
// Brevo Transactional Email Service
// ================================================================

const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
function getBrevoClient() {
    const client = new brevo.TransactionalEmailsApi();
    client.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
    );
    return client;
}

// ----------------------------------------------------------------
// HTML Email Templates
// ----------------------------------------------------------------

function baseTemplate(content, product) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px 40px;text-align:center;">
    <h1 style="margin:0;color:#0f172a;font-size:24px;font-weight:700;">BossFx Academy</h1>
    <p style="margin:8px 0 0;color:#0f172a;font-size:14px;opacity:0.8;">Your Trading Journey Starts Now</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:40px;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 40px 30px;border-top:1px solid #334155;text-align:center;">
    <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">BossFx Academy &mdash; Professional Forex Education</p>
    <p style="margin:0;color:#64748b;font-size:11px;">
      <a href="https://www.bossfxcademy.com" style="color:#f59e0b;text-decoration:none;">Website</a> &bull;
      <a href="https://t.me/qD_fBeaziqE5YzU8" style="color:#f59e0b;text-decoration:none;">Telegram</a> &bull;
      <a href="mailto:bossfx.official@gmail.com" style="color:#f59e0b;text-decoration:none;">Support</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function courseEmailContent(customer, product, txRef) {
    return `
    <h2 style="margin:0 0 16px;color:#f8fafc;font-size:22px;">Welcome to ${product.name}!</h2>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;">
      Hi ${customer.name},<br><br>
      Your payment has been confirmed and you now have <strong style="color:#f59e0b;">lifetime access</strong> to the complete course.
    </p>

    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#f59e0b;font-weight:600;font-size:14px;">YOUR PURCHASE DETAILS</p>
      <table width="100%" style="color:#cbd5e1;font-size:14px;">
        <tr><td style="padding:4px 0;">Product:</td><td style="text-align:right;color:#f8fafc;">${product.name}</td></tr>
        <tr><td style="padding:4px 0;">Reference:</td><td style="text-align:right;color:#f8fafc;">${txRef}</td></tr>
        <tr><td style="padding:4px 0;">Amount:</td><td style="text-align:right;color:#f8fafc;">${(product.amountNGN).toLocaleString()} NGN</td></tr>
      </table>
    </div>

    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;font-weight:600;">What you get:</p>
    <ul style="color:#cbd5e1;font-size:14px;line-height:1.8;padding-left:20px;">
      ${product.deliverables.map(d => `<li>${d}</li>`).join('')}
    </ul>

    <div style="text-align:center;margin:32px 0 16px;">
      <a href="${product.onboardingUrl}" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        Start Learning Now
      </a>
    </div>
    <div style="text-align:center;margin:0 0 16px;">
      <a href="${product.telegramInvite}" style="display:inline-block;background:transparent;border:2px solid #f59e0b;color:#f59e0b;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Join Telegram Community
      </a>
    </div>`;
}

function mentorshipEmailContent(customer, product, txRef) {
    const is1on1 = product.type === 'mentorship' && product.amountNGN === 150000;
    return `
    <h2 style="margin:0 0 16px;color:#f8fafc;font-size:22px;">Welcome to ${product.name}!</h2>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;">
      Hi ${customer.name},<br><br>
      Your mentorship enrollment is confirmed! ${is1on1
        ? 'You now have direct access to Timilehin Shobande for personalized 1-on-1 trading mentorship.'
        : 'You\'re now part of an exclusive group of traders committed to mastering the forex markets together.'}
    </p>

    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#f59e0b;font-weight:600;font-size:14px;">ENROLLMENT DETAILS</p>
      <table width="100%" style="color:#cbd5e1;font-size:14px;">
        <tr><td style="padding:4px 0;">Program:</td><td style="text-align:right;color:#f8fafc;">${product.name}</td></tr>
        <tr><td style="padding:4px 0;">Reference:</td><td style="text-align:right;color:#f8fafc;">${txRef}</td></tr>
        <tr><td style="padding:4px 0;">Amount:</td><td style="text-align:right;color:#f8fafc;">${(product.amountNGN).toLocaleString()} NGN</td></tr>
        <tr><td style="padding:4px 0;">Billing:</td><td style="text-align:right;color:#f8fafc;">Monthly</td></tr>
      </table>
    </div>

    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;font-weight:600;">What's included:</p>
    <ul style="color:#cbd5e1;font-size:14px;line-height:1.8;padding-left:20px;">
      ${product.deliverables.map(d => `<li>${d}</li>`).join('')}
    </ul>

    <div style="background:#0f172a;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
      <p style="margin:0;color:#f59e0b;font-weight:600;font-size:14px;">NEXT STEP</p>
      <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">
        ${is1on1
          ? 'Timilehin will reach out within 24 hours to schedule your first 1-on-1 session.'
          : 'Join the mentorship community below to get your session schedule and meet your group.'}
      </p>
    </div>

    <div style="text-align:center;margin:32px 0 16px;">
      <a href="${product.telegramInvite}" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        Join Mentorship Community
      </a>
    </div>`;
}

function vipEmailContent(customer, product, txRef) {
    return `
    <h2 style="margin:0 0 16px;color:#f8fafc;font-size:22px;">Welcome to the VIP Program!</h2>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;">
      Hi ${customer.name},<br><br>
      Congratulations! You've unlocked <strong style="color:#f59e0b;">lifetime VIP access</strong> to everything BossFx Academy has to offer &mdash; now and in the future.
    </p>

    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#f59e0b;font-weight:600;font-size:14px;">VIP MEMBERSHIP DETAILS</p>
      <table width="100%" style="color:#cbd5e1;font-size:14px;">
        <tr><td style="padding:4px 0;">Program:</td><td style="text-align:right;color:#f8fafc;">${product.name}</td></tr>
        <tr><td style="padding:4px 0;">Reference:</td><td style="text-align:right;color:#f8fafc;">${txRef}</td></tr>
        <tr><td style="padding:4px 0;">Amount:</td><td style="text-align:right;color:#f8fafc;">${(product.amountNGN).toLocaleString()} NGN</td></tr>
        <tr><td style="padding:4px 0;">Access:</td><td style="text-align:right;color:#22c55e;font-weight:600;">Lifetime</td></tr>
      </table>
    </div>

    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;font-weight:600;">Your VIP benefits:</p>
    <ul style="color:#cbd5e1;font-size:14px;line-height:1.8;padding-left:20px;">
      ${product.deliverables.map(d => `<li>${d}</li>`).join('')}
    </ul>

    <div style="background:linear-gradient(135deg,#f59e0b22,#d9770622);border:1px solid #f59e0b;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#f59e0b;font-weight:700;font-size:16px;text-align:center;">SMA Pro Trend EA</p>
      <p style="margin:0;color:#cbd5e1;font-size:14px;text-align:center;">
        Your VIP membership includes the SMA Pro Trend EA. Download it from MQL5 Market using the link below.
      </p>
      <div style="text-align:center;margin-top:12px;">
        <a href="https://www.mql5.com/en/market/product/174970" style="color:#f59e0b;font-size:14px;text-decoration:underline;">Download SMA Pro Trend EA</a>
      </div>
    </div>

    <div style="text-align:center;margin:32px 0 16px;">
      <a href="${product.telegramInvite}" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        Join VIP Channel
      </a>
    </div>
    <div style="text-align:center;margin:0 0 16px;">
      <a href="${product.onboardingUrl}" style="display:inline-block;background:transparent;border:2px solid #f59e0b;color:#f59e0b;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Access All Courses
      </a>
    </div>`;
}

function eaEmailContent(customer, product, txRef) {
    return `
    <h2 style="margin:0 0 16px;color:#f8fafc;font-size:22px;">Your EA is Ready!</h2>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;">
      Hi ${customer.name},<br><br>
      Your purchase of the <strong style="color:#f59e0b;">SMA Pro Trend EA</strong> is confirmed. Follow the instructions below to get started.
    </p>

    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#f59e0b;font-weight:600;font-size:14px;">PURCHASE DETAILS</p>
      <table width="100%" style="color:#cbd5e1;font-size:14px;">
        <tr><td style="padding:4px 0;">Product:</td><td style="text-align:right;color:#f8fafc;">${product.name}</td></tr>
        <tr><td style="padding:4px 0;">Reference:</td><td style="text-align:right;color:#f8fafc;">${txRef}</td></tr>
        <tr><td style="padding:4px 0;">Amount:</td><td style="text-align:right;color:#f8fafc;">${(product.amountNGN).toLocaleString()} NGN</td></tr>
      </table>
    </div>

    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;font-weight:600;">Getting started:</p>
    <ol style="color:#cbd5e1;font-size:14px;line-height:1.8;padding-left:20px;">
      <li>Download the EA from <a href="https://www.mql5.com/en/market/product/174970" style="color:#f59e0b;">MQL5 Market</a></li>
      <li>Open MetaTrader 5 and go to File &rarr; Open Data Folder</li>
      <li>Copy the EA file into the <code>MQL5/Experts</code> folder</li>
      <li>Restart MT5 and attach the EA to your preferred chart</li>
      <li>Use the recommended settings included in the guide</li>
    </ol>

    <p style="color:#cbd5e1;font-size:14px;line-height:1.6;">
      <strong>Note:</strong> The EA works on MT5 only. Make sure you're using a demo account first to test the settings before going live.
    </p>

    <div style="text-align:center;margin:32px 0 16px;">
      <a href="https://www.mql5.com/en/market/product/174970" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        Download from MQL5
      </a>
    </div>
    <div style="text-align:center;margin:0 0 16px;">
      <a href="${product.telegramInvite}" style="display:inline-block;background:transparent;border:2px solid #f59e0b;color:#f59e0b;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Join Community for Support
      </a>
    </div>`;
}

// ----------------------------------------------------------------
// Admin Notification Email
// ----------------------------------------------------------------

function adminNotificationContent(customer, product, txRef, paymentData) {
    return `
    <h2 style="margin:0 0 16px;color:#f8fafc;font-size:22px;">New Sale!</h2>
    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:24px 0;">
      <table width="100%" style="color:#cbd5e1;font-size:14px;">
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Customer</td><td style="text-align:right;color:#f8fafc;">${customer.name}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Email</td><td style="text-align:right;color:#f8fafc;">${customer.email}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Phone</td><td style="text-align:right;color:#f8fafc;">${customer.phone || 'N/A'}</td></tr>
        <tr><td colspan="2" style="padding:12px 0 6px;border-top:1px solid #334155;"></td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Product</td><td style="text-align:right;color:#f8fafc;">${product.name}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Amount</td><td style="text-align:right;color:#22c55e;font-weight:700;">${(product.amountNGN).toLocaleString()} NGN</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Reference</td><td style="text-align:right;color:#f8fafc;">${txRef}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Flutterwave ID</td><td style="text-align:right;color:#f8fafc;">${paymentData.id || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Payment Method</td><td style="text-align:right;color:#f8fafc;">${paymentData.payment_type || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#f59e0b;">Time</td><td style="text-align:right;color:#f8fafc;">${new Date().toISOString()}</td></tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;">
      Fulfillment email has been sent to the customer automatically.
    </p>`;
}

// ----------------------------------------------------------------
// Send Email Functions
// ----------------------------------------------------------------

/**
 * Send a fulfillment email to the customer
 */
async function sendFulfillmentEmail(customer, product, txRef) {
    const client = getBrevoClient();

    // Select the right content generator based on product type
    let contentFn;
    switch (product.type) {
        case 'course':      contentFn = courseEmailContent; break;
        case 'mentorship':  contentFn = mentorshipEmailContent; break;
        case 'vip':         contentFn = vipEmailContent; break;
        case 'ea':          contentFn = eaEmailContent; break;
        default:            contentFn = courseEmailContent; break;
    }

    const htmlContent = baseTemplate(contentFn(customer, product, txRef), product);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = getSubjectLine(product);
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
        name: 'BossFx Academy',
        email: process.env.SENDER_EMAIL || 'bossfx.official@gmail.com'
    };
    sendSmtpEmail.to = [{ email: customer.email, name: customer.name }];
    sendSmtpEmail.replyTo = {
        email: 'bossfx.official@gmail.com',
        name: 'BossFx Academy'
    };
    sendSmtpEmail.tags = [product.type, 'fulfillment', 'automated'];

    const result = await client.sendTransacEmail(sendSmtpEmail);
    console.log(`[Email] Fulfillment sent to ${customer.email} for ${product.name}`, result.messageId);
    return result;
}

/**
 * Send admin notification about a new sale
 */
async function sendAdminNotification(customer, product, txRef, paymentData) {
    const adminEmail = process.env.ADMIN_EMAIL || 'bossfx.official@gmail.com';
    const client = getBrevoClient();

    const htmlContent = baseTemplate(
        adminNotificationContent(customer, product, txRef, paymentData),
        product
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `[BossFx] New Sale: ${product.name} - ${(product.amountNGN).toLocaleString()} NGN`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
        name: 'BossFx System',
        email: process.env.SENDER_EMAIL || 'bossfx.official@gmail.com'
    };
    sendSmtpEmail.to = [{ email: adminEmail, name: 'BossFx Admin' }];
    sendSmtpEmail.tags = ['admin', 'sale-notification'];

    const result = await client.sendTransacEmail(sendSmtpEmail);
    console.log(`[Email] Admin notification sent for ${product.name}`, result.messageId);
    return result;
}

/**
 * Add contact to Brevo contact list
 */
async function addToContactList(customer, product) {
    try {
        const contactsApi = new brevo.ContactsApi();
        contactsApi.setApiKey(
            brevo.ContactsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY
        );

        const createContact = new brevo.CreateContact();
        createContact.email = customer.email;
        createContact.attributes = {
            FIRSTNAME: customer.name.split(' ')[0],
            LASTNAME: customer.name.split(' ').slice(1).join(' ') || '',
            PHONE: customer.phone || '',
            PRODUCT: product.name,
            PRODUCT_TYPE: product.type,
            PURCHASE_DATE: new Date().toISOString()
        };
        createContact.updateEnabled = true; // Update if contact exists

        await contactsApi.createContact(createContact);
        console.log(`[Email] Contact added/updated: ${customer.email}`);
    } catch (err) {
        // Don't fail fulfillment if contact creation fails
        console.error(`[Email] Contact add failed (non-fatal): ${err.message}`);
    }
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function getSubjectLine(product) {
    switch (product.type) {
        case 'course':
            return `Welcome to ${product.name} - Your Access is Ready!`;
        case 'mentorship':
            return `You're In! ${product.name} - Getting Started`;
        case 'vip':
            return `VIP Access Activated - Welcome to the Inner Circle!`;
        case 'ea':
            return `Your SMA Pro Trend EA - Download & Setup Guide`;
        default:
            return `Your BossFx Academy Purchase Confirmation`;
    }
}

module.exports = {
    sendFulfillmentEmail,
    sendAdminNotification,
    addToContactList
};
