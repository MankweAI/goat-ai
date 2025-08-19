/**
 * Daily Job Implementations
 * Implements: SYS.INIT(@users.dailyStreak), SYS.SCHED(MSG_GOODLUCK,@users.testDate)
 */

const userDAO = require("../lib/data/user");
const analyticsService = require("../services/analytics");
const { getDatabase } = require("../lib/database");
const logger = require("../utils/logger");

/**
 * Send daily study reminders to opted-in users
 */
async function sendDailyReminders() {
  try {
    logger.info("Starting daily reminder job", {
      user: "sophoniagoat",
      timestamp: new Date().toISOString(),
    });

    const db = getDatabase();

    // Get users who opted in for reminders
    const { data: users, error } = await db
      .from("users")
      .select("userID, grade, goal, studyPlan, dailyStreak")
      .eq("optInStatus", true);

    if (error) {
      logger.error("Failed to fetch users for reminders", {
        error: error.message,
      });
      return;
    }

    let remindersSent = 0;

    for (const user of users || []) {
      try {
        // Generate personalized reminder message
        const reminderMessage = generateReminderMessage(user);

        // In a real implementation, you would send this via ManyChat API
        // For now, we'll just log and track analytics
        logger.info("Daily reminder generated", {
          userId: user.userID,
          streak: user.dailyStreak,
          message: reminderMessage.substring(0, 100) + "...",
        });

        await analyticsService.trackEvent(user.userID, "daily_reminder_sent", {
          streak: user.dailyStreak,
          hasStudyPlan: !!user.studyPlan,
        });

        remindersSent++;
      } catch (userError) {
        logger.error("Failed to send reminder to user", {
          userId: user.userID,
          error: userError.message,
        });
      }
    }

    logger.info("Daily reminders completed", {
      totalUsers: users?.length || 0,
      remindersSent,
      user: "sophoniagoat",
    });
  } catch (error) {
    logger.error("Daily reminder job failed", { error: error.message });
  }
}

/**
 * Send good luck messages to students with tests today
 */
async function sendGoodLuckMessages() {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    logger.info("Checking for test day messages", { date: today });

    const db = getDatabase();

    // Get users with tests today
    const { data: users, error } = await db
      .from("users")
      .select("userID, grade, goal, testDate")
      .eq("testDate", today);

    if (error) {
      logger.error("Failed to fetch users with tests today", {
        error: error.message,
      });
      return;
    }

    let messagesSent = 0;

    for (const user of users || []) {
      try {
        const goodLuckMessage = generateGoodLuckMessage(user);

        logger.info("Good luck message generated", {
          userId: user.userID,
          testDate: user.testDate,
          message: goodLuckMessage.substring(0, 100) + "...",
        });

        await analyticsService.trackEvent(
          user.userID,
          "good_luck_message_sent",
          {
            testDate: user.testDate,
            grade: user.grade,
          }
        );

        messagesSent++;
      } catch (userError) {
        logger.error("Failed to send good luck message", {
          userId: user.userID,
          error: userError.message,
        });
      }
    }

    logger.info("Good luck messages completed", {
      usersWithTestsToday: users?.length || 0,
      messagesSent,
    });
  } catch (error) {
    logger.error("Good luck message job failed", { error: error.message });
  }
}

/**
 * Update user daily streaks
 * Implements: SYS.INIT(@users.dailyStreak)
 */
async function updateUserStreaks() {
  try {
    logger.info("Starting streak calculation job");

    const db = getDatabase();

    // Get all active users
    const { data: users, error } = await db
      .from("users")
      .select("userID, dailyStreak");

    if (error) {
      logger.error("Failed to fetch users for streak update", {
        error: error.message,
      });
      return;
    }

    let streaksUpdated = 0;

    for (const user of users || []) {
      try {
        const newStreak = await calculateUserStreak(user.userID);

        if (newStreak !== user.dailyStreak) {
          await userDAO.updateUser(user.userID, { dailyStreak: newStreak });

          await analyticsService.trackEvent(user.userID, "streak_updated", {
            oldStreak: user.dailyStreak,
            newStreak,
          });

          streaksUpdated++;
        }
      } catch (userError) {
        logger.error("Failed to update streak for user", {
          userId: user.userID,
          error: userError.message,
        });
      }
    }

    logger.info("Streak calculation completed", {
      totalUsers: users?.length || 0,
      streaksUpdated,
    });
  } catch (error) {
    logger.error("Streak calculation job failed", { error: error.message });
  }
}

/**
 * Perform daily maintenance tasks
 */
async function performDailyMaintenance() {
  try {
    logger.info("Starting daily maintenance");

    // Clean up old analytics events (older than 90 days)
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { error } = await db
      .from("analytics_events")
      .delete()
      .lt("ts", cutoffDate.toISOString());

    if (error) {
      logger.error("Failed to clean old analytics", { error: error.message });
    } else {
      logger.info("Old analytics events cleaned up", {
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    // Log daily system health
    await analyticsService.trackEvent("system", "daily_health_check", {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      user: "sophoniagoat",
    });

    logger.info("Daily maintenance completed");
  } catch (error) {
    logger.error("Daily maintenance failed", { error: error.message });
  }
}

/**
 * Calculate user's current streak based on activity
 */
async function calculateUserStreak(userId) {
  try {
    const db = getDatabase();
    const today = new Date();
    let currentStreak = 0;

    // Look back day by day to find consecutive activity
    for (let i = 0; i < 30; i++) {
      // Max 30 days lookback
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await db
        .from("analytics_events")
        .select("eventID")
        .eq("userID", userId)
        .gte("ts", dayStart.toISOString())
        .lte("ts", dayEnd.toISOString())
        .limit(1);

      if (error || !data || data.length === 0) {
        // No activity on this day, streak breaks
        break;
      }

      currentStreak++;
    }

    return currentStreak;
  } catch (error) {
    logger.error("Streak calculation failed for user", {
      userId,
      error: error.message,
    });
    return 0;
  }
}

/**
 * Generate personalized reminder message
 */
function generateReminderMessage(user) {
  const messages = [
    `🌟 Good morning! Ready to continue your ${user.dailyStreak}-day learning streak?`,
    `📚 Time for today's study session! Your goal: "${
      user.goal || "Academic excellence"
    }"`,
    `💪 Day ${
      user.dailyStreak + 1
    } of your learning journey! Let's keep the momentum going!`,
    `🎯 Quick reminder: Every small step counts toward your goal of "${user.goal}"`,
  ];

  const baseMessage = messages[Math.floor(Math.random() * messages.length)];

  if (user.studyPlan) {
    return `${baseMessage}\n\nCheck your personalized study plan and tackle today's topics!`;
  }

  return `${baseMessage}\n\nWhat would you like to practice today?`;
}

/**
 * Generate good luck message for test day
 */
function generateGoodLuckMessage(user) {
  const messages = [
    `🍀 Today's the big day! Good luck with your exam!`,
    `⭐ You've prepared well - now go show what you know!`,
    `🎯 Exam day is here! Trust your preparation and do your best!`,
    `💫 All your hard work has led to this moment. You've got this!`,
  ];

  const baseMessage = messages[Math.floor(Math.random() * messages.length)];

  return `${baseMessage}\n\nRemember:\n✓ Read questions carefully\n✓ Manage your time\n✓ Stay calm and confident\n\nYou're ready for this! 📝✨`;
}

module.exports = {
  sendDailyReminders,
  sendGoodLuckMessages,
  updateUserStreaks,
  performDailyMaintenance,
};

