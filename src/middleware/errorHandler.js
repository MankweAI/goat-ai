/**
 * Enhanced Error Handling and Monitoring
 */

const logger = require("../utils/logger");

/**
 * Enhanced error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error with context
  logger.error("Application error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.body?.userId || "unknown",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });

  // Determine response based on error type
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Invalid request data";
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized";
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      details: err.message,
      stack: err.stack,
    }),
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  logger.warn("404 - Route not found", {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(404).json({
    success: false,
    error: "Not Found",
    message: "The requested endpoint does not exist",
    requestedPath: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const requestId = generateRequestId();
  req.requestId = requestId;

  logger.info("Request received", {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  next();
}

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
};
