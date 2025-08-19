/**
 * User Data Access Layer
 */

const { getDatabase } = require("../database");
const logger = require("../../utils/logger");

/**
 * Create a new user
 */
async function createUser(userData) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("users")
      .insert([
        {
          userID: userData.userID,
          grade: userData.grade || null,
          goal: userData.goal || null,
          dailyStreak: 0,
          optInStatus: false,
          testDate: userData.testDate || null,
          studyPlan: userData.studyPlan || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info("User created successfully", { userId: userData.userID });
    return data;
  } catch (error) {
    logger.error("Failed to create user", {
      userId: userData.userID,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("userID", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // User not found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Failed to get user", { userId, error: error.message });
    throw error;
  }
}

/**
 * Update user data
 */
async function updateUser(userId, updates) {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from("users")
      .update(updates)
      .eq("userID", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info("User updated successfully", { userId, updates });
    return data;
  } catch (error) {
    logger.error("Failed to update user", {
      userId,
      updates,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Check if user exists
 */
async function userExists(userId) {
  try {
    const user = await getUserById(userId);
    return user !== null;
  } catch (error) {
    logger.error("Failed to check user existence", {
      userId,
      error: error.message,
    });
    return false;
  }
}

module.exports = {
  createUser,
  getUserById,
  updateUser,
  userExists,
};

