const { sql } = require('./db');
const { logger } = require('../logger');

const TAG = 'db_savings_goals';

const savingsGoalsDb = {
  // Create a new savings goal
  create: async (userId, goalData) => {
    try {
      const {
        title,
        description,
        amount,
        deadline,
        category,
        priority = 'medium',
        icon,
        color,
        current_amount = 0.0
      } = goalData;
      
      const query = `
        INSERT INTO savings_goals (
          user_id, title, description, amount, current_amount, 
          deadline, category, priority, icon, color
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const values = [
        userId, title, description, amount, current_amount,
        deadline, category, priority, icon, color
      ];
      
      logger.info(`${TAG} Creating savings goal for user ${userId}`);
      const result = await sql.unsafe(query, values);
      
      if (result.length > 0) {
        logger.info(`${TAG} Successfully created savings goal with ID: ${result[0].id}`);
        return result[0];
      }
      
      throw new Error('Failed to create savings goal');
    } catch (error) {
      logger.error(`${TAG} Error creating savings goal: ${error.message}`);
      throw error;
    }
  },
  // Get all savings goals for a user
  getByUserId: async (userId) => {
    try {
      const query = `
        SELECT *
        FROM savings_goals
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      
      logger.info(`${TAG} Fetching savings goals for user ${userId}`);
      const result = await sql.unsafe(query, [userId]);
      
      logger.info(`${TAG} Found ${result.length} savings goals for user ${userId}`);
      return result;
    } catch (error) {
      logger.error(`${TAG} Error fetching savings goals for user ${userId}: ${error.message}`);
      throw error;
    }
  },
  // Get a specific savings goal by ID
  getById: async (goalId) => {
    try {
      const query = `
        SELECT *
        FROM savings_goals
        WHERE id = $1
      `;
      
      logger.info(`${TAG} Fetching savings goal with ID: ${goalId}`);
      const result = await sql.unsafe(query, [goalId]);
      
      if (result.length > 0) {
        logger.info(`${TAG} Found savings goal with ID: ${goalId}`);
        return result[0];
      }
      
      logger.warn(`${TAG} No savings goal found with ID: ${goalId}`);
      return null;
    } catch (error) {
      logger.error(`${TAG} Error fetching savings goal with ID ${goalId}: ${error.message}`);
      throw error;
    }
  },
  // Update a savings goal
  update: async (goalId, userId, goalData) => {
    try {
      const {
        title,
        description,
        amount,
        current_amount,
        deadline,
        category,
        priority,
        icon,
        color
      } = goalData;
      
      // Build dynamic query based on provided fields
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      if (title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (amount !== undefined) {
        fields.push(`amount = $${paramIndex++}`);
        values.push(amount);
      }
      if (current_amount !== undefined) {
        fields.push(`current_amount = $${paramIndex++}`);
        values.push(current_amount);
      }
      if (deadline !== undefined) {
        fields.push(`deadline = $${paramIndex++}`);
        values.push(deadline);
      }
      if (category !== undefined) {
        fields.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (priority !== undefined) {
        fields.push(`priority = $${paramIndex++}`);
        values.push(priority);
      }
      if (icon !== undefined) {
        fields.push(`icon = $${paramIndex++}`);
        values.push(icon);
      }
      if (color !== undefined) {
        fields.push(`color = $${paramIndex++}`);
        values.push(color);
      }
      
      if (fields.length === 0) {
        throw new Error('No fields provided for update');
      }
      
      // Add updated_at timestamp
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add WHERE clause parameters
      values.push(goalId, userId);
      
      const query = `
        UPDATE savings_goals
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
        RETURNING *
      `;
      
      logger.info(`${TAG} Updating savings goal ${goalId} for user ${userId}`);
      const result = await sql.unsafe(query, values);
      
      if (result.length > 0) {
        logger.info(`${TAG} Successfully updated savings goal with ID: ${goalId}`);
        return result[0];
      }
      
      logger.warn(`${TAG} No savings goal found to update with ID: ${goalId} for user: ${userId}`);
      return null;
    } catch (error) {
      logger.error(`${TAG} Error updating savings goal: ${error.message}`);
      throw error;
    }
  },

  // Delete a savings goal
  delete: async (goalId, userId) => {
    try {
      const query = `
        DELETE FROM savings_goals
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      
      logger.info(`${TAG} Deleting savings goal ${goalId} for user ${userId}`);
      const result = await sql.unsafe(query, [goalId, userId]);
      
      if (result.length > 0) {
        logger.info(`${TAG} Successfully deleted savings goal with ID: ${goalId}`);
        return true;
      }
      
      logger.warn(`${TAG} No savings goal found to delete with ID: ${goalId} for user: ${userId}`);
      return false;
    } catch (error) {
      logger.error(`${TAG} Error deleting savings goal: ${error.message}`);
      throw error;
    }
  }
};

module.exports = savingsGoalsDb;
