/**
 * Simplified Webhook Routes for Debugging
 */

const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

// Simple test route to verify router works
router.get("/test", (req, res) => {
  logger.info("Webhook test route accessed");
  res.json({
    message: "Webhook router is working",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

// Health check for webhooks
router.get("/health", (req, res) => {
  logger.info("Webhook health check accessed");
  res.json({
    status: "OK",
    service: "webhook",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    features: ["onboarding", "examPrep", "homework", "practice"],
    environment: process.env.NODE_ENV,
  });
});

// Simplified ManyChat webhook endpoint
router.post("/manychat", (req, res) => {
  try {
    logger.info("ManyChat webhook accessed", {
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
    });

    const { userId, action, data } = req.body;

    // Basic validation
    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["userId", "action"],
        received: { userId, action },
      });
    }

    // Simple response for now
    res.json({
      success: true,
      message: "Webhook received successfully",
      received: {
        userId,
        action,
        data: data || {},
      },
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
    });
  } catch (error) {
    logger.error("Webhook processing error", {
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// Debug: Log all requests to this router
router.use((req, res, next) => {
  logger.info("Webhook router request", {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
  next();
});

module.exports = router;
