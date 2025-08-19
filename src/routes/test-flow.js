/**
 * Test Flow Routes - For testing complete user journeys
 */

const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

// Complete onboarding flow test
router.post("/onboarding-flow", async (req, res) => {
  try {
    const testUserId = `test_user_${Date.now()}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    logger.info("Testing complete onboarding flow", { testUserId });

    const steps = [
      {
        name: "Welcome",
        request: {
          userId: testUserId,
          action: "onboarding",
          step: "welcome",
          data: {},
        },
      },
      {
        name: "Grade Selection",
        request: {
          userId: testUserId,
          action: "onboarding",
          step: "grade",
          data: { grade: 11 },
        },
      },
      {
        name: "Goal Setting",
        request: {
          userId: testUserId,
          action: "onboarding",
          step: "goal",
          data: { goal: "Improve mathematics and prepare for university" },
        },
      },
    ];

    const results = [];

    for (const step of steps) {
      results.push({
        step: step.name,
        request: step.request,
        status: "simulated_success",
        message: `${step.name} step would be processed successfully`,
      });
    }

    res.json({
      testUserId,
      flowType: "onboarding",
      results,
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      instructions: {
        message: "To test manually, use these requests in sequence:",
        baseUrl: `${baseUrl}/webhook/manychat`,
        steps: steps.map((s) => s.request),
      },
    });
  } catch (error) {
    logger.error("Onboarding flow test error", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test all features quick check
router.get("/feature-status", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    features: {
      onboarding: {
        status: "implemented",
        endpoints: ["welcome", "grade", "goal"],
        testUrl: "/webhook/manychat",
      },
      examPrep: {
        status: "implemented",
        endpoints: ["init", "subject", "date", "weaknesses", "generate"],
        testUrl: "/webhook/manychat",
      },
      homework: {
        status: "implemented",
        endpoints: ["init", "text", "image", "feedback"],
        testUrl: "/webhook/manychat",
      },
      practice: {
        status: "implemented",
        endpoints: ["init", "topic", "difficulty", "explanation", "continue"],
        testUrl: "/webhook/manychat",
      },
    },
    nextSteps: [
      "Test individual features using POST requests",
      "Set up real database (Supabase)",
      "Configure OpenAI API key",
      "Add scheduled jobs",
      "Deploy to production",
    ],
  });
});

module.exports = router;


