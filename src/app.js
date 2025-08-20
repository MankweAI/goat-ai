/**
 * Express Application Configuration
 * Enhanced for SA Student Companion with database initialization
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./utils/logger");

// Import database initialization
const { initializeDatabase } = require("./lib/database");
const {
  initializeDatabase: initDatabaseSchema,
} = require("./lib/database-init");

// Import routes
const webhookRoutes = require("./routes/webhook");
const monitoringRoutes = require("./routes/monitoring");

// Create Express app
const app = express();

// Initialize database connection
async function initializeApp() {
  try {
    logger.info("Initializing SA Student Companion application", {
      user: "sophoniagoat",
      timestamp: new Date().toISOString(),
    });

    // Initialize database client
    const db = initializeDatabase();
    logger.info("Database client initialized");

    // Test database schema
    const schemaReady = await initDatabaseSchema();
    if (schemaReady) {
      logger.info("Database schema verified and ready");
    } else {
      logger.warn("Database schema incomplete - some features may not work");
    }
  } catch (error) {
    logger.error("Application initialization failed", { error: error.message });
  }
}

// Initialize app
initializeApp();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "GOAT Bot Backend is running",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    environment: process.env.NODE_ENV,
    project: "SA Student Companion",
  });
});

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to GOAT Bot Backend API - SA Student Companion",
    version: "2.0.0",
    user: "sophoniagoat",
    endpoints: [
      "GET /health - Health check",
      "GET /monitoring/health - Detailed system health",
      "GET /monitoring/database-status - Database schema status",
      "POST /webhook/manychat - ManyChat webhook",
      "GET /webhook/health - Webhook health check",
    ],
    project: "SA Student Companion",
    phase: "Infrastructure Activation",
  });
});

// API routes
app.use("/webhook", webhookRoutes);
app.use("/monitoring", monitoringRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn("404 - Route not found", {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist",
    requestedPath: req.path,
    method: req.method,
    availableEndpoints: [
      "GET /",
      "GET /health",
      "GET /monitoring/health",
      "GET /monitoring/database-status",
      "POST /webhook/manychat",
      "GET /webhook/health",
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

module.exports = app;
