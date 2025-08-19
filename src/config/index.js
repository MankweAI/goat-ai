/**
 * Application Configuration
 */

module.exports = {
  app: {
    name: "GOAT Bot Backend",
    version: "1.0.0",
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },

  features: {
    onboarding: true,
    examPrep: true,
    homework: true,
    practice: true,
  },

  grades: [10, 11],
};

