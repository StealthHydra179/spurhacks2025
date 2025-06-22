const axios = require("axios");
require("dotenv").config();

/**
 * Generate insights using GPT-4o-mini based on transaction data
 * @param {Array} transactions - Array of transaction objects
 * @param {string} prompt - Custom prompt to send to the model
 * @param {string} apiKey - OpenAI API key (optional, can use environment variable)
 * @returns {Promise<Object>} Response from OpenAI API
 */
async function generateInsights(transactions, prompt, apiKey = null) {
  try {
    // Use provided API key or fall back to environment variable
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error(
        "OpenAI API key is required. Please provide it as a parameter or set OPENAI_API_KEY environment variable."
      );
    }

    // Concatenate transactions into a string
    const transactionsText = transactions
      .map((transaction) => {
        // Assuming transaction objects have properties like amount, description, date, etc.
        // Adjust this based on your actual transaction structure
        return JSON.stringify(transaction);
      })
      .join("\n");

    // Combine the custom prompt with the transactions data
    const fullPrompt = `${prompt}\n\nTransaction Data:\n${transactionsText}`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1",
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
      insights: response.data.choices[0].message.content,
    };
  } catch (error) {
    console.error("Error generating insights:", error.message);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

/**
 * Categorize a transaction using GPT-4o-mini into one of 8 budget categories
 * @param {Object} transaction - Transaction object from Plaid
 * @param {string} apiKey - OpenAI API key (optional, can use environment variable)
 * @returns {Promise<string>} Categorized budget category
 */
async function categorizeTransaction(transaction, apiKey = null) {
  try {
    throw new Error(
      "LLM categorization is currently disabled. Please use the fallback categorization method instead."
    );
  } catch (error) {
    console.error("Error categorizing transaction with LLM:", error.message);
    // Fallback to default categorization
    return categorizeTransactionFallback(transaction);
  }
}

async function llmCategorizeTransaction(transaction, apiKey = null) {
  // Use provided API key or fall back to environment variable
  const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error(
      "OpenAI API key is required. Please provide it as a parameter or set OPENAI_API_KEY environment variable."
    );
  }

  const prompt = `Categorize this transaction into one of these 8 budget categories:

Transaction: ${transaction.name}
Amount: $${transaction.amount}
Date: ${transaction.date}
Original Category: ${
    transaction.personal_finance_category?.primary ||
    transaction.category?.[0] ||
    "Unknown"
  }

Budget Categories:
1. Housing & Utilities - rent, mortgage, electricity, water, internet, property tax, etc.
2. Food & Dining - groceries, restaurants, coffee, delivery, etc.
3. Transportation - gas, car payments, maintenance, public transit, rideshare, etc.
4. Health & Insurance - medical bills, prescriptions, insurance premiums, etc.
5. Personal & Lifestyle - clothing, grooming, gym, hobbies, subscriptions, etc.
6. Entertainment & Leisure - streaming, movies, events, travel, vacations, etc.
7. Financial & Savings - debt payments, savings, investments, taxes, etc.
8. Gifts & Donations - charitable giving, gifts for others, event contributions, etc.

Respond with ONLY the category name (e.g., "Housing & Utilities", "Food & Dining", etc.).`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.1, // Low temperature for consistent categorization
    },
    {
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const aiResponse = response.data.choices[0].message.content.trim();

  // Extract the category from the AI response
  const categoryMatch = aiResponse.match(
    /(Housing & Utilities|Food & Dining|Transportation|Health & Insurance|Personal & Lifestyle|Entertainment & Leisure|Financial & Savings|Gifts & Donations)/i
  );

  if (categoryMatch) {
    return categoryMatch[1];
  }

  // Fallback to default categorization if AI response is unclear
  return categorizeTransactionFallback(transaction);
}

/**
 * Fallback categorization function using hardcoded rules
 * @param {Object} transaction - Transaction object from Plaid
 * @returns {string} Categorized budget category
 */
