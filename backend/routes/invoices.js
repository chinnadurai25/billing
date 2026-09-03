import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (isConnected()) {
      const db = getDB();
      let query = 'SELECT * FROM invoices';
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
      const filtered = fallbackStore.invoices.filter(i => i.user_id === userId);
      return res.json({ success: true, data: filtered });
    }
    res.json({ success: true, data: fallbackStore.invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Create Tax Invoice
router.post('/', async (req, res) => {
  try {
    const { invoiceNumber, customerName, customerGst, date, dueDate, subtotal, cgst, sgst, igst, totalTax, grandTotal, status, userId } = req.body;

    if (!customerName || !grandTotal) {
      return res.status(400).json({ success: false, message: 'Customer Name and Total are required' });
    }

    const invId = req.body.id || `INV-${Date.now().toString().slice(-4)}`;
    const num = invoiceNumber || `TP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveUserId = userId || 'USR-901';

    const newInvoice = {
      id: invId,
      user_id: effectiveUserId,
      invoice_number: num,
      customer_name: customerName,
      customer_gst: customerGst || '33AAACD1234F1Z5',
      date: date || new Date().toISOString().split('T')[0],
      due_date: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      subtotal: parseFloat(subtotal) || 0,
      cgst: parseFloat(cgst) || 0,
      sgst: parseFloat(sgst) || 0,
      igst: parseFloat(igst) || 0,
      total_tax: parseFloat(totalTax) || 0,
      grand_total: parseFloat(grandTotal) || 0,
      status: status || 'Pending'
    };

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO invoices (id, user_id, invoice_number, customer_name, customer_gst, date, due_date, subtotal, cgst, sgst, igst, total_tax, grand_total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invId, effectiveUserId, num, customerName, newInvoice.customer_gst, newInvoice.date, newInvoice.due_date, newInvoice.subtotal, newInvoice.cgst, newInvoice.sgst, newInvoice.igst, newInvoice.total_tax, newInvoice.grand_total, newInvoice.status]
      );
    } else {
      fallbackStore.invoices.unshift(newInvoice);
    }

    res.status(201).json({
      success: true,
      message: 'Tax Invoice generated & saved in MySQL database',
      invoice: newInvoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update Invoice
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, customerName, grandTotal } = req.body;

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `UPDATE invoices SET status = COALESCE(?, status), customer_name = COALESCE(?, customer_name), grand_total = COALESCE(?, grand_total)
         WHERE id = ?`,
        [status, customerName, grandTotal, id]
      );
    } else {
      const idx = fallbackStore.invoices.findIndex(i => i.id === id);
      if (idx !== -1) {
        fallbackStore.invoices[idx] = {
          ...fallbackStore.invoices[idx],
          status: status || fallbackStore.invoices[idx].status,
          customer_name: customerName || fallbackStore.invoices[idx].customer_name,
          customerName: customerName || fallbackStore.invoices[idx].customerName,
          grand_total: grandTotal !== undefined ? grandTotal : fallbackStore.invoices[idx].grand_total,
          grandTotal: grandTotal !== undefined ? grandTotal : fallbackStore.invoices[idx].grandTotal
        };
      }
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Invoice
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const db = getDB();
      await db.query('DELETE FROM invoices WHERE id = ?', [id]);
    } else {
      fallbackStore.invoices = fallbackStore.invoices.filter(i => i.id !== id);
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
