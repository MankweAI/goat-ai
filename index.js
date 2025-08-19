/**
 * GOAT Bot Backend - Production Entry Point
 * Date: 2025-08-19 13:49:43 UTC
 * User: sophoniagoat
 */

require("dotenv").config();

const app = require("./src/app");
const { initializeDatabase, testConnection } = require("./src/lib/database");
const { initializeOpenAI } = require("./src/services/openai");
const logger = require("./src/utils/logger");

// Try to import optional modules
let initializeJobs, stopJobs;
try {
  const jobs = require("./src/jobs");
  initializeJobs = jobs.initializeJobs;
  stopJobs = jobs.stopJobs;
} catch (error) {
  logger.warn("Scheduled jobs not available");
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    logger.info("🚀 Starting GOAT Bot Backend", {
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      environment: process.env.NODE_ENV,
      port: PORT,
    });

    // Initialize core services
    logger.info("🔧 Initializing core services...");

    // Initialize database
    initializeDatabase();

    // Initialize OpenAI
    initializeOpenAI();

    // Initialize scheduled jobs if available
    if (
      initializeJobs &&
      (process.env.NODE_ENV === "production" ||
        process.env.ENABLE_JOBS === "true")
    ) {
      initializeJobs();
      logger.info("📅 Scheduled jobs enabled");
    } else {
      logger.info("📅 Scheduled jobs disabled (development mode)");
    }

    // Test database connection (non-blocking)
    testConnection().then((connected) => {
      if (connected) {
        logger.info("✅ Database connection verified");
      } else {
        logger.warn("⚠️ Database running in mock mode");
      }
    });

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info("🎉 GOAT Bot Backend started successfully", {
        port: PORT,
        environment: process.env.NODE_ENV,
        user: "sophoniagoat",
        timestamp: new Date().toISOString(),
        features: {
          onboarding: "✅ Ready",
          examPrep: "✅ Ready",
          homework: "✅ Ready",
          practice: "✅ Ready",
          scheduling: initializeJobs ? "✅ Available" : "⚠️ Disabled",
          monitoring: "✅ Active",
        },
        endpoints: [
          `🌐 Main: http://localhost:${PORT}/`,
          `💓 Health: http://localhost:${PORT}/health`,
          `🔗 Webhook: http://localhost:${PORT}/webhook/manychat`,
        ],
      });

      console.log(`\n🎯 GOAT Bot Backend is ready!`);
      console.log(`📍 Location: Pretoria, ZA-GP`);
      console.log(`👤 User: sophoniagoat`);
      console.log(`🌐 Access: http://localhost:${PORT}`);
      console.log(`📈 Monitor: http://localhost:${PORT}/health\n`);
    });

    // Handle server shutdown gracefully
    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Stop scheduled jobs if available
      if (stopJobs) {
        stopJobs();
      }

      // Close server
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("❌ Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection:", {
    reason: reason.toString(),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

startServer();
