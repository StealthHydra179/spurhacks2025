const express = require("express");
const router = express.Router();
const plaid = require("../../plaid/plaid");
const { logger } = require("../../logger");
const plaidUsersDb = require("../../db/plaid_users");
const botConversationsDb = require("../../db/bot_conversations");
const authenticateToken = require("../../jwt");

const TAG = "plaid_routes";

/**
 * Helper function to validate and normalize date strings
 */
function normalizeDate(dateString) {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      logger.warn(`${TAG} Invalid date string: ${dateString}`);
      return null;
    }

    // Return date in YYYY-MM-DD format
    return date.toISOString().split("T")[0];
  } catch (error) {
    logger.warn(`${TAG} Error parsing date: ${dateString}`, error);
    return null;
  }
}

/**
 * POST /api/plaid/create_link_token
 * Step 1: Create a link token for Plaid Link initialization
 */
router.post("/create_link_token", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.userID; // Use authenticated user ID

    const linkTokenData = await plaid.createLinkToken(user_id);
    res.json(linkTokenData);
  } catch (error) {
    logger.error(`${TAG} Error creating link token: ${error.message}`);
    res.status(500).json({ error: "Failed to create link token" });
  }
});

/**
 * POST /api/plaid/exchange_public_token
 * Step 3: Exchange public token for permanent access token
 */
router.post("/exchange_public_token", authenticateToken, async (req, res) => {
  try {
    const { public_token } = req.body;
    const user_id = req.user.userID; // Use authenticated user ID

    if (!public_token) {
      return res.status(400).json({ error: "Public token is required" });
    }

    const tokenData = await plaid.exchangePublicToken(public_token, user_id);

    // Store access token in plaid_users table (users can have multiple access tokens)
    const plaidUser = await plaidUsersDb.createAccessToken(
      user_id,
      tokenData.access_token
    );
    logger.info(
      `${TAG}: Created new plaid_user record ${plaidUser.id} with access token for user ${user_id}`
    );

    res.json({
      message: "Public token exchange complete",
      item_id: tokenData.item_id,
      plaid_user_id: plaidUser.id,
    });
  } catch (error) {
    logger.error(`${TAG} Error exchanging public token: ${error.message}`);
    res.status(500).json({ error: "Failed to exchange public token" });
  }
});

/**
 * GET /api/plaid/accounts/:user_id
 * Step 4: Get account information for a user
 */
router.get("/accounts/:user_id", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const authenticatedUserID = req.user.userID;

    // Verify the requested user_id matches the authenticated user
    if (parseInt(user_id) !== authenticatedUserID) {
      return res
        .status(403)
        .json({ error: "Access denied to this user's data" });
    }

    const accountsData = await plaid.getAccounts(user_id);
    res.json(accountsData);
  } catch (error) {
    logger.error(`${TAG} Error getting accounts: ${error.message}`);
    res.status(500).json({ error: "Failed to get accounts" });
  }
});

/**
 * GET /api/plaid/transactions/:user_id
 * Get transactions for a user
 */
