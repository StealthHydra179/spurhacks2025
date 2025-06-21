const express = require('express');
const router = express.Router();
const plaid = require('../../plaid/plaid');
const { logger } = require('../../logger');
const plaidUsersDb = require('../../db/plaid_users');

const TAG = 'plaid_routes';

/**
 * POST /api/plaid/create_link_token
 * Step 1: Create a link token for Plaid Link initialization
 */
router.post('/create_link_token', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const linkTokenData = await plaid.createLinkToken(user_id);
    res.json(linkTokenData);
  } catch (error) {
    logger.error(`${TAG} Error creating link token: ${error.message}`);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

/**
 * POST /api/plaid/exchange_public_token
 * Step 3: Exchange public token for permanent access token
 */
router.post('/exchange_public_token', async (req, res) => {
  try {
    const { public_token, user_id } = req.body;
    
    if (!public_token || !user_id) {
      return res.status(400).json({ error: 'Public token and user ID are required' });
    }    
    
    const tokenData = await plaid.exchangePublicToken(public_token, user_id);
    
    // Store access token in plaid_users table (users can have multiple access tokens)
    const plaidUser = await plaidUsersDb.createAccessToken(user_id, tokenData.access_token);
    logger.info(`${TAG}: Created new plaid_user record ${plaidUser.id} with access token for user ${user_id}`);
    
    res.json({ 
      message: 'Public token exchange complete',
      item_id: tokenData.item_id,
      plaid_user_id: plaidUser.id
    });

    
    } catch (error) {
    logger.error(`${TAG} Error exchanging public token: ${error.message}`);
    res.status(500).json({ error: 'Failed to exchange public token' });
  }
});

/**
 * GET /api/plaid/accounts/:user_id
 * Step 4: Get account information for a user
 */
router.get('/accounts/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const accountsData = await plaid.getAccounts(user_id);
    res.json(accountsData);
  } catch (error) {
    logger.error(`${TAG} Error getting accounts: ${error.message}`);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

/**
 * GET /api/plaid/transactions/:user_id
 * Get transactions for a user
 */
router.get('/transactions/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { start_date, end_date } = req.query;
    
    logger.info(`${TAG} Getting transactions for user ${user_id}`);
    logger.info(`${TAG} Date range: ${start_date || 'default'} to ${end_date || 'default'}`);
    
    const transactionsData = await plaid.syncTransactions(user_id, start_date, end_date);
    
    // Log the response structure and transaction count
    logger.info(`${TAG} Transactions API response received for user ${user_id}`);
    logger.info(`${TAG} Response structure:`, JSON.stringify({
      has_transactions: !!transactionsData.transactions,
      transaction_count: transactionsData.transactions ? transactionsData.transactions.length : 0,
      accounts_count: transactionsData.accounts ? transactionsData.accounts.length : 0,
      total_transactions: transactionsData.total_transactions || 0,
      request_id: transactionsData.request_id || 'N/A'
    }, null, 2));
    
    // Log first few transactions for debugging
    if (transactionsData.transactions && transactionsData.transactions.length > 0) {
      logger.info(`${TAG} Sample transactions for user ${user_id}:`);
      const sampleTransactions = transactionsData.transactions.slice(0, 3).map(t => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        category: t.category,
        pending: t.pending
      }));
      logger.info(`${TAG} Sample transactions:`, JSON.stringify(sampleTransactions, null, 2));
    } else {
      logger.info(`${TAG} No transactions found for user ${user_id}`);
    }
    
    res.json(transactionsData);
  } catch (error) {
    logger.error(`${TAG} Error getting transactions: ${error.message}`);
    logger.error(`${TAG} Full error details:`, error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// /**
//  * GET /api/plaid/balances/:user_id
//  * Get account balances for a user
//  */
// router.get('/balances/:user_id', async (req, res) => {
//   try {
//     const { user_id } = req.params;
    
//     const balancesData = await plaid.getBalances(user_id);
//     res.json(balancesData);
//   } catch (error) {
//     logger.error(`${TAG} Error getting balances: ${error.message}`);
//     res.status(500).json({ error: 'Failed to get balances' });
//   }
// });

// /**
//  * GET /api/plaid/identity/:user_id
//  * Get identity information for a user
//  */
// router.get('/identity/:user_id', async (req, res) => {
//   try {
//     const { user_id } = req.params;
    
//     const identityData = await plaid.getIdentity(user_id);
//     res.json(identityData);
//   } catch (error) {
//     logger.error(`${TAG} Error getting identity: ${error.message}`);
//     res.status(500).json({ error: 'Failed to get identity' });
//   }
// });

/**
 * GET /api/plaid/item-status/:user_id
 * Check if a user has a linked Plaid Item
 */
router.get('/item-status/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Log all stored access tokens
    plaid.logStoredAccessTokens();
    
    // Check if user has an access token stored (indicating a linked item)
    const hasLinkedItem = plaid.hasLinkedItem ? plaid.hasLinkedItem(user_id) : false;
    
    if (hasLinkedItem) {
      // If they have a linked item, try to get basic info to verify it's still valid
      try {
        const accountsData = await plaid.getAccounts(user_id);
        res.json({
          has_linked_item: true,
          item_id: plaid.getItemId ? plaid.getItemId(user_id) : null,
          account_count: accountsData.accounts ? accountsData.accounts.length : 0,
          last_verified: new Date().toISOString()
        });
      } catch (error) {
        // Item exists but might be invalid/expired
        res.json({
          has_linked_item: true,
          item_id: plaid.getItemId ? plaid.getItemId(user_id) : null,
          account_count: 0,
          status: 'invalid_or_expired',
          error: error.message,
          last_verified: new Date().toISOString()
        });
      }
    } else {
      res.json({
        has_linked_item: false,
        item_id: null,
        account_count: 0,
        last_checked: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error(`${TAG} Error checking item status for user ${req.params.user_id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to check item status' });
  }
});

/**
 * DELETE /api/plaid/item/:user_id
 * Remove/disconnect a bank account for a user
 */
router.delete('/item/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const result = await plaid.removeItem(user_id);
    res.json(result);
  } catch (error) {
    logger.error(`${TAG} Error removing item: ${error.message}`);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

/**
 * GET /api/plaid/summary
 * Get summary of all connected users and their Plaid data
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await plaid.getPlaidSummary();
    res.json(summary);
  } catch (error) {
    logger.error(`${TAG} Error getting Plaid summary: ${error.message}`);
    res.status(500).json({ error: 'Failed to get Plaid summary' });
  }
});

/**
 * POST /api/plaid/fetch-all
 * Manually trigger fetching all Plaid data for all users
 */
router.post('/fetch-all', async (req, res) => {
  try {
    logger.info(`${TAG} Manual fetch all Plaid data triggered`);
    const data = await plaid.fetchPlaidInfo();
    res.json({
      message: 'Plaid data fetch completed',
      data: data
    });
  } catch (error) {
    logger.error(`${TAG} Error in manual fetch all: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch all Plaid data' });
  }
});

/**
 * POST /api/plaid/fetch-recent
 * Manually trigger fetching last day's transactions for all users
 */
router.post('/fetch-recent', async (req, res) => {
  try {
    logger.info(`${TAG} Manual fetch recent transactions triggered`);
    const data = await plaid.fetchLastDayPlaidInfo();
    res.json({
      message: 'Recent transactions fetch completed',
      data: data
    });
  } catch (error) {
    logger.error(`${TAG} Error in manual fetch recent: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
});

/**
 * POST /api/plaid/fetch-all-transactions
 * Manually trigger fetching all transactions for all users
 */
router.post('/fetch-all-transactions', async (req, res) => {
  try {
    logger.info(`${TAG} Manual fetch all transactions triggered`);
    const data = await plaid.fetchAllTransactionsPlaid();
    res.json({
      message: 'All transactions fetch completed',
      data: data
    });
  } catch (error) {
    logger.error(`${TAG} Error in manual fetch all transactions: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch all transactions' });
  }
});

module.exports = router;
