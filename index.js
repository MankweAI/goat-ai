/**
 * GOAT Bot Backend - ManyChat Response Mapping Compatible
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
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
  });
});

// ManyChat Response Mapping Compatible Endpoint
app.post("/api/webhook", async (req, res) => {
  try {
    console.log("ManyChat webhook received:", {
      body: req.body,
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
    });

    const { psid, message } = req.body;

    // Validate required fields
    if (!psid) {
      return res.json({
        echo: "Sorry, I couldn't identify you. Please try again.",
      });
    }

    // Process message and generate response
    const userMessage = (message || "").toLowerCase().trim();
    let botResponse;

    // Smart response logic
    if (
      userMessage.includes("hi") ||
      userMessage.includes("hello") ||
      userMessage.includes("start")
    ) {
      botResponse =
        "Hi there! 👋 Welcome to GOAT Bot! 🎓\n\nI'm your AI study assistant for Grade 10-11 students in South Africa. I can help you with:\n\n📚 Homework problems\n📝 Exam preparation  \n🧮 Math & Science\n📖 Study planning\n\nWhat subject are you working on today?";
    } else if (userMessage.includes("help") || userMessage.includes("menu")) {
      botResponse =
        "Here's how I can help you excel! 🌟\n\n📚 HOMEWORK HELP\nSend me your questions and I'll solve them step-by-step\n\n📝 EXAM PREP\nGet study plans and practice questions\n\n🧮 MATH & SCIENCE\nAlgebra, Geometry, Physics, Chemistry\n\n📖 STUDY TIPS\nEffective study techniques\n\nJust describe what you need help with!";
    } else if (
      userMessage.includes("math") ||
      userMessage.includes("algebra") ||
      userMessage.includes("geometry")
    ) {
      botResponse =
        "Perfect! 🧮 I love helping with Math!\n\nSend me your math problem and I'll:\n✅ Solve it step-by-step\n✅ Explain the concepts\n✅ Give you similar practice problems\n\nWhat math topic are you working on? (Algebra, Geometry, Trigonometry, etc.)";
    } else if (
      userMessage.includes("science") ||
      userMessage.includes("physics") ||
      userMessage.includes("chemistry")
    ) {
      botResponse =
        "Awesome! 🔬 Science is fascinating!\n\nI can help you with:\n⚗️ Chemistry equations\n⚡ Physics problems\n🧬 Biology concepts\n\nWhat science topic do you need help with?";
    } else if (userMessage.includes("exam") || userMessage.includes("test")) {
      botResponse =
        "Let's ace that exam! 📝💪\n\nTell me:\n1️⃣ What subject?\n2️⃣ When is your exam?\n3️⃣ What topics are you struggling with?\n\nI'll create a personalized study plan for you!";
    } else if (userMessage.includes("homework")) {
      botResponse =
        "I'm here to help with your homework! 📚\n\nJust send me:\n📸 A photo of the problem\n✏️ Type out the question\n📝 Tell me the subject\n\nI'll walk you through the solution step-by-step!";
    } else {
      botResponse = `I see you said: "${message}" 🤔\n\nI'm GOAT Bot, your AI study assistant! I'm here to help Grade 10-11 students with:\n\n📚 Homework & assignments\n🧮 Math problems\n🔬 Science questions\n📝 Exam preparation\n\nTry saying "help" to see all my features, or just describe what you need help with!`;
    }

    // ManyChat expects ONLY the "echo" field for Response Mapping
    const response = {
      echo: botResponse,
    };

    console.log("Sending ManyChat response:", response);
    res.json(response);
  } catch (error) {
    console.error("ManyChat webhook error:", error);

    // Even errors must follow ManyChat's echo format
    res.json({
      echo: "Sorry, I encountered a technical issue. Please try again in a moment! 🔧",
    });
  }
});

// Original webhook (for testing)
app.post("/webhook/manychat", (req, res) => {
  res.json({
    success: true,
    message: "Original webhook working",
    received: req.body,
    timestamp: new Date().toISOString(),
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

module.exports = app;
