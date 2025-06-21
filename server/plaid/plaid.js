const { Configuration, PlaidApi } = require('plaid');
const { logger } = require('../logger');

const TAG = 'plaid';

// Plaid client configuration - using localhost:8000 as the Plaid server
const configuration = new Configuration({
  basePath: 'http://localhost:8000', // Custom Plaid server
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

// Store access tokens temporarily (in production, use a proper database)
const accessTokens = new Map();

/**
 * Step 1: Create a link token for Plaid Link
 */
async function createLinkToken(userId) {
  try {
    const request = {
      user: {
        client_user_id: userId.toString(),
      },
      client_name: 'CappySpend App',
      products: ['auth', 'transactions'],
      language: 'en',
      country_codes: ['US'],
    //   webhook: process.env.PLAID_WEBHOOK_URL || 'https://webhook.example.com',
    };

    const createTokenResponse = await client.linkTokenCreate(request);
    logger.info(`${TAG} Link token created for user ${userId}`);
    return createTokenResponse.data;
  } catch (error) {
    logger.error(`${TAG} Error creating link token: ${error.message}`);
    throw error;
  }
}

/**
 * Step 3: Exchange public token for access token
 */
async function exchangePublicToken(publicToken, userId) {
  try {
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Store the access token (in production, save to database)
    accessTokens.set(userId, { accessToken, itemId });

    logger.info(`${TAG} Public token exchanged for user ${userId}, item ${itemId}`);
    
    return {
      access_token: accessToken,
      item_id: itemId,
    };
  } catch (error) {
    logger.error(`${TAG} Error exchanging public token: ${error.message}`);
    throw error;
  }
}

/**
 * Step 4: Get account information
 */
async function getAccounts(userId) {
  try {
    const userTokens = accessTokens.get(userId);
    if (!userTokens) {
      throw new Error('No access token found for user');
    }

    const accountsResponse = await client.accountsGet({
      access_token: userTokens.accessToken,
    });

    logger.info(`${TAG} Retrieved accounts for user ${userId}`);
    return accountsResponse.data;
  } catch (error) {
    logger.error(`${TAG} Error getting accounts: ${error.message}`);
    throw error;
  }
}

/**
 * Get transactions for a user
 */
async function getTransactions(userId, startDate, endDate) {
  try {
    const userTokens = accessTokens.get(userId);
    if (!userTokens) {
      throw new Error('No access token found for user');
    }

    const request = {
      access_token: userTokens.accessToken,
      start_date: startDate || '2020-01-01',
      end_date: endDate || new Date().toISOString().split('T')[0],
    };

    const transactionsResponse = await client.transactionsGet(request);
    logger.info(`${TAG} Retrieved transactions for user ${userId}`);
    return transactionsResponse.data;
  } catch (error) {
    logger.error(`${TAG} Error getting transactions: ${error.message}`);
    throw error;
  }
}

/**
 * Get account balances
 */
async function getBalances(userId) {
  try {
    const userTokens = accessTokens.get(userId);
    if (!userTokens) {
      throw new Error('No access token found for user');
    }

    const balanceResponse = await client.accountsBalanceGet({
      access_token: userTokens.accessToken,
    });

    logger.info(`${TAG} Retrieved balances for user ${userId}`);
    return balanceResponse.data;
  } catch (error) {
    logger.error(`${TAG} Error getting balances: ${error.message}`);
    throw error;
  }
}

/**
 * Get identity information
 */
async function getIdentity(userId) {
  try {
    const userTokens = accessTokens.get(userId);
    if (!userTokens) {
      throw new Error('No access token found for user');
    }

    const identityResponse = await client.identityGet({
      access_token: userTokens.accessToken,
    });

    logger.info(`${TAG} Retrieved identity for user ${userId}`);
    return identityResponse.data;
  } catch (error) {
    logger.error(`${TAG} Error getting identity: ${error.message}`);
    throw error;
  }
}

/**
 * Remove an item (disconnect bank account)
 */
async function removeItem(userId) {
  try {
    const userTokens = accessTokens.get(userId);
    if (!userTokens) {
      throw new Error('No access token found for user');
    }

    await client.itemRemove({
      access_token: userTokens.accessToken,
    });

    // Remove from local storage
    accessTokens.delete(userId);

    logger.info(`${TAG} Item removed for user ${userId}`);
    return { message: 'Item removed successfully' };
  } catch (error) {
    logger.error(`${TAG} Error removing item: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch all Plaid information for all connected users
 */
async function fetchPlaidInfo() {
  try {
    logger.info(`${TAG} Starting to fetch Plaid information for all users`);
    
    if (accessTokens.size === 0) {
      logger.info(`${TAG} No connected users found`);
      return { message: 'No connected users found' };
    }

    const results = {};
    
    for (const [userId, tokenData] of accessTokens.entries()) {
      try {
        logger.info(`${TAG} Fetching data for user ${userId}`);
        
        // Fetch accounts, balances, and recent transactions
        const [accounts, balances, transactions] = await Promise.all([
          getAccounts(userId),
          getBalances(userId),
          getTransactions(userId, getDateDaysAgo(30), getCurrentDate())
        ]);

        results[userId] = {
          accounts: accounts.accounts,
          balances: balances.accounts,
          transactions: transactions.transactions,
          totalTransactions: transactions.total_transactions,
          fetchedAt: new Date().toISOString()
        };

        logger.info(`${TAG} Successfully fetched data for user ${userId}: ${accounts.accounts.length} accounts, ${transactions.transactions.length} transactions`);
      } catch (error) {
        logger.error(`${TAG} Error fetching data for user ${userId}: ${error.message}`);
        results[userId] = { error: error.message };
      }
    }

    logger.info(`${TAG} Completed fetching Plaid information for ${Object.keys(results).length} users`);
    return results;
  } catch (error) {
    logger.error(`${TAG} Error in fetchPlaidInfo: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch last day's transactions for all users
 */
async function fetchLastDayPlaidInfo() {
  try {
    logger.info(`${TAG} Fetching last day's Plaid information`);
    
    if (accessTokens.size === 0) {
      logger.info(`${TAG} No connected users found`);
      return { message: 'No connected users found' };
    }

    const results = {};
    const yesterday = getDateDaysAgo(1);
    const today = getCurrentDate();
    
    for (const [userId, tokenData] of accessTokens.entries()) {
      try {
        const transactions = await getTransactions(userId, yesterday, today);
        results[userId] = {
          transactions: transactions.transactions,
          count: transactions.transactions.length,
          dateRange: { start: yesterday, end: today },
          fetchedAt: new Date().toISOString()
        };
        
        logger.info(`${TAG} Fetched ${transactions.transactions.length} transactions for user ${userId} from last day`);
      } catch (error) {
        logger.error(`${TAG} Error fetching last day data for user ${userId}: ${error.message}`);
        results[userId] = { error: error.message };
      }
    }

    return results;
  } catch (error) {
    logger.error(`${TAG} Error in fetchLastDayPlaidInfo: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch all transactions for all users
 */
async function fetchAllTransactionsPlaid() {
  try {
    logger.info(`${TAG} Fetching all transactions for all users`);
    
    if (accessTokens.size === 0) {
      logger.info(`${TAG} No connected users found`);
      return { message: 'No connected users found' };
    }

    const results = {};
    
    for (const [userId, tokenData] of accessTokens.entries()) {
      try {
        // Fetch transactions from 2 years ago to today
        const startDate = getDateDaysAgo(730); // ~2 years
        const endDate = getCurrentDate();
        
        const transactions = await getTransactions(userId, startDate, endDate);
        results[userId] = {
          transactions: transactions.transactions,
          totalTransactions: transactions.total_transactions,
          dateRange: { start: startDate, end: endDate },
          fetchedAt: new Date().toISOString()
        };
        
        logger.info(`${TAG} Fetched ${transactions.transactions.length} total transactions for user ${userId}`);
      } catch (error) {
        logger.error(`${TAG} Error fetching all transactions for user ${userId}: ${error.message}`);
        results[userId] = { error: error.message };
      }
    }

    return results;
  } catch (error) {
    logger.error(`${TAG} Error in fetchAllTransactionsPlaid: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to get date N days ago
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Helper function to get current date
 */
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get summary of all connected users and their data
 */
async function getPlaidSummary() {
  try {
    if (accessTokens.size === 0) {
      return { connectedUsers: 0, message: 'No users connected' };
    }

    const summary = {
      connectedUsers: accessTokens.size,
      users: {}
    };

    for (const [userId, tokenData] of accessTokens.entries()) {
      try {
        const accounts = await getAccounts(userId);
        summary.users[userId] = {
          itemId: tokenData.itemId,
          accountCount: accounts.accounts.length,
          accountTypes: [...new Set(accounts.accounts.map(acc => acc.type))],
          connectedAt: new Date().toISOString()
        };
      } catch (error) {
        summary.users[userId] = { error: error.message };
      }
    }

    return summary;
  } catch (error) {
    logger.error(`${TAG} Error getting Plaid summary: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getTransactions,
  getBalances,
  getIdentity,
  removeItem,
  fetchPlaidInfo,
  fetchLastDayPlaidInfo,
  fetchAllTransactionsPlaid,
  getPlaidSummary,
};