/**
 * Exam Preparation Controller
 */

const userDAO = require("../lib/data/user");
const openaiService = require("../services/openai");
const analyticsService = require("../services/analytics");
const logger = require("../utils/logger");

/**
 * Handle exam preparation flow
 */
async function handleExamPrep(req, res) {
  try {
    const { userId, step, data } = req.body;

    await analyticsService.trackFeatureUsage(userId, "exam_prep", { step });

    logger.info("Processing exam prep", { userId, step, data });

    switch (step) {
      case "init":
        return handleExamPrepInit(userId, res);

      case "subject":
        return handleSubjectSelection(userId, data, res);

      case "date":
        return handleDateSelection(userId, data, res);

      case "weaknesses":
        return handleWeaknessIdentification(userId, data, res);

      case "generate":
        return handleStudyPlanGeneration(userId, data, res);

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid exam prep step",
        });
    }
  } catch (error) {
    logger.error("Exam prep error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}

async function handleExamPrepInit(userId, res) {
  return res.json({
    success: true,
    message:
      "Let's prepare for your upcoming exam! What subject are you studying for?",
    nextStep: "subject",
    suggestions: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "English",
      "History",
    ],
  });
}

async function handleSubjectSelection(userId, data, res) {
  if (!data.subject) {
    return res.json({
      success: true,
      message: "Please tell me which subject you're preparing for.",
      requiresInput: true,
    });
  }

  // Store subject in user session (in a real app, you'd use session storage)
  await userDAO.updateUser(userId, {
    examSubject: data.subject,
  });

  return res.json({
    success: true,
    message: `Great! You're preparing for ${data.subject}. When is your exam? Please enter the date in YYYY-MM-DD format.`,
    nextStep: "date",
  });
}

async function handleDateSelection(userId, data, res) {
  if (!data.testDate) {
    return res.json({
      success: true,
      message:
        "Please enter your exam date in YYYY-MM-DD format (e.g., 2025-09-15).",
      requiresInput: true,
    });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.testDate)) {
    return res.json({
      success: false,
      message:
        "Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-09-15).",
    });
  }

  const examDate = new Date(data.testDate);
  const today = new Date();

  if (examDate <= today) {
    return res.json({
      success: false,
      message:
        "Exam date must be in the future. Please enter a valid future date.",
    });
  }

  await userDAO.updateUser(userId, { testDate: data.testDate });

  const daysUntil = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

  return res.json({
    success: true,
    message: `Perfect! Your exam is in ${daysUntil} days. Which topics do you find most challenging? Please list the areas you'd like to focus on.`,
    nextStep: "weaknesses",
    examInfo: {
      date: data.testDate,
      daysUntil,
    },
  });
}

async function handleWeaknessIdentification(userId, data, res) {
  if (!data.weaknesses) {
    return res.json({
      success: true,
      message: "Please tell me which topics or areas you find challenging.",
      requiresInput: true,
    });
  }

  // Parse weaknesses (could be comma-separated string or array)
  let weaknesses = data.weaknesses;
  if (typeof weaknesses === "string") {
    weaknesses = weaknesses.split(",").map((w) => w.trim());
  }

  return res.json({
    success: true,
    message: `I understand you want to focus on: ${weaknesses.join(
      ", "
    )}. Let me generate a personalized study plan for you.`,
    nextStep: "generate",
    weaknesses,
  });
}

async function handleStudyPlanGeneration(userId, data, res) {
  try {
    const user = await userDAO.getUserById(userId);

    if (!user || !user.testDate) {
      return res.json({
        success: false,
        message:
          "Missing exam information. Please start the exam prep process again.",
      });
    }

    const weaknesses = data.weaknesses || ["General review"];
    const studyPlan = await openaiService.generateStudyPlan(
      weaknesses,
      user.testDate,
      user.grade || 10
    );

    // Store the study plan
    await userDAO.updateUser(userId, {
      studyPlan: JSON.stringify(studyPlan),
      optInStatus: true,
    });

    await analyticsService.trackEvent(userId, "study_plan_generated", {
      topics: weaknesses,
      testDate: user.testDate,
    });

    return res.json({
      success: true,
      message: "Your personalized study plan is ready!",
      studyPlan,
      optInPrompt:
        "Would you like me to send you daily reminders and study tips?",
    });
  } catch (error) {
    logger.error("Study plan generation error", {
      userId,
      error: error.message,
    });
    return res.json({
      success: false,
      message:
        "Sorry, I had trouble generating your study plan. Please try again.",
    });
  }
}

module.exports = {
  handleExamPrep,
};

