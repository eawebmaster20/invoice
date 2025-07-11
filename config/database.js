const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "invoice_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

// Drop all tables
async function dropAllTables() {
  try {
    // Drop tables in reverse order to avoid foreign key constraints
    await pool.execute(`SET FOREIGN_KEY_CHECKS = 0`);

    const tables = [
      "payment_details",
      "invoice_items",
      "invoices",
      "clients",
      "bill_from_addresses",
      "users",
    ];

    for (const table of tables) {
      await pool.execute(`DROP TABLE IF EXISTS ${table}`);
      console.log(`Dropped table: ${table}`);
    }

    await pool.execute(`SET FOREIGN_KEY_CHECKS = 1`);
    console.log("All tables dropped successfully");
  } catch (error) {
    console.error("Error dropping tables:", error.message);
    throw error;
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Check if DB_RESET environment variable is set to true
    if (process.env.DB_RESET === "true") {
      console.log("DB_RESET is enabled, dropping all tables...");
      await dropAllTables();
    }

    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create bill_from_addresses table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS bill_from_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        company_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(255) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create clients table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(255),
        postal_code VARCHAR(20),
        country VARCHAR(255),
        tax_id VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create invoices table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        client_id INT,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        bill_from_id INT,
        subtotal DECIMAL(10,2) NOT NULL,
        tax_rate DECIMAL(5,2) NOT NULL,
        tax_amount DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid', 'partially_paid', 'overdue') DEFAULT 'pending',
        amount_paid DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (bill_from_id) REFERENCES bill_from_addresses(id)
      )
    `);

    // Create invoice_items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT,
        description TEXT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);

    // Create payment_details table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payment_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        invoice_id INT,
        method VARCHAR(100) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        swift_code VARCHAR(50) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  dropAllTables,
};
