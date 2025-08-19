/**
 * Express Application Configuration
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./utils/logger");

// Import routes
const webhookRoutes = require("./routes/webhook");

// Create Express app
const app = express();

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
  });
});

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to GOAT Bot Backend API",
    version: "1.0.0",
    user: "sophoniagoat",
    endpoints: [
      "GET /health - Health check",
      "POST /webhook/manychat - ManyChat webhook",
      "GET /webhook/health - Webhook health check",
    ],
  });
});

// API routes - THIS IS CRITICAL
app.use("/webhook", webhookRoutes);

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
