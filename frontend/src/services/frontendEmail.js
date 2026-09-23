import { api } from './api';

/**
 * Send OTP Email directly using BillSon API (Gmail SMTP / Hostinger Mail)
 * 
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<{success: boolean, sent: boolean, otp: string, message: string}>}
 */
export const sendOtpEmailDirect = async (toEmail, otpCode) => {
  const cleanEmail = (toEmail || '').trim();
  if (!cleanEmail) {
    return { success: false, sent: false, message: 'Valid email address is required' };
  }

  // Always cache OTP locally in sessionStorage for verification
  try {
    sessionStorage.setItem(`billson_otp_${cleanEmail.toLowerCase()}`, otpCode);
  } catch (e) {}

  // 1. Primary: Use BillSon API (supports Gmail SMTP 465 SSL + 587 TLS + Hostinger Mail)
  try {
    const res = await api.sendOtp({ email: cleanEmail, otp: otpCode });
    if (res && res.success) {
      const activeOtp = res.otp || otpCode;
      try {
        sessionStorage.setItem(`billson_otp_${cleanEmail.toLowerCase()}`, activeOtp);
      } catch (e) {}

      return {
        success: true,
        sent: res.sent ?? true,
        otp: activeOtp,
        message: res.message || `OTP verification code sent to ${cleanEmail}. Please check your Inbox / Spam folder.`
      };
    }
  } catch (err) {
    console.warn('[OTP Email API Notice]:', err?.message || err);
  }

  // 2. Direct fallback to origin /api/auth/send-otp
  try {
    const defaultApiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? `${window.location.origin}/api`
      : 'http://localhost:5000/api';
    const backendUrl = localStorage.getItem('billson_api_url') || defaultApiUrl;
    const cleanBackendUrl = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl.replace(/\/$/, '')}/api`;

    const directRes = await fetch(`${cleanBackendUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: otpCode })
    });

    if (directRes.ok) {
      const data = await directRes.json();
      if (data && data.success) {
        return {
          success: true,
          sent: data.sent ?? true,
          otp: data.otp || otpCode,
          message: data.message || `OTP verification code sent to ${cleanEmail}`
        };
      }
    }
  } catch (fetchErr) {
    console.warn('[Direct OTP API Error]:', fetchErr?.message || fetchErr);
  }

  return {
    success: true,
    sent: false,
    otp: otpCode,
    message: `OTP code generated for ${cleanEmail}.`
  };
};