function categorizeTransactionFallback(transaction) {
  const category =
    transaction.personal_finance_category?.primary?.toLowerCase() ||
    transaction.category?.[0]?.toLowerCase() ||
    "";
  const transactionName = transaction.name.toLowerCase();

  // Map transaction categories to budget categories
  if (
    category.includes("food") ||
    category.includes("dining") ||
    category.includes("restaurant") ||
    category.includes("grocery") ||
    category.includes("meal") ||
    transactionName.includes("restaurant") ||
    transactionName.includes("cafe") ||
    transactionName.includes("starbucks") ||
    transactionName.includes("mcdonalds") ||
    transactionName.includes("uber eats") ||
    transactionName.includes("doordash") ||
    transactionName.includes("grubhub") ||
    transactionName.includes("pizza") ||
    transactionName.includes("subway") ||
    transactionName.includes("chipotle")
  ) {
    return "Food & Dining";
  } else if (
    category.includes("transport") ||
    category.includes("car") ||
    category.includes("gas") ||
    category.includes("uber") ||
    category.includes("lyft") ||
    category.includes("parking") ||
    category.includes("public") ||
    category.includes("bus") ||
    category.includes("train") ||
    transactionName.includes("shell") ||
    transactionName.includes("exxon") ||
    transactionName.includes("chevron") ||
    transactionName.includes("bp") ||
    transactionName.includes("parking") ||
    transactionName.includes("metro") ||
    transactionName.includes("amtrak") ||
    transactionName.includes("taxi")
  ) {
    return "Transportation";
  } else if (
    category.includes("health") ||
    category.includes("medical") ||
    category.includes("doctor") ||
    category.includes("pharmacy") ||
    category.includes("dental") ||
    category.includes("vision") ||
    category.includes("hospital") ||
    category.includes("insurance") ||
    transactionName.includes("cvs") ||
    transactionName.includes("walgreens") ||
    transactionName.includes("rite aid") ||
    transactionName.includes("kroger pharmacy") ||
    transactionName.includes("doctor") ||
    transactionName.includes("dentist") ||
    transactionName.includes("hospital") ||
    transactionName.includes("clinic")
  ) {
    return "Health & Insurance";
  } else if (
    category.includes("utility") ||
    category.includes("electric") ||
    category.includes("water") ||
    category.includes("gas") ||
    category.includes("internet") ||
    category.includes("phone") ||
    category.includes("cable") ||
    category.includes("waste") ||
    category.includes("rent") ||
    category.includes("mortgage") ||
    category.includes("property") ||
    transactionName.includes("comcast") ||
    transactionName.includes("verizon") ||
    transactionName.includes("at&t") ||
    transactionName.includes("t-mobile") ||
    transactionName.includes("sprint") ||
    transactionName.includes("spectrum") ||
    transactionName.includes("duke energy") ||
    transactionName.includes("pg&e")
  ) {
    return "Housing & Utilities";
  } else if (
    category.includes("clothing") ||
    category.includes("apparel") ||
    category.includes("grooming") ||
    category.includes("gym") ||
    category.includes("fitness") ||
    category.includes("hobby") ||
    category.includes("subscription") ||
    category.includes("personal") ||
    transactionName.includes("target") ||
    transactionName.includes("walmart") ||
    transactionName.includes("amazon") ||
    transactionName.includes("ebay") ||
    transactionName.includes("nike") ||
    transactionName.includes("adidas") ||
    transactionName.includes("apple store") ||
    transactionName.includes("best buy") ||
    transactionName.includes("home depot") ||
    transactionName.includes("lowes")
  ) {
    return "Personal & Lifestyle";
  } else if (
    category.includes("entertainment") ||
    category.includes("movie") ||
    category.includes("theater") ||
    category.includes("sport") ||
    category.includes("game") ||
    category.includes("travel") ||
    category.includes("vacation") ||
    category.includes("leisure") ||
    transactionName.includes("netflix") ||
    transactionName.includes("spotify") ||
    transactionName.includes("hulu") ||
    transactionName.includes("disney") ||
    transactionName.includes("amc") ||
    transactionName.includes("regal") ||
    transactionName.includes("game stop") ||
    transactionName.includes("steam") ||
    transactionName.includes("playstation") ||
    transactionName.includes("xbox")
  ) {
    return "Entertainment & Leisure";
  } else if (
    category.includes("financial") ||
    category.includes("savings") ||
    category.includes("investment") ||
    category.includes("debt") ||
    category.includes("loan") ||
    category.includes("tax") ||
    category.includes("bank") ||
    category.includes("credit")
  ) {
    return "Financial & Savings";
  } else if (
    category.includes("gift") ||
    category.includes("donation") ||
    category.includes("charity") ||
    category.includes("contribution") ||
    category.includes("fundraiser")
  ) {
    return "Gifts & Donations";
  }

  // Default to Personal & Lifestyle for uncategorized transactions
  return "Personal & Lifestyle";
}

