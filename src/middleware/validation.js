/**
 * Request Validation Middleware
 */

const Joi = require("joi");
const logger = require("../utils/logger");

/**
 * Create validation middleware for a schema
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      logger.warn("Request validation failed", {
        error: error.details[0].message,
        path: req.path,
        body: req.body,
      });

      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: error.details[0].message,
      });
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
}

/**
 * Webhook validation schemas
 */
const schemas = {
  webhook: Joi.object({
    userId: Joi.string().required(),
    action: Joi.string().required(),
    data: Joi.object().default({}),
  }).unknown(true),

  onboarding: Joi.object({
    userId: Joi.string().required(),
    action: Joi.string().valid("onboarding").required(),
    step: Joi.string().valid("welcome", "grade", "goal").required(),
    data: Joi.object({
      grade: Joi.number().valid(10, 11).optional(),
      goal: Joi.string().max(500).optional(),
    }).default({}),
  }).unknown(true),
};

module.exports = {
  validateRequest,
  schemas,
};

