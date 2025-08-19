/**
 * GOAT Bot Backend - Menu-Driven System
 * User: sophoniagoat
 */

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Basic routes
app.get("/", (req, res) => {
  res.json({
    message: "GOAT Bot Backend API - Menu-Driven System Ready!",
    version: "2.0.0",
    user: "sophoniagoat",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

// Helper function for OpenAI (when API key is available)
async function getAIResponse(prompt, context = "") {
  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY) {
    return null; // Fall back to predefined responses
  }

  try {
    // This would integrate with OpenAI API
    // For now, return null to use menu system
    return null;
  } catch (error) {
    console.error("OpenAI error:", error);
    return null;
  }
}

// Main ManyChat webhook with menu system
app.post("/api/webhook", async (req, res) => {
  try {
    console.log("GOAT Bot webhook received:", {
      body: req.body,
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
    });

    const { psid, message } = req.body;

    if (!psid) {
      return res.json({
        echo: "Sorry, I couldn't identify you. Please try again.",
      });
    }

    const userMessage = (message || "").toLowerCase().trim();
    let botResponse;

    // === MAIN MENU SYSTEM ===

    // Initial greeting and menu
    if (
      userMessage.includes("hi") ||
      userMessage.includes("hello") ||
      userMessage.includes("start") ||
      userMessage === ""
    ) {
      botResponse =
        `Welcome to The GOAT. I'm here help you study with calm and clarity.\n\n` +
        `What do you need right now?\n\n` +
        `1️⃣ 📅 Exam/Test coming 😰\n` +
        `2️⃣ 📚 I got Homework 🫶\n` +
        `3️⃣ 🧮 I need more practice\n\n` +
        `Just pick a number! ✨`;
    }

    // Menu option 1: Exam/Test preparation
    else if (
      userMessage.includes("1") ||
      userMessage.includes("exam") ||
      userMessage.includes("test")
    ) {
      botResponse =
        `📅 Exam prep mode activated! 💪\n\n` +
        `Let's get you ready:\n\n` +
        `📝 What subject is your exam on?\n` +
        `📅 When is your exam date?\n` +
        `🤔 What topics worry you most?\n\n` +
        `Just tell me about your exam and I'll create a study plan! 🎯`;
    }

    // Menu option 2: Homework help
    else if (userMessage.includes("2") || userMessage.includes("homework")) {
      botResponse =
        `📚 Homework helper activated! 🫶\n\n` +
        `I'm here to guide you through it:\n\n` +
        `📸 Send me a photo of your homework\n` +
        `✏️ Or just type your question\n` +
        `📖 Tell me what subject it is\n\n` +
        `I'll walk you through the solution step-by-step! 🌟`;
    }

    // Menu option 3: Practice questions
    else if (userMessage.includes("3") || userMessage.includes("practice")) {
      botResponse =
        `🧮 Practice mode activated! 💫\n\n` +
        `Let's sharpen those skills:\n\n` +
        `🎯 What subject do you want to practice?\n` +
        `📊 What's your current grade level?\n` +
        `💡 Any specific topics you want to focus on?\n\n` +
        `I'll generate practice questions just for you! 🚀`;
    }

    // Menu navigation
    else if (
      userMessage.includes("menu") ||
      userMessage.includes("back") ||
      userMessage.includes("main")
    ) {
      botResponse =
        `Welcome back to The GOAT! 🐐\n\n` +
        `What do you need right now?\n\n` +
        `1️⃣ 📅 Exam/Test coming 😰\n` +
        `2️⃣ 📚 I got Homework 🫶\n` +
        `3️⃣ 🧮 I need more practice\n\n` +
        `Just pick a number! ✨`;
    }

    // Subject-specific responses
    else if (
      userMessage.includes("math") ||
      userMessage.includes("algebra") ||
      userMessage.includes("geometry")
    ) {
      botResponse =
        `🧮 Math mastery mode! Let's solve this together:\n\n` +
        `📝 Send me your math problem\n` +
        `🔍 I'll break it down step-by-step\n` +
        `💡 Then give you similar practice problems\n\n` +
        `What specific math topic? (Algebra, Geometry, Trigonometry, etc.) 📐`;
    } else if (
      userMessage.includes("science") ||
      userMessage.includes("physics") ||
      userMessage.includes("chemistry")
    ) {
      botResponse =
        `🔬 Science exploration time!\n\n` +
        `⚗️ Chemistry reactions\n` +
        `⚡ Physics problems\n` +
        `🧬 Biology concepts\n\n` +
        `What science topic can I help you master? 🌟`;
    }

    // Help and guidance
    else if (userMessage.includes("help")) {
      botResponse =
        `🤝 I'm here to help you succeed!\n\n` +
        `🎯 Choose from the main menu:\n\n` +
        `1️⃣ 📅 Exam/Test prep\n` +
        `2️⃣ 📚 Homework help\n` +
        `3️⃣ 🧮 Practice questions\n\n` +
        `Or just describe what you're working on! I'll guide you. ✨`;
    }

    // Default response - redirect to menu
    else {
      // Try to get AI response first (if OpenAI is configured)
      const aiResponse = await getAIResponse(
        `Student said: "${message}". Respond as a helpful tutor for Grade 10-11 students in South Africa.`,
        "educational_assistant"
      );

      if (aiResponse) {
        botResponse = aiResponse;
      } else {
        botResponse =
          `I see you said: "${message}" 🤔\n\n` +
          `I'm The GOAT, your study companion! Let me help you:\n\n` +
          `1️⃣ 📅 Exam/Test coming 😰\n` +
          `2️⃣ 📚 I got Homework 🫶\n` +
          `3️⃣ 🧮 I need more practice\n\n` +
          `Just pick a number or describe what you need! ✨`;
      }
    }

    // Return ManyChat-compatible response
    res.json({ echo: botResponse });

    console.log("GOAT Bot response sent:", { echo: botResponse });
  } catch (error) {
    console.error("GOAT Bot error:", error);
    res.json({
      echo: "Sorry, I encountered a technical issue. Please try saying 'menu' to restart! 🔧",
    });
  }
});

// Health check for webhooks
app.get("/webhook/health", (req, res) => {
  res.json({
    status: "OK",
    service: "GOAT Bot Menu System",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    features: ["menu-driven", "openai-ready"],
  });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`GOAT Bot server running on port ${PORT}`);
  });
}

module.exports = app;
