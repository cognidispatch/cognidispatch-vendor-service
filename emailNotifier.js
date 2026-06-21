// vendor-service/emailNotifier.js
// Sends email notifications to vendors using nodemailer + SMTP.
// Credentials are injected from Azure Key Vault via cogni-secrets.

const nodemailer = require('nodemailer');

let transporterInstance = null;

function getTransporter() {
  if (transporterInstance) return transporterInstance;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');

  if (!user || !pass) {
    console.warn('[Email] SMTP_USER or SMTP_PASS not set — email notifications disabled.');
    return null;
  }

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure: false,  // STARTTLS on port 587
    auth: { user, pass }
  });

  console.log(`[Email] ✅ SMTP transporter ready. Sender: ${user}`);
  return transporterInstance;
}

/**
 * Sends a dispatch notification email to the vendor.
 */
async function sendDispatchNotification({ vendorEmail, vendorName, dispatch }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const urgencyBadge = dispatch.urgency === 'HIGH' ? '🔴 HIGH' :
                       dispatch.urgency === 'MEDIUM' ? '🟡 MEDIUM' : '🟢 LOW';

  const mailOptions = {
    from: `"CogniDispatch Alerts" <${process.env.SMTP_USER}>`,
    to: vendorEmail,
    subject: `🚨 New Dispatch Request — ${dispatch.category} [${dispatch.urgency}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">🚨 CogniDispatch</h1>
          <p style="color: #aaa; margin: 4px 0 0;">Emergency Dispatch Notification</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px;">Hello <strong>${vendorName}</strong>,</p>
          <p>A new dispatch request has been assigned to you. Please open the CogniDispatch app to accept or decline.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd; width: 40%;">Dispatch ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${dispatch.dispatchId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Category</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${dispatch.category}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Urgency</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${urgencyBadge}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Homeowner</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${dispatch.userName}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Summary</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${dispatch.summary}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Payout Amount</td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #2ecc71; font-weight: bold;">₹${dispatch.amount}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Dispatched At</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date(dispatch.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cognidispatch.g0ku1.online" 
               style="background: #e94560; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
              Open CogniDispatch App →
            </a>
          </div>

          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated notification from CogniDispatch. 
            Do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Notification sent to ${vendorEmail} — MessageId: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] ❌ Failed to send to ${vendorEmail}:`, err.message);
  }
}

module.exports = { sendDispatchNotification };
