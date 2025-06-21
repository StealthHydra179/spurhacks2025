const { pool } = require('./db');
const { logger } = require('../logger');

const TAG = 'db_savings_goals';

const savingsGoalsDb = {
  // Create a new savings goal
  create: async (userId, amount, startTimestamp, endTimestamp) => {
    try {
      const query = `
        INSERT INTO savings_goals (user_id, amount, start_timestamp, end_timestamp, current_amount)
        VALUES ($1, $2, $3, $4, 0.0)
        RETURNING id, user_id, amount, start_timestamp, end_timestamp
      `;
      const values = [userId, amount, startTimestamp, endTimestamp];
      
      logger.info(`${TAG} Creating savings goal for user ${userId}`);
      const result = await pool.query(query, values);
      
      if (result.rows.length > 0) {
        logger.info(`${TAG} Successfully created savings goal with ID: ${result.rows[0].id}`);
        return result.rows[0];
      }
      
      throw new Error('Failed to create savings goal');
    } catch (error) {
      logger.error(`${TAG} Error creating savings goal: ${error.message}`);
      throw error;
    }
  },

  // Get all savings goals for a user (excluding current_amount)
  getByUserId: async (userId) => {
    try {
      const query = `
        SELECT id, user_id, amount, start_timestamp, end_timestamp
        FROM savings_goals
        WHERE user_id = $1
        ORDER BY start_timestamp DESC
      `;
      
      logger.info(`${TAG} Fetching savings goals for user ${userId}`);
      const result = await pool.query(query, [userId]);
      
      logger.info(`${TAG} Found ${result.rows.length} savings goals for user ${userId}`);
      return result.rows;
    } catch (error) {
      logger.error(`${TAG} Error fetching savings goals for user ${userId}: ${error.message}`);
      throw error;
    }
  },

  // Get a specific savings goal by ID (excluding current_amount)
  getById: async (goalId) => {
    try {
      const query = `
        SELECT id, user_id, amount, start_timestamp, end_timestamp
        FROM savings_goals
        WHERE id = $1
      `;
      
      logger.info(`${TAG} Fetching savings goal with ID: ${goalId}`);
      const result = await pool.query(query, [goalId]);
      
      if (result.rows.length > 0) {
        logger.info(`${TAG} Found savings goal with ID: ${goalId}`);
        return result.rows[0];
      }
      
      logger.warn(`${TAG} No savings goal found with ID: ${goalId}`);
      return null;
    } catch (error) {
      logger.error(`${TAG} Error fetching savings goal with ID ${goalId}: ${error.message}`);
      throw error;
    }
  },

  // Update a savings goal (excluding current_amount)
  update: async (goalId, userId, amount, startTimestamp, endTimestamp) => {
    try {
      const query = `
        UPDATE savings_goals
        SET amount = $2, start_timestamp = $3, end_timestamp = $4
        WHERE id = $1 AND user_id = $5
        RETURNING id, user_id, amount, start_timestamp, end_timestamp
      `;
      const values = [goalId, amount, startTimestamp, endTimestamp, userId];
      
      logger.info(`${TAG} Updating savings goal ${goalId} for user ${userId}`);
      const result = await pool.query(query, values);
      
      if (result.rows.length > 0) {
        logger.info(`${TAG} Successfully updated savings goal with ID: ${goalId}`);
        return result.rows[0];
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
      const result = await pool.query(query, [goalId, userId]);
      
      if (result.rows.length > 0) {
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
