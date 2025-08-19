/**
 * Analytics Service
 */

const { getDatabase } = require("../lib/database");
const logger = require("../utils/logger");

/**
 * Track user event
 */
async function trackEvent(userId, eventType, eventData = {}) {
  try {
    const db = getDatabase();

    const analyticsData = {
      userID: userId,
      ts: new Date().toISOString(),
      type: eventType,
      details: eventData,
    };

    const { data, error } = await db
      .from("analytics_events")
      .insert([analyticsData]);

    if (error) {
      // Log error but don't throw - analytics shouldn't break the main flow
      logger.warn("Failed to track analytics event", {
        userId,
        eventType,
        error: error.message,
      });
      return null;
    }

    logger.debug("Analytics event tracked", { userId, eventType });
    return data;
  } catch (error) {
    logger.warn("Analytics tracking error", {
      userId,
      eventType,
      error: error.message,
    });
    return null;
  }
}

/**
 * Track user session start
 */
async function trackSessionStart(userId, platform = "manychat") {
  return trackEvent(userId, "session_start", { platform });
}

/**
 * Track feature usage
 */
async function trackFeatureUsage(userId, feature, details = {}) {
  return trackEvent(userId, "feature_usage", { feature, ...details });
}

/**
 * Track user engagement
 */
async function trackEngagement(userId, action, details = {}) {
  return trackEvent(userId, "engagement", { action, ...details });
}

/**
 * Get user analytics summary
 */
async function getUserAnalyticsSummary(userId, days = 30) {
  try {
    const db = getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await db
      .from("analytics_events")
      .select("type, ts, details")
      .eq("userID", userId)
      .gte("ts", startDate.toISOString())
      .order("ts", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      totalEvents: data.length,
      events: data,
      period: `${days} days`,
    };
  } catch (error) {
    logger.error("Failed to get user analytics", {
      userId,
      error: error.message,
    });
    return null;
  }
}

module.exports = {
  trackEvent,
  trackSessionStart,
  trackFeatureUsage,
  trackEngagement,
  getUserAnalyticsSummary,
};

