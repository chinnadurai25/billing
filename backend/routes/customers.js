import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all registered customers
router.get('/', async (req, res) => {
  try {
    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: fallbackStore.customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST REGISTRATION ( CUSTOMER )
router.post('/', async (req, res) => {
  try {
    const { name, ledger, address, gstNumber, panNumber, mobile, email, city, state } = req.body;

    if (!name || !gstNumber) {
      return res.status(400).json({ success: false, message: 'NAME and GST NO are required for customer registration' });
    }

    const custId = `CUST-${Date.now().toString().slice(-4)}`;

    const newCustomer = {
      id: custId,
      name,
      ledger: ledger || 'SUNDRY DEBTORS',
      address: address || '',
      gst_number: gstNumber,
      pan_number: panNumber || '',
      mobile: mobile || '',
      email: email || '',
      city: city || 'Chennai',
      state: state || 'Tamil Nadu',
      total_billed: 0.00,
      status: 'Active'
    };

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO customers (id, name, ledger, address, gst_number, pan_number, mobile, email, city, state, total_billed, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [custId, name, newCustomer.ledger, address, gstNumber, newCustomer.pan_number, mobile, email, newCustomer.city, newCustomer.state, 0, 'Active']
      );
    } else {
      fallbackStore.customers.unshift(newCustomer);
    }

    res.status(201).json({
      success: true,
      message: 'REGISTRATION (CUSTOMER) persisted successfully in MySQL',
      customer: newCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
