/**
 * Onboarding Controller
 */

const userDAO = require("../lib/data/user");
const { validateRequest, schemas } = require("../middleware/validation");
const logger = require("../utils/logger");

/**
 * Handle onboarding flow
 */
async function handleOnboarding(req, res) {
  try {
    const { userId, step, data } = req.body;

    logger.info("Processing onboarding", {
      userId,
      step,
      data,
      timestamp: new Date().toISOString(),
    });

    switch (step) {
      case "welcome":
        return handleWelcome(userId, res);

      case "grade":
        return handleGradeSelection(userId, data, res);

      case "goal":
        return handleGoalSetting(userId, data, res);

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid onboarding step",
        });
    }
  } catch (error) {
    logger.error("Onboarding error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}

async function handleWelcome(userId, res) {
  try {
    const userExists = await userDAO.userExists(userId);

    if (userExists) {
      const user = await userDAO.getUserById(userId);
      return res.json({
        success: true,
        message: `Welcome back! You're currently set up as a Grade ${
          user.grade || "unspecified"
        } student.`,
        isReturningUser: true,
        user: {
          grade: user.grade,
          goal: user.goal,
        },
      });
    }

    return res.json({
      success: true,
      message:
        "Welcome to GOAT Bot! I'm here to help you achieve your academic goals. Let's get started!",
      isNewUser: true,
      nextStep: "grade",
    });
  } catch (error) {
    logger.error("Welcome handler error", { userId, error: error.message });
    throw error;
  }
}

async function handleGradeSelection(userId, data, res) {
  try {
    if (!data.grade) {
      return res.json({
        success: true,
        message: "Please select your grade (10 or 11):",
        requiresInput: true,
      });
    }

    const userExists = await userDAO.userExists(userId);

    if (userExists) {
      await userDAO.updateUser(userId, { grade: data.grade });
    } else {
      await userDAO.createUser({ userID: userId, grade: data.grade });
    }

    return res.json({
      success: true,
      message: `Great! You're set up for Grade ${data.grade}. Now, what's your academic goal for this term?`,
      nextStep: "goal",
    });
  } catch (error) {
    logger.error("Grade selection error", { userId, error: error.message });
    throw error;
  }
}

async function handleGoalSetting(userId, data, res) {
  try {
    if (!data.goal) {
      return res.json({
        success: true,
        message: "What's your academic goal for this term?",
        requiresInput: true,
      });
    }

    await userDAO.updateUser(userId, { goal: data.goal });

    return res.json({
      success: true,
      message: `Perfect! I'll help you achieve your goal: "${data.goal}". Here's what I can help you with:`,
      onboardingComplete: true,
      menu: [
        "1. Exam Preparation",
        "2. Homework Help",
        "3. Practice Questions",
      ],
    });
  } catch (error) {
    logger.error("Goal setting error", { userId, error: error.message });
    throw error;
  }
}

module.exports = {
  handleOnboarding,
  validateOnboarding: validateRequest(schemas.onboarding),
};

