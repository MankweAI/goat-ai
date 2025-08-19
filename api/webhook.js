/**
 * ManyChat Compatible Webhook Endpoint
 * User: sophoniagoat
 */

const express = require("express");
const app = express();

app.use(express.json());

// ManyChat webhook handler
app.all("*", async (req, res) => {
  try {
    console.log("ManyChat webhook received:", {
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });

    const { psid, message } = req.body;

    // Basic validation
    if (!psid) {
      return res.status(400).json({
        message: "User ID is required",
        status: "error",
        echo: "User ID is required",
        timestamp: new Date().toISOString(),
        error: "Missing psid parameter",
      });
    }

    // Process the message based on content
    let response;
    const userMessage = message?.toLowerCase() || "";

    if (
      userMessage.includes("hi") ||
      userMessage.includes("hello") ||
      userMessage.includes("start")
    ) {
      response = {
        message:
          "Welcome to GOAT Bot! 🎓 I'm here to help Grade 10-11 students excel in their studies. How can I help you today?",
        status: "success",
        echo: "Welcome to GOAT Bot! 🎓 I'm here to help Grade 10-11 students excel in their studies. How can I help you today?",
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
      };
    } else if (userMessage.includes("help")) {
      response = {
        message:
          "I can help you with:\n📚 Homework problems\n📝 Exam preparation\n🧮 Practice questions\n📖 Study planning\n\nWhat would you like to work on?",
        status: "success",
        echo: "I can help you with: Homework problems, Exam preparation, Practice questions, Study planning. What would you like to work on?",
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
      };
    } else if (
      userMessage.includes("math") ||
      userMessage.includes("algebra")
    ) {
      response = {
        message:
          "Great! I love helping with Math! 🧮 Send me your math problem and I'll walk you through the solution step by step.",
        status: "success",
        echo: "Great! I love helping with Math! Send me your math problem and I'll walk you through the solution step by step.",
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
      };
    } else {
      response = {
        message:
          "I understand you said: '" +
          message +
          "'. I'm here to help with your studies! Try asking about homework, math problems, or exam prep.",
        status: "success",
        echo:
          "I understand you said: '" +
          message +
          "'. I'm here to help with your studies! Try asking about homework, math problems, or exam prep.",
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
      };
    }

    // Log successful interaction
    console.log("Successful response sent:", response);

    res.json(response);
  } catch (error) {
    console.error("Webhook error:", error);

    res.status(500).json({
      message: "Sorry, I encountered an error. Please try again.",
      status: "error",
      echo: "Sorry, I encountered an error. Please try again.",
      timestamp: new Date().toISOString(),
      error: error.message,
      user: "sophoniagoat",
    });
  }
});

module.exports = app;


