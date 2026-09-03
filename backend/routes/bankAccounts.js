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

// PUT Update Bank / Cash Account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bankType, accountName, accountNumber, bankName, ifscCode, address, balance, status } = req.body;

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `UPDATE bank_accounts SET bank_type = ?, account_name = ?, account_number = ?, bank_name = ?, ifsc_code = ?, address = ?, balance = COALESCE(?, balance), status = COALESCE(?, status)
         WHERE id = ?`,
        [bankType, accountName, accountNumber, bankName, ifscCode, address, balance, status, id]
      );
    } else {
      const idx = fallbackStore.bankAccounts.findIndex(b => b.id === id);
      if (idx !== -1) {
        fallbackStore.bankAccounts[idx] = {
          ...fallbackStore.bankAccounts[idx],
          bank_type: bankType || fallbackStore.bankAccounts[idx].bank_type,
          bankType: bankType || fallbackStore.bankAccounts[idx].bankType,
          account_name: accountName || fallbackStore.bankAccounts[idx].account_name,
          accountName: accountName || fallbackStore.bankAccounts[idx].accountName,
          account_number: accountNumber || fallbackStore.bankAccounts[idx].account_number,
          accountNumber: accountNumber || fallbackStore.bankAccounts[idx].accountNumber,
          bank_name: bankName || fallbackStore.bankAccounts[idx].bank_name,
          bankName: bankName || fallbackStore.bankAccounts[idx].bankName,
          ifsc_code: ifscCode !== undefined ? ifscCode : fallbackStore.bankAccounts[idx].ifsc_code,
          ifscCode: ifscCode !== undefined ? ifscCode : fallbackStore.bankAccounts[idx].ifscCode,
          address: address !== undefined ? address : fallbackStore.bankAccounts[idx].address,
          balance: balance !== undefined ? balance : fallbackStore.bankAccounts[idx].balance,
          status: status || fallbackStore.bankAccounts[idx].status
        };
      }
    }

    res.json({
      success: true,
      message: 'Bank / Cash account updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Bank / Cash Account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const db = getDB();
      await db.query('DELETE FROM bank_accounts WHERE id = ?', [id]);
    } else {
      fallbackStore.bankAccounts = fallbackStore.bankAccounts.filter(b => b.id !== id);
    }

    res.json({
      success: true,
      message: 'Bank / Cash account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
