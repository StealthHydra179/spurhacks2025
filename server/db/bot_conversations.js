const { sql } = require("./db");
const OpenAI = require("openai");
const { logger } = require("../logger");
const usersDb = require("./users");

const TAG = "bot_conversations";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function format(transactionData) {
    // keep the following elements
    // original amount
    //transaction time
    //category primary
    //payment chanel
    //currency code
    //location

    return transactionData.map((transaction) => {
        return {
            original_amount: transaction.original_amount || 0,
            transaction_time: transaction.transaction_time
                ? new Date(transaction.transaction_time).toISOString()
                : null,
            category_primary: transaction.category_primary || "Uncategorized",
            payment_channel: transaction.payment_channel || "Unknown",
            iso_currency_code: transaction.iso_currency_code || "USD",
            location: transaction.location || "Unknown",
        };
    });
}

/**
 * Generate AI response using OpenAI GPT-4 mini
 */
async function generateAIResponse(userMessage, userContext = {}, userId = null) {
  try {
    // Get user personality mode from database
    let personalityMode = 0; // Default to normal
    let personalityDescription = "";
    
    if (userId) {
      try {
        personalityMode = await usersDb.getUserPersonality(userId);
        if (personalityMode === null) {
          personalityMode = 0; // Default to normal if no personality found
        }
      } catch (error) {
        logger.warn(`${TAG} Could not fetch personality for user ${userId}: ${error.message}`);
        personalityMode = 0;
      }
    }

    // Set personality description and behavior based on mode
    switch (personalityMode) {
      case -1:
        personalityDescription = `You should be GENTLE and ENCOURAGING in your financial advice. 
Be supportive and understanding about financial mistakes. Use softer language like "consider" and "might want to" instead of direct commands.
Focus on small, achievable steps and celebrate any progress the user makes.
Be empathetic about financial stress and provide reassurance along with advice.`;
        break;
      case 1:
        personalityDescription = `You should be MORE DIRECT and ASSERTIVE in your financial advice.
Use stronger language and be more firm about financial decisions that need to be made.
Point out financial mistakes clearly and provide direct action items.
Be more urgent about addressing poor financial habits, but remain helpful and supportive.
Use phrases like "you need to" and "you should immediately" when appropriate.`;
        break;
      case 0:
      default:
        personalityDescription = `You should be BALANCED in your approach - neither too gentle nor too aggressive.
Provide clear, practical advice while being understanding of the user's situation.
Use a friendly but informative tone that encourages good financial habits.`;
        break;
    }

    const systemPrompt = `You are Capy, a capybara financial assistant for the CapySpend app. 
You help users manage their finances, understand their spending patterns, and make better financial decisions.
Be conversational, supportive, and provide actionable advice.
Keep responses concise but helpful.
If you need specific financial data to answer a question, let the user know what information would be helpful.

PERSONALITY MODE: ${personalityDescription}

IMPORTANT: Format your responses using Markdown for better readability:
- Use **bold text** for emphasis on important points
- Use *italic text* for financial terms or concepts  
- Use bullet points (- or *) for lists of tips or suggestions
- Use numbered lists (1., 2., etc.) for step-by-step instructions
- Use \`code formatting\` for specific dollar amounts or percentages
- Use ### headings for organizing longer responses into sections

Examples of good formatting:
- "I recommend **reducing your dining out budget** by \`$50\` per month"
- "Here are *three key strategies* for building an emergency fund:"

When you first respond to a user, introduce yourself as Capy and explain that you are here to help them with their finances.
Mention that you are not a financial advisor, but you can provide general financial tips and advice based on the user's spending habits and financial goals.


Recent Transaction Data (postive is an outflow of money, negative is an inflow):
${JSON.stringify(format(userContext.transactionData))}

`;

    // const formatTransactionData = (transactions) => {
    //       if (!transactions || transactions.length === 0) {
    //         return 'No transaction data available.';
    //       }

    //       // Format recent transactions for AI analysis
    //     //   const recentTransactions = transactions.slice(0, 10); // Last 10 transactions
    //     //   return recentTransactions.map(t =>
    //     //     `Date: ${t.transaction_time?.toISOString().split('T')[0] || 'Unknown'}, ` +
    //     //     `Amount: $${Math.abs(t.amount || 0).toFixed(2)}, ` +
    //     //     `Merchant: ${t.merchant_name || 'Unknown'}, ` +
    //     //     `Category: ${t.category_primary || 'Unknown'}, ` +
    //     //     `Account: ${t.account_name || 'Unknown'}`
    //     //   ).join('\n');
    //         return transactions
    //     };

    const userPrompt = `User question: ${userMessage}
    
Context: The user is using CapySpend, a personal finance app that connects to their bank accounts via Plaid.
${
  userContext.hasPlaidData
    ? "The user has connected their bank accounts."
    : "The user may not have connected their bank accounts yet."
}

Please provide a helpful response.`;
    logger.info(
      `${TAG} Generating AI response for user message: ${userMessage}`
    );
    logger.info(`${TAG} User has Plaid data: ${userContext.hasPlaidData}`);
    if (userContext.transactionData && userContext.transactionData.length > 0) {
      logger.info(
        `${TAG} Using ${userContext.transactionData.length} transactions for context`
      );
    }
    logger.info(`${TAG} systemPrompt: ${systemPrompt}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logger.error(`${TAG} Error generating AI response: ${error.message}`);
    return "I'm sorry, I'm having trouble generating a response right now. Please try again later, or feel free to ask me about your finances and spending habits!";
  }
}

async function getByID(id) {
  return await sql`SELECT * FROM bot_conversations WHERE id = ${id}`;
}

async function getUserConversations(userID) {
  return await sql`SELECT * FROM bot_conversations WHERE user_id = ${userID}`;
}

async function getFullConversation(conversationID) {
  const summary = await getByID(conversationID);
  const messages =
    await sql`SELECT * FROM conversation_message WHERE conversation_id = ${conversationID}`;
  return { summary: summary, messages: messages };
}

async function createConversation(userID, summary) {
  const result = await sql`
        INSERT INTO bot_conversations (user_id, summary, create_timestamp)
        VALUES (${userID}, ${summary}, NOW())
        RETURNING id, user_id, summary, create_timestamp
    `;
  return result[0];
}

async function addMessageToConversation(conversationID, message, sender) {
  // Get the highest message_number for this conversation
  const maxMessageResult = await sql`
        SELECT COALESCE(MAX(message_number), 0) as max_message_number 
        FROM conversation_message 
        WHERE conversation_id = ${conversationID}
    `;

  const nextMessageNumber = maxMessageResult[0].max_message_number + 1;

  // Insert the new message
  const result = await sql`
        INSERT INTO conversation_message (conversation_id, message, message_number, sender, message_timestamp)
        VALUES (${conversationID}, ${message}, ${nextMessageNumber}, ${sender}, NOW())
        RETURNING id, conversation_id, message, message_number, sender, message_timestamp
    `;

  return result[0];
}

module.exports = {
  getByID: getByID,
  getUserConversations: getUserConversations,
  getFullConversation: getFullConversation,
  createConversation: createConversation,
  addMessageToConversation: addMessageToConversation,
  generateAIResponse: generateAIResponse,
};
