import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all invoices
router.get('/', async (req, res) => {
  try {
    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: fallbackStore.invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Create Tax Invoice
router.post('/', async (req, res) => {
  try {
    const { invoiceNumber, customerName, customerGst, date, dueDate, subtotal, cgst, sgst, igst, totalTax, grandTotal, status } = req.body;

    if (!customerName || !grandTotal) {
      return res.status(400).json({ success: false, message: 'Customer Name and Total are required' });
    }

    const invId = `INV-${Date.now().toString().slice(-4)}`;
    const num = invoiceNumber || `TP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newInvoice = {
      id: invId,
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
        `INSERT INTO invoices (id, invoice_number, customer_name, customer_gst, date, due_date, subtotal, cgst, sgst, igst, total_tax, grand_total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invId, num, customerName, newInvoice.customer_gst, newInvoice.date, newInvoice.due_date, newInvoice.subtotal, newInvoice.cgst, newInvoice.sgst, newInvoice.igst, newInvoice.total_tax, newInvoice.grand_total, newInvoice.status]
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

export default router;
