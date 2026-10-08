import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all receipts (optionally filtered by userId)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (isConnected()) {
      const db = getDB();
      let query = 'SELECT * FROM receipts';
      const params = [];
      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await db.query(query, params);
      const formatted = rows.map(r => ({
        ...r,
        items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
      }));
      return res.json({ success: true, data: formatted });
    }

    if (userId) {
      const filtered = (fallbackStore.receipts || []).filter(r => r.user_id === userId);
      return res.json({ success: true, data: filtered });
    }
    res.json({ success: true, data: fallbackStore.receipts || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single receipt by id or receipt_number
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query(
        'SELECT * FROM receipts WHERE id = ? OR receipt_number = ? LIMIT 1',
        [id, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }
      const r = rows[0];
      return res.json({
        success: true,
        data: {
          ...r,
          items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
        }
      });
    }

    const item = (fallbackStore.receipts || []).find(r => r.id === id || r.receipt_number === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Create new Receipt voucher
router.post('/', async (req, res) => {
  try {
    const {
      id,
      userId,
      receiptNumber,
      receipt_number,
      customerName,
      customer_name,
      customerGst,
      customer_gst,
      date,
      paymentMethod,
      payment_method,
      receivedFrom,
      received_from,
      purpose,
      paymentPurpose,
      amount,
      grandTotal,
      status,
      items
    } = req.body;

    const targetCustomer = customerName || customer_name || receivedFrom || received_from;
    const finalAmount = parseFloat(amount !== undefined ? amount : (grandTotal || 0)) || 0;

    if (!targetCustomer) {
      return res.status(400).json({ success: false, message: 'Customer Name / Received From is required' });
    }

    const recId = id || `REC-${Date.now()}`;
    const recNum = receiptNumber || receipt_number || `REC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveUserId = userId || 'USR-901';
    const recDate = date || new Date().toISOString().split('T')[0];
    const recMethod = paymentMethod || payment_method || 'Bank Transfer';
    const recParty = receivedFrom || received_from || targetCustomer;
    const recPurpose = purpose || paymentPurpose || 'Payment Received';
    const recStatus = status || 'Completed';
    const itemsJson = JSON.stringify(items || []);

    const newReceipt = {
      id: recId,
      user_id: effectiveUserId,
      userId: effectiveUserId,
      receipt_number: recNum,
      receiptNumber: recNum,
      customer_name: targetCustomer,
      customerName: targetCustomer,
      customer_gst: customerGst || customer_gst || 'N/A',
      customerGst: customerGst || customer_gst || 'N/A',
      date: recDate,
      payment_method: recMethod,
      paymentMethod: recMethod,
      received_from: recParty,
      receivedFrom: recParty,
      purpose: recPurpose,
      amount: finalAmount,
      grandTotal: finalAmount,
      status: recStatus,
      items: items || [],
      created_at: new Date().toISOString()
    };

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO receipts (id, user_id, receipt_number, customer_name, customer_gst, date, payment_method, received_from, purpose, amount, status, items)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         receipt_number=VALUES(receipt_number), customer_name=VALUES(customer_name),
         customer_gst=VALUES(customer_gst), date=VALUES(date), payment_method=VALUES(payment_method),
         received_from=VALUES(received_from), purpose=VALUES(purpose), amount=VALUES(amount),
         status=VALUES(status), items=VALUES(items)`,
        [recId, effectiveUserId, recNum, targetCustomer, newReceipt.customer_gst, recDate, recMethod, recParty, recPurpose, finalAmount, recStatus, itemsJson]
      );
    }

    if (!fallbackStore.receipts) fallbackStore.receipts = [];
    const existingIdx = fallbackStore.receipts.findIndex(r => r.id === recId || r.receipt_number === recNum);
    if (existingIdx >= 0) {
      fallbackStore.receipts[existingIdx] = newReceipt;
    } else {
      fallbackStore.receipts.unshift(newReceipt);
    }

    res.status(201).json({
      success: true,
      message: 'Receipt recorded successfully',
      data: newReceipt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update Receipt
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      customerName,
      customer_name,
      amount,
      grandTotal,
      paymentMethod,
      payment_method,
      purpose,
      paymentPurpose
    } = req.body;

    if (isConnected()) {
      const db = getDB();
      const updates = [];
      const values = [];

      if (status) { updates.push('status = ?'); values.push(status); }
      if (customerName || customer_name) { updates.push('customer_name = ?'); values.push(customerName || customer_name); }
      if (amount !== undefined || grandTotal !== undefined) {
        updates.push('amount = ?');
        values.push(parseFloat(amount !== undefined ? amount : grandTotal) || 0);
      }
      if (paymentMethod || payment_method) { updates.push('payment_method = ?'); values.push(paymentMethod || payment_method); }
      if (purpose || paymentPurpose) { updates.push('purpose = ?'); values.push(purpose || paymentPurpose); }

      if (updates.length > 0) {
        values.push(id, id);
        await db.query(`UPDATE receipts SET ${updates.join(', ')} WHERE id = ? OR receipt_number = ?`, values);
      }
    }

    if (fallbackStore.receipts) {
      const idx = fallbackStore.receipts.findIndex(r => r.id === id || r.receipt_number === id);
      if (idx >= 0) {
        fallbackStore.receipts[idx] = {
          ...fallbackStore.receipts[idx],
          ...req.body
        };
      }
    }

    res.json({ success: true, message: 'Receipt updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Receipt
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const db = getDB();
      await db.query('DELETE FROM receipts WHERE id = ? OR receipt_number = ?', [id, id]);
    }

    if (fallbackStore.receipts) {
      fallbackStore.receipts = fallbackStore.receipts.filter(r => r.id !== id && r.receipt_number !== id);
    }

    res.json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
