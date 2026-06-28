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

  // ── Urgency config ────────────────────────────────────────────────────────
  const urgencyMap = {
    HIGH:   { label: '🔴 HIGH PRIORITY',   bg: '#FEE2E2', color: '#991B1B', border: '#F87171', icon: '🚨' },
    MEDIUM: { label: '🟡 MEDIUM PRIORITY', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: '⚠️' },
    LOW:    { label: '🟢 LOW PRIORITY',    bg: '#D1FAE5', color: '#065F46', border: '#34D399', icon: '✅' },
  };
  const urgency = urgencyMap[dispatch.urgency] || urgencyMap.MEDIUM;

  // ── Category icon map ────────────────────────────────────────────────────
  const categoryIcons = {
    PLUMBING:     '🔧', ELECTRICAL: '⚡', HVAC:      '❄️',
    LOCKSMITH:    '🔐', ROOFING:    '🏠', PEST:      '🐛',
    CLEANING:     '🧹', MOVING:     '📦', APPLIANCE: '🔌',
    LANDSCAPING:  '🌿', PAINTING:   '🎨', GENERAL:   '🛠️',
  };
  const categoryIcon = categoryIcons[dispatch.category?.toUpperCase()] || '🛠️';

  const formattedTime = new Date(dispatch.timestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const mailOptions = {
    from: `"CogniDispatch Alerts" <${process.env.SMTP_USER}>`,
    to: vendorEmail,
    subject: `${urgency.icon} New Dispatch — ${dispatch.category} [${dispatch.urgency}] · ${dispatch.dispatchId}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CogniDispatch Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FF;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 50%,#EC4899 100%);border-radius:20px 20px 0 0;padding:40px 32px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50px;padding:8px 20px;margin-bottom:16px;">
                <span style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Live Dispatch Alert</span>
              </div>
              <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1.1;margin-bottom:6px;">
                ⚡ CogniDispatch
              </div>
              <div style="color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;letter-spacing:0.5px;">
                Emergency Responder Network
              </div>
            </td>
          </tr>

          <!-- ═══ URGENCY BANNER ═══ -->
          <tr>
            <td style="background:${urgency.bg};border-left:5px solid ${urgency.border};padding:14px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:13px;font-weight:800;color:${urgency.color};letter-spacing:1px;text-transform:uppercase;">${urgency.label}</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:${urgency.color};font-weight:600;opacity:0.8;">${formattedTime}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ MAIN CARD BODY ═══ -->
          <tr>
            <td style="background:#ffffff;padding:32px 28px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:#1E1B4B;">
                Hello, ${vendorName} 👋
              </p>
              <p style="margin:0 0 28px 0;font-size:14px;color:#6B7280;line-height:1.6;">
                A new emergency dispatch has been routed to your unit. Review the details below and respond promptly.
              </p>

              <!-- ═══ 4 STAT CARDS (2x2 grid via table) ═══ -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <!-- Card 1: Dispatch ID -->
                  <td width="48%" valign="top" style="padding-right:8px;padding-bottom:12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border-radius:14px;border:1px solid #C7D2FE;overflow:hidden;">
                      <tr>
                        <td style="padding:18px 16px;">
                          <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">📋 Dispatch ID</div>
                          <div style="font-size:13px;font-weight:800;color:#3730A3;font-family:monospace;word-break:break-all;">${dispatch.dispatchId}</div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Card 2: Category -->
                  <td width="48%" valign="top" style="padding-left:8px;padding-bottom:12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border-radius:14px;border:1px solid #DDD6FE;overflow:hidden;">
                      <tr>
                        <td style="padding:18px 16px;">
                          <div style="font-size:10px;font-weight:700;color:#7C3AED;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">${categoryIcon} Category</div>
                          <div style="font-size:15px;font-weight:800;color:#4C1D95;">${dispatch.category}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <!-- Card 3: Payout -->
                  <td width="48%" valign="top" style="padding-right:8px;padding-bottom:12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-radius:14px;border:1px solid #A7F3D0;overflow:hidden;">
                      <tr>
                        <td style="padding:18px 16px;">
                          <div style="font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">💰 Payout</div>
                          <div style="font-size:22px;font-weight:900;color:#065F46;">₹${dispatch.amount}</div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Card 4: Homeowner -->
                  <td width="48%" valign="top" style="padding-left:8px;padding-bottom:12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border-radius:14px;border:1px solid #FED7AA;overflow:hidden;">
                      <tr>
                        <td style="padding:18px 16px;">
                          <div style="font-size:10px;font-weight:700;color:#EA580C;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">👤 Homeowner</div>
                          <div style="font-size:15px;font-weight:800;color:#7C2D12;">${dispatch.userName}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ═══ INCIDENT SUMMARY CARD ═══ -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-radius:14px;border:1px solid #E2E8F0;border-left:4px solid #6366F1;padding:20px 20px;">
                    <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">📝 Incident Summary</div>
                    <div style="font-size:14px;color:#374151;line-height:1.7;font-style:italic;">"${dispatch.summary}"</div>
                  </td>
                </tr>
              </table>

              <!-- ═══ CTA BUTTON ═══ -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://cognidispatch.g0ku1.online"
                       style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(79,70,229,0.4);">
                      Open CogniDispatch App →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══ DIVIDER INFO ROW ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:18px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:12px;color:rgba(255,255,255,0.9);font-weight:600;">🕐 Dispatched at ${formattedTime}</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;color:rgba(255,255,255,0.7);">IST · CogniDispatch Network</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background:#1E1B4B;border-radius:0 0 20px 20px;padding:24px 28px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#A5B4FC;">⚡ CogniDispatch</p>
              <p style="margin:0;font-size:11px;color:#6B7280;line-height:1.6;">
                This is an automated operational alert. Please do not reply to this email.<br/>
                © 2026 CogniDispatch · Emergency Responder Network
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
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
