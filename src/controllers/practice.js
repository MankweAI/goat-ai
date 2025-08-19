/**
 * Practice Questions Controller
 */

const questionDAO = require("../lib/data/question");
const explanationDAO = require("../lib/data/explanation");
const userDAO = require("../lib/data/user");
const openaiService = require("../services/openai");
const analyticsService = require("../services/analytics");
const logger = require("../utils/logger");

/**
 * Handle practice questions flow
 */
async function handlePractice(req, res) {
  try {
    const { userId, step, data } = req.body;

    await analyticsService.trackFeatureUsage(userId, "practice", { step });

    logger.info("Processing practice", { userId, step, data });

    switch (step) {
      case "init":
        return handlePracticeInit(userId, res);

      case "topic":
        return handleTopicSelection(userId, data, res);

      case "question":
        return handleQuestionDelivery(userId, data, res);

      case "difficulty":
        return handleDifficultyAssessment(userId, data, res);

      case "explanation":
        return handleExplanationRequest(userId, data, res);

      case "continue":
        return handleContinuePrompt(userId, data, res);

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid practice step",
        });
    }
  } catch (error) {
    logger.error("Practice error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}

async function handlePracticeInit(userId, res) {
  try {
    const user = await userDAO.getUserById(userId);

    // Suggest topics based on user's grade or previous activity
    const suggestedTopics = getSuggestedTopics(user?.grade || 10);

    return res.json({
      success: true,
      message:
        "Ready for some practice questions? What topic would you like to work on?",
      suggestedTopics,
      nextStep: "topic",
    });
  } catch (error) {
    logger.error("Practice init error", { userId, error: error.message });
    return res.json({
      success: true,
      message:
        "Ready for some practice questions? What topic would you like to work on?",
      nextStep: "topic",
    });
  }
}

async function handleTopicSelection(userId, data, res) {
  try {
    if (!data.topic) {
      return res.json({
        success: true,
        message: "Please tell me which topic you'd like to practice.",
        requiresInput: true,
      });
    }

    const user = await userDAO.getUserById(userId);
    const grade = user?.grade || 10;

    // Get questions for the topic
    const questions = await questionDAO.getQuestionsByTopic(
      data.topic,
      grade,
      1
    );

    if (!questions || questions.length === 0) {
      return res.json({
        success: false,
        message: `Sorry, I don't have practice questions for "${data.topic}" right now. Try another topic like Mathematics, Physics, or Chemistry.`,
      });
    }

    const question = questions[0];

    // Track question view
    await questionDAO.trackQuestionView(userId, question.qID);

    return res.json({
      success: true,
      message: "Here's a practice question for you:",
      question: {
        id: question.qID,
        text: question.qText,
        subject: question.subj,
        topic: question.topic,
        imageUrl: question.imgUrl,
      },
      nextStep: "difficulty",
      prompt:
        "Take your time to solve this. When you're ready, let me know how difficult you found it: Easy, Tricky, or Difficult.",
    });
  } catch (error) {
    logger.error("Topic selection error", { userId, error: error.message });
    return res.json({
      success: false,
      message:
        "Sorry, I had trouble finding questions for that topic. Please try another topic.",
    });
  }
}

async function handleQuestionDelivery(userId, data, res) {
  // This is handled in handleTopicSelection for simplicity
  return handleTopicSelection(userId, data, res);
}

async function handleDifficultyAssessment(userId, data, res) {
  try {
    const difficulty = data.difficulty; // 'easy', 'tricky', 'difficult'
    const questionId = data.questionId;

    if (!difficulty) {
      return res.json({
        success: true,
        message:
          "How did you find that question? Please select: Easy, Tricky, or Difficult.",
        options: ["Easy", "Tricky", "Difficult"],
      });
    }

    await analyticsService.trackEvent(userId, "question_difficulty", {
      questionId,
      difficulty,
    });

    if (difficulty.toLowerCase() === "easy") {
      return res.json({
        success: true,
        message:
          "Excellent! You're doing great. Would you like to try another question on this topic?",
        nextStep: "continue",
      });
    } else {
      // For tricky or difficult questions, offer explanation
      return res.json({
        success: true,
        message: `I understand this was ${difficulty.toLowerCase()}. What specific part are you struggling with? I can provide a detailed explanation.`,
        nextStep: "explanation",
        questionId,
      });
    }
  } catch (error) {
    logger.error("Difficulty assessment error", {
      userId,
      error: error.message,
    });
    return res.json({
      success: true,
      message: "Would you like to try another question?",
      nextStep: "continue",
    });
  }
}

async function handleExplanationRequest(userId, data, res) {
  try {
    const struggle = data.struggle;
    const questionId = data.questionId;

    if (!struggle && !questionId) {
      return res.json({
        success: true,
        message: "What part would you like me to explain?",
        requiresInput: true,
      });
    }

    // Get the question details
    const question = await questionDAO.getQuestionById(questionId);

    if (!question) {
      return res.json({
        success: false,
        message:
          "Sorry, I couldn't find the question details. Please try asking about the concept in general.",
      });
    }

    // Look for existing explanation or generate new one
    let explanation = await explanationDAO.getExplanationForQuestion(
      questionId,
      struggle
    );

    if (!explanation) {
      // Generate new explanation
      const explanationText = await openaiService.generateHomeworkExplanation(
        question.qText +
          (struggle ? `\n\nStudent is struggling with: ${struggle}` : ""),
        question.subj
      );

      // Store the explanation
      explanation = await explanationDAO.createExplanation({
        qID: questionId,
        trigger: struggle || "general",
        explText: explanationText,
        src: "AI",
      });
    }

    await analyticsService.trackEvent(userId, "explanation_delivered", {
      questionId,
      trigger: struggle,
    });

    return res.json({
      success: true,
      message: "Here's a detailed explanation:",
      explanation:
        explanation?.explText || "General explanation of the problem approach.",
      nextStep: "continue",
      prompt:
        "Was this explanation helpful? Would you like to try another question?",
    });
  } catch (error) {
    logger.error("Explanation request error", { userId, error: error.message });
    return res.json({
      success: false,
      message:
        "Sorry, I had trouble generating an explanation. Please try rephrasing your question.",
    });
  }
}

async function handleContinuePrompt(userId, data, res) {
  const wantsContinue = data.continue; // boolean

  if (wantsContinue) {
    return res.json({
      success: true,
      message: "Great! What topic would you like to practice next?",
      nextStep: "topic",
    });
  } else {
    await analyticsService.trackEvent(userId, "practice_session_end");

    return res.json({
      success: true,
      message:
        "Good work on practicing today! Remember, consistent practice is key to improvement. Come back anytime for more questions!",
    });
  }
}

/**
 * Get suggested topics based on grade
 */
function getSuggestedTopics(grade) {
  const topics = {
    10: [
      "Algebra",
      "Geometry",
      "Trigonometry",
      "Physics - Motion",
      "Chemistry - Atoms",
    ],
    11: [
      "Calculus",
      "Advanced Algebra",
      "Physics - Electricity",
      "Chemistry - Organic",
      "Statistics",
    ],
  };

  return topics[grade] || topics[10];
}

module.exports = {
  handlePractice,
};
