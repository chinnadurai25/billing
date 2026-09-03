import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

let dbPool = null;
let isMySqlConnected = false;

// Fallback in-memory store if MySQL server is offline during dev
export const fallbackStore = {
  users: [
    {
      id: 'USR-001',
      fullName: 'Chinna Durai',
      email: 'chinna.durai@taxpulse.io',
      contactNumber: '+91 98765 43210',
      companyName: 'Durai Tax Advisory & Financials Ltd',
      constitution: 'Private Limited',
      companyAddress: 'Suite 402, Quantum Tech Tower, Inner Ring Road',
      state: 'Tamil Nadu',
      gstNumber: '33AAACD1234F1Z5',
      registrationType: 'Regular',
      panNumber: 'AAACD1234F',
      username: 'chinna_durai',
      passwordHash: bcrypt.hashSync('password123', 10)
    }
  ],
  customers: [],
  bankAccounts: [],
  productsServices: [],
  invoices: [],
  adminUsers: [],
  activityLogs: []
};

export const initDB = async () => {
  try {
    // 1. Initial connection without DB selected to ensure database exists
    const rootConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'taxpulse_db'}\`;`);
    await rootConnection.end();

    // 2. Create connection pool to taxpulse_db
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'taxpulse_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 3. Create Tables
    const connection = await dbPool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        contact_number VARCHAR(20) NOT NULL,
        company_name VARCHAR(200) NOT NULL,
        constitution ENUM('Proprietorship', 'Partnership Firm', 'Private Limited') DEFAULT 'Private Limited',
        company_address TEXT NOT NULL,
        state VARCHAR(100) NOT NULL,
        gst_number VARCHAR(15) NOT NULL,
        registration_type ENUM('Regular', 'Composition') DEFAULT 'Regular',
        pan_number VARCHAR(10) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        company_logo LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure company_logo column exists in users table if already created
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN company_logo LONGTEXT;`);
    } catch (e) {
      // Column already exists, ignore
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(100),
        name VARCHAR(200) NOT NULL,
        ledger ENUM('SUNDRY DEBTORS', 'SUNDRY CREDITORS') DEFAULT 'SUNDRY DEBTORS',
        address TEXT,
        gst_number VARCHAR(15) NOT NULL,
        pan_number VARCHAR(10),
        mobile VARCHAR(20),
        email VARCHAR(150),
        city VARCHAR(100) DEFAULT 'Chennai',
        state VARCHAR(100) DEFAULT 'Tamil Nadu',
        total_billed DECIMAL(15,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(100),
        bank_type ENUM('Bank Account', 'Cash in Hand', 'Petty Cash') DEFAULT 'Bank Account',
        account_name VARCHAR(200) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        bank_name VARCHAR(150),
        ifsc_code VARCHAR(20),
        address TEXT,
        balance DECIMAL(15,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products_services (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(100),
        title VARCHAR(200) NOT NULL,
        unit VARCHAR(50) DEFAULT 'Pices',
        hsn_sac VARCHAR(20) NOT NULL,
        opening_stock INT DEFAULT 100,
        rate DECIMAL(15,2) NOT NULL,
        tax_percent DECIMAL(5,2) DEFAULT 18.00,
        category VARCHAR(100) DEFAULT 'Tax Compliance',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(100),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(200) NOT NULL,
        customer_gst VARCHAR(15) NOT NULL,
        date DATE NOT NULL,
        due_date DATE NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL,
        cgst DECIMAL(15,2) DEFAULT 0.00,
        sgst DECIMAL(15,2) DEFAULT 0.00,
        igst DECIMAL(15,2) DEFAULT 0.00,
        total_tax DECIMAL(15,2) NOT NULL,
        grand_total DECIMAL(15,2) NOT NULL,
        status ENUM('Paid', 'Pending', 'Overdue', 'Draft') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure user_id column exists in case tables were already created
    const tablesToMigrate = ['customers', 'bank_accounts', 'products_services', 'invoices'];
    for (const tbl of tablesToMigrate) {
      try {
        await connection.query(`ALTER TABLE ${tbl} ADD COLUMN user_id VARCHAR(100);`);
      } catch (e) {
        // Column already exists, ignore
      }
    }

    // 4. Auto-seed initial data ONLY on brand-new fresh database setup
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log('🌱 Fresh DB setup: Seeding initial demo user & template records into MySQL...');
      const defaultPassHash = await bcrypt.hash('password123', 10);
      await connection.query(
        `INSERT IGNORE INTO users (id, full_name, email, contact_number, company_name, constitution, company_address, state, gst_number, registration_type, pan_number, username, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['USR-901', 'Chinna Durai', 'chinna.durai@taxpulse.io', '+91 98765 43210', 'Durai Tax Advisory & Financials Ltd', 'Private Limited', 'Suite 402, Quantum Tech Tower, Inner Ring Road', 'Tamil Nadu', '33AAACD1234F1Z5', 'Regular', 'AAACD1234F', 'chinna_durai', defaultPassHash]
      );

      // Seed Customers
      const initialCustomers = [
        ['CUST-001', 'USR-901', 'Acme Global Solutions', 'SUNDRY DEBTORS', 'Plot 12, Tech Park, Bengaluru', '29AABCA1234B1Z2', 'AAACD1234F', '+91 98400 11223', 'billing@acmeglobal.com', 'Bengaluru', 'Karnataka', 145000.00, 'Active'],
        ['CUST-002', 'USR-901', 'Zenith Retail Infra', 'SUNDRY DEBTORS', '24, Mount Road, Chennai', '33BBCCZ5678K1Z8', 'AAACD1234F', '+91 97100 44556', 'finance@zenithretail.in', 'Chennai', 'Tamil Nadu', 98000.00, 'Active'],
        ['CUST-003', 'USR-901', 'Apex Logistics Tech', 'SUNDRY DEBTORS', '88, BKC Complex, Mumbai', '27CCCAP9988P1Z4', 'AAACD1234F', '+91 99600 77889', 'accounts@apexlogistics.io', 'Mumbai', 'Maharashtra', 230000.00, 'Active'],
        ['CUST-004', 'USR-901', 'Nova Biotech Ltd', 'SUNDRY DEBTORS', '5th Floor, HITEC City, Hyderabad', '36DDDNB4455M1Z9', 'AAACD1234F', '+91 94400 33445', 'tax@novabiotech.org', 'Hyderabad', 'Telangana', 64000.00, 'Active'],
        ['CUST-005', 'USR-901', 'Vanguard Design Studio', 'SUNDRY DEBTORS', '14, Avinashi Road, Coimbatore', '33EEEVD8877Q1Z1', 'AAACD1234F', '+91 98800 22110', 'hello@vanguarddesign.com', 'Coimbatore', 'Tamil Nadu', 42000.00, 'Active']
      ];
      for (const c of initialCustomers) {
        await connection.query(
          'INSERT IGNORE INTO customers (id, user_id, name, ledger, address, gst_number, pan_number, mobile, email, city, state, total_billed, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          c
        );
      }

      // Seed Bank Accounts
      const initialBanks = [
        ['BANK-001', 'USR-901', 'Bank Account', 'Durai Tax Advisory Operating A/C', '50100234901234', 'HDFC Bank Ltd', 'HDFC0001234', 'Anna Salai, Chennai Branch', 450000.00, 'Active'],
        ['BANK-002', 'USR-901', 'Bank Account', 'Durai Tax Collection Reserve', '000405012345', 'ICICI Bank Ltd', 'ICIC0000004', 'Nungambakkam, Chennai Branch', 280000.00, 'Active'],
        ['BANK-003', 'USR-901', 'Cash in Hand', 'Main Petty Cash Ledger', 'CASH-LEDGER-01', 'Cash Chest', 'N/A', 'Office Safe', 35000.00, 'Active']
      ];
      for (const b of initialBanks) {
        await connection.query(
          'INSERT IGNORE INTO bank_accounts (id, user_id, bank_type, account_name, account_number, bank_name, ifsc_code, address, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          b
        );
      }

      // Seed Products & Services
      const initialProducts = [
        ['SRV-101', 'USR-901', 'GSTR-1 & GSTR-3B Monthly Tax Filing', 'Pices', '998222', 100, 12500.00, 18.00, 'Tax Compliance'],
        ['SRV-102', 'USR-901', 'Corporate Income Tax Return (ITR-6)', 'Pices', '998231', 50, 35000.00, 18.00, 'Income Tax'],
        ['SRV-103', 'USR-901', 'GST Annual Audit & Reconciliation', 'Pices', '998221', 30, 48000.00, 18.00, 'Auditing'],
        ['SRV-104', 'USR-901', 'TDS / TCS Quarterly Advisory & Returns', 'Pices', '998212', 80, 15000.00, 18.00, 'Direct Tax'],
        ['SRV-105', 'USR-901', 'Transfer Pricing Documentation', 'Pices', '998240', 25, 75000.00, 18.00, 'International Tax']
      ];
      for (const p of initialProducts) {
        await connection.query(
          'INSERT IGNORE INTO products_services (id, user_id, title, unit, hsn_sac, opening_stock, rate, tax_percent, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          p
        );
      }

      // Seed Invoices
      const initialInvoices = [
        ['INV-2026-089', 'USR-901', 'TP-2026-089', 'Acme Global Solutions', '29AABCA1234B1Z2', '2026-08-24', '2026-09-07', 50000.00, 4500.00, 4500.00, 0.00, 9000.00, 59000.00, 'Paid'],
        ['INV-2026-088', 'USR-901', 'TP-2026-088', 'Apex Logistics Tech', '27CCCAP9988P1Z4', '2026-08-21', '2026-09-04', 75000.00, 0.00, 0.00, 13500.00, 13500.00, 88500.00, 'Pending'],
        ['INV-2026-087', 'USR-901', 'TP-2026-087', 'Zenith Retail Infra', '33BBCCZ5678K1Z8', '2026-08-15', '2026-08-25', 35000.00, 3150.00, 3150.00, 0.00, 6300.00, 41300.00, 'Overdue'],
        ['INV-2026-086', 'USR-901', 'TP-2026-086', 'Nova Biotech Ltd', '36DDDNB4455M1Z9', '2026-08-10', '2026-08-24', 48000.00, 0.00, 0.00, 8640.00, 8640.00, 56640.00, 'Paid'],
        ['INV-2026-085', 'USR-901', 'TP-2026-085', 'Vanguard Design Studio', '33EEEVD8877Q1Z1', '2026-08-02', '2026-08-16', 25000.00, 2250.00, 2250.00, 0.00, 4500.00, 29500.00, 'Paid']
      ];
      for (const inv of initialInvoices) {
        await connection.query(
          'INSERT IGNORE INTO invoices (id, user_id, invoice_number, customer_name, customer_gst, date, due_date, subtotal, cgst, sgst, igst, total_tax, grand_total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          inv
        );
      }
      console.log('✅ Initial Seed Data successfully populated in MySQL tables!');
    }

    connection.release();
    isMySqlConnected = true;
    console.log('✅ MySQL Database Connected & All 7 Relational Tables Ready (taxpulse_db)');
  } catch (error) {
    console.log(`⚠️ MySQL Connection Note: ${error.message}. Operating with Memory-Store fallback mode.`);
    isMySqlConnected = false;
  }
};

export const getDB = () => dbPool;
export const isConnected = () => isMySqlConnected;
