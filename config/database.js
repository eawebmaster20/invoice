const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create Sequelize instance using DATABASE_URL for PostgreSQL
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: process.env.SEQUELIZE_LOGGING === "true" ? console.log : false,
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false,
  //   },
  // },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
  },
});

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

// Drop all tables
async function dropAllTables() {
  try {
    console.log("Dropping all tables...");
    await sequelize.drop();
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

    // Sync all models with database
    const syncOptions = {
      force: process.env.SEQUELIZE_SYNC_FORCE === "true",
      alter: process.env.SEQUELIZE_SYNC_ALTER === "true",
    };

    await sequelize.sync(syncOptions);
    console.log("Database tables synchronized successfully");
  } catch (error) {
    console.error("Error initializing database:", error.message);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  dropAllTables,
};
module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  dropAllTables,
};
