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
    from: `"BillSon Compliance Portal" <${rawUser}>`,
    to: toEmail.trim(),
    subject: `🔒 BillSon Account Registration OTP: ${otpCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; border-b: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 1px; }
          .title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 8px; }
          .otp-container { text-align: center; margin: 28px 0; background: #1e1b4b; border: 1px solid #4f46e5; border-radius: 12px; padding: 20px; }
          .otp-code { font-size: 36px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 8px; color: #38bdf8; }
          .otp-sub { font-size: 12px; color: #a5b4fc; margin-top: 6px; }
          .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-t: 1px solid #1e293b; pt: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">⚡ BillSon</div>
            <div class="title">Email Address Verification</div>
          </div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Hello,
          </p>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
            Thank you for registering your company on BillSon SaaS Portal. Please use the following 6-digit One-Time Password (OTP) to complete your email verification:
          </p>
          
          <div class="otp-container">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-sub">Valid for 10 minutes • Do not share this code with anyone</div>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
            If you did not initiate this registration request, please ignore this email or contact support immediately.
          </p>

          <div class="footer">
            © 2026 BillSon Billing & Financial Compliance Solutions. All rights reserved.
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
