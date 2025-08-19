/**
 * Streak Calculation Core Logic
 * Implements: SYS.INIT(@users.dailyStreak)
 */

const { getDatabase } = require("../database");
const logger = require("../../utils/logger");

/**
 * Calculate user engagement streak
 */
async function calculateEngagementStreak(userId, maxDays = 30) {
  try {
    const db = getDatabase();
    const today = new Date();
    let streak = 0;

    // Check each day going backwards from today
    for (let i = 0; i < maxDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const hasActivity = await hasUserActivity(userId, checkDate);

      if (hasActivity) {
        streak++;
      } else {
        // Streak is broken
        break;
      }
    }

    logger.debug("Streak calculated", { userId, streak });
    return streak;
  } catch (error) {
    logger.error("Streak calculation error", { userId, error: error.message });
    return 0;
  }
}

/**
 * Check if user had any meaningful activity on a specific date
 */
async function hasUserActivity(userId, date) {
  try {
    const db = getDatabase();

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Check for meaningful engagement events
    const { data, error } = await db
      .from("analytics_events")
      .select("type")
      .eq("userID", userId)
      .gte("ts", dayStart.toISOString())
      .lte("ts", dayEnd.toISOString())
      .in("type", [
        "feature_usage",
        "homework_explained",
        "question_difficulty",
        "explanation_delivered",
        "study_plan_generated",
      ])
      .limit(1);

    if (error) {
      logger.warn("Activity check failed", {
        userId,
        date,
        error: error.message,
      });
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    logger.error("Activity check error", {
      userId,
      date,
      error: error.message,
    });
    return false;
  }
}

/**
 * Get streak statistics for a user
 */
async function getStreakStats(userId) {
  try {
    const currentStreak = await calculateEngagementStreak(userId);
    const longestStreak = await calculateLongestStreak(userId);

    return {
      currentStreak,
      longestStreak,
      calculatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Streak stats error", { userId, error: error.message });
    return {
      currentStreak: 0,
      longestStreak: 0,
      calculatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Calculate user's longest ever streak
 */
async function calculateLongestStreak(userId, maxDays = 365) {
  try {
    const db = getDatabase();
    const today = new Date();
    let longestStreak = 0;
    let currentStreak = 0;

    // Check each day going backwards from today
    for (let i = 0; i < maxDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const hasActivity = await hasUserActivity(userId, checkDate);

      if (hasActivity) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return longestStreak;
  } catch (error) {
    logger.error("Longest streak calculation error", {
      userId,
      error: error.message,
    });
    return 0;
  }
}

module.exports = {
  calculateEngagementStreak,
  hasUserActivity,
  getStreakStats,
  calculateLongestStreak,
};
