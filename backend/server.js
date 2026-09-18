import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { initDB, isConnected } from './config/db.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import bankRoutes from './routes/bankAccounts.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Hostinger dynamically assigns PORT via process.env.PORT — do not hardcode
const INITIAL_PORT = parseInt(process.env.PORT || '3000');

// Prevent silent crashes (critical for Hostinger Node.js hosting)
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

// Middlewares
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
    mysql: isConnected() ? 'connected' : 'memory-fallback-active',
    timestamp: new Date().toISOString()
  });
});

// Resolve correct static files path:
// Priority 1: root dist (Vite deployment output synced to root)
// Priority 2: frontend/dist (committed React build)
// Priority 3: backend/dist (fallback copy)
const rootDistPath = path.join(__dirname, '..', 'dist');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
const backendDistPath = path.join(__dirname, 'dist');
const staticPath = existsSync(path.join(rootDistPath, 'index.html'))
  ? rootDistPath
  : existsSync(path.join(frontendDistPath, 'index.html'))
  ? frontendDistPath
  : backendDistPath;

console.log(`📁 Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));

// Catch-all: serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Server startup with port fallback
const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', async () => {
    console.log(`🚀 BillSon Backend listening on port ${port}`);
    await initDB();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(INITIAL_PORT);
