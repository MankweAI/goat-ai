/**
 * Enhanced System Monitoring with Database Schema Check
 * Updated for SA Student Companion pivot
 */

const express = require("express");
const router = express.Router();
const { getDatabase, testConnection } = require("../lib/database");
const {
  verifyDatabaseSchema,
  getDatabaseSetupInstructions,
} = require("../lib/database-init");
const { testConnection: testOpenAI } = require("../services/openai");
const logger = require("../utils/logger");

// Comprehensive health check with enhanced database schema
router.get("/health", async (req, res) => {
  try {
    const healthCheck = {
      status: "OK",
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      environment: process.env.NODE_ENV,
      project: "SA_Student_Companion",
      phase: "Infrastructure_Activation",
      services: {},
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };

    // Test database connection and enhanced schema
    try {
      const dbConnected = await testConnection();

      if (dbConnected) {
        const schemaStatus = await verifyDatabaseSchema();
        const requiredTables = [
          "users",
          "content_storage",
          "user_feedback",
          "content_quality_metrics",
          "questions",
          "explanations",
          "analytics_events",
          "user_question_views",
          "explanation_feedback",
        ];

        const allTablesExist =
          schemaStatus &&
          requiredTables.every((table) => schemaStatus[table] === "exists");

        healthCheck.services.database = {
          status: allTablesExist ? "connected" : "schema_incomplete",
          type: "supabase_enhanced",
          schema: schemaStatus,
          pivotReady: allTablesExist,
          ...(allTablesExist
            ? { message: "Enhanced schema ready for SA Student Companion" }
            : {
                setupInstructions: getDatabaseSetupInstructions(),
                missingTables: requiredTables.filter(
                  (table) => !schemaStatus || schemaStatus[table] !== "exists"
                ),
              }),
        };
      } else {
        healthCheck.services.database = {
          status: "disconnected",
          type: "supabase",
          setupInstructions: getDatabaseSetupInstructions(),
        };
      }
    } catch (error) {
      healthCheck.services.database = {
        status: "error",
        error: error.message,
        setupInstructions: getDatabaseSetupInstructions(),
      };
    }

    // Test OpenAI service with real connection
    try {
      const openaiConnected = await testOpenAI();
      healthCheck.services.openai = {
        status: openaiConnected ? "connected" : "mock_mode",
        type: "gpt-3.5-turbo",
        pivotReady: openaiConnected,
        message: openaiConnected
          ? "Real OpenAI API connected and tested"
          : "Using mock responses - add OPENAI_API_KEY to environment",
      };
    } catch (error) {
      healthCheck.services.openai = {
        status: process.env.OPENAI_API_KEY ? "error" : "mock_mode",
        error: error.message,
        message: "Add OPENAI_API_KEY to environment for real AI functionality",
      };
    }

    // Overall health status
    const hasErrors = Object.values(healthCheck.services).some(
      (service) => service.status === "error"
    );

    const hasIncompleteSetup = Object.values(healthCheck.services).some(
      (service) =>
        ["disconnected", "schema_incomplete", "mock_mode"].includes(
          service.status
        )
    );

    if (hasErrors) {
      healthCheck.status = "ERROR";
    } else if (hasIncompleteSetup) {
      healthCheck.status = "SETUP_REQUIRED";
    } else {
      healthCheck.status = "PIVOT_READY";
      healthCheck.message = "SA Student Companion infrastructure ready";
    }

    res.status(hasErrors ? 503 : 200).json(healthCheck);
  } catch (error) {
    logger.error("Health check failed", { error: error.message });
    res.status(500).json({
      status: "ERROR",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Rest of existing routes remain the same...
router.get("/database-status", async (req, res) => {
  try {
    const schemaStatus = await verifyDatabaseSchema();
    const setupInstructions = getDatabaseSetupInstructions();

    const requiredTables = [
      "users",
      "content_storage",
      "user_feedback",
      "content_quality_metrics",
      "questions",
      "explanations",
      "analytics_events",
      "user_question_views",
      "explanation_feedback",
    ];

    res.json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      project: "SA_Student_Companion",
      schema: schemaStatus,
      setupInstructions,
      isComplete:
        schemaStatus &&
        requiredTables.every((table) => schemaStatus[table] === "exists"),
      pivotEnhancements: {
        contentStorage: schemaStatus?.content_storage === "exists",
        userFeedback: schemaStatus?.user_feedback === "exists",
        qualityMetrics: schemaStatus?.content_quality_metrics === "exists",
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to check database status",
      setupInstructions: getDatabaseSetupInstructions(),
      timestamp: new Date().toISOString(),
    });
  }
});

router.get("/metrics", async (req, res) => {
  try {
    const db = getDatabase();

    const metrics = {
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      project: "SA_Student_Companion",
      period: "24h",
      users: { total: 0, optedIn: 0, grade10: 0, grade11: 0 },
      activity: { totalEvents: 0, uniqueEventTypes: 0 },
      content: {
        stored: 0,
        examQuestions: 0,
        homeworkSolutions: 0,
        memoryHacks: 0,
        avgQualityScore: 0,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV,
      },
      note: "Enhanced metrics for SA Student Companion - will populate when database is connected",
    };

    res.json(metrics);
  } catch (error) {
    logger.error("Metrics collection failed", { error: error.message });
    res.status(500).json({
      error: "Failed to collect metrics",
      timestamp: new Date().toISOString(),
    });
  }
});

router.get("/features", async (req, res) => {
  const featureStats = {
    mockExams: { usage: 0, avgRating: 0, contentStored: 0 },
    homeworkHelp: { usage: 0, avgRating: 0, contentStored: 0 },
    memoryHacks: { usage: 0, avgRating: 0, contentStored: 0 },
  };

  res.json({
    timestamp: new Date().toISOString(),
    period: "7 days",
    user: "sophoniagoat",
    project: "SA_Student_Companion",
    features: featureStats,
    totalUsage: 0,
    note: "Enhanced feature stats for SA Student Companion will be populated when database is connected",
  });
});

module.exports = router;
