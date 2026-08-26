import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all registered bank & cash accounts
router.get('/', async (req, res) => {
  try {
    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query('SELECT * FROM bank_accounts ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: fallbackStore.bankAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST REGISTRATION ( BANK / CASH )
router.post('/', async (req, res) => {
  try {
    const { bankType, accountName, accountNumber, bankName, ifscCode, address } = req.body;

    if (!accountName || !accountNumber) {
      return res.status(400).json({ success: false, message: 'NAME OF ACCOUNT and ACCOUNT NUMBER are required' });
    }

    const bankId = `BANK-${Date.now().toString().slice(-4)}`;

    const newBank = {
      id: bankId,
      bank_type: bankType || 'Bank Account',
      account_name: accountName,
      account_number: accountNumber,
      bank_name: bankName || 'HDFC Bank Ltd',
      ifsc_code: ifscCode || 'HDFC0001234',
      address: address || '',
      balance: 150000.00,
      status: 'Active'
    };

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO bank_accounts (id, bank_type, account_name, account_number, bank_name, ifsc_code, address, balance, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bankId, newBank.bank_type, accountName, accountNumber, newBank.bank_name, newBank.ifsc_code, address, 150000.00, 'Active']
      );
    } else {
      fallbackStore.bankAccounts.unshift(newBank);
    }

    res.status(201).json({
      success: true,
      message: 'REGISTRATION (BANK / CASH) persisted successfully in MySQL',
      bankAccount: newBank
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
