const { Configuration, PlaidApi, PlaidEnvironments} = require('plaid');
const { logger } = require('../logger');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const TAG = 'plaid';

// Plaid client configuration - using localhost:8000 as the Plaid server
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use lowercase 'sandbox'
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
 * Helper function to log Plaid API errors comprehensively
 */
function logPlaidError(error, operation, userId = null) {
  const userInfo = userId ? ` for user ${userId}` : '';
  logger.error(`${TAG} Error in ${operation}${userInfo}:`);
  logger.error(`${TAG} Error message: ${error.message}`);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    logger.error(`${TAG} Plaid API Error Response:`);
    logger.error(`${TAG} Status: ${error.response.status}`);
    logger.error(`${TAG} Status Text: ${error.response.statusText}`);
    logger.error(`${TAG} Headers:`, error.response.headers);
    logger.error(`${TAG} Data:`, JSON.stringify(error.response.data, null, 2));
    
    // Log specific Plaid error details if available
    if (error.response.data && error.response.data.error_code) {
      logger.error(`${TAG} Plaid Error Code: ${error.response.data.error_code}`);
      logger.error(`${TAG} Plaid Error Type: ${error.response.data.error_type}`);
      logger.error(`${TAG} Plaid Display Message: ${error.response.data.display_message}`);
      logger.error(`${TAG} Plaid Suggested Action: ${error.response.data.suggested_action}`);
    }
  } else if (error.request) {
    // The request was made but no response was received
    logger.error(`${TAG} No response received from Plaid API`);
    logger.error(`${TAG} Request details:`, error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    logger.error(`${TAG} Error setting up request: ${error.message}`);
  }
  
  // Log the full error stack trace for debugging
  logger.error(`${TAG} Full error stack:`, error.stack);
}

/**
 * Step 1: Create a link token for Plaid Link
 */
async function createLinkToken(userId) {
  try {
    logger.info(`${TAG} Creating link token for user ${userId}`);
    
    // Log environment variables for debugging (without exposing secrets)
    logger.info(`${TAG} PLAID_CLIENT_ID exists: ${!!process.env.PLAID_CLIENT_ID}`);
    logger.info(`${TAG} PLAID_SECRET exists: ${!!process.env.PLAID_SECRET}`);
    
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

    logger.info(`${TAG} Request payload:`, JSON.stringify(request, null, 2));
    const createTokenResponse = await client.linkTokenCreate(request);
    
    logger.info(`${TAG} Link token created successfully for user ${userId}`);
    logger.info(`${TAG} Response:`, JSON.stringify(createTokenResponse.data, null, 2));
    return createTokenResponse.data;
  } catch (error) {
    logPlaidError(error, 'creating link token', userId);
    throw error;
  }
}

/**
 * Step 3: Exchange public token for access token
 */
async function exchangePublicToken(publicToken, userId) {
  try {
    logger.info(`${TAG} Exchanging public token for user ${userId}`);
    logger.info(`${TAG} Public token (first 10 chars): ${publicToken.substring(0, 10)}...`);
    
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Store the access token (in production, save to database)
    accessTokens.set(userId, { accessToken, itemId });

    logger.info(`${TAG} Public token exchanged successfully for user ${userId}, item ${itemId}`);
    logger.info(`${TAG} Access token (first 10 chars): ${accessToken.substring(0, 10)}...`);
    
    return {
      access_token: accessToken,
      item_id: itemId,
    };
  } catch (error) {
    logPlaidError(error, 'exchanging public token', userId);
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

/**
 * Check if a user has a linked Plaid Item
 */
function hasLinkedItem(userId) {
  return accessTokens.has(userId);
}

/**
 * Get the item ID for a user
 */
function getItemId(userId) {
  const userTokens = accessTokens.get(userId);
  return userTokens ? userTokens.itemId : null;
}

/**
 * Test Plaid configuration and connectivity
 */
async function testPlaidConfiguration() {
  try {
    logger.info(`${TAG} Testing Plaid configuration...`);
    
    // Check environment variables
    if (!process.env.PLAID_CLIENT_ID) {
      throw new Error('PLAID_CLIENT_ID environment variable is not set');
    }
    if (!process.env.PLAID_SECRET) {
      throw new Error('PLAID_SECRET environment variable is not set');
    }
    
    logger.info(`${TAG} Environment variables are set correctly`);
    logger.info(`${TAG} Using Plaid environment: sandbox`);
    
    // Test a simple API call to verify connectivity
    const testRequest = {
      user: {
        client_user_id: 'test-user',
      },
      client_name: 'Test App',
      products: ['auth'],
      language: 'en',
      country_codes: ['US'],
    };
    
    logger.info(`${TAG} Testing API connectivity with link token creation...`);
    const response = await client.linkTokenCreate(testRequest);
    
    logger.info(`${TAG} ✅ Plaid configuration test successful!`);
    logger.info(`${TAG} Link token created: ${response.data.link_token.substring(0, 10)}...`);
    
    return {
      success: true,
      message: 'Plaid configuration is working correctly',
      link_token: response.data.link_token
    };
  } catch (error) {
    logPlaidError(error, 'testing Plaid configuration');
    return {
      success: false,
      message: 'Plaid configuration test failed',
      error: error.message
    };
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
  testPlaidConfiguration,
  hasLinkedItem,
  getItemId,
};