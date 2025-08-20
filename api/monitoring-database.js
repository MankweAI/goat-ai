/**
 * Direct database status endpoint for Vercel
 */

const { getDatabase } = require("../src/lib/database");

module.exports = async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      project: "SA_Student_Companion",
      database: "testing...",
    };

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
            "3. Add to Vercel environment variables",
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
};

