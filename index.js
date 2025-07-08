const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");
const { errorHandler, notFound, isApiSecure } = require("./middleware");
const { specs, swaggerUi } = require("./config/swagger");
const db = require("./models");

// Import routes
const userRoutes = require("./routes/users");
const invoiceRoutes = require("./routes/invoices");
const billFromAddressRoutes = require("./routes/billFromAddresses");
const paymentDetailsRoutes = require("./routes/paymentDetails");
const clientRoutes = require("./routes/clients");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// // Security warning if API_SECURE is disabled
// if (!isApiSecure()) {
//   console.log("\n🚨 WARNING: API_SECURE is disabled!");
//   console.log("🔓 Authentication and validation are bypassed.");
//   console.log("⚠️  This should only be used for development purposes.\n");
// }

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

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Invoice Server API Documentation",
  })
);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 apiSecure:
 *                   type: boolean
 *                   example: true
 *                 warning:
 *                   type: string
 *                   example: Authentication and validation are disabled
 */
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
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/bill-from-addresses", billFromAddressRoutes);
app.use("/api/payment-details", paymentDetailsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Invoice Server API",
    version: "1.0.0",
    description: "A general invoice server for eaweb-solutions",
    documentation: "/api-docs",
    endpoints: {
      health: "/health",
      documentation: "/api-docs",
      users: "/api/users",
      clients: "/api/clients",
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

// Server instance and startup flag
let server = null;
let isServerStarted = false;

// Initialize database and start server
async function startServer() {
  // Prevent multiple server starts
  if (isServerStarted) {
    console.log("Server is already running or starting...");
    return;
  }

  isServerStarted = true;

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
    server = app.listen(PORT, () => {
      console.log(`🚀 Invoice Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
    });

    // Set up graceful shutdown handlers
    setupGracefulShutdown();
  } catch (error) {
    console.error("Failed to start server:", error);
    isServerStarted = false;
    process.exit(1);
  }
}

// Graceful shutdown setup
function setupGracefulShutdown() {
  const gracefulShutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        console.log("Server closed successfully");
        process.exit(0);
      });
    } else {
      console.log("No server instance to close");
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

// Start the server only if this file is run directly (not required as a module)

// app.listen(PORT, () => {
//   console.log(`🚀 Invoice Server is running on port ${PORT}`);
//   console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(`🔗 Health check: http://localhost:${PORT}/health`);
//   console.log(`📚 API Documentation: http://localhost:${PORT}/`);
// });
startServer();
module.exports = { app, startServer };
