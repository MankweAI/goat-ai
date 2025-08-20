/**
 * OpenAI Service - Enhanced for SA Student Companion
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
    logger.info(
      "OpenAI client initialized successfully for SA Student Companion"
    );
    return openai;
  } catch (error) {
    logger.error("Failed to initialize OpenAI client", {
      error: error.message,
    });
    return createMockClient();
  }
}

/**
 * Test OpenAI connection with SA-specific content
 */
async function testConnection() {
  try {
    if (!openai) {
      openai = initializeOpenAI();
    }

    const testPrompt =
      "Generate a simple Grade 10 Mathematics question about basic algebra following the South African CAPS curriculum.";

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: testPrompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    const generatedText = response.choices[0].message.content;

    logger.info("OpenAI connection test successful", {
      promptLength: testPrompt.length,
      responseLength: generatedText.length,
      preview: generatedText.substring(0, 100) + "...",
    });

    return true;
  } catch (error) {
    logger.error("OpenAI connection test failed", { error: error.message });
    return false;
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
          logger.info("Mock OpenAI request for SA Student Companion", {
            model: params.model,
            messageCount: params.messages.length,
          });

          const prompt = params.messages[0].content.toLowerCase();

          let mockResponse =
            "This is a mock response for SA Student Companion development.";

          if (prompt.includes("exam") || prompt.includes("test")) {
            mockResponse =
              "**Mock Exam Question:** Solve for x in the equation: 2x + 5 = 15\n\n**Solution:**\n1. Subtract 5 from both sides: 2x = 10\n2. Divide both sides by 2: x = 5\n\n**Answer:** x = 5";
          } else if (prompt.includes("homework")) {
            mockResponse =
              "**Homework Solution:** This appears to be a Grade 10 Mathematics problem. Here's the step-by-step solution following CAPS curriculum methodology...";
          } else if (prompt.includes("memory") || prompt.includes("hack")) {
            mockResponse =
              "**Memory Hack:** For remembering quadratic formula: 'Negative b, plus or minus, square root, b squared minus 4ac, all over 2a' 📚";
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

// Rest of existing functions remain the same...
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

async function generateStudyPlan(topics, testDate, grade) {
  // Existing implementation...
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

async function generateHomeworkExplanation(problemText, subject = null) {
  // Existing implementation...
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
  testConnection,
  generateText,
  generateStudyPlan,
  generateHomeworkExplanation,
};
