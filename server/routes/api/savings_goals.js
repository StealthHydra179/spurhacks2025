var express = require("express");
var router = express.Router();
const { logger } = require("../../logger");
const savingsGoalsDb = require("../../db/savings_goals");
const { authenticateJWT } = require("../../jwt");

const TAG = "api_savings_goals";

// Get all savings goals for the authenticated user
router.get("/", authenticateJWT, async function (req, res) {
  try {
    const userId = req.user.userID;
    logger.info(`${TAG} Fetching savings goals for user: ${userId}`);
    
    const savingsGoals = await savingsGoalsDb.getByUserId(userId);
    
    res.json({
      status: "success",
      data: savingsGoals,
      message: `Found ${savingsGoals.length} savings goals`
    });
  } catch (error) {
    logger.error(`${TAG} Error fetching savings goals: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

// Get a specific savings goal by ID
router.get("/:id", authenticateJWT, async function (req, res) {
  try {
    const userId = req.user.userID;
    const goalId = req.params.id;
    
    logger.info(`${TAG} Fetching savings goal ${goalId} for user: ${userId}`);
    
    const savingsGoal = await savingsGoalsDb.getById(goalId);
    
    if (!savingsGoal) {
      logger.warn(`${TAG} Savings goal ${goalId} not found`);
      return res.status(404).json({
        status: "error",
        message: "Savings goal not found"
      });
    }
    
    // Check if the goal belongs to the authenticated user
    if (savingsGoal.user_id !== userId) {
      logger.warn(`${TAG} User ${userId} attempted to access savings goal ${goalId} belonging to user ${savingsGoal.user_id}`);
      return res.status(403).json({
        status: "error",
        message: "Access denied"
      });
    }
    
    res.json({
      status: "success",
      data: savingsGoal
    });
  } catch (error) {
    logger.error(`${TAG} Error fetching savings goal: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

// Create a new savings goal
router.post("/", authenticateJWT, async function (req, res) {
  try {
    const userId = req.user.userID;
    const { amount, start_timestamp, end_timestamp } = req.body;
    
    // Validate required fields
    if (!amount || !start_timestamp || !end_timestamp) {
      logger.warn(`${TAG} Missing required fields for savings goal creation`);
      return res.status(400).json({
        status: "error",
        message: "Amount, start_timestamp, and end_timestamp are required"
      });
    }
    
    // Validate amount is positive
    if (amount <= 0) {
      logger.warn(`${TAG} Invalid amount for savings goal: ${amount}`);
      return res.status(400).json({
        status: "error",
        message: "Amount must be greater than 0"
      });
    }
    
    // Validate dates
    const startDate = new Date(start_timestamp);
    const endDate = new Date(end_timestamp);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      logger.warn(`${TAG} Invalid date format`);
      return res.status(400).json({
        status: "error",
        message: "Invalid date format"
      });
    }
    
    if (endDate <= startDate) {
      logger.warn(`${TAG} End date must be after start date`);
      return res.status(400).json({
        status: "error",
        message: "End date must be after start date"
      });
    }
    
    logger.info(`${TAG} Creating savings goal for user: ${userId}`);
    
    const newSavingsGoal = await savingsGoalsDb.create(
      userId,
      amount,
      start_timestamp,
      end_timestamp
    );
    
    res.status(201).json({
      status: "success",
      data: newSavingsGoal,
      message: "Savings goal created successfully"
    });
  } catch (error) {
    logger.error(`${TAG} Error creating savings goal: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

// Update a savings goal
router.put("/:id", authenticateJWT, async function (req, res) {
  try {
    const userId = req.user.userID;
    const goalId = req.params.id;
    const { amount, start_timestamp, end_timestamp } = req.body;
    
    // Validate required fields
    if (!amount || !start_timestamp || !end_timestamp) {
      logger.warn(`${TAG} Missing required fields for savings goal update`);
      return res.status(400).json({
        status: "error",
        message: "Amount, start_timestamp, and end_timestamp are required"
      });
    }
    
    // Validate amount is positive
    if (amount <= 0) {
      logger.warn(`${TAG} Invalid amount for savings goal: ${amount}`);
      return res.status(400).json({
        status: "error",
        message: "Amount must be greater than 0"
      });
    }
    
    // Validate dates
    const startDate = new Date(start_timestamp);
    const endDate = new Date(end_timestamp);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      logger.warn(`${TAG} Invalid date format`);
      return res.status(400).json({
        status: "error",
        message: "Invalid date format"
      });
    }
    
    if (endDate <= startDate) {
      logger.warn(`${TAG} End date must be after start date`);
      return res.status(400).json({
        status: "error",
        message: "End date must be after start date"
      });
    }
    
    logger.info(`${TAG} Updating savings goal ${goalId} for user: ${userId}`);
    
    const updatedSavingsGoal = await savingsGoalsDb.update(
      goalId,
      userId,
      amount,
      start_timestamp,
      end_timestamp
    );
    
    if (!updatedSavingsGoal) {
      logger.warn(`${TAG} Savings goal ${goalId} not found for user ${userId}`);
      return res.status(404).json({
        status: "error",
        message: "Savings goal not found"
      });
    }
    
    res.json({
      status: "success",
      data: updatedSavingsGoal,
      message: "Savings goal updated successfully"
    });
  } catch (error) {
    logger.error(`${TAG} Error updating savings goal: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

// Delete a savings goal
router.delete("/:id", authenticateJWT, async function (req, res) {
  try {
    const userId = req.user.userID;
    const goalId = req.params.id;
    
    logger.info(`${TAG} Deleting savings goal ${goalId} for user: ${userId}`);
    
    const deleted = await savingsGoalsDb.delete(goalId, userId);
    
    if (!deleted) {
      logger.warn(`${TAG} Savings goal ${goalId} not found for user ${userId}`);
      return res.status(404).json({
        status: "error",
        message: "Savings goal not found"
      });
    }
    
    res.json({
      status: "success",
      message: "Savings goal deleted successfully"
    });
  } catch (error) {
    logger.error(`${TAG} Error deleting savings goal: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

module.exports = router;
