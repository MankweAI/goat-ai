/**
 * OpenAI Service
 */

const OpenAI = require("openai");
const logger = require("../utils/logger");

let openai = null;

/**
 * Initialize OpenAI client
 */
function initializeOpenAI() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "your_openai_api_key_here") {
      logger.warn(
        "OpenAI API key not configured. AI features will use mock responses."
      );
      return createMockClient();
    }

    openai = new OpenAI({ apiKey });
    logger.info("OpenAI client initialized successfully");
    return openai;
  } catch (error) {
    logger.error("Failed to initialize OpenAI client", {
      error: error.message,
    });
    return createMockClient();
  }
}

/**
 * Create mock OpenAI client for development
 */
function createMockClient() {
  return {
    chat: {
      completions: {
        create: async (params) => {
          logger.info("Mock OpenAI request", { params });

          // Generate mock responses based on the prompt
          const prompt = params.messages[0].content.toLowerCase();

          let mockResponse = "This is a mock response for development.";

          if (prompt.includes("study plan")) {
            mockResponse = JSON.stringify({
              dailyPlan: [
                {
                  day: 1,
                  topics: ["Mathematics"],
                  activities: ["Review algebra", "Practice equations"],
                },
                {
                  day: 2,
                  topics: ["Physics"],
                  activities: ["Study motion", "Practice problems"],
                },
              ],
              reviewStrategy:
                "Review all topics and practice example questions",
              resources: ["Textbook", "Online videos", "Practice tests"],
            });
          } else if (
            prompt.includes("explain") ||
            prompt.includes("homework")
          ) {
            mockResponse =
              "Here's a step-by-step explanation of the concept: 1) First understand the problem, 2) Identify the key elements, 3) Apply the appropriate formula or method, 4) Solve systematically.";
          } else if (prompt.includes("motivational")) {
            mockResponse =
              "Stay focused on your goals! Every small step counts toward your success. 📚✨";
          }

          return {
            choices: [
              {
                message: {
                  content: mockResponse,
                },
              },
            ],
          };
        },
      },
    },
  };
}

/**
 * Generate text using OpenAI
 */
async function generateText(prompt, options = {}) {
  try {
    if (!openai) {
      openai = initializeOpenAI();
    }

    const response = await openai.chat.completions.create({
      model: options.model || "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      ...options,
    });

    const generatedText = response.choices[0].message.content;

    logger.info("OpenAI text generated successfully", {
      promptLength: prompt.length,
      responseLength: generatedText.length,
      model: options.model || "gpt-3.5-turbo",
    });

    return generatedText;
  } catch (error) {
    logger.error("OpenAI text generation failed", { error: error.message });
    throw error;
  }
}

/**
 * Generate a study plan
 */
async function generateStudyPlan(topics, testDate, grade) {
  try {
    const today = new Date();
    const examDate = new Date(testDate);
    const daysUntilTest = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilTest < 1) {
      throw new Error("Test date must be in the future");
    }

    const prompt = `Create a detailed study plan for a Grade ${grade} student preparing for a test on ${testDate} (${daysUntilTest} days from now).

Topics to cover: ${topics.join(", ")}

Please create a structured study plan with:
1. Daily breakdown of what to study
2. Recommended practice exercises
3. Review strategies for the final days

Return the response as a valid JSON object with this structure:
{
  "dailyPlan": [{"day": 1, "topics": ["topic1"], "activities": ["activity1", "activity2"]}],
  "reviewStrategy": "text describing review approach",
  "resources": ["resource1", "resource2"]
}`;

    const response = await generateText(prompt, { maxTokens: 1000 });

    try {
      return JSON.parse(response);
    } catch (parseError) {
      logger.warn("Failed to parse study plan JSON, returning text response", {
        error: parseError.message,
      });
      return {
        textPlan: response,
        daysUntilTest,
        topics,
      };
    }
  } catch (error) {
    logger.error("Study plan generation failed", { error: error.message });
    throw error;
  }
}

/**
 * Generate homework explanation
 */
async function generateHomeworkExplanation(problemText, subject = null) {
  try {
    let prompt = `Please provide a clear, step-by-step explanation for this academic problem:\n\n${problemText}\n\n`;

    if (subject) {
      prompt += `This is a ${subject} problem. `;
    }

    prompt += `Please:
1. Identify what type of problem this is
2. Explain the key concepts involved
3. Provide a step-by-step solution
4. Include any helpful tips or common mistakes to avoid

Keep the explanation clear and educational for a high school student.`;

    return await generateText(prompt, { maxTokens: 800 });
  } catch (error) {
    logger.error("Homework explanation generation failed", {
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  initializeOpenAI,
  generateText,
  generateStudyPlan,
  generateHomeworkExplanation,
};
