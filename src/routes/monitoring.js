/**
 * Enhanced System Monitoring with Database Schema Check
 */

const express = require("express");
const router = express.Router();
const { getDatabase, testConnection } = require("../lib/database");
const {
  verifyDatabaseSchema,
  getDatabaseSetupInstructions,
} = require("../lib/database-init");
const logger = require("../utils/logger");

// Comprehensive health check with database schema
router.get("/health", async (req, res) => {
  try {
    const healthCheck = {
      status: "OK",
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      environment: process.env.NODE_ENV,
      services: {},
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };

    // Test database connection and schema
    try {
      const dbConnected = await testConnection();

      if (dbConnected) {
        const schemaStatus = await verifyDatabaseSchema();
        const allTablesExist =
          schemaStatus &&
          Object.values(schemaStatus).every((status) => status === "exists");

        healthCheck.services.database = {
          status: allTablesExist ? "connected" : "schema_incomplete",
          type: "supabase",
          schema: schemaStatus,
          ...(allTablesExist
            ? {}
            : {
                setupInstructions: getDatabaseSetupInstructions(),
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

    // Test OpenAI service
    try {
      const openaiService = require("../services/openai");
      await openaiService.generateText("Health check test", { maxTokens: 10 });
      healthCheck.services.openai = {
        status: "connected",
      };
    } catch (error) {
      healthCheck.services.openai = {
        status: process.env.OPENAI_API_KEY ? "error" : "mock_mode",
        error: error.message,
      };
    }

    // Overall health status
    const hasErrors = Object.values(healthCheck.services).some(
      (service) => service.status === "error"
    );

    const hasIncompleteSetup = Object.values(healthCheck.services).some(
      (service) =>
        ["disconnected", "schema_incomplete"].includes(service.status)
    );

    if (hasErrors) {
      healthCheck.status = "ERROR";
    } else if (hasIncompleteSetup) {
      healthCheck.status = "SETUP_REQUIRED";
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

// Database setup status endpoint
router.get("/database-status", async (req, res) => {
  try {
    const schemaStatus = await verifyDatabaseSchema();
    const setupInstructions = getDatabaseSetupInstructions();

    res.json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      schema: schemaStatus,
      setupInstructions,
      isComplete:
        schemaStatus &&
        Object.values(schemaStatus).every((status) => status === "exists"),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to check database status",
      setupInstructions: getDatabaseSetupInstructions(),
      timestamp: new Date().toISOString(),
    });
  }
});

// Rest of the monitoring routes remain the same...
router.get("/metrics", async (req, res) => {
  try {
    const db = getDatabase();

    const metrics = {
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      period: "24h",
      users: { total: 0, optedIn: 0, grade10: 0, grade11: 0 },
      activity: { totalEvents: 0, uniqueEventTypes: 0 },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV,
      },
      note: "Metrics will be populated when database is connected",
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
    onboarding: 0,
    examPrep: 0,
    homework: 0,
    practice: 0,
  };

  res.json({
    timestamp: new Date().toISOString(),
    period: "7 days",
    user: "sophoniagoat",
    features: featureStats,
    totalUsage: 0,
    note: "Feature stats will be populated when database is connected",
  });
});

module.exports = router;
