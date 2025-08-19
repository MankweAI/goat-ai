/**
 * Question Data Access Layer
 */

const { getDatabase } = require("../database");
const logger = require("../../utils/logger");

/**
 * Get questions by topic and grade
 */
async function getQuestionsByTopic(topic, grade, limit = 5) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("questions")
      .select("*")
      .eq("grade", grade)
      .ilike("topic", `%${topic}%`)
      .eq("verified", true)
      .limit(limit);

    if (error) {
      throw error;
    }

    logger.info("Questions retrieved", {
      topic,
      grade,
      count: data?.length || 0,
    });
    return data || [];
  } catch (error) {
    logger.error("Failed to get questions", {
      topic,
      grade,
      error: error.message,
    });

    // Return mock questions for development
    return createMockQuestions(topic, grade, limit);
  }
}

/**
 * Create mock questions for development
 */
function createMockQuestions(topic, grade, limit) {
  const mockQuestions = [];

  for (let i = 1; i <= limit; i++) {
    mockQuestions.push({
      qID: `mock_${topic}_${i}`,
      grade,
      subj: "Mathematics",
      topic,
      sub_topic: `${topic} Basics`,
      qText: `Mock question ${i} about ${topic} for Grade ${grade}`,
      imgUrl: null,
      src: "AI",
      useCount: Math.floor(Math.random() * 100),
      verified: true,
      created: new Date().toISOString(),
    });
  }

  logger.info("Created mock questions", {
    topic,
    grade,
    count: mockQuestions.length,
  });
  return mockQuestions;
}

/**
 * Get question by ID
 */
async function getQuestionById(questionId) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("questions")
      .select("*")
      .eq("qID", questionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Failed to get question by ID", {
      questionId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Track question view
 */
async function trackQuestionView(userId, questionId) {
  try {
    const db = getDatabase();
    const { data, error } = await db.from("user_question_views").insert([
      {
        userID: userId,
        qID: questionId,
        viewed: new Date().toISOString(),
      },
    ]);

    if (error) {
      logger.warn("Failed to track question view", {
        userId,
        questionId,
        error: error.message,
      });
    }

    return data;
  } catch (error) {
    logger.warn("Question view tracking error", {
      userId,
      questionId,
      error: error.message,
    });
    return null;
  }
}

module.exports = {
  getQuestionsByTopic,
  getQuestionById,
  trackQuestionView,
};

