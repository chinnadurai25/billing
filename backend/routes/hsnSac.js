import express from 'express';
import { lookupHsnSac } from '../services/hsnSacService.js';

const router = express.Router();

router.get('/lookup', async (req, res) => {
  try {
    const results = await lookupHsnSac({ code: req.query.query, type: req.query.type });
    res.json({ success: true, data: results });
  } catch (error) {
    const status = error.code === 'HSN_SAC_NOT_CONFIGURED' ? 503 : 502;
    res.status(status).json({ success: false, message: error.message });
  }
});

export default router;
