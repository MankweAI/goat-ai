/**
 * Job Scheduler - Daily reminders and maintenance tasks
 */

const cron = require("node-cron");
const logger = require("../utils/logger");

/**
 * Initialize all scheduled jobs
 */
function initializeJobs() {
  logger.info("Initializing scheduled jobs", {
    user: "sophoniagoat",
    timestamp: new Date().toISOString(),
  });

  // Daily reminder job - runs at 8 AM every day
  cron.schedule(
    "0 8 * * *",
    async () => {
      logger.info("Running daily reminder job");
      // Job implementation will be added when database is connected
    },
    {
      timezone: "Africa/Johannesburg",
    }
  );

  // Good luck messages - runs at 6 AM on test days
  cron.schedule(
    "0 6 * * *",
    async () => {
      logger.info("Checking for test day good luck messages");
      // Job implementation will be added when database is connected
    },
    {
      timezone: "Africa/Johannesburg",
    }
  );

  logger.info("All scheduled jobs initialized successfully");
}

/**
 * Stop all scheduled jobs
 */
function stopJobs() {
  cron.getTasks().forEach((task) => task.stop());
  logger.info("All scheduled jobs stopped");
}

module.exports = {
  initializeJobs,
  stopJobs,
};
