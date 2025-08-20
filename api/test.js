// Simple Vercel test endpoint with monitoring capabilities
module.exports = (req, res) => {
  // Route based on query parameter
  const { type } = req.query;

  if (type === "health") {
    return handleHealthCheck(req, res);
  } else if (type === "database") {
    return handleDatabaseCheck(req, res);
  } else {
    // Default test response
    res.json({
      message: "Vercel Node.js is working!",
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      method: req.method,
      url: req.url,
      availableChecks: [
        "GET /api/test?type=health - System health check",
        "GET /api/test?type=database - Database status check",
      ],
    });
  }
};

async function handleHealthCheck(req, res) {
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

    // Check database
    try {
      const { getDatabase } = require("../src/lib/database");
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

    // Check OpenAI
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
}

async function handleDatabaseCheck(req, res) {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      project: "SA_Student_Companion",
      database: "testing...",
    };

    const { getDatabase } = require("../src/lib/database");
    const db = getDatabase();

    // Test basic connection
    const { data, error } = await db.from("users").select("count").limit(1);

    if (error) {
      status.database = {
        status: "error",
        error: error.message,
        message: "Please check Supabase credentials and run database schema",
        setupInstructions: {
          steps: [
            "1. Go to https://supabase.com and create/access your project",
            "2. Copy Project URL and anon key",
            "3. Add to Vercel environment variables: SUPABASE_URL and SUPABASE_ANON_KEY",
            "4. Run database schema in Supabase SQL editor",
          ],
        },
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
}
