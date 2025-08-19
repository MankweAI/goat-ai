/**
 * Production-Ready Express Application
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./utils/logger");

// Import routes
const webhookRoutes = require("./routes/webhook");

// Try to import optional routes
let testFlowRoutes,
  monitoringRoutes,
  errorHandler,
  notFoundHandler,
  requestLogger;

try {
  testFlowRoutes = require("./routes/test-flow");
} catch (error) {
  logger.warn("Test flow routes not available");
}

try {
  monitoringRoutes = require("./routes/monitoring");
} catch (error) {
  logger.warn("Monitoring routes not available");
}

try {
  const errorHandlers = require("./middleware/errorHandler");
  errorHandler = errorHandlers.errorHandler;
  notFoundHandler = errorHandlers.notFoundHandler;
  requestLogger = errorHandlers.requestLogger;
} catch (error) {
  logger.warn("Error handlers not available, using basic handlers");
}

// Create Express app
const app = express();

// Trust proxy for production deployment
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
if (requestLogger) {
  app.use(requestLogger);
}

// HTTP request logging (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// API routes
app.use("/webhook", webhookRoutes);

if (testFlowRoutes) {
  app.use("/test-flow", testFlowRoutes);
}

if (monitoringRoutes) {
  app.use("/monitoring", monitoringRoutes);
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "GOAT Bot Backend API",
    version: "1.0.0",
    user: "sophoniagoat",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    endpoints: {
      main: "GET /",
      health: "GET /monitoring/health",
      webhook: "POST /webhook/manychat",
      metrics: "GET /monitoring/metrics",
      features: "GET /monitoring/features",
    },
    status: "Production Ready",
  });
});

// Basic health check (legacy)
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "GOAT Bot Backend is running",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    environment: process.env.NODE_ENV,
  });
});

// 404 handler
app.use(
  notFoundHandler ||
    ((req, res) => {
      res.status(404).json({
        error: "Not Found",
        message: "The requested endpoint does not exist",
        requestedPath: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    })
);

// Error handler (must be last)
app.use(
  errorHandler ||
    ((err, req, res, next) => {
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
    })
);

module.exports = app;
