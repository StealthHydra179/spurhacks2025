const { sql } = require("./db");
const { logger } = require("../logger");

const TAG = "db_budgets";

const budgetsDb = {
  // Create a new budget
  create: async (userId, budgetData) => {
    try {
      const {
        overall,
        housing,
        food,
        transportation,
        health,
        personal,
        entertainment,
        financial,
        gifts,
      } = budgetData;

      const query = `
        INSERT INTO budgets (
          user_id, overall, housing, food, transportation, 
          health, personal, entertainment, financial, gifts
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const values = [
        userId,
        overall,
        housing,
        food,
        transportation,
        health,
        personal,
        entertainment,
        financial,
        gifts,
      ];

      logger.info(`${TAG} Creating budget for user ${userId}`);
      const result = await sql.unsafe(query, values);

      if (result.length > 0) {
        logger.info(
          `${TAG} Successfully created budget with ID: ${result[0].id}`
        );
        return result[0];
      }

      throw new Error("Failed to create budget");
    } catch (error) {
      logger.error(`${TAG} Error creating budget: ${error.message}`);
      throw error;
    }
  },

  // Get all budgets for a user
  getByUserId: async (userId) => {
    try {
      const query = `
        SELECT * FROM budgets 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;

      logger.info(`${TAG} Fetching budgets for user ${userId}`);
      const result = await sql.unsafe(query, [userId]);

      logger.info(`${TAG} Found ${result.length} budgets for user ${userId}`);
      return result;
    } catch (error) {
      logger.error(
        `${TAG} Error fetching budgets for user ${userId}: ${error.message}`
      );
      throw error;
    }
  },

  // Get the current budget for a user (most recent)
  getCurrentByUserId: async (userId) => {
    try {
      const query = `
        SELECT * FROM budgets 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        LIMIT 1
      `;

      logger.info(`${TAG} Fetching current budget for user ${userId}`);
      const result = await sql.unsafe(query, [userId]);

      if (result.length > 0) {
        logger.info(`${TAG} Found current budget for user ${userId}`);
        return result[0];
      }

      logger.info(`${TAG} No current budget found for user ${userId}`);
      return null;
    } catch (error) {
      logger.error(
        `${TAG} Error fetching current budget for user ${userId}: ${error.message}`
      );
      throw error;
    }
  },

  // Get a specific budget by ID
  getById: async (budgetId) => {
    try {
      const query = `
        SELECT * FROM budgets 
        WHERE id = $1
      `;

      logger.info(`${TAG} Fetching budget ${budgetId}`);
      const result = await sql.unsafe(query, [budgetId]);

      if (result.length > 0) {
        logger.info(`${TAG} Found budget ${budgetId}`);
        return result[0];
      }

      logger.info(`${TAG} Budget ${budgetId} not found`);
      return null;
    } catch (error) {
      logger.error(
        `${TAG} Error fetching budget ${budgetId}: ${error.message}`
      );
      throw error;
    }
  },

  // Update a budget
  update: async (budgetId, budgetData) => {
    try {
      const {
        overall,
        housing,
        food,
        transportation,
        health,
        personal,
        entertainment,
        financial,
        gifts,
      } = budgetData;

      const query = `
        UPDATE budgets SET 
          overall = $1, housing = $2, food = $3, transportation = $4,
          health = $5, personal = $6, entertainment = $7, financial = $8,
          gifts = $9, updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;
      const values = [
        overall,
        housing,
        food,
        transportation,
        health,
        personal,
        entertainment,
        financial,
        gifts,
        budgetId,
      ];

      logger.info(`${TAG} Updating budget ${budgetId}`);
      const result = await sql.unsafe(query, values);

      if (result.length > 0) {
        logger.info(`${TAG} Successfully updated budget ${budgetId}`);
        return result[0];
      }

      logger.warn(`${TAG} Budget ${budgetId} not found for update`);
      return null;
    } catch (error) {
      logger.error(
        `${TAG} Error updating budget ${budgetId}: ${error.message}`
      );
      throw error;
    }
  },

  // Partially update a budget (patch)
  patch: async (budgetId, updates) => {
    try {
      const allowedFields = [
        "overall",
        "housing",
        "food",
        "transportation",
        "health",
        "personal",
        "entertainment",
        "financial",
        "gifts",
      ];
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error("No valid fields to update");
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(budgetId);

      const query = `
        UPDATE budgets SET ${updateFields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      logger.info(
        `${TAG} Patching budget ${budgetId} with fields: ${Object.keys(
          updates
        ).join(", ")}`
      );
      const result = await sql.unsafe(query, values);

      if (result.length > 0) {
        logger.info(`${TAG} Successfully patched budget ${budgetId}`);
        return result[0];
      }

      logger.warn(`${TAG} Budget ${budgetId} not found for patch`);
      return null;
    } catch (error) {
      logger.error(
        `${TAG} Error patching budget ${budgetId}: ${error.message}`
      );
      throw error;
    }
  },

  // Delete a budget
  delete: async (budgetId) => {
    try {
      const query = `
        DELETE FROM budgets 
        WHERE id = $1
        RETURNING *
      `;

      logger.info(`${TAG} Deleting budget ${budgetId}`);
      const result = await sql.unsafe(query, [budgetId]);

      if (result.length > 0) {
        logger.info(`${TAG} Successfully deleted budget ${budgetId}`);
        return result[0];
      }

      logger.warn(`${TAG} Budget ${budgetId} not found for deletion`);
      return null;
    } catch (error) {
      logger.error(
        `${TAG} Error deleting budget ${budgetId}: ${error.message}`
      );
      throw error;
    }
  },
};

module.exports = budgetsDb;
