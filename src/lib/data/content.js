/**
 * Content Storage Data Access Layer
 * For SA Student Companion pivot
 */

const { getDatabase } = require("../database");
const logger = require("../../utils/logger");

/**
 * Store generated content for reuse
 */
async function storeContent(contentData) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("content_storage")
      .insert([
        {
          type: contentData.type, // 'EXAM', 'HOMEWORK', 'HACK'
          grade: contentData.grade,
          subject: contentData.subject,
          topic: contentData.topic,
          question_text: contentData.question_text,
          solution_text: contentData.solution_text,
          metadata: contentData.metadata || {},
          quality_score: contentData.quality_score || 0.0,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info("Content stored successfully", { 
      contentId: data.contentID,
      type: contentData.type 
    });
    return data;
  } catch (error) {
    logger.error("Failed to store content", {
      type: contentData.type,
      error: error.message,
    });
    return null;
  }
}

/**
 * Get content for reuse
 */
async function getReusableContent(type, grade, subject, topic, limit = 5) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("content_storage")
      .select("*")
      .eq("type", type)
      .eq("grade", grade)
      .eq("subject", subject)
      .ilike("topic", `%${topic}%`)
      .gte("quality_score", 0.7)
      .order("quality_score", { ascending: false })
      .order("reuse_count", { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    logger.info("Retrieved reusable content", {
      type,
      grade,
      subject,
      topic,
      count: data?.length || 0,
    });
    return data || [];
  } catch (error) {
    logger.error("Failed to get reusable content", {
      type,
      grade,
      subject,
      topic,
      error: error.message,
    });
    return [];
  }
}

/**
 * Record content usage
 */
async function recordContentUsage(contentId) {
  try {
    const db = getDatabase();
    const { error } = await db
      .from("content_storage")
      .update({ 
        reuse_count: db.raw('reuse_count + 1')
      })
      .eq("contentID", contentId);

    if (error) {
      logger.warn("Failed to record content usage", {
        contentId,
        error: error.message,
      });
    }
  } catch (error) {
    logger.warn("Content usage recording error", {
      contentId,
      error: error.message,
    });
  }
}

/**
 * Store user feedback for content
 */
async function storeFeedback(contentId, userId, rating, feedbackText = null) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("user_feedback")
      .insert([
        {
          contentID: contentId,
          userID: userId,
          rating: rating,
          feedback_text: feedbackText,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update average rating
    await updateContentQualityScore(contentId);

    logger.info("Feedback stored successfully", { 
      contentId,
      userId,
      rating 
    });
    return data;
  } catch (error) {
    logger.error("Failed to store feedback", {
      contentId,
      userId,
      rating,
      error: error.message,
    });
    return null;
  }
}

/**
 * Update content quality score based on feedback
 */
async function updateContentQualityScore(contentId) {
  try {
    const db = getDatabase();
    
    // Calculate average rating
    const { data: ratingData, error: ratingError } = await db
      .from("user_feedback")
      .select("rating")
      .eq("contentID", contentId);

    if (ratingError || !ratingData || ratingData.length === 0) {
      return;
    }

    const avgRating = ratingData.reduce((sum, item) => sum + item.rating, 0) / ratingData.length;
    const normalizedScore = avgRating / 5.0; // Convert to 0-1 scale

    // Update quality metrics
    const { error: updateError } = await db
      .from("content_quality_metrics")
      .upsert([
        {
          contentID: contentId,
          user_rating_avg: avgRating,
          accuracy_score: normalizedScore,
        },
      ]);

    // Update main content table
    await db
      .from("content_storage")
      .update({ quality_score: normalizedScore })
      .eq("contentID", contentId);

    if (updateError) {
      logger.warn("Failed to update quality metrics", {
        contentId,
        error: updateError.message,
      });
    }
  } catch (error) {
    logger.warn("Quality score update error", {
      contentId,
      error: error.message,
    });
  }
}

module.exports = {
  storeContent,
  getReusableContent,
  recordContentUsage,
  storeFeedback,
  updateContentQualityScore,
};
