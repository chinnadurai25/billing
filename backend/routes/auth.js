import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, isConnected, fallbackStore } from '../config/db.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = express.Router();
const otpStore = new Map(); // In-memory OTP storage

// OTP Endpoint 1: Send OTP to User Email via Nodemailer
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email.toLowerCase(), {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    const result = await sendOtpEmail(email, otpCode);

    if (result.sent) {
      res.json({
        success: true,
        message: `Verification OTP has been sent to ${email}`,
        sent: true
      });
    } else if (result.simulated) {
      res.json({
        success: true,
        message: `OTP code generated for ${email}. Demo Code: ${otpCode}`,
        code: otpCode,
        simulated: true,
        notice: 'Add your Gmail address & App Password to backend/.env to send real emails'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to send OTP email. Please check SMTP settings in backend/.env'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// OTP Endpoint 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const record = otpStore.get(email.toLowerCase());
    
    // Allow master codes or matching valid OTP
    if (otp === '984210' || otp === '123456' || (record && record.code === otp && record.expiresAt > Date.now())) {
      otpStore.delete(email.toLowerCase());
      return res.json({ success: true, message: 'Email verified successfully' });
    }

    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP requested or OTP has expired' });
    }

    res.status(400).json({ success: false, message: 'Invalid OTP code. Please check your email and try again.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1. User Registration (10 Fields + OTP Verification Check)
router.post('/register', async (req, res) => {
  try {
    const {
      fullName, email, contactNumber, password, companyName,
      constitution, companyAddress, state, gstNumber, registrationType, panNumber, username, companyLogo
    } = req.body;

    const userLoginName = username || email;

    if (!email || !contactNumber || !companyName || !gstNumber || !panNumber || !password) {
      return res.status(400).json({ success: false, message: 'Please fill all required registration fields' });
    }

    if (isConnected()) {
      const db = getDB();
      const [existing] = await db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, userLoginName]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'An account with this Email address already exists' });
      }
    } else {
      const existing = fallbackStore.users.find(u => u.email === email || u.username === userLoginName);
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this Email address already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `USR-${Date.now()}`;

    const newUserObj = {
      id: userId,
      fullName,
      email,
      contactNumber,
      companyName,
      constitution: constitution || 'Private Limited',
      companyAddress,
      state,
      gstNumber,
      registrationType: registrationType || 'Regular',
      panNumber,
      username: userLoginName,
      companyLogo: companyLogo || null,
      passwordHash
    };

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO users (id, full_name, email, contact_number, company_name, constitution, company_address, state, gst_number, registration_type, pan_number, username, company_logo, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName, email, contactNumber, companyName, constitution || 'Private Limited', companyAddress, state, gstNumber, registrationType || 'Regular', panNumber, userLoginName, companyLogo || null, passwordHash]
      );
    } else {
      fallbackStore.users.push(newUserObj);
    }

    const token = jwt.sign({ userId, username, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User and Company registered successfully',
      user: {
        id: userId,
        fullName,
        email,
        contactNumber,
        companyName,
        constitution: constitution || 'Private Limited',
        companyAddress,
        state,
        gstNumber,
        registrationType: registrationType || 'Regular',
        panNumber,
        username,
        companyLogo: companyLogo || null
      },
      token
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Registration Error' });
  }
});

// 2. User Login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginId = email || username;

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Email address and password are required' });
    }

    let foundUser = null;

    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [loginId, loginId]);
      if (rows.length > 0) foundUser = rows[0];
    } else {
      foundUser = fallbackStore.users.find(u => u.email === loginId || u.username === loginId);
    }

    if (!foundUser) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password' });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password_hash || foundUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password' });
    }

    const token = jwt.sign({ userId: foundUser.id, username: foundUser.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login authenticated successfully',
      user: {
        id: foundUser.id,
        fullName: foundUser.full_name || foundUser.fullName,
        email: foundUser.email,
        contactNumber: foundUser.contact_number || foundUser.contactNumber,
        companyName: foundUser.company_name || foundUser.companyName,
        companyAddress: foundUser.company_address || foundUser.companyAddress,
        state: foundUser.state,
        gstNumber: foundUser.gst_number || foundUser.gstNumber,
        panNumber: foundUser.pan_number || foundUser.panNumber,
        constitution: foundUser.constitution,
        username: foundUser.username,
        companyLogo: foundUser.company_logo || foundUser.companyLogo || null
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Login Error' });
  }
});

// 3. Admin Login (Enforces admin@gmail.com / admin123)
router.post('/admin/login', async (req, res) => {
  const { adminUser, password } = req.body;
  if ((adminUser === 'admin@gmail.com' || adminUser === 'admin_taxpulse') && password === 'admin123') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    return res.json({ success: true, message: 'Admin authorized', token });
  }
  res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
});

export default router;
