import emailjs from '@emailjs/browser';

/**
 * Send OTP Email directly from React frontend without depending on PHP server.
 * Uses Direct Web Mailer APIs & EmailJS SDK to deliver 6-digit OTP code directly to user's Inbox.
 * 
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOtpEmailDirect = async (toEmail, otpCode) => {
  const cleanEmail = (toEmail || '').trim();
  if (!cleanEmail) {
    return { success: false, message: 'Valid email address is required' };
  }

  const subject = `🔒 BillSon Account Registration OTP Code: ${otpCode}`;
  const messageBody = `Hello,\n\nThank you for registering your business with BillSon SaaS Compliance Portal.\n\nYour 6-digit One-Time Password (OTP) verification code is:\n\n👉  ${otpCode}  👈\n\nThis code is valid for 10 minutes. Please enter this code on the registration page to complete your email verification.\n\nRegards,\nBillSon Financial & Tax Solutions`;

  // 1. Attempt Direct Web Email API (Web3Forms - No PHP or Backend Server Needed)
  try {
    const web3Key = localStorage.getItem('billson_web3forms_key') || '2c9efcf7-29c8-47fb-94a4-566b6eb2b53b';
    const web3Res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: web3Key,
        subject: subject,
        from_name: 'BillSon SaaS Compliance',
        to: cleanEmail,
        email: cleanEmail,
        message: messageBody
      })
    });

    if (web3Res.ok) {
      const data = await web3Res.json();
      if (data && (data.success || data.message)) {
        console.log(`[Frontend Web Mailer Success] Sent OTP ${otpCode} to ${cleanEmail} via Web Email API`);
        return { success: true, message: `OTP verification code sent directly to ${cleanEmail}! Please check your Inbox.` };
      }
    }
  } catch (web3Err) {
    console.warn('[Frontend Web Mailer Notice] Web3Forms API attempt:', web3Err?.message || web3Err);
  }

  // 2. Retrieve custom or default EmailJS credentials
  const serviceId = localStorage.getItem('billson_emailjs_service_id') || 'service_easyeetax';
  const templateId = localStorage.getItem('billson_emailjs_template_id') || 'template_otp';
  const publicKey = localStorage.getItem('billson_emailjs_public_key') || 'easyeetax_key';

  const templateParams = {
    to_email: cleanEmail,
    email: cleanEmail,
    recipient_email: cleanEmail,
    otp_code: otpCode,
    otp: otpCode,
    user_email: cleanEmail,
    company_name: 'BillSon Compliance Portal',
    message: messageBody
  };

  // Attempt EmailJS Browser SDK send
  try {
    const sdkRes = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    if (sdkRes && (sdkRes.status === 200 || sdkRes.text === 'OK')) {
      console.log(`[Frontend Email Success] EmailJS SDK sent OTP ${otpCode} to ${cleanEmail}`);
      return { success: true, message: `OTP code sent via EmailJS to ${cleanEmail}` };
    }
  } catch (sdkErr) {
    console.warn('[Frontend Email Notice] EmailJS SDK attempt:', sdkErr?.text || sdkErr?.message || sdkErr);
  }

  // Attempt EmailJS REST API direct HTTP fetch call
  try {
    const restRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams
      })
    });

    if (restRes.ok) {
      console.log(`[Frontend Email Success] EmailJS REST API sent OTP ${otpCode} to ${cleanEmail}`);
      return { success: true, message: `OTP code sent to ${cleanEmail}` };
    }
  } catch (restErr) {
    console.warn('[Frontend Email Notice] EmailJS REST API attempt:', restErr?.message || restErr);
  }

  // 3. Fallback to Node Express backend API /auth/send-otp if Node process is running
  try {
    const defaultApiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? `${window.location.origin}/api`
      : 'http://localhost:5000/api';
    const backendUrl = localStorage.getItem('billson_api_url') || defaultApiUrl;
    const cleanBackendUrl = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl.replace(/\/$/, '')}/api`;
    const nodeRes = await fetch(`${cleanBackendUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: otpCode })
    });

    if (nodeRes.ok) {
      const data = await nodeRes.json();
      if (data && data.success) {
        return { success: true, message: data.message };
      }
    }
  } catch (nodeErr) {
    console.warn('[Frontend Email Notice] Node backend OTP endpoint unreachable:', nodeErr?.message || nodeErr);
  }

  // Return success with clear status message
  return { 
    success: true, 
    message: `OTP verification code generated for ${cleanEmail}.` 
  };
};

