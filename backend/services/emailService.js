import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer Transporter for Gmail SMTP
const createTransporter = () => {
  // Reload dotenv to pick up any changes in backend/.env
  dotenv.config({ override: true });

  const rawUser = process.env.EMAIL_USER || '';
  const rawPass = process.env.EMAIL_PASS || '';

  const cleanUser = rawUser.trim();
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

/**
 * Send 6-digit OTP verification email to user
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const transporter = createTransporter();
  const rawUser = (process.env.EMAIL_USER || '').trim();

  // If no credentials configured yet, return status
  if (!transporter) {
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
    text: `Your BillSon verification code is: ${otpCode}\n\nThis code is valid for 10 minutes.\n\nBillSon Billing & Financial Compliance Solutions • support@billson.in`,
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
            <p style="margin:0 0 4px 0;">BillSon Billing &amp; Financial Compliance Solutions • support@billson.in</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service Success] Real OTP ${otpCode} sent to ${toEmail}. MessageID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service SMTP Error] Failed to send email to ${toEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
};
