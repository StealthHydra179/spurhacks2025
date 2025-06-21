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
        model: "gpt-4o-mini",
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
        console.log("✅ Success! Here are the insights:");
        console.log("=".repeat(50));
        console.log(result.insights);
        console.log("=".repeat(50));
      } else {
        console.log("❌ Error:", result.error);
      }
    })
    .catch((error) => {
      console.error("❌ Test failed:", error.message);
    });
}

module.exports = {
  generateInsights,
  mockTransactions,
};
