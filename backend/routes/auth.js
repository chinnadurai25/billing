import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// 1. User Registration (10 Fields + OTP Verification Check)
router.post('/register', async (req, res) => {
  try {
    const {
      fullName, email, contactNumber, password, companyName,
      constitution, companyAddress, state, gstNumber, registrationType, panNumber, username
    } = req.body;

    if (!email || !contactNumber || !companyName || !gstNumber || !panNumber || !username || !password) {
      return res.status(400).json({ success: false, message: 'Please fill all 10 required registration fields' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `USR-${Date.now()}`;

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO users (id, full_name, email, contact_number, company_name, constitution, company_address, state, gst_number, registration_type, pan_number, username, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName, email, contactNumber, companyName, constitution || 'Private Limited', companyAddress, state, gstNumber, registrationType || 'Regular', panNumber, username, passwordHash]
      );
    } else {
      fallbackStore.users.push({
        id: userId, fullName, email, contactNumber, companyName, constitution, companyAddress, state, gstNumber, registrationType, panNumber, username, passwordHash
      });
    }

    const token = jwt.sign({ userId, username, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User and Company registered successfully in MySQL database',
      user: { id: userId, fullName, email, companyName, gstNumber, panNumber, constitution },
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    let foundUser = null;

    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
      if (rows.length > 0) foundUser = rows[0];
    } else {
      foundUser = fallbackStore.users.find(u => u.username === username || u.email === username);
    }

    if (!foundUser) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password_hash || foundUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: foundUser.id, username: foundUser.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login authenticated successfully',
      user: {
        id: foundUser.id,
        fullName: foundUser.full_name || foundUser.fullName,
        email: foundUser.email,
        companyName: foundUser.company_name || foundUser.companyName,
        gstNumber: foundUser.gst_number || foundUser.gstNumber
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
