/**
 * GOAT Bot Backend - ManyChat Compatible
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
    message: "GOAT Bot Backend API - Ready for ManyChat!",
    version: "1.0.0",
    user: "sophoniagoat",
    timestamp: new Date().toISOString(),
    environment: "production",
    endpoints: {
      webhook: "/webhook/manychat",
      manychat_api: "/api/webhook",
      health: "/health",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    services: {
      webhook: "active",
      manychat: "integrated",
    },
  });
});

// Original webhook endpoint
app.post("/webhook/manychat", (req, res) => {
  console.log("Original webhook received:", req.body);

  res.json({
    success: true,
    message: "Webhook received successfully",
    received: req.body,
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

// ManyChat compatible endpoint
app.post("/api/webhook", async (req, res) => {
  try {
    console.log("ManyChat API webhook received:", {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });

    const { psid, message } = req.body;

    // Validate required fields
    if (!psid) {
      return res.status(400).json({
        message: "User ID is required",
        status: "error",
        echo: "User ID is required",
        timestamp: new Date().toISOString(),
      });
    }

    // Process message and generate response
    const userMessage = message?.toLowerCase() || "";
    let botResponse;

    if (userMessage.includes("hi") || userMessage.includes("hello")) {
      botResponse =
        "Hi! 👋 Welcome to GOAT Bot! I'm your AI study assistant for Grade 10-11. How can I help you excel today?";
    } else if (userMessage.includes("help")) {
      botResponse =
        "I can help you with:\n📚 Homework solutions\n📝 Exam preparation\n🧮 Math problems\n📖 Study planning\n\nWhat subject are you working on?";
    } else if (userMessage.includes("math")) {
      botResponse =
        "Perfect! 🧮 I love math! Send me your problem and I'll solve it step-by-step. Whether it's algebra, geometry, or calculus - I'm here to help!";
    } else {
      botResponse = `I see you said "${message}". I'm here to help with your studies! Try asking about homework, math problems, or exam preparation. 📚`;
    }

    const response = {
      message: botResponse,
      status: "success",
      echo: botResponse,
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      psid: psid,
    };

    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("ManyChat webhook error:", error);

    res.status(500).json({
      message: "Sorry, I encountered an error. Please try again.",
      status: "error",
      echo: "Sorry, I encountered an error. Please try again.",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.get("/webhook/health", (req, res) => {
  res.json({
    status: "OK",
    service: "webhook",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    endpoints: {
      manychat_original: "/webhook/manychat",
      manychat_api: "/api/webhook",
    },
  });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
