/**
 * Enhanced System Monitoring with Database Schema Check
 * Updated for SA Student Companion pivot
 */

const express = require("express");
const router = express.Router();

// Simple health check first
router.get("/health", async (req, res) => {
  try {
    const healthCheck = {
      status: "OK",
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      environment: process.env.NODE_ENV,
      project: "SA_Student_Companion",
      phase: "Infrastructure_Activation",
      services: {
        app: "running",
        database: "checking...",
        openai: "checking...",
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };

    // Try to test database
    try {
      const { getDatabase } = require("../lib/database");
      const db = getDatabase();

      // Simple test
      const { data, error } = await db.from("users").select("count").limit(1);

      if (error) {
        healthCheck.services.database = {
          status: "error",
          error: error.message,
          message: "Database connection failed - check Supabase credentials",
        };
      } else {
        healthCheck.services.database = {
          status: "connected",
          message: "Database connection successful",
        };
      }
    } catch (dbError) {
      healthCheck.services.database = {
        status: "error",
        error: dbError.message,
        message: "Database initialization failed",
      };
    }

    // Try to test OpenAI
    try {
      const { testConnection } = require("../services/openai");
      const openaiWorking = await testConnection();

      healthCheck.services.openai = {
        status: openaiWorking ? "connected" : "mock_mode",
        message: openaiWorking
          ? "OpenAI API connected and working"
          : "Using mock responses - add OPENAI_API_KEY to environment",
      };
    } catch (aiError) {
      healthCheck.services.openai = {
        status: "error",
        error: aiError.message,
        message: "OpenAI service test failed",
      };
    }

    // Determine overall status
    const hasErrors = Object.values(healthCheck.services).some(
      (service) => typeof service === "object" && service.status === "error"
    );

    if (hasErrors) {
      healthCheck.status = "DEGRADED";
    } else {
      healthCheck.status = "OK";
    }

    res.json(healthCheck);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "ERROR",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Database status endpoint
router.get("/database-status", async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      project: "SA_Student_Companion",
      database: "testing...",
    };

    const { getDatabase } = require("../lib/database");
    const db = getDatabase();

    // Test basic connection
    const { data, error } = await db.from("users").select("count").limit(1);

    if (error) {
      status.database = {
        status: "error",
        error: error.message,
        message: "Please check Supabase credentials and run database schema",
      };
    } else {
      status.database = {
        status: "connected",
        message: "Database connection successful",
        tablesChecked: ["users"],
      };
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: "Database status check failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Simple test endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "Monitoring route is working!",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    project: "SA_Student_Companion",
  });
});

module.exports = router;