router.get("/transactions/:user_id", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const authenticatedUserID = req.user.userID;
    const { start_date, end_date } = req.query;

    // Verify the requested user_id matches the authenticated user
    if (parseInt(user_id) !== authenticatedUserID) {
      return res
        .status(403)
        .json({ error: "Access denied to this user's data" });
    }

    // Normalize and validate dates
    const normalizedStartDate = normalizeDate(start_date);
    const normalizedEndDate = normalizeDate(end_date);

    logger.info(`${TAG} Getting transactions for user ${user_id}`);
    logger.info(
      `${TAG} Original date range: ${start_date || "default"} to ${
        end_date || "default"
      }`
    );
    logger.info(
      `${TAG} Normalized date range: ${normalizedStartDate || "default"} to ${
        normalizedEndDate || "default"
      }`
    );

    const transactionsData = await plaid.getTransactions(
      user_id,
      normalizedStartDate,
      normalizedEndDate
    );

    // Additional date filtering to ensure we only return transactions within the specified range
    let filteredTransactions = transactionsData.transactions || [];

    if (normalizedStartDate || normalizedEndDate) {
      filteredTransactions = filteredTransactions.filter((transaction) => {
        const transactionDate = transaction.date; // Plaid returns date in YYYY-MM-DD format

        // Convert dates to Date objects for comparison
        const txDate = new Date(transactionDate);
        const startDate = normalizedStartDate
          ? new Date(normalizedStartDate)
          : null;
        const endDate = normalizedEndDate ? new Date(normalizedEndDate) : null;

        // Reset time to start of day for accurate date comparison
        txDate.setHours(0, 0, 0, 0);
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(0, 0, 0, 0);

        // Check if transaction date is within range
        const afterStart = !startDate || txDate >= startDate;
        const beforeEnd = !endDate || txDate <= endDate;

        const isInRange = afterStart && beforeEnd;

        // Log transactions that are being filtered out
        if (!isInRange) {
          logger.debug(
            `${TAG} Filtering out transaction: ${transaction.name} (${transaction.date}) - outside range ${normalizedStartDate} to ${normalizedEndDate}`
          );
        }

        return isInRange;
      });

      logger.info(
        `${TAG} Date filtering applied: ${
          transactionsData.transactions?.length || 0
        } total transactions, ${filteredTransactions.length} after filtering`
      );

      // Log any transactions that were filtered out
      const filteredOut = (transactionsData.transactions || []).filter(
        (t) => !filteredTransactions.includes(t)
      );
      if (filteredOut.length > 0) {
        logger.info(
          `${TAG} Filtered out transactions:`,
          filteredOut.map((t) => ({
            date: t.date,
            name: t.name,
            amount: t.amount,
          }))
        );
      }
    }

    // Debug logging to see the exact structure
    console.log("🔍 Raw transactionsData:", transactionsData);
    console.log("🔍 transactionsData type:", typeof transactionsData);
    console.log("🔍 transactionsData keys:", Object.keys(transactionsData));
    console.log(
      "🔍 Filtered transactions length:",
      filteredTransactions.length
    );

    // Log the response structure and transaction count
    logger.info(
      `${TAG} Transactions API response received for user ${user_id}`
    );
    logger.info(
      `${TAG} Response structure:`,
      JSON.stringify(
        {
          has_transactions: !!filteredTransactions,
          transaction_count: filteredTransactions.length,
          accounts_count: transactionsData.accounts
            ? transactionsData.accounts.length
            : 0,
          total_transactions: transactionsData.total_transactions || 0,
          request_id: transactionsData.request_id || "N/A",
          date_filter_applied: !!(normalizedStartDate || normalizedEndDate),
          original_start_date: start_date,
          original_end_date: end_date,
          normalized_start_date: normalizedStartDate,
          normalized_end_date: normalizedEndDate,
        },
        null,
        2
      )
    );

    if (filteredTransactions.length > 0) {
      logger.info(`${TAG} Sample filtered transactions for user ${user_id}:`);
      const sampleTransactions = filteredTransactions.slice(0, 3).map((t) => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        category: t.category,
        pending: t.pending,
      }));
      logger.info(
        `${TAG} Sample transactions:`,
        JSON.stringify(sampleTransactions, null, 2)
      );
    } else {
      logger.info(
        `${TAG} No transactions found for user ${user_id} in specified date range`
      );
    }

    // Log the final response format
    console.log(
      "📤 Final API response format:",
      Array.isArray(filteredTransactions) ? "Array" : "Not Array"
    );
    console.log("📤 Response length:", filteredTransactions.length);
    console.log("📤 Response type:", typeof filteredTransactions);

    res.json(filteredTransactions);
  } catch (error) {
    logger.error(`${TAG} Error getting transactions: ${error.message}`);
    logger.error(`${TAG} Full error details:`, error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

/**
 * GET /api/plaid/balances/:user_id
 * Get account balances for a user
 */
router.get('/balances/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const balancesData = await plaid.getBalances(user_id);
    res.json(balancesData);
  } catch (error) {
    logger.error(`${TAG} Error getting balances: ${error.message}`);
    res.status(500).json({ error: 'Failed to get balances' });
  }
});

/**
 * GET /api/plaid/item-status/:user_id
 * Check if a user has a linked Plaid Item
 */
