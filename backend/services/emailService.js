import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '..', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');

const reloadEnv = () => {
  dotenv.config({ path: rootEnvPath });
  dotenv.config({ path: backendEnvPath, override: true });
};

reloadEnv();

/**
 * Returns the configured Admin email address (which is also used for sending OTP)
 */
export const getAdminEmail = () => {
  reloadEnv();
  const rawUser = process.env.EMAIL_USER || '';
  return rawUser.trim() || 'easyeetax@gmail.com';
};

// Create Nodemailer Transporter for Gmail SMTP (Port 465 SSL)
const createTransporter = () => {
  reloadEnv();

  const cleanUser = getAdminEmail();
  const rawPass = process.env.EMAIL_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, ''); // Remove spaces from Gmail App Password

  if (!cleanUser || !cleanPass || cleanUser.includes('your_email') || cleanPass.includes('your_app_password')) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: cleanUser,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Create fallback transporter (Port 587 TLS)
const createFallbackTransporter = () => {
  reloadEnv();

  const cleanUser = getAdminEmail();
  const rawPass = process.env.EMAIL_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');

  if (!cleanUser || !cleanPass) return null;

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: cleanUser,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send 6-digit OTP verification email to user
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const transporter = createTransporter();
  const cleanUser = getAdminEmail();

  // If no credentials configured yet, return status
  if (!transporter || !cleanUser) {
    console.log(`[Email Service Notice] Real SMTP credentials not configured in .env. OTP for ${toEmail}: ${otpCode}`);
    return { 
      sent: false, 
      simulated: true, 
      code: otpCode, 
      message: 'SMTP credentials missing in .env. Use demo code or provide EMAIL_USER & EMAIL_PASS in backend/.env' 
    };
  }

  const mailOptions = {
    from: `"BillSon Verification" <${cleanUser}>`,
    to: toEmail.trim(),
    replyTo: cleanUser,
    subject: `BillSon Verification Code: ${otpCode}`,
    text: `Your BillSon verification code is: ${otpCode}\n\nThis code is valid for 10 minutes.\n\nBillSon Billing & Financial Compliance Solutions • ${cleanUser}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BillSon Verification Code</title>
      </head>
      <body style="margin:0;padding:24px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
        <div style="max-width:500px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:36px 32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.04);">
          <div style="border-bottom:1px solid #f1f5f9;padding-bottom:16px;margin-bottom:20px;">
            <span style="font-size:22px;font-weight:800;color:#4338ca;letter-spacing:-0.5px;">BillSon</span>
            <span style="font-size:13px;color:#64748b;margin-left:8px;font-weight:500;">Compliance &amp; Billing</span>
          </div>
          
          <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Verify your email address</h2>
          <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
            Thank you for registering on BillSon. Please use the following 6-digit One-Time Password (OTP) verification code:
          </p>

          <div style="background-color:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:18px;margin:24px 0;text-align:center;">
            <span style="font-size:34px;font-weight:800;letter-spacing:8px;color:#2563eb;font-family:monospace;">${otpCode}</span>
            <div style="font-size:12px;color:#64748b;margin-top:6px;">Valid for 10 minutes</div>
          </div>

          <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;color:#64748b;">
            Never share this code with anyone. If you did not initiate this registration, please disregard this email.
          </p>

          <div style="border-top:1px solid #f1f5f9;padding-top:16px;font-size:12px;color:#94a3b8;line-height:1.5;">
            <p style="margin:0 0 4px 0;">BillSon Billing &amp; Financial Compliance Solutions • ${cleanUser}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service Success - SSL] Real OTP ${otpCode} sent to ${toEmail}. MessageID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[Email Service SSL Attempt Note] ${error.message}. Retrying via TLS Port 587...`);
    try {
      const fallbackTransporter = createFallbackTransporter();
      if (fallbackTransporter) {
        const info2 = await fallbackTransporter.sendMail(mailOptions);
        console.log(`[Email Service Success - TLS] Real OTP ${otpCode} sent to ${toEmail}. MessageID: ${info2.messageId}`);
        return { sent: true, messageId: info2.messageId };
      }
      return { sent: false, error: error.message };
    } catch (fallbackError) {
      console.error(`[Email Service SMTP Error] Failed to send email to ${toEmail}:`, fallbackError.message);
      return { sent: false, error: fallbackError.message };
    }
  }
};

/**
 * Send User Status Notification Email (Suspended or Suspension Cancelled/Active)
 * @param {string} toEmail - Recipient user's email address
 * @param {string} userName - Recipient user's full name
 * @param {string} status - 'Suspended' | 'Active'
 * @param {string} [companyName] - Optional registered company name
 */
