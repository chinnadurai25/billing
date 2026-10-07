import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';
import { sendUserStatusEmail, getAdminEmail } from '../services/emailService.js';

const router = express.Router();

// GET all registered users for Admin Portal
router.get('/users', async (req, res) => {
  try {
    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query(
        'SELECT id, full_name, email, contact_number, company_name, constitution, company_address, state, gst_number, registration_type, pan_number, username, created_at, status FROM users ORDER BY created_at DESC'
      );
      
      const formatted = rows.map(u => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.contact_number,
        company: u.company_name,
        constitution: u.constitution,
        address: u.company_address,
        state: u.state,
        gst: u.gst_number,
        registrationType: u.registration_type,
        pan: u.pan_number,
        username: u.username,
        plan: 'Enterprise Pro',
        status: (u.status && u.status.toLowerCase() === 'suspended') ? 'Suspended' : 'Active',
        date: new Date(u.created_at).toISOString().split('T')[0]
      }));

      return res.json({ success: true, data: formatted });
    }

    const fallbackFormatted = (fallbackStore.users || []).map(u => ({
      id: u.id,
      name: u.fullName || u.name,
      email: u.email,
      phone: u.contactNumber || u.phone,
      company: u.companyName || u.company,
      constitution: u.constitution,
      address: u.companyAddress || u.address,
      state: u.state,
      gst: u.gstNumber || u.gst,
      registrationType: u.registrationType,
      pan: u.panNumber || u.pan,
      username: u.username,
      plan: 'Enterprise Pro',
      status: (u.status && u.status.toLowerCase() === 'suspended') ? 'Suspended' : 'Active',
      date: u.date || new Date().toISOString().split('T')[0]
    }));

    res.json({ success: true, data: fallbackFormatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Account Status Controller (Active / Suspended)
const handleUserStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, email: providedEmail, name: providedName, company: providedCompany, username: providedUsername } = req.body;
    
    if (!status || !['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either "Active" or "Suspended"' });
    }

    const cleanId = (id || '').trim();
    const cleanEmail = (providedEmail || '').trim().toLowerCase();
    const cleanUsername = (providedUsername || '').trim();

    let foundUser = null;

    if (isConnected()) {
      const db = getDB();
      // 1. Fetch user from MySQL to get registered email & details
      const [rows] = await db.query(
        'SELECT id, full_name, email, company_name, status FROM users WHERE id = ? OR username = ? OR email = ? OR LOWER(email) = ?',
        [cleanId, cleanId, cleanId, cleanEmail]
      );
      if (rows.length > 0) {
        foundUser = rows[0];
      }

      // 2. Persist status update in MySQL users table (matches by ID, email, or username)
      const targetQueryEmail = (foundUser?.email || cleanEmail).toLowerCase();
      const targetQueryId = foundUser?.id || cleanId;

      const [updateResult] = await db.query(
        'UPDATE users SET status = ? WHERE id = ? OR LOWER(email) = ? OR username = ?',
        [status, targetQueryId, targetQueryEmail, cleanUsername || cleanId]
      );

      // If user wasn't in MySQL yet (e.g. from client storage), insert or upsert record with the new status
      if (updateResult.affectedRows === 0 && (cleanEmail || cleanId)) {
        try {
          const insertId = cleanId.startsWith('USR-') ? cleanId : `USR-${Date.now()}`;
          const insertEmail = cleanEmail || `${insertId.toLowerCase()}@user.local`;
          const insertName = providedName || providedCompany || 'Registered User';
          const insertCompany = providedCompany || insertName;
          const dummyHash = '$2a$10$e8wF5qQ1wA4aVbC3dE2fGu1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v';
          await db.query(
            `INSERT INTO users (id, full_name, email, contact_number, company_name, constitution, company_address, state, gst_number, registration_type, pan_number, username, password_hash, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status)`,
            [
              insertId, insertName, insertEmail, req.body.phone || '9876543210',
              insertCompany, req.body.constitution || 'Private Limited',
              req.body.address || 'Address', req.body.state || 'Tamil Nadu',
              req.body.gst || '33AAACD1234F1Z5', req.body.registrationType || 'Regular',
              req.body.pan || 'AAACD1234F', cleanUsername || insertEmail.split('@')[0],
              dummyHash, status
            ]
          );
          foundUser = { id: insertId, full_name: insertName, email: insertEmail, company_name: insertCompany, status };
        } catch (insErr) {
          console.warn('[Admin User Insert fallback note]:', insErr.message);
        }
      }
    }

    // 3. Update in fallbackStore if running in memory fallback
    if (fallbackStore.users) {
      const idx = fallbackStore.users.findIndex(u => 
        u.id === cleanId || 
        u.username === cleanId || 
        u.email === cleanId ||
        (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
      );
      if (idx !== -1) {
        fallbackStore.users[idx].status = status;
        if (!foundUser) foundUser = fallbackStore.users[idx];
      }
    }

    // 4. Resolve recipient email and display name
    const targetEmail = (foundUser?.email || cleanEmail).trim();
    const targetName = foundUser?.full_name || foundUser?.fullName || providedName || foundUser?.company_name || 'Valued User';
    const targetCompany = foundUser?.company_name || foundUser?.companyName || providedCompany || '';
    const adminEmail = getAdminEmail();

    // 5. Send automated email notification directly via Nodemailer
    let emailSent = false;
    let emailError = null;
    let messageId = null;

    if (targetEmail && targetEmail.includes('@') && !targetEmail.endsWith('.local')) {
      console.log(`[Admin User Status] 📧 Dispatching status email to: ${targetEmail} (New Status: ${status}). Admin: ${adminEmail}`);
      try {
        const mailResult = await sendUserStatusEmail(targetEmail, targetName, status, targetCompany);
        emailSent = !!mailResult.sent;
        emailError = mailResult.error || null;
        messageId = mailResult.messageId || null;
        console.log(`[Admin User Status Email Result] to=${targetEmail}, sent=${emailSent}, messageId=${messageId || 'none'}, error=${emailError || 'none'}`);
      } catch (mailErr) {
        console.error(`[Admin User Status Email Error] Failed sending to ${targetEmail}:`, mailErr.message);
        emailSent = false;
        emailError = mailErr.message;
      }
    } else {
      console.warn(`[Admin User Status Warning] No valid email address for user ID ${cleanId}. Email skipped.`);
      emailError = 'No valid email found';
    }

    const message = status === 'Suspended'
      ? `User account suspended. ${emailSent ? `Official notice email sent to ${targetEmail}.` : `(Email note: ${emailError || 'Check SMTP configuration'})`}`
      : `User suspension cancelled. ${emailSent ? `Reactivation email sent to ${targetEmail}.` : `(Email note: ${emailError || 'Check SMTP configuration'})`}`;

    res.json({
      success: true,
      message,
      status,
      user: {
        id: foundUser?.id || cleanId,
        email: targetEmail,
        name: targetName,
        status
      },
      emailSent,
      emailError,
      messageId,
      adminEmail
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accept POST, PATCH, and PUT for user status update to ensure maximum frontend & CORS compatibility
router.post('/users/:id/status', handleUserStatusUpdate);
router.patch('/users/:id/status', handleUserStatusUpdate);
router.put('/users/:id/status', handleUserStatusUpdate);

// DELETE User and cascade delete all tenant data
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (isConnected()) {
      const db = getDB();
      await db.query('DELETE FROM invoices WHERE user_id = ?', [id]);
      await db.query('DELETE FROM customers WHERE user_id = ?', [id]);
      await db.query('DELETE FROM products WHERE user_id = ?', [id]);
      await db.query('DELETE FROM bank_accounts WHERE user_id = ?', [id]);
      await db.query('DELETE FROM users WHERE id = ? OR username = ? OR email = ?', [id, id, id]);
    }

    if (fallbackStore.users) {
      fallbackStore.users = fallbackStore.users.filter(u => u.id !== id && u.username !== id && u.email !== id);
    }
    if (fallbackStore.invoices) {
      fallbackStore.invoices = fallbackStore.invoices.filter(inv => inv.user_id !== id && inv.userId !== id);
    }
    if (fallbackStore.customers) {
      fallbackStore.customers = fallbackStore.customers.filter(c => c.user_id !== id && c.userId !== id);
    }
    if (fallbackStore.products) {
      fallbackStore.products = fallbackStore.products.filter(p => p.user_id !== id && p.userId !== id);
    }

    res.json({ success: true, message: `User ${id} and tenant data deleted permanently` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
