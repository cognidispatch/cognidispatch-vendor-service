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

  const urgencyBg = dispatch.urgency === 'HIGH' ? '#7f1d1d' : dispatch.urgency === 'MEDIUM' ? '#78350f' : '#064e3b';
  const urgencyColor = dispatch.urgency === 'HIGH' ? '#fca5a5' : dispatch.urgency === 'MEDIUM' ? '#fde68a' : '#a7f3d0';
  const urgencyBorder = dispatch.urgency === 'HIGH' ? '#b91c1c' : dispatch.urgency === 'MEDIUM' ? '#b45309' : '#047857';

  const mailOptions = {
    from: `"CogniDispatch Alerts" <${process.env.SMTP_USER}>`,
    to: vendorEmail,
    subject: `🚨 New Dispatch Request — ${dispatch.category} [${dispatch.urgency}]`,
    html: `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 10px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.45);">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 35px 20px; border-bottom: 1px solid #1f2937;">
                  <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; text-shadow: 0 0 15px rgba(99,102,241,0.55);">
                    <span style="color: #6366f1;">⚡</span> COGNI<span style="color: #6366f1;">DISPATCH</span>
                  </div>
                  <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; margin: 12px 0 0 0; font-weight: 700;">Immediate Responder Alert</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 35px; color: #e2e8f0; font-size: 15px; line-height: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px;">Hello <strong style="color: #ffffff; font-weight: 700;">${vendorName}</strong>,</p>
                  <p style="margin: 0 0 30px 0; color: #94a3b8;">A new emergency dispatch request has been routed to your unit. Please review the details below and act accordingly.</p>

                  <!-- Details Card -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1e293b; border-radius: 12px; margin-bottom: 35px; border: 1px solid #334155; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);">
                    <tr>
                      <td style="padding: 24px;">
                        
                        <!-- Detail Row -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 40%;">Dispatch ID</td>
                            <td style="color: #ffffff; font-family: monospace; font-size: 14px; font-weight: 600;">${dispatch.dispatchId}</td>
                          </tr>
                        </table>

                        <!-- Detail Row -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 40%;">Category</td>
                            <td style="color: #6366f1; font-weight: 700; font-size: 15px;">${dispatch.category}</td>
                          </tr>
                        </table>

                        <!-- Detail Row -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 40%;">Urgency</td>
                            <td>
                              <span style="background-color: ${urgencyBg}; color: ${urgencyColor}; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; border: 1px solid ${urgencyBorder}; display: inline-block; letter-spacing: 0.5px;">
                                ${urgencyBadge}
                              </span>
                            </td>
                          </tr>
                        </table>

                        <!-- Detail Row -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 40%;">Payout Amount</td>
                            <td style="color: #10b981; font-weight: 800; font-size: 18px;">₹${dispatch.amount}</td>
                          </tr>
                        </table>

                        <!-- Detail Row -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 40%;">Homeowner</td>
                            <td style="color: #ffffff; font-weight: 600;">${dispatch.userName}</td>
                          </tr>
                        </table>

                        <!-- Divider -->
                        <div style="height: 1px; background-color: #334155; margin: 18px 0;"></div>

                        <!-- Summary Row -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 6px; display: block;">Incident Summary</td>
                          </tr>
                          <tr>
                            <td style="color: #f1f5f9; font-style: italic; font-size: 14px; line-height: 22px;">"${dispatch.summary}"</td>
                          </tr>
                        </table>

                      </td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 10px 0 20px 0;">
                        <a href="https://cognidispatch.g0ku1.online" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 18px rgba(79, 70, 229, 0.45); border: 1px solid #6366f1;">
                          OPEN COGNIDISPATCH APP →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Time footer -->
                  <p style="color: #64748b; font-size: 11px; text-align: center; margin: 25px 0 0 0; letter-spacing: 0.25px;">
                    Alert sent at: ${new Date(dispatch.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #0f172a; padding: 22px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1f2937; line-height: 18px;">
                  This is an automated operational transmission from CogniDispatch.<br>
                  Please do not reply directly to this mail.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
