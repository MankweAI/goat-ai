/**
 * GOAT Bot Backend - With User State Management
 * User: sophoniagoat
 */

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory user state storage (for production, use a database)
const userStates = new Map();

// Set user state
function setUserState(psid, state, context = {}) {
  userStates.set(psid, {
    mode: state,
    context: context,
    timestamp: Date.now(),
  });
  console.log(`User ${psid} state set to: ${state}`);
}

// Get user state
function getUserState(psid) {
  const state = userStates.get(psid);

  // Clean up old states (older than 1 hour)
  if (state && Date.now() - state.timestamp > 3600000) {
    userStates.delete(psid);
    return null;
  }

  return state;
}

// Clear user state
function clearUserState(psid) {
  userStates.delete(psid);
  console.log(`User ${psid} state cleared`);
}

// OpenAI integration function (keep existing)
async function getOpenAIResponse(prompt, context = "general") {
  if (!process.env.OPENAI_API_KEY) {
    console.log("OpenAI API key not configured");
    return null;
  }

  try {
    console.log("Making OpenAI request...", {
      prompt: prompt.substring(0, 50),
      context,
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are The GOAT, an AI tutor for Grade 10-11 students in South Africa. 
                     Be helpful, encouraging, and educational. Use step-by-step explanations.
                     Keep responses concise but thorough. Use emojis appropriately.
                     Context: ${context}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    console.log("OpenAI response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const data = await response.json();
    console.log("OpenAI response received:", {
      choices: data.choices?.length || 0,
      usage: data.usage,
    });

    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }

    console.error("OpenAI unexpected response structure:", data);
    return null;
  } catch (error) {
    console.error("OpenAI API error details:", {
      message: error.message,
      stack: error.stack?.substring(0, 200),
    });
    return null;
  }
}

// Basic routes
app.get("/", (req, res) => {
  res.json({
    message: "GOAT Bot Backend API - OpenAI Ready with State Management!",
    version: "2.1.0",
    user: "sophoniagoat",
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY,
    active_users: userStates.size,
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    openai_status: process.env.OPENAI_API_KEY ? "configured" : "not_configured",
    active_states: userStates.size,
  });
});

// OpenAI test endpoint (keep existing)
app.get("/api/test-openai", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        status: "error",
        message: "OpenAI API key not configured",
        timestamp: new Date().toISOString(),
      });
    }

    const testResponse = await getOpenAIResponse(
      'Say "Hello! OpenAI is working!" and explain what 2+2 equals in a fun way.',
      "test"
    );

    if (testResponse) {
      res.json({
        status: "success",
        message: "OpenAI API is working!",
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        test_response: testResponse,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        status: "error",
        message: "OpenAI API call failed - check server logs",
        api_key_configured: !!process.env.OPENAI_API_KEY,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.json({
      status: "error",
      message: "OpenAI test failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Main ManyChat webhook with state management
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
    const currentState = getUserState(psid);
    let botResponse;

    console.log(`User ${psid} current state:`, currentState?.mode || "none");

    // === STATE-BASED RESPONSES ===

    // If user is in a specific mode, handle with AI
    if (currentState) {
      let contextPrompt = "";

      switch (currentState.mode) {
        case "exam_prep":
          contextPrompt = `User is in exam preparation mode. They said: "${message}". 
                          Help them create a study plan, suggest topics, or answer exam-related questions.
                          Be encouraging and provide actionable advice.`;
          break;

        case "homework_help":
          contextPrompt = `User needs homework help. They said: "${message}". 
                          Provide step-by-step explanations, guide them through problems,
                          and help them understand concepts. Don't just give answers.`;
          break;

        case "practice_mode":
          contextPrompt = `User wants practice questions. They said: "${message}". 
                          Generate appropriate practice problems for their grade level,
                          or help them with practice they're working on.`;
          break;
      }

      if (contextPrompt) {
        const aiResponse = await getOpenAIResponse(
          contextPrompt,
          currentState.mode
        );

        if (aiResponse) {
          botResponse =
            aiResponse + '\n\n💡 Say "menu" anytime to return to main options!';
          res.json({ echo: botResponse });
          return;
        }
      }
    }

    // === MENU SYSTEM (Fast responses, no AI) ===

    // Initial greeting and menu
    if (
      userMessage.includes("hi") ||
      userMessage.includes("hello") ||
      userMessage.includes("start") ||
      userMessage === ""
    ) {
      clearUserState(psid);
      botResponse =
        `Welcome to The GOAT. I'm here help you study with calm and clarity.\n\n` +
        `What do you need right now?\n\n` +
        `1️⃣ 📅 Exam/Test coming 😰\n` +
        `2️⃣ 📚 I got Homework 🫶\n` +
        `3️⃣ 🧮 I need more practice\n\n` +
        `Just pick a number! ✨`;
    }

    // Menu option 1: Exam/Test preparation
    else if (userMessage === "1") {
      setUserState(psid, "exam_prep");
      botResponse =
        `📅 Exam prep mode activated! 💪\n\n` +
        `Let's get you ready:\n\n` +
        `📝 What subject is your exam on?\n` +
        `📅 When is your exam date?\n` +
        `🤔 What topics worry you most?\n\n` +
        `Just tell me about your exam and I'll create a study plan! 🎯`;
    }

    // Menu option 2: Homework help
    else if (userMessage === "2") {
      setUserState(psid, "homework_help");
      botResponse =
        `📚 Homework helper activated! 🫶\n\n` +
        `I'm here to guide you through it:\n\n` +
        `📸 Send me a photo of your homework\n` +
        `✏️ Or just type your question\n` +
        `📖 Tell me what subject it is\n\n` +
        `I'll walk you through the solution step-by-step! 🌟`;
    }

    // Menu option 3: Practice questions
    else if (userMessage === "3") {
      setUserState(psid, "practice_mode");
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
      clearUserState(psid);
      botResponse =
        `Welcome back to The GOAT! 🐐\n\n` +
        `What do you need right now?\n\n` +
        `1️⃣ 📅 Exam/Test coming 😰\n` +
        `2️⃣ 📚 I got Homework 🫶\n` +
        `3️⃣ 🧮 I need more practice\n\n` +
        `Just pick a number! ✨`;
    }

    // === AI-POWERED RESPONSES (for users not in menu mode) ===
    else {
      console.log("Using AI for general response:", userMessage);

      // Determine context based on keywords
      let context = "general";
      if (
        userMessage.includes("math") ||
        userMessage.includes("algebra") ||
        userMessage.includes("solve") ||
        userMessage.includes("equation")
      ) {
        context = "mathematics";
      } else if (
        userMessage.includes("science") ||
        userMessage.includes("physics") ||
        userMessage.includes("chemistry") ||
        userMessage.includes("photosynthesis")
      ) {
        context = "science";
      }

      // Try to get AI response
      const aiResponse = await getOpenAIResponse(message, context);

      if (aiResponse) {
        botResponse = aiResponse + '\n\n💡 Say "menu" for more options!';
        console.log("OpenAI response generated successfully");
      } else {
        // Fallback to menu system
        botResponse =
          `I see you said: "${message}" 🤔\n\n` +
          `I'm The GOAT, your study companion! Let me help you:\n\n` +
          `1️⃣ 📅 Exam/Test coming 😰\n` +
          `2️⃣ 📚 I got Homework 🫶\n` +
          `3️⃣ 🧮 I need more practice\n\n` +
          `Just pick a number or describe what you need! ✨`;
        console.log("Fallback to menu system used");
      }
    }

    // Return ManyChat-compatible response
    res.json({ echo: botResponse });

    console.log("GOAT Bot response sent:", {
      echo: botResponse.substring(0, 100) + "...",
    });
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
    service: "GOAT Bot with OpenAI & State Management",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    features: ["menu-driven", "openai-integrated", "stateful"],
    openai_configured: !!process.env.OPENAI_API_KEY,
    active_user_states: userStates.size,
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
