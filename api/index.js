/**
 * Vercel Serverless Function Entry Point
 * Updated to include monitoring routes
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Import routes directly - ADD THIS LINE
const monitoringRoutes = require("../src/routes/monitoring");
const webhookRoutes = require("../src/routes/webhook");

// Import database initialization
const { initializeDatabase } = require("../src/lib/database");

// Create Express app
const app = express();

// Initialize database
initializeDatabase();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Root endpoint
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

// Mount routes - ADD THIS LINE
app.use("/monitoring", monitoringRoutes);
app.use("/webhook", webhookRoutes);

// 404 handler
app.use((req, res) => {
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
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Export the Express app as a serverless function
module.exports = app;
