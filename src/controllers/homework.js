/**
 * Homework Help Controller
 */

const openaiService = require("../services/openai");
const analyticsService = require("../services/analytics");
const logger = require("../utils/logger");

/**
 * Handle homework help flow
 */
async function handleHomework(req, res) {
  try {
    const { userId, step, data } = req.body;

    await analyticsService.trackFeatureUsage(userId, "homework_help", { step });

    logger.info("Processing homework help", { userId, step, data });

    switch (step) {
      case "init":
        return handleHomeworkInit(userId, res);

      case "text":
        return handleTextProblem(userId, data, res);

      case "image":
        return handleImageProblem(userId, data, res);

      case "feedback":
        return handleFeedback(userId, data, res);

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid homework help step",
        });
    }
  } catch (error) {
    logger.error("Homework help error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}

async function handleHomeworkInit(userId, res) {
  return res.json({
    success: true,
    message:
      "I'll help you with your homework! You can either:\n\n1. Type your question directly\n2. Upload an image of the problem\n\nHow would you like to share your homework question?",
    options: ["Type question", "Upload image"],
  });
}

async function handleTextProblem(userId, data, res) {
  try {
    if (!data.problemText) {
      return res.json({
        success: true,
        message: "Please type your homework question or problem.",
        requiresInput: true,
      });
    }

    logger.info("Processing text homework problem", {
      userId,
      problemLength: data.problemText.length,
    });

    const explanation = await openaiService.generateHomeworkExplanation(
      data.problemText,
      data.subject
    );

    await analyticsService.trackEvent(userId, "homework_explained", {
      method: "text",
      subject: data.subject || "unknown",
    });

    return res.json({
      success: true,
      message: "Here's my explanation:",
      explanation,
      followUp:
        "Was this explanation helpful? Please let me know if you need clarification on any part!",
    });
  } catch (error) {
    logger.error("Text problem processing error", {
      userId,
      error: error.message,
    });
    return res.json({
      success: false,
      message:
        "Sorry, I had trouble processing your question. Please try rephrasing it or break it into smaller parts.",
    });
  }
}

async function handleImageProblem(userId, data, res) {
  try {
    if (!data.imageUrl) {
      return res.json({
        success: true,
        message: "Please upload an image of your homework problem.",
        requiresInput: true,
        inputType: "image",
      });
    }

    // In a real implementation, you would:
    // 1. Download the image
    // 2. Use OCR (Google Vision API) to extract text
    // 3. Process the extracted text with OpenAI

    // For now, we'll simulate this process
    logger.info("Processing image homework problem", {
      userId,
      imageUrl: data.imageUrl,
    });

    // Mock OCR result
    const extractedText = data.mockText || "Solve for x: 2x + 5 = 15";

    const explanation = await openaiService.generateHomeworkExplanation(
      extractedText,
      data.subject
    );

    await analyticsService.trackEvent(userId, "homework_explained", {
      method: "image",
      subject: data.subject || "unknown",
    });

    return res.json({
      success: true,
      message: "I've analyzed your image. Here's my explanation:",
      extractedProblem: extractedText,
      explanation,
      followUp:
        "Was this explanation helpful? Please let me know if the text recognition was accurate!",
    });
  } catch (error) {
    logger.error("Image problem processing error", {
      userId,
      error: error.message,
    });
    return res.json({
      success: false,
      message:
        "Sorry, I had trouble processing your image. Please make sure the image is clear and try again.",
    });
  }
}

async function handleFeedback(userId, data, res) {
  try {
    const feedback = data.feedback; // 'helpful', 'somewhat', 'notHelpful'

    await analyticsService.trackEvent(userId, "homework_feedback", {
      feedback,
    });

    let response = "";
    if (feedback === "helpful") {
      response =
        "Great! I'm glad I could help. Feel free to ask if you have more questions!";
    } else if (feedback === "somewhat") {
      response = "I see. What part would you like me to explain differently?";
    } else {
      response =
        "I apologize that wasn't helpful. Could you tell me what you'd like me to focus on?";
    }

    return res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    logger.error("Feedback processing error", { userId, error: error.message });
    return res.json({
      success: true,
      message: "Thank you for your feedback!",
    });
  }
}

module.exports = {
  handleHomework,
};

