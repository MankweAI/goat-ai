/**
 * Database Connection - Supabase Client
 */

const { createClient } = require("@supabase/supabase-js");
const logger = require("../utils/logger");

let supabase = null;

/**
 * Initialize Supabase connection
 */
function initializeDatabase() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    // Check if credentials are provided
    if (!supabaseUrl || !supabaseKey) {
      logger.warn("Supabase credentials not found. Running in mock mode.");
      return createMockClient();
    }

    // Validate URL format
    if (!supabaseUrl.includes("supabase.co")) {
      logger.warn("Invalid Supabase URL format. Running in mock mode.");
      return createMockClient();
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    logger.info("Supabase client initialized successfully");

    return supabase;
  } catch (error) {
    logger.error("Failed to initialize Supabase client", {
      error: error.message,
    });
    return createMockClient();
  }
}

/**
 * Create a mock client for development without Supabase
 */
function createMockClient() {
  logger.info("Using mock database client");

  return {
    from: (table) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: function () {
        return this;
      },
      single: function () {
        return this;
      },
      limit: function () {
        return this;
      },
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  };
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    if (!supabase) {
      throw new Error("Database not initialized");
    }

    // Try a simple query
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      logger.warn(
        "Database connection test failed (expected if tables don't exist yet)",
        {
          error: error.message,
        }
      );
      return false;
    }

    logger.info("Database connection test successful");
    return true;
  } catch (error) {
    logger.error("Database connection test failed", { error: error.message });
    return false;
  }
}

/**
 * Get the database client
 */
function getDatabase() {
  if (!supabase) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return supabase;
}

module.exports = {
  initializeDatabase,
  testConnection,
  getDatabase,
};

