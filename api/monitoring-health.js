/**
 * Direct monitoring health endpoint for Vercel
 */

const { getDatabase } = require("../src/lib/database");

module.exports = async (req, res) => {
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
      const db = getDatabase();
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
      const openaiKey = process.env.OPENAI_API_KEY;
      healthCheck.services.openai = {
        status: openaiKey ? "configured" : "missing_key",
        message: openaiKey
          ? "OpenAI API key configured"
          : "Add OPENAI_API_KEY to environment variables",
      };
    } catch (aiError) {
      healthCheck.services.openai = {
        status: "error",
        error: aiError.message,
        message: "OpenAI service check failed",
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
};

