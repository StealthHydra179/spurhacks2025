var express = require("express");
var router = express.Router();
const { logger } = require("../../logger");
const savingsGoalsDb = require("../../db/savings_goals");
const authenticateToken = require("../../jwt");

const TAG = "api_savings_goals";

// Get all savings goals for the authenticated user
router.get("/", authenticateToken, async function (req, res) {
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
router.get("/:id", authenticateToken, async function (req, res) {
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
router.post("/", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
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
    } = req.body;
    
    // Validate required fields
    if (!title || !amount) {
      logger.warn(`${TAG} Missing required fields for savings goal creation`);
      return res.status(400).json({
        status: "error",
        message: "Title and amount are required"
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
    
    // Validate current_amount is not negative
    if (current_amount < 0) {
      logger.warn(`${TAG} Invalid current_amount for savings goal: ${current_amount}`);
      return res.status(400).json({
        status: "error",
        message: "Current amount cannot be negative"
      });
    }
    
    // Validate deadline if provided
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        logger.warn(`${TAG} Invalid deadline format`);
        return res.status(400).json({
          status: "error",
          message: "Invalid deadline format"
        });
      }
      
      if (deadlineDate <= new Date()) {
        logger.warn(`${TAG} Deadline must be in the future`);
        return res.status(400).json({
          status: "error",
          message: "Deadline must be in the future"
        });
      }
    }
    
    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      logger.warn(`${TAG} Invalid priority: ${priority}`);
      return res.status(400).json({
        status: "error",
        message: "Priority must be 'low', 'medium', or 'high'"
      });
    }
    
    logger.info(`${TAG} Creating savings goal for user: ${userId}`);
    
    const goalData = {
      title,
      description,
      amount,
      deadline,
      category,
      priority,
      icon,
      color,
      current_amount
    };
    
    const newSavingsGoal = await savingsGoalsDb.create(userId, goalData);
    
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
router.put("/:id", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    const goalId = req.params.id;
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
    } = req.body;
    
    // Validate amount is positive if provided
    if (amount !== undefined && amount <= 0) {
      logger.warn(`${TAG} Invalid amount for savings goal: ${amount}`);
      return res.status(400).json({
        status: "error",
        message: "Amount must be greater than 0"
      });
    }
    
    // Validate current_amount is not negative if provided
    if (current_amount !== undefined && current_amount < 0) {
      logger.warn(`${TAG} Invalid current_amount for savings goal: ${current_amount}`);
      return res.status(400).json({
        status: "error",
        message: "Current amount cannot be negative"
      });
    }
    
    // Validate deadline if provided
    if (deadline !== undefined && deadline !== null) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        logger.warn(`${TAG} Invalid deadline format`);
        return res.status(400).json({
          status: "error",
          message: "Invalid deadline format"
        });
      }
    }
    
    // Validate priority if provided
    if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
      logger.warn(`${TAG} Invalid priority: ${priority}`);
      return res.status(400).json({
        status: "error",
        message: "Priority must be 'low', 'medium', or 'high'"
      });
    }
    
    logger.info(`${TAG} Updating savings goal ${goalId} for user: ${userId}`);
    
    const goalData = {
      title,
      description,
      amount,
      current_amount,
      deadline,
      category,
      priority,
      icon,
      color
    };
    
    const updatedSavingsGoal = await savingsGoalsDb.update(goalId, userId, goalData);
    
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

// Partial update of a savings goal (PATCH)
router.patch("/:id", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    const goalId = req.params.id;
    const updateData = req.body;
    
    // Validate that at least one field is provided
    if (Object.keys(updateData).length === 0) {
      logger.warn(`${TAG} No fields provided for savings goal update`);
      return res.status(400).json({
        status: "error",
        message: "At least one field must be provided for update"
      });
    }
    
    // Validate specific fields if they are provided
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      logger.warn(`${TAG} Invalid amount for savings goal: ${updateData.amount}`);
      return res.status(400).json({
        status: "error",
        message: "Amount must be greater than 0"
      });
    }
    
    if (updateData.current_amount !== undefined && updateData.current_amount < 0) {
      logger.warn(`${TAG} Invalid current_amount for savings goal: ${updateData.current_amount}`);
      return res.status(400).json({
        status: "error",
        message: "Current amount cannot be negative"
      });
    }
    
    if (updateData.deadline !== undefined && updateData.deadline !== null) {
      const deadlineDate = new Date(updateData.deadline);
      if (isNaN(deadlineDate.getTime())) {
        logger.warn(`${TAG} Invalid deadline format`);
        return res.status(400).json({
          status: "error",
          message: "Invalid deadline format"
        });
      }
    }
    
    if (updateData.priority !== undefined && !['low', 'medium', 'high'].includes(updateData.priority)) {
      logger.warn(`${TAG} Invalid priority: ${updateData.priority}`);
      return res.status(400).json({
        status: "error",
        message: "Priority must be 'low', 'medium', or 'high'"
      });
    }
    
    logger.info(`${TAG} Partially updating savings goal ${goalId} for user: ${userId}`);
    
    const updatedSavingsGoal = await savingsGoalsDb.update(goalId, userId, updateData);
    
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
router.delete("/:id", authenticateToken, async function (req, res) {
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

// Get savings goals statistics for a user
router.get("/stats/summary", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    logger.info(`${TAG} Fetching savings goals statistics for user: ${userId}`);
    
    const savingsGoals = await savingsGoalsDb.getByUserId(userId);
    
    const stats = {
      total_goals: savingsGoals.length,
      total_target_amount: 0,
      total_current_amount: 0,
      completed_goals: 0,
      active_goals: 0,
      overdue_goals: 0,
      progress_percentage: 0,
      goals_by_priority: {
        high: 0,
        medium: 0,
        low: 0
      },
      goals_by_category: {}
    };
    
    const now = new Date();
    
    savingsGoals.forEach(goal => {
      stats.total_target_amount += parseFloat(goal.amount || 0);
      stats.total_current_amount += parseFloat(goal.current_amount || 0);
      
      // Check if goal is completed
      if (parseFloat(goal.current_amount || 0) >= parseFloat(goal.amount || 0)) {
        stats.completed_goals++;
      } else {
        stats.active_goals++;
      }
      
      // Check if goal is overdue
      if (goal.deadline && new Date(goal.deadline) < now && 
          parseFloat(goal.current_amount || 0) < parseFloat(goal.amount || 0)) {
        stats.overdue_goals++;
      }
      
      // Count by priority
      if (goal.priority && stats.goals_by_priority.hasOwnProperty(goal.priority)) {
        stats.goals_by_priority[goal.priority]++;
      }
      
      // Count by category
      if (goal.category) {
        stats.goals_by_category[goal.category] = (stats.goals_by_category[goal.category] || 0) + 1;
      }
    });
    
    // Calculate overall progress percentage
    if (stats.total_target_amount > 0) {
      stats.progress_percentage = Math.round((stats.total_current_amount / stats.total_target_amount) * 100);
    }
    
    res.json({
      status: "success",
      data: stats,
      message: "Savings goals statistics retrieved successfully"
    });
  } catch (error) {
    logger.error(`${TAG} Error fetching savings goals statistics: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

module.exports = router;
