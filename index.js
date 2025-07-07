const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");
const { errorHandler, notFound, isApiSecure } = require("./middleware");

// Import routes
const userRoutes = require("./routes/users");
const invoiceRoutes = require("./routes/invoices");
const billFromAddressRoutes = require("./routes/billFromAddresses");
const paymentDetailsRoutes = require("./routes/paymentDetails");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security warning if API_SECURE is disabled
if (!isApiSecure()) {
  console.log("\n🚨 WARNING: API_SECURE is disabled!");
  console.log("🔓 Authentication and validation are bypassed.");
  console.log("⚠️  This should only be used for development purposes.\n");
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    apiSecure: isApiSecure(),
    warning: !isApiSecure()
      ? "Authentication and validation are disabled"
      : undefined,
  });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/bill-from-addresses", billFromAddressRoutes);
app.use("/api/payment-details", paymentDetailsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Invoice Server API",
    version: "1.0.0",
    description: "A general invoice server for eaweb-solutions",
    endpoints: {
      health: "/health",
      users: "/api/users",
      invoices: "/api/invoices",
      billFromAddresses: "/api/bill-from-addresses",
      paymentDetails: "/api/payment-details",
    },
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log("Starting Invoice Server...");

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Initialize database tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Invoice Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
