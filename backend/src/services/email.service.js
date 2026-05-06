const nodemailer = require('nodemailer');
const db = require('../config/db');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const APP = process.env.APP_NAME || 'SMSPulse';
const FROM = process.env.SMTP_FROM;

// Base HTML wrapper
function wrap(content) {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: 'DM Sans', Arial, sans-serif; background: #0d0f12; color: #eef0f4; margin: 0; padding: 0; }
      .container { max-width: 520px; margin: 40px auto; background: #13161b; border: 1px solid #252a33; border-radius: 16px; padding: 36px; }
      .logo { font-size: 22px; font-weight: 700; color: #00e676; margin-bottom: 28px; }
      .logo span { color: #eef0f4; }
      h2 { font-size: 20px; margin: 0 0 12px; color: #eef0f4; }
      p { font-size: 15px; line-height: 1.7; color: #8892a0; margin: 0 0 16px; }
      .stat-row { display: flex; gap: 16px; margin: 20px 0; }
      .stat { flex: 1; background: #1a1e25; border-radius: 10px; padding: 14px; text-align: center; }
      .stat-val { font-size: 24px; font-weight: 700; color: #00e676; }
      .stat-label { font-size: 12px; color: #4e5764; margin-top: 4px; }
      .btn { display: inline-block; background: #00e676; color: #0d0f12; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; margin: 8px 0; }
      .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #252a33; font-size: 12px; color: #4e5764; }
      .highlight { color: #00e676; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">⚡ <span>${APP}</span></div>
      ${content}
      <div class="footer">© ${new Date().getFullYear()} ${APP} · Tanzania</div>
    </div>
  </body>
  </html>`;
}

async function send(to, subject, html, userId = null, type = 'general') {
    try {
        await transporter.sendMail({ from: FROM, to, subject, html });
        if (userId) {
            await db.query(
                `INSERT INTO email_logs (user_id, type, subject, status) VALUES (?, ?, ?, 'sent')`,
                [userId, type, subject]
            );
        }
    } catch (err) {
        console.error('Email send error:', err.message);
        if (userId) {
            await db.query(
                `INSERT INTO email_logs (user_id, type, subject, status) VALUES (?, ?, ?, 'failed')`,
                [userId, type, subject]
            );
        }
    }
}

exports.sendWelcome = (user) => send(
    user.email,
    `Welcome to ${APP}!`,
    wrap(`
    <h2>Welcome, ${user.name}! 👋</h2>
    <p>Your account is ready. You've received <span class="highlight">50 free SMS credits</span> to get started.</p>
    <p>Create your first contact list, upload your contacts, and send your first campaign in minutes.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard →</a>
  `),
    user.id, 'welcome'
);

exports.sendCampaignComplete = (user, campaign) => send(
    user.email,
    `Campaign "${campaign.name}" completed`,
    wrap(`
    <h2>Campaign Complete ✅</h2>
    <p>Your campaign <strong>${campaign.name}</strong> has finished sending.</p>
    <div class="stat-row">
      <div class="stat"><div class="stat-val">${campaign.total_recipients?.toLocaleString()}</div><div class="stat-label">Recipients</div></div>
      <div class="stat"><div class="stat-val">${campaign.delivered_count?.toLocaleString()}</div><div class="stat-label">Delivered</div></div>
      <div class="stat"><div class="stat-val">${campaign.failed_count?.toLocaleString()}</div><div class="stat-label">Failed</div></div>
    </div>
    <a href="${process.env.FRONTEND_URL}/campaigns/${campaign.id}" class="btn">View Full Report →</a>
  `),
    user.id, 'campaign_complete'
);

exports.sendLowCreditAlert = (user) => send(
    user.email,
    `⚠️ Low SMS credits — ${user.sms_credits} remaining`,
    wrap(`
    <h2>Running Low on Credits</h2>
    <p>You only have <span class="highlight">${user.sms_credits} SMS credits</span> remaining on your account.</p>
    <p>Top up now to make sure your campaigns keep running without interruption.</p>
    <a href="${process.env.FRONTEND_URL}/billing" class="btn">Buy Credits →</a>
  `),
    user.id, 'low_credits'
);

exports.sendPaymentReceipt = (user, credits, amount) => send(
    user.email,
    `Payment confirmed — ${credits.toLocaleString()} credits added`,
    wrap(`
    <h2>Payment Successful 🎉</h2>
    <p>Your payment of <span class="highlight">TZS ${amount.toLocaleString()}</span> was successful.</p>
    <p><span class="highlight">${credits.toLocaleString()} SMS credits</span> have been added to your account.</p>
    <a href="${process.env.FRONTEND_URL}/billing" class="btn">View Balance →</a>
  `),
    user.id, 'payment_receipt'
);

exports.sendReferralBonus = (user, bonusCredits) => send(
    user.email,
    `🎁 You earned ${bonusCredits} free credits!`,
    wrap(`
    <h2>Referral Bonus Received!</h2>
    <p>Someone you referred just made their first purchase.</p>
    <p>We've added <span class="highlight">${bonusCredits} free SMS credits</span> to your account as a thank you!</p>
    <a href="${process.env.FRONTEND_URL}/billing" class="btn">View Balance →</a>
  `),
    user.id, 'referral_bonus'
);