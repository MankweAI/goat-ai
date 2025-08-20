/**
 * Database Initialization and Setup
 * Enhanced for SA Student Companion pivot
 */

const { getDatabase } = require("./database");
const logger = require("../utils/logger");

/**
 * Initialize database with enhanced schema for pivot
 */
async function initializeDatabase() {
  try {
    logger.info("Starting database initialization for SA Student Companion", {
      user: "sophoniagoat",
      timestamp: new Date().toISOString(),
    });

    const db = getDatabase();

    // Test basic connection first
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

    // Test enhanced tables
    try {
      await testContentStorage();
      logger.info("Enhanced database schema verified successfully");
    } catch (schemaError) {
      logger.warn("Enhanced schema incomplete", { error: schemaError.message });
      return false;
    }

    logger.info("Database connection successful with enhanced schema");
    return true;
  } catch (error) {
    logger.error("Database initialization failed", { error: error.message });
    return false;
  }
}

/**
 * Test content storage functionality
 */
async function testContentStorage() {
  try {
    const db = getDatabase();

    // Test if content_storage table exists
    const { data, error } = await db
      .from("content_storage")
      .select("count")
      .limit(1);

    if (error) {
      throw new Error(`Content storage table not found: ${error.message}`);
    }

    logger.info("Content storage functionality verified");
    return true;
  } catch (error) {
    logger.warn("Content storage test failed", { error: error.message });
    throw error;
  }
}

/**
 * Verify all required tables exist (updated for pivot)
 */
async function verifyDatabaseSchema() {
  try {
    const db = getDatabase();
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

    const results = {};

    for (const table of requiredTables) {
      try {
        const { data, error } = await db.from(table).select("count").limit(1);
        results[table] = error ? "missing" : "exists";
      } catch (error) {
        results[table] = "error";
      }
    }

    logger.info("Enhanced database schema verification", { results });
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
    message: "Enhanced database setup required for SA Student Companion",
    steps: [
      "1. Create Supabase project at https://supabase.com",
      "2. Copy your project URL and anon key",
      "3. Update .env file with SUPABASE_URL and SUPABASE_ANON_KEY",
      "4. Go to Supabase SQL Editor",
      "5. Run the enhanced schema.sql file (found in database/ directory)",
      "6. Restart the application",
    ],
    schemaFile: "database/schema.sql",
    user: "sophoniagoat",
    project: "SA Student Companion",
    enhancedFeatures: [
      "Content storage and reuse system",
      "User feedback collection",
      "Content quality metrics",
      "Real-time rating system",
    ],
  };
}

module.exports = {
  initializeDatabase,
  verifyDatabaseSchema,
  getDatabaseSetupInstructions,
  testContentStorage,
};