export const sendUserStatusEmail = async (toEmail, userName, status, companyName = '') => {
  reloadEnv();
  const transporter = createTransporter();
  const cleanAdminEmail = getAdminEmail();
  const targetEmail = (toEmail || '').trim();
  const displayName = userName || 'Valued User';

  if (!targetEmail) {
    return { sent: false, error: 'Recipient email is required' };
  }

  const isSuspended = status === 'Suspended';
  const companyInfo = companyName ? ` (${companyName})` : '';

  const subject = isSuspended
    ? `⚠️ Account Suspended Notice - Action Required | BillSon Administration`
    : `✅ Account Reactivated - Suspension Cancelled | BillSon Administration`;

  const plainText = isSuspended
    ? `Dear ${displayName},\n\n` +
      `Your BillSon account (${targetEmail})${companyInfo} has been suspended by the administrator.\n\n` +
      `All access to your billing features, invoicing, and account management has been temporarily placed on hold.\n\n` +
      `FOR FURTHER DETAILS & CONTACTING ADMINISTRATOR:\n` +
      `For further details or reactivation assistance, please contact the administrator directly at:\n` +
      `Administrator Email: ${cleanAdminEmail}\n\n` +
      `Please mention your registered account email (${targetEmail}) in your email.\n\n` +
      `BillSon Billing & Financial Compliance Solutions • Admin Desk`
    : `Dear ${displayName},\n\n` +
      `We are pleased to inform you that the suspension on your BillSon account (${targetEmail})${companyInfo} has been cancelled by the administrator.\n\n` +
      `Your account has been fully reactivated. You can now log in and continue managing your invoices, customers, and financial compliance without restriction.\n\n` +
      `If you have any questions or require support, please contact the administrator at: ${cleanAdminEmail}\n\n` +
      `BillSon Billing & Financial Compliance Solutions • Admin Desk`;

  const html = isSuspended
    ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BillSon Account Suspended Notice</title>
      </head>
      <body style="margin:0;padding:24px;background-color:#0b0f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
        <div style="max-width:560px;margin:0 auto;background-color:#111827;border:1px solid rgba(239,68,68,0.3);border-top:4px solid #ef4444;border-radius:14px;padding:36px 32px;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
          
          <div style="border-bottom:1px solid #1f2937;padding-bottom:16px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td>
                  <span style="font-size:24px;font-weight:900;color:#f59e0b;letter-spacing:-0.5px;">BillSon</span>
                  <span style="font-size:12px;color:#94a3b8;margin-left:8px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Admin Desk</span>
                </td>
                <td style="text-align:right;">
                  <span style="background-color:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#f87171;font-size:11px;font-weight:700;padding:5px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:0.5px;display:inline-block;">
                    Account Suspended
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <h2 style="margin:0 0 14px 0;font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;">
            Your Account Has Been Suspended
          </h2>

          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#cbd5e1;">
            Dear <strong style="color:#ffffff;">${displayName}</strong>,
          </p>

          <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#94a3b8;">
            This is an official notice that your BillSon account associated with <span style="color:#f59e0b;font-weight:600;">${targetEmail}</span>${companyInfo} has been <span style="color:#f87171;font-weight:700;">suspended by the administrator</span>. Access to billing operations, invoices, and tenant features is currently paused.
          </p>

          <div style="background-color:#1e1b2e;border:1px solid rgba(248,113,113,0.3);border-left:4px solid #ef4444;border-radius:10px;padding:20px;margin:24px 0;">
            <div style="margin-bottom:10px;">
              <span style="font-size:16px;margin-right:6px;">⚠️</span>
              <strong style="color:#fca5a5;font-size:14px;letter-spacing:0.3px;">Contact Administrator For Further Details</strong>
            </div>
            <p style="margin:0 0 14px 0;font-size:13px;line-height:1.6;color:#cbd5e1;">
              For further details regarding why your account was suspended, or to discuss account reactivation and compliance, please contact the administrator directly:
            </p>
            <div style="background-color:#0b0f17;border:1px solid rgba(248,113,113,0.3);border-radius:8px;padding:14px 18px;margin-bottom:12px;">
              <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">
                Administrator Email Address:
              </div>
              <a href="mailto:${cleanAdminEmail}" style="font-size:17px;font-weight:800;color:#60a5fa;text-decoration:none;font-family:monospace;letter-spacing:0.5px;">
                ${cleanAdminEmail}
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
              📌 <em>Please mention your registered email (<strong>${targetEmail}</strong>) in your inquiry email to expedite verification.</em>
            </p>
          </div>

          <div style="text-align:center;margin:28px 0 20px 0;">
            <a href="mailto:${cleanAdminEmail}?subject=${encodeURIComponent('Account Suspension Inquiry - ' + targetEmail)}" 
               style="background:linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 28px;border-radius:8px;display:inline-block;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(239,68,68,0.3);">
              Contact Administrator
            </a>
          </div>

          <div style="border-top:1px solid #1f2937;padding-top:20px;margin-top:28px;font-size:12px;color:#64748b;line-height:1.6;">
            <p style="margin:0 0 4px 0;">BillSon Billing &amp; Financial Compliance Solutions</p>
            <p style="margin:0;color:#475569;">Official Administrative Security &amp; Compliance Notification</p>
          </div>
        </div>
      </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BillSon Account Reactivated</title>
      </head>
      <body style="margin:0;padding:24px;background-color:#0b0f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
        <div style="max-width:560px;margin:0 auto;background-color:#111827;border:1px solid rgba(16,185,129,0.3);border-top:4px solid #10b981;border-radius:14px;padding:36px 32px;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
          
          <div style="border-bottom:1px solid #1f2937;padding-bottom:16px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td>
                  <span style="font-size:24px;font-weight:900;color:#f59e0b;letter-spacing:-0.5px;">BillSon</span>
                  <span style="font-size:12px;color:#94a3b8;margin-left:8px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Admin Desk</span>
                </td>
                <td style="text-align:right;">
                  <span style="background-color:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#34d399;font-size:11px;font-weight:700;padding:5px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:0.5px;display:inline-block;">
                    Suspension Cancelled
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <h2 style="margin:0 0 14px 0;font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;">
            Account Suspension Cancelled &amp; Reactivated
          </h2>

          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#cbd5e1;">
            Dear <strong style="color:#ffffff;">${displayName}</strong>,
          </p>

          <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#94a3b8;">
            We are pleased to inform you that your BillSon account associated with <span style="color:#f59e0b;font-weight:600;">${targetEmail}</span>${companyInfo} <span style="color:#34d399;font-weight:700;">suspension has been cancelled</span> by the administrator.
          </p>

          <div style="background-color:#062319;border:1px solid rgba(16,185,129,0.3);border-left:4px solid #10b981;border-radius:10px;padding:20px;margin:24px 0;">
            <div style="margin-bottom:10px;">
              <span style="font-size:16px;margin-right:6px;">✅</span>
              <strong style="color:#6ee7b7;font-size:14px;letter-spacing:0.3px;">Account Restored &amp; Ready for Use</strong>
            </div>
            <p style="margin:0 0 14px 0;font-size:13px;line-height:1.6;color:#d1fae5;">
              All previous account restrictions have been cleared. You now have immediate, unrestricted access to your billing dashboard, invoice management, GST tools, and financial ledgers.
            </p>
            <div style="background-color:#0b0f17;border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:14px 18px;">
              <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">
                Administrator Contact:
              </div>
              <a href="mailto:${cleanAdminEmail}" style="font-size:16px;font-weight:800;color:#34d399;text-decoration:none;font-family:monospace;">
                ${cleanAdminEmail}
              </a>
            </div>
          </div>

          <div style="text-align:center;margin:28px 0 20px 0;">
            <span style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#ffffff;font-weight:700;font-size:13px;border-radius:8px;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
              You May Now Log In and Use Your Account
            </span>
          </div>

          <div style="border-top:1px solid #1f2937;padding-top:20px;margin-top:28px;font-size:12px;color:#64748b;line-height:1.6;">
            <p style="margin:0 0 4px 0;">BillSon Billing &amp; Financial Compliance Solutions</p>
            <p style="margin:0;color:#475569;">Official Administrative Security &amp; Compliance Notification</p>
          </div>
        </div>
      </body>
      </html>
    `;

  if (!transporter || !cleanAdminEmail) {
    console.log(`[Email Service Notice] SMTP not configured. Simulated status email (${status}) for ${targetEmail}`);
    return {
      sent: false,
      simulated: true,
      message: 'SMTP credentials missing in .env.'
    };
  }

  const mailOptions = {
    from: `"BillSon Administration" <${cleanAdminEmail}>`,
    to: targetEmail,
    replyTo: cleanAdminEmail,
    subject,
    text: plainText,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service Success - SSL] User status email (${status}) sent to ${targetEmail}. MessageID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[Email Service SSL Notice] ${error.message}. Retrying via TLS Port 587...`);
    try {
      const fallbackTransporter = createFallbackTransporter();
      if (fallbackTransporter) {
        const info2 = await fallbackTransporter.sendMail(mailOptions);
        console.log(`[Email Service Success - TLS] User status email (${status}) sent to ${targetEmail}. MessageID: ${info2.messageId}`);
        return { sent: true, messageId: info2.messageId };
      }
      return { sent: false, error: error.message };
    } catch (fallbackError) {
      console.error(`[Email Service SMTP Error] Failed to send status email to ${targetEmail}:`, fallbackError.message);
      return { sent: false, error: fallbackError.message };
    }
  }
};
