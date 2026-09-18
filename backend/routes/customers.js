import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all registered customers
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (isConnected()) {
      const db = getDB();
      let query = 'SELECT * FROM customers';
      const params = [];
      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await db.query(query, params);
      return res.json({ success: true, data: rows });
    }

    if (userId) {
      const filtered = fallbackStore.customers.filter(c => c.user_id === userId);
      return res.json({ success: true, data: filtered });
    }
    res.json({ success: true, data: fallbackStore.customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST REGISTRATION ( CUSTOMER )
router.post('/', async (req, res) => {
  try {
    const { name, ledger, address, gstNumber, panNumber, mobile, email, city, state, userId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'NAME is required for customer registration' });
    }

    const custId = req.body.id || `CUST-${Date.now().toString().slice(-6)}`;
    const effectiveUserId = userId || 'USR-901';

    const newCustomer = {
      id: custId,
      user_id: effectiveUserId,
      name,
      ledger: ledger || 'SUNDRY DEBTORS',
      address: address || '',
      gst_number: gstNumber || '',
      pan_number: panNumber || '',
      mobile: mobile || '',
      email: email || '',
      city: city || '',
      state: state || '',
      total_billed: 0.00,
      status: 'Active'
    };

    if (!isConnected()) {
      await initDB();
    }

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO customers (id, user_id, name, ledger, address, gst_number, pan_number, mobile, email, city, state, total_billed, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           user_id = VALUES(user_id),
           name = VALUES(name),
           ledger = VALUES(ledger),
           address = VALUES(address),
           gst_number = VALUES(gst_number),
           pan_number = VALUES(pan_number),
           mobile = VALUES(mobile),
           email = VALUES(email),
           city = VALUES(city),
           state = VALUES(state),
           status = VALUES(status)`,
        [custId, effectiveUserId, name, newCustomer.ledger, newCustomer.address, newCustomer.gst_number, newCustomer.pan_number, newCustomer.mobile, newCustomer.email, newCustomer.city, newCustomer.state, 0, 'Active']
      );
    } else {
      console.warn('⚠️ MySQL not connected when saving customer; saving to memory fallback');
    }

    const existingIdx = fallbackStore.customers.findIndex(c => c.id === custId);
    if (existingIdx >= 0) {
      fallbackStore.customers[existingIdx] = newCustomer;
    } else {
      fallbackStore.customers.unshift(newCustomer);
    }

    res.status(201).json({
      success: true,
      message: 'REGISTRATION (CUSTOMER) persisted successfully',
      customer: newCustomer,
      mysqlSaved: isConnected()
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update Customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ledger, address, gstNumber, panNumber, mobile, email, city, state } = req.body;

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `UPDATE customers SET name = ?, ledger = ?, address = ?, gst_number = ?, pan_number = ?, mobile = ?, email = ?, city = ?, state = ?
         WHERE id = ?`,
        [name, ledger, address || '', gstNumber || '', panNumber || '', mobile || '', email || '', city || '', state || '', id]
      );
    } else {
      const idx = fallbackStore.customers.findIndex(c => c.id === id);
      if (idx !== -1) {
        fallbackStore.customers[idx] = {
          ...fallbackStore.customers[idx],
          name: name || fallbackStore.customers[idx].name,
          ledger: ledger || fallbackStore.customers[idx].ledger,
          address: address !== undefined ? address : fallbackStore.customers[idx].address,
          gst_number: gstNumber !== undefined ? gstNumber : fallbackStore.customers[idx].gst_number,
          pan_number: panNumber !== undefined ? panNumber : fallbackStore.customers[idx].pan_number,
          mobile: mobile !== undefined ? mobile : fallbackStore.customers[idx].mobile,
          email: email !== undefined ? email : fallbackStore.customers[idx].email,
          city: city !== undefined ? city : fallbackStore.customers[idx].city,
          state: state !== undefined ? state : fallbackStore.customers[idx].state
        };
      }
    }

    res.json({
      success: true,
      message: 'Customer record updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const db = getDB();
      await db.query('DELETE FROM customers WHERE id = ?', [id]);
    } else {
      fallbackStore.customers = fallbackStore.customers.filter(c => c.id !== id);
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
