import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB, isConnected } from './config/db.js';

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import bankRoutes from './routes/bankAccounts.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const INITIAL_PORT = parseInt(process.env.PORT || '5000');

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bank-accounts', bankRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    mysql: isConnected() ? 'connected (taxpulse_db)' : 'memory-fallback-active',
    timestamp: new Date().toISOString()
  });
});

// Port Fallback & Server Startup
const startServer = (port) => {
  const server = app.listen(port, async () => {
    console.log(`🚀 TaxPulse Backend REST API listening on http://localhost:${port}`);
    await initDB();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is occupied. Retrying on port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(INITIAL_PORT);
