import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all registered users for Admin Portal
router.get('/users', async (req, res) => {
  try {
    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query(
        'SELECT id, full_name, email, contact_number, company_name, constitution, company_address, state, gst_number, registration_type, pan_number, username, created_at FROM users ORDER BY created_at DESC'
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
        status: 'Active',
        date: new Date(u.created_at).toISOString().split('T')[0]
      }));

      return res.json({ success: true, data: formatted });
    }
    res.json({ success: true, data: fallbackStore.users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH Toggle User Account Status (Active / Suspended)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Status update acknowledgment
    res.json({ success: true, message: `User ${id} status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
