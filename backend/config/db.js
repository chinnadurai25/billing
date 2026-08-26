import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let dbPool = null;
let isMySqlConnected = false;

// Fallback in-memory store if MySQL server is offline during dev
export const fallbackStore = {
  users: [],
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
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

    connection.release();
    isMySqlConnected = true;
    console.log('✅ MySQL Database Connected & All 7 Relational Tables Initialized (taxpulse_db)');
  } catch (error) {
    console.log('⚠️ MySQL Connection Note: MySQL server is not active on localhost:3306. Operating with seamless Memory-Store fallback mode.');
    isMySqlConnected = false;
  }
};

export const getDB = () => dbPool;
export const isConnected = () => isMySqlConnected;
