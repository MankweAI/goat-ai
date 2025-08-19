/**
 * GOAT Bot Backend - Vercel Compatible Entry Point
 */

const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get("/", (req, res) => {
  res.json({
    message: "GOAT Bot Backend API - Working on Vercel!",
    version: "1.0.0",
    user: "sophoniagoat",
    timestamp: new Date().toISOString(),
    environment: "production",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

// Webhook routes
app.post("/webhook/manychat", (req, res) => {
  console.log("Webhook received:", req.body);

  res.json({
    success: true,
    message: "Webhook received successfully",
    received: req.body,
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

app.get("/webhook/health", (req, res) => {
  res.json({
    status: "OK",
    service: "webhook",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
