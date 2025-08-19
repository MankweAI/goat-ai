/**
 * Explanation Data Access Layer
 */

const { getDatabase } = require("../database");
const logger = require("../../utils/logger");

/**
 * Get explanation for a question
 */
async function getExplanationForQuestion(questionId, trigger = null) {
  try {
    const db = getDatabase();
    let query = db.from("explanations").select("*").eq("qID", questionId);

    if (trigger) {
      query = query.ilike("trigger", `%${trigger}%`);
    }

    const { data, error } = await query
      .order("verified", { ascending: false })
      .order("useCount", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    logger.error("Failed to get explanation", {
      questionId,
      trigger,
      error: error.message,
    });
    return null;
  }
}

/**
 * Create explanation
 */
async function createExplanation(explanationData) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("explanations")
      .insert([
        {
          ...explanationData,
          useCount: 0,
          verified: false,
          created: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info("Explanation created", { explanationId: data.explID });
    return data;
  } catch (error) {
    logger.error("Failed to create explanation", { error: error.message });
    return null;
  }
}

/**
 * Record explanation feedback
 */
async function recordFeedback(explanationId, userId, rating) {
  try {
    const db = getDatabase();
    const { data, error } = await db.from("explanation_feedback").insert([
      {
        explID: explanationId,
        userID: userId,
        rating,
        ts: new Date().toISOString(),
      },
    ]);

    if (error) {
      logger.warn("Failed to record feedback", {
        explanationId,
        userId,
        error: error.message,
      });
    }

    return data;
  } catch (error) {
    logger.warn("Feedback recording error", {
      explanationId,
      userId,
      error: error.message,
    });
    return null;
  }
}

module.exports = {
  getExplanationForQuestion,
  createExplanation,
  recordFeedback,
};