/**
 * Categorize multiple transactions using LLM
 * @param {Array} transactions - Array of transaction objects
 * @param {string} apiKey - OpenAI API key (optional, can use environment variable)
 * @returns {Promise<Array>} Array of transactions with categorized budget_category field
 */
async function categorizeTransactions(transactions, apiKey = null) {
  try {
    const categorizedTransactions = [];

    for (const transaction of transactions) {
      const budgetCategory = await categorizeTransaction(transaction, apiKey);

      // Add the categorized budget category to the transaction
      const categorizedTransaction = {
        ...transaction,
        budget_category: budgetCategory,
      };

      categorizedTransactions.push(categorizedTransaction);
    }

    return categorizedTransactions;
  } catch (error) {
    console.error("Error categorizing transactions:", error.message);
    // Return transactions with fallback categorization
    return transactions.map((transaction) => ({
      ...transaction,
      budget_category: categorizeTransactionFallback(transaction),
    }));
  }
}

// Mock transaction data for testing
const mockTransactions = [
  {
    id: 1,
    amount: 25.5,
    description: "Starbucks Coffee",
    date: "2024-01-15",
    category: "Food & Drink",
  },
  {
    id: 2,
    amount: 89.99,
    description: "Whole Foods Market",
    date: "2024-01-16",
    category: "Groceries",
  },
  {
    id: 3,
    amount: 45.0,
    description: "Uber Ride",
    date: "2024-01-17",
    category: "Transportation",
  },
  {
    id: 4,
    amount: 120.0,
    description: "Amazon.com",
    date: "2024-01-18",
    category: "Shopping",
  },
  {
    id: 5,
    amount: 15.75,
    description: "McDonald's",
    date: "2024-01-19",
    category: "Food & Drink",
  },
];

// Test the function if this file is run directly
if (require.main === module) {
  console.log("🧪 Testing generateInsights function...\n");

  const customPrompt = `Analyze these transactions and provide actionable financial insights. 
  Format your response as itemized insights with each insight on a single line. 
  Each insight should be a specific, actionable piece of advice based on the transaction patterns. 
  Focus on spending habits, budgeting opportunities, and financial optimization. 
  Do not include explanations or categories - just list the insights one per line. 
  The insights should contain specific examples from the user's transactions. Make sure
  to not make up random numbers in the insights. If you provide numbers, 
  make sure to justify them with the transaction data. You should draw reasonable 
  conclusions from the transaction data, and not use single transactions to draw conclusions.
  You should look at patterns in the spending and not just single transactions. Based on
  the nature of the merchant and timing of the transaction, you may classify some transactions
  as impulse buys and generate an insight about that. If an insight says that the user could 
  save a certain amount of money, provide specific calculations to justify the amount. Each insight should be at least 3 sentences long.`;

  generateInsights(mockTransactions, customPrompt)
    .then((result) => {
      if (result.success) {
        console.log("Success! Here are the insights:");
        console.log("=".repeat(50));
        console.log(result.insights);
        console.log("=".repeat(50));
      } else {
        console.log("Error:", result.error);
      }
    })
    .catch((error) => {
      console.error("Test failed:", error.message);
    });
}

module.exports = {
  generateInsights,
  categorizeTransaction,
  categorizeTransactionFallback,
  categorizeTransactions,
  mockTransactions,
};
