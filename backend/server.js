import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, isConnected } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import bankRoutes from './routes/bankAccounts.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

// Hostinger assigns PORT dynamically via process.env.PORT — NEVER hardcode it
const INITIAL_PORT = parseInt(process.env.PORT || '3000');

// Prevent crashes from unhandled promise rejections (critical for Hostinger Node.js)
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

// Middlewares with 50MB payload limit for company logos & full CORS support
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    mysql: isConnected() ? 'connected (billson_db)' : 'memory-fallback-active',
    timestamp: new Date().toISOString()
  });
});

// Serve Frontend Static Files
// Try frontend/dist (one level up from backend), fall back to backend/dist
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
const backendDistPath = path.join(__dirname, 'dist');

import { existsSync } from 'fs';
const staticPath = existsSync(path.join(frontendDistPath, 'index.html'))
  ? frontendDistPath
  : backendDistPath;

console.log(`📁 Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));

// Catch-all route to serve the React app for any non-API URL
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Port Fallback & Server Startup
const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', async () => {
    console.log(`🚀 BillSon Backend REST API listening on port ${port} (0.0.0.0)`);
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
