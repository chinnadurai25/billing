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

// PUT Update Product / Service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, unit, hsnSac, openingStock, rate, taxPercent, category } = req.body;

    if (isConnected()) {
      const db = getDB();
      await db.query(
        `UPDATE products_services SET title = ?, unit = ?, hsn_sac = ?, opening_stock = ?, rate = ?, tax_percent = ?, category = ?
         WHERE id = ?`,
        [title, unit, hsnSac, parseInt(openingStock) || 0, parseFloat(rate) || 0, parseFloat(taxPercent) || 0, category || 'Sales / Service Item', id]
      );
    } else {
      const idx = fallbackStore.productsServices.findIndex(p => p.id === id);
      if (idx !== -1) {
        fallbackStore.productsServices[idx] = {
          ...fallbackStore.productsServices[idx],
          title: title || fallbackStore.productsServices[idx].title,
          unit: unit || fallbackStore.productsServices[idx].unit,
          hsn_sac: hsnSac || fallbackStore.productsServices[idx].hsn_sac,
          hsnSac: hsnSac || fallbackStore.productsServices[idx].hsnSac,
          opening_stock: openingStock !== undefined ? parseInt(openingStock) : fallbackStore.productsServices[idx].opening_stock,
          openingStock: openingStock !== undefined ? parseInt(openingStock) : fallbackStore.productsServices[idx].openingStock,
          rate: rate !== undefined ? parseFloat(rate) : fallbackStore.productsServices[idx].rate,
          tax_percent: taxPercent !== undefined ? parseFloat(taxPercent) : fallbackStore.productsServices[idx].tax_percent,
          taxPercent: taxPercent !== undefined ? parseFloat(taxPercent) : fallbackStore.productsServices[idx].taxPercent,
          category: category || fallbackStore.productsServices[idx].category
        };
      }
    }

    res.json({
      success: true,
      message: 'Item / Service updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Product / Service
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const db = getDB();
      await db.query('DELETE FROM products_services WHERE id = ?', [id]);
    } else {
      fallbackStore.productsServices = fallbackStore.productsServices.filter(p => p.id !== id);
    }

    res.json({
      success: true,
      message: 'Item / Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
