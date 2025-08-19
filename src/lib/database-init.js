/**
 * Database Initialization and Setup
 * User: sophoniagoat
 */

const { getDatabase } = require("./database");
const logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");

/**
 * Initialize database with schema and sample data
 */
async function initializeDatabase() {
  try {
    logger.info("Starting database initialization", {
      user: "sophoniagoat",
      timestamp: new Date().toISOString(),
    });

    const db = getDatabase();

    // Test basic connection
    const { data, error } = await db.from("users").select("count").limit(1);

    if (error && error.code === "42P01") {
      logger.warn(
        "Database tables do not exist. Please run the schema.sql file in your Supabase dashboard."
      );
      return false;
    }

    if (error) {
      logger.error("Database connection failed", { error: error.message });
      return false;
    }

    logger.info("Database connection successful");
    return true;
  } catch (error) {
    logger.error("Database initialization failed", { error: error.message });
    return false;
  }
}

/**
 * Verify all required tables exist
 */
async function verifyDatabaseSchema() {
  try {
    const db = getDatabase();
    const requiredTables = [
      "users",
      "questions",
      "explanations",
      "analytics_events",
      "user_question_views",
      "explanation_feedback",
    ];

    const results = {};

    for (const table of requiredTables) {
      try {
        const { data, error } = await db.from(table).select("count").limit(1);

        results[table] = error ? "missing" : "exists";
      } catch (error) {
        results[table] = "error";
      }
    }

    logger.info("Database schema verification", { results });
    return results;
  } catch (error) {
    logger.error("Schema verification failed", { error: error.message });
    return null;
  }
}

/**
 * Get database setup instructions
 */
function getDatabaseSetupInstructions() {
  return {
    message: "Database setup required",
    steps: [
      "1. Create Supabase project at https://supabase.com",
      "2. Copy your project URL and anon key",
      "3. Update .env file with SUPABASE_URL and SUPABASE_ANON_KEY",
      "4. Go to Supabase SQL Editor",
      "5. Run the schema.sql file (found in database/ directory)",
      "6. Restart the application",
    ],
    schemaFile: "database/schema.sql",
    user: "sophoniagoat",
  };
}

module.exports = {
  initializeDatabase,
  verifyDatabaseSchema,
  getDatabaseSetupInstructions,
};
