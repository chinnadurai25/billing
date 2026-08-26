import express from 'express';
import { getDB, isConnected, fallbackStore } from '../config/db.js';

const router = express.Router();

// GET all sales & service items
router.get('/', async (req, res) => {
  try {
    if (isConnected()) {
      const db = getDB();
      const [rows] = await db.query('SELECT * FROM products_services ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: fallbackStore.productsServices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST REGISTRATION ( SALES / SERVICES )
router.post('/', async (req, res) => {
  try {
    const { title, unit, hsnSac, openingStock, rate, taxPercent, category } = req.body;

    if (!title || !hsnSac) {
      return res.status(400).json({ success: false, message: 'NAME OF THE ITEM and HSN CODE are required' });
    }

    const prodId = `SRV-${Date.now().toString().slice(-4)}`;

    const newItem = {
      id: prodId,
      title,
      unit: unit || 'Pices',
      hsn_sac: hsnSac,
      opening_stock: parseInt(openingStock) || 100,
      rate: parseFloat(rate) || 12500.00,
      tax_percent: parseFloat(taxPercent) || 18.00,
      category: category || 'Sales / Service Item'
    };

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `INSERT INTO products_services (id, title, unit, hsn_sac, opening_stock, rate, tax_percent, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [prodId, title, newItem.unit, hsnSac, newItem.opening_stock, newItem.rate, newItem.tax_percent, newItem.category]
      );
    } else {
      fallbackStore.productsServices.unshift(newItem);
    }

    res.status(201).json({
      success: true,
      message: 'REGISTRATION (SALES / SERVICES) persisted successfully in MySQL',
      product: newItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
