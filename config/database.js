const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create Sequelize instance using DATABASE_URL for PostgreSQL
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: process.env.SEQUELIZE_LOGGING === "true" ? console.log : false,
  dialectOptions: {
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
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

// Drop all tables safely
async function dropAllTables() {
  try {
    console.log("Dropping all tables...");

    // Drop tables in correct order to avoid foreign key constraints
    const queryInterface = sequelize.getQueryInterface();

    // Disable foreign key checks
    if (sequelize.getDialect() === "postgres") {
      await sequelize.query("SET session_replication_role = replica;");
    }

    // Get all table names
    const tables = await queryInterface.showAllTables();

    // Drop each table
    for (const tableName of tables) {
      await queryInterface.dropTable(tableName, { cascade: true });
      console.log(`Dropped table: ${tableName}`);
    }

    // Re-enable foreign key checks
    if (sequelize.getDialect() === "postgres") {
      await sequelize.query("SET session_replication_role = DEFAULT;");
    }

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