router.get("/item-status/:user_id", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const authenticatedUserID = req.user.userID;

    // Verify the requested user_id matches the authenticated user
    if (parseInt(user_id) !== authenticatedUserID) {
      return res
        .status(403)
        .json({ error: "Access denied to this user's data" });
    }

    // Log all stored access tokens
    plaid.logStoredAccessTokens();

    // Check if user has an access token stored (indicating a linked item)
    const hasLinkedItem = plaid.hasLinkedItem
      ? await plaid.hasLinkedItem(user_id)
      : false;

    if (hasLinkedItem) {
      // If they have a linked item, try to get basic info to verify it's still valid
      try {
        const accountsData = await plaid.getAccounts(user_id);
        res.json({
          has_linked_item: true,
          item_id: await plaid.getItemId(user_id),
          account_count: accountsData.accounts
            ? accountsData.accounts.length
            : 0,
          last_verified: new Date().toISOString(),
        });
      } catch (error) {
        // Item exists but might be invalid/expired
        res.json({
          has_linked_item: true,
          item_id: plaid.getItemId ? plaid.getItemId(user_id) : null,
          account_count: 0,
          status: "invalid_or_expired",
          error: error.message,
          last_verified: new Date().toISOString(),
        });
      }
    } else {
      res.json({
        has_linked_item: false,
        item_id: null,
        account_count: 0,
        last_checked: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error(
      `${TAG} Error checking item status for user ${req.params.user_id}: ${error.message}`
    );
    res.status(500).json({ error: "Failed to check item status" });
  }
});

/**
 * DELETE /api/plaid/item/:user_id
 * Remove/disconnect a bank account for a user
 */
router.delete("/item/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await plaid.removeItem(user_id);
    res.json(result);
  } catch (error) {
    logger.error(`${TAG} Error removing item: ${error.message}`);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

/**
 * GET /api/plaid/summary
 * Get summary of all connected users and their Plaid data
 */
router.get("/summary", async (req, res) => {
  try {
    const summary = await plaid.getPlaidSummary();
    res.json(summary);
  } catch (error) {
    logger.error(`${TAG} Error getting Plaid summary: ${error.message}`);
    res.status(500).json({ error: "Failed to get Plaid summary" });
  }
});

/**
 * POST /api/plaid/fetch-all
 * Manually trigger fetching all Plaid data for all users
 */
router.post("/fetch-all", async (req, res) => {
  try {
    logger.info(`${TAG} Manual fetch all Plaid data triggered`);
    const data = await plaid.fetchPlaidInfo();
    res.json({
      message: "Plaid data fetch completed",
      data: data,
    });
  } catch (error) {
    logger.error(`${TAG} Error in manual fetch all: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch all Plaid data" });
  }
});

/**
 * POST /api/plaid/fetch-recent
 * Manually trigger fetching last day's transactions for all users
 */
router.post("/fetch-recent", async (req, res) => {
  try {
    logger.info(`${TAG} Manual fetch recent transactions triggered`);
    const data = await plaid.fetchLastDayPlaidInfo();
    res.json({
      message: "Recent transactions fetch completed",
      data: data,
    });
  } catch (error) {
    logger.error(`${TAG} Error in manual fetch recent: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});

/**
 * POST /api/plaid/fetch-all-transactions
 * Manually trigger fetching all transactions for all users
 */
router.post("/fetch-all-transactions", async (req, res) => {
  try {
    logger.info(`${TAG} Manual fetch all transactions triggered`);
    const data = await plaid.fetchAllTransactionsPlaid();
    res.json({
      message: "All transactions fetch completed",
      data: data,
    });
  } catch (error) {
    logger.error(
      `${TAG} Error in manual fetch all transactions: ${error.message}`
    );
    res.status(500).json({ error: "Failed to fetch all transactions" });
  }
});

/**
 * POST /api/plaid/chat-response
 * Generate AI response for ongoing conversations
 */
router.post("/chat-response", authenticateToken, async (req, res) => {
  try {
    const { conversation_id, user_message } = req.body;
    const authenticatedUserID = req.user.userID;

    if (!conversation_id || !user_message) {
      return res
        .status(400)
        .json({ error: "Conversation ID and user message are required" });
    }

    // Get conversation context
    const conversation = await botConversationsDb.getFullConversation(
      conversation_id
    );
    if (!conversation.summary || conversation.summary.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const user_id = conversation.summary[0].user_id;

    // Verify the conversation belongs to the authenticated user
    if (user_id !== authenticatedUserID) {
      return res
        .status(403)
        .json({ error: "Access denied to this conversation" });
    }

    // Build conversation history for context
    const recentMessages = conversation.messages
      .slice(-6) // Get last 6 messages for context
      .map((msg) => `${msg.sender}: ${msg.message}`)
      .join("\n");

    const contextualMessage = `Recent conversation history:
${recentMessages}

Current user message: ${user_message}`;

    // Check if user has Plaid data for context
    const plaidUsers = await plaidUsersDb.getByUserID(user_id);
    const userContext = {
      hasPlaidData: plaidUsers && plaidUsers.length > 0,
      transactionData:
        plaidUsers.length > 0
          ? await plaid.getTransactionByUserID(plaidUsers[0].user_id)
          : null,
    };    // Generate AI response with conversation context
    const aiResponse = await botConversationsDb.generateAIResponse(
      contextualMessage,
      userContext,
      user_id
    );

    logger.info(`${TAG}: AI response received: ${aiResponse ? aiResponse.substring(0, 100) + '...' : 'EMPTY RESPONSE'}`);

    // Validate the response
    if (!aiResponse || aiResponse.trim() === '') {
      logger.error(`${TAG}: Empty AI response received for conversation ${conversation_id}`);
      return res.status(500).json({ 
        error: "Failed to generate response",
        message: "I'm sorry, I'm having trouble generating a response right now. Please try again."
      });
    }

    // Add AI response to the conversation
    const newMessage = await botConversationsDb.addMessageToConversation(
      conversation_id,
      aiResponse,
      "bot"
    );

    logger.info(
      `${TAG}: Generated AI response for conversation ${conversation_id}`
    );

    res.json({
      success: true,
      message: aiResponse,
      message_data: newMessage,
    });
  } catch (error) {
    logger.error(`${TAG} Error generating chat response: ${error.message}`);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

module.exports = router;
