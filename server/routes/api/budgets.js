var express = require("express");
var router = express.Router();
const { logger } = require("../../logger");
const budgetsDb = require("../../db/budgets");
const authenticateToken = require("../../jwt");

const TAG = "api_budgets";

// Get all budgets for the authenticated user
router.get("/", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    logger.info(`${TAG} Fetching budgets for user: ${userId}`);

    const budgets = await budgetsDb.getByUserId(userId);

    res.json({
      status: "success",
      data: budgets,
      message: `Found ${budgets.length} budgets`,
    });
  } catch (error) {
    logger.error(`${TAG} Error fetching budgets: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

// Get a specific budget by ID
router.get("/:id", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    const budgetId = req.params.id;

    logger.info(`${TAG} Fetching budget ${budgetId} for user: ${userId}`);

    const budget = await budgetsDb.getById(budgetId);

    if (!budget) {
      logger.warn(`${TAG} Budget ${budgetId} not found`);
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    // Check if the budget belongs to the authenticated user
    if (budget.user_id !== userId) {
      logger.warn(
        `${TAG} User ${userId} attempted to access budget ${budgetId} belonging to user ${budget.user_id}`
      );
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    res.json({
      status: "success",
      data: budget,
    });
  } catch (error) {
    logger.error(`${TAG} Error fetching budget: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

// Create a new budget
router.post("/", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
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
    } = req.body;

    // Validate required fields
    if (!overall || overall <= 0) {
      logger.warn(`${TAG} Missing or invalid overall budget amount`);
      return res.status(400).json({
        status: "error",
        message: "Overall budget amount is required and must be greater than 0",
      });
    }

    // Validate that all category amounts are non-negative if provided
    const categories = {
      housing,
      food,
      transportation,
      health,
      personal,
      entertainment,
      financial,
      gifts,
    };
    for (const [category, amount] of Object.entries(categories)) {
      if (amount !== undefined && amount !== null && amount < 0) {
        logger.warn(`${TAG} Invalid ${category} amount: ${amount}`);
        return res.status(400).json({
          status: "error",
          message: `${category} amount cannot be negative`,
        });
      }
    }

    // Calculate total of categories if provided and validate against overall budget
    const categoryTotal = Object.values(categories)
      .filter((amount) => amount !== undefined && amount !== null)
      .reduce((sum, amount) => sum + parseFloat(amount), 0);

    if (categoryTotal > overall) {
      logger.warn(
        `${TAG} Category total (${categoryTotal}) exceeds overall budget (${overall})`
      );
      return res.status(400).json({
        status: "error",
        message: "Sum of category budgets cannot exceed overall budget",
      });
    }

    logger.info(`${TAG} Creating budget for user: ${userId}`);

    const budgetData = {
      overall,
      housing,
      food,
      transportation,
      health,
      personal,
      entertainment,
      financial,
      gifts,
    };

    const newBudget = await budgetsDb.create(userId, budgetData);

    res.status(201).json({
      status: "success",
      data: newBudget,
      message: "Budget created successfully",
    });
  } catch (error) {
    logger.error(`${TAG} Error creating budget: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

// Update a budget (complete replacement)
router.put("/:id", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    const budgetId = req.params.id;
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
    } = req.body;

    // Check if budget exists and belongs to user
    const existingBudget = await budgetsDb.getById(budgetId);
    if (!existingBudget) {
      logger.warn(`${TAG} Budget ${budgetId} not found for update`);
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    if (existingBudget.user_id !== userId) {
      logger.warn(
        `${TAG} User ${userId} attempted to update budget ${budgetId} belonging to user ${existingBudget.user_id}`
      );
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    // Validate required fields
    if (!overall || overall <= 0) {
      logger.warn(`${TAG} Missing or invalid overall budget amount for update`);
      return res.status(400).json({
        status: "error",
        message: "Overall budget amount is required and must be greater than 0",
      });
    }

    // Validate that all category amounts are non-negative if provided
    const categories = {
      housing,
      food,
      transportation,
      health,
      personal,
      entertainment,
      financial,
      gifts,
    };
    for (const [category, amount] of Object.entries(categories)) {
      if (amount !== undefined && amount !== null && amount < 0) {
        logger.warn(`${TAG} Invalid ${category} amount: ${amount}`);
        return res.status(400).json({
          status: "error",
          message: `${category} amount cannot be negative`,
        });
      }
    }

    // Calculate total of categories if provided and validate against overall budget
    const categoryTotal = Object.values(categories)
      .filter((amount) => amount !== undefined && amount !== null)
      .reduce((sum, amount) => sum + parseFloat(amount), 0);

    if (categoryTotal > overall) {
      logger.warn(
        `${TAG} Category total (${categoryTotal}) exceeds overall budget (${overall})`
      );
      return res.status(400).json({
        status: "error",
        message: "Sum of category budgets cannot exceed overall budget",
      });
    }

    logger.info(`${TAG} Updating budget ${budgetId} for user: ${userId}`);

    const budgetData = {
      overall,
      housing,
      food,
      transportation,
      health,
      personal,
      entertainment,
      financial,
      gifts,
    };

    const updatedBudget = await budgetsDb.update(budgetId, budgetData);

    if (!updatedBudget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    res.json({
      status: "success",
      data: updatedBudget,
      message: "Budget updated successfully",
    });
  } catch (error) {
    logger.error(`${TAG} Error updating budget: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

// Partially update a budget (patch specific attributes)
router.patch("/:id", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    const budgetId = req.params.id;
    const updates = req.body;

    // Check if budget exists and belongs to user
    const existingBudget = await budgetsDb.getById(budgetId);
    if (!existingBudget) {
      logger.warn(`${TAG} Budget ${budgetId} not found for patch`);
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    if (existingBudget.user_id !== userId) {
      logger.warn(
        `${TAG} User ${userId} attempted to patch budget ${budgetId} belonging to user ${existingBudget.user_id}`
      );
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    // Validate that no amounts are negative
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
    for (const [field, value] of Object.entries(updates)) {
      if (!allowedFields.includes(field)) {
        logger.warn(`${TAG} Invalid field in patch request: ${field}`);
        return res.status(400).json({
          status: "error",
          message: `Invalid field: ${field}`,
        });
      }

      if (value !== undefined && value !== null && value < 0) {
        logger.warn(`${TAG} Invalid ${field} amount: ${value}`);
        return res.status(400).json({
          status: "error",
          message: `${field} amount cannot be negative`,
        });
      }

      if (
        field === "overall" &&
        (value === undefined || value === null || value <= 0)
      ) {
        logger.warn(`${TAG} Invalid overall budget amount: ${value}`);
        return res.status(400).json({
          status: "error",
          message: "Overall budget amount must be greater than 0",
        });
      }
    }

    // If overall budget is being updated, validate against category totals
    const newOverall =
      updates.overall !== undefined ? updates.overall : existingBudget.overall;
    const categories = [
      "housing",
      "food",
      "transportation",
      "health",
      "personal",
      "entertainment",
      "financial",
      "gifts",
    ];
    const categoryTotal = categories.reduce((sum, category) => {
      const value =
        updates[category] !== undefined
          ? updates[category]
          : existingBudget[category];
      return sum + (value || 0);
    }, 0);

    if (categoryTotal > newOverall) {
      logger.warn(
        `${TAG} Category total (${categoryTotal}) would exceed overall budget (${newOverall})`
      );
      return res.status(400).json({
        status: "error",
        message: "Sum of category budgets cannot exceed overall budget",
      });
    }

    logger.info(`${TAG} Patching budget ${budgetId} for user: ${userId}`);

    const updatedBudget = await budgetsDb.patch(budgetId, updates);

    if (!updatedBudget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    res.json({
      status: "success",
      data: updatedBudget,
      message: "Budget updated successfully",
    });
  } catch (error) {
    logger.error(`${TAG} Error patching budget: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

// Delete a budget
router.delete("/:id", authenticateToken, async function (req, res) {
  try {
    const userId = req.user.userID;
    const budgetId = req.params.id;

    // Check if budget exists and belongs to user
    const existingBudget = await budgetsDb.getById(budgetId);
    if (!existingBudget) {
      logger.warn(`${TAG} Budget ${budgetId} not found for deletion`);
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    if (existingBudget.user_id !== userId) {
      logger.warn(
        `${TAG} User ${userId} attempted to delete budget ${budgetId} belonging to user ${existingBudget.user_id}`
      );
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    logger.info(`${TAG} Deleting budget ${budgetId} for user: ${userId}`);

    const deletedBudget = await budgetsDb.delete(budgetId);

    if (!deletedBudget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    res.json({
      status: "success",
      data: deletedBudget,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    logger.error(`${TAG} Error deleting budget: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
