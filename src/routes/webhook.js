/**
 * ManyChat Webhook Routes
 */

const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

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

// Main ManyChat webhook endpoint (POST)
router.post("/manychat", (req, res) => {
  try {
    logger.info("ManyChat webhook POST request received", {
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

// GET route for easy browser testing
router.get("/manychat", (req, res) => {
  logger.info("ManyChat webhook GET request (test mode)");
  res.json({
    message: "ManyChat webhook endpoint is working",
    note: "This is a GET request for testing. Real webhooks should use POST.",
    testPOSTwith: {
      method: "POST",
      url: "https://goat-ai.vercel.app/webhook/manychat",
      headers: { "Content-Type": "application/json" },
      body: {
        userId: "test123",
        action: "test",
        data: {},
      },
    },
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

module.exports = router;
