const { sql } = require("./db");
const OpenAI = require("openai");
const { logger } = require("../logger");
const usersDb = require("./users");
const plaid = require("../plaid/plaid");
const savingsGoalsDb = require("./savings_goals");
const budgetsDb = require("./budgets");

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
  logger.info(`${TAG} transactionDATA: ${JSON.stringify(transactionData)}`)
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
            merchant_name: transaction.merchant_name || "Unknown",
        };
    });
}

function formatAccountBalances(accountsData) {
    // Format account balance data for AI context
    if (!accountsData || !accountsData.accounts) {
        return [];
    }
    
    logger.info(`${TAG} accountsData: ${JSON.stringify(accountsData)}`);
    return accountsData.accounts.map((account) => {
        return {
            account_name: account.name || "Unknown Account",
            account_type: account.type || "Unknown",
            account_subtype: account.subtype || "Unknown",
            current_balance: account.balances?.current || 0,
            available_balance: account.balances?.available || 0,
            currency_code: account.balances?.iso_currency_code || "USD",
            account_mask: account.mask || "****"
        };
    });
}

function formatSavingsGoals(goalsData) {
    // Format savings goals data for AI context
    if (!goalsData || goalsData.length === 0) {
        return [];
    }
    
    logger.info(`${TAG} goalsData: ${JSON.stringify(goalsData)}`);
    return goalsData.map((goal) => {
        const progressPercentage = goal.amount > 0 ? ((goal.current_amount || 0) / goal.amount * 100).toFixed(1) : 0;
        const remainingAmount = Math.max(0, goal.amount - (goal.current_amount || 0));
        
        // Calculate days until deadline
        let daysUntilDeadline = null;
        if (goal.deadline) {
            const deadlineDate = new Date(goal.deadline);
            const today = new Date();
            const diffTime = deadlineDate.getTime() - today.getTime();
            daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        return {
            title: goal.title || "Untitled Goal",
            description: goal.description || "",
            target_amount: goal.amount || 0,
            current_amount: goal.current_amount || 0,
            progress_percentage: progressPercentage,
            remaining_amount: remainingAmount,
            deadline: goal.deadline || null,
            days_until_deadline: daysUntilDeadline,
            category: goal.category || "savings",
            priority: goal.priority || "medium",
            status: goal.status || "active",
            icon: goal.icon || "💰",
            color: goal.color || "#4CAF50"
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
    }    // Fetch account balance data if user has connected accounts
    let accountBalances = [];
    if (userId && userContext.hasPlaidData) {
      try {
        logger.info(`${TAG} Fetching account balances for user ${userId}`);
        const balanceData = await plaid.getBalances(userId);
        accountBalances = formatAccountBalances(balanceData);
        logger.info(`${TAG} Retrieved ${accountBalances.length} account balances`);
      } catch (error) {
        logger.warn(`${TAG} Could not fetch account balances for user ${userId}: ${error.message}`);
        accountBalances = [];
      }
    }

    // Fetch savings goals data if user is available
    let savingsGoals = [];
    if (userId) {
      try {
        logger.info(`${TAG} Fetching savings goals for user ${userId}`);
        const goalsData = await savingsGoalsDb.getByUserId(userId);
        savingsGoals = formatSavingsGoals(goalsData);
        logger.info(`${TAG} Retrieved ${savingsGoals.length} savings goals`);
      } catch (error) {
        logger.warn(`${TAG} Could not fetch savings goals for user ${userId}: ${error.message}`);
        savingsGoals = [];
      }
    }

    // Fetch current budget data if user is available
    let currentBudget = null;
    if (userId) {
      try {
        logger.info(`${TAG} Fetching current budget for user ${userId}`);
        const budgetData = await budgetsDb.getCurrentByUserId(userId);
        currentBudget = budgetData;
        logger.info(`${TAG} Retrieved current budget for user ${userId}`);
      } catch (error) {
        logger.warn(`${TAG} Could not fetch current budget for user ${userId}: ${error.message}`);
        currentBudget = null;
      }
    }

    // Set personality description and behavior based on mode
    switch (personalityMode) {
      case -1:
        personalityDescription = `You should be GENTLE and ENCOURAGING in your financial advice. 
Be supportive and understanding about financial mistakes. Use softer language like "consider" and "might want to" instead of direct commands.
Focus on small, achievable steps and celebrate any progress the user makes.
Be empathetic about financial stress and provide reassurance along with advice. Your first message should be very welcoming and friendly.`;
        break;
      case 1:
        personalityDescription = `You should be MORE DIRECT and ASSERTIVE in your financial advice.
Use stronger language and be more firm about financial decisions that need to be made.
Point out financial mistakes clearly and provide direct action items.
Be more urgent about addressing poor financial habits, but remain helpful and supportive.
Use phrases like "you need to" and "you should immediately" when appropriate. Your first message should have a strong call to action.`;
        break;
      case 2:
        personalityDescription = `You are COMMUNIST CAPY - a revolutionary financial advisor with socialist principles!
Emphasize collective financial responsibility, community support, and equitable wealth distribution.
Use revolutionary language and references to collective action. Be passionate about financial equality and helping the working class.
Suggest community-based financial solutions, mutual aid, and collective bargaining approaches.
Use phrases like "comrade", "for the people", "collective wealth", and "solidarity". Be enthusiastic about building a more equitable financial future together.
Your first message should be revolutionary and inspiring, emphasizing that we're all in this together!`;
        break;
      case 0:
      default:
        personalityDescription = `You should be BALANCED in your approach - neither too gentle nor too aggressive.
Provide clear, practical advice while being understanding of the user's situation.
Use a friendly but informative tone that encourages good financial habits.`;
        break;
    }    const systemPrompt = `You are Capy, a capybara financial assistant for the CapySpend app. 
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

CURRENT DATE: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD format)
${accountBalances.length > 0 ? `
Current Account Balances:
${JSON.stringify(accountBalances, null, 2)}
` : 'No account balance data available.'}

TRANSACTION DATA FORMATTING RULES:
- **Negative values (-$100)** represent **deposits/income** into accounts (money coming in)
- **Positive values (+$100)** represent **withdrawals/purchases** (money going out)
- When discussing transactions, always clarify whether it's income or spending
- Format amounts as: "You spent \`$50\` at [merchant]" for positive values
- Format amounts as: "You received \`$100\` from [source]" for negative values
- When analyzing spending patterns, focus on positive values (outflows)
- When discussing income, focus on negative values (inflows)

OTHER FORMATTING RULES:
- Whenever there is a value that is a dollar amount, format it as \`$100.00\` for clarity. Or use the corresponding currency symbol for the given currency

${accountBalances.length > 0 ? `
Current Account Balances:
${JSON.stringify(accountBalances, null, 2)}
` : 'No account balance data available.'}

${savingsGoals.length > 0 ? `
User's Savings Goals and Progress:
${JSON.stringify(savingsGoals, null, 2)}

CREATE_GOAL FUNCTION:
- use this tool call when the user expresses interest in saving for a specific purpose
- only use the tool call after confirming with the user that they want to add a goal to their account
- the tool call will create a new savings goal with the provided details
- after doing the tool call, return a message confirming the goal was created successfully and that the user can see it in their dashboard

UPDATE_BUDGET FUNCTION:
- use this tool call when the user seeks help for designing their budget
- analyze the user's transactions to potentially determine their monthly income and spending patterns
- suggest a budget personalized to these transactions
- use the tool call ONLY after you propose a budget with exact numbers for each category and the user accepts this budget

GOALS GUIDANCE:
- Use the progress_percentage to understand how close the user is to their goals
- Consider days_until_deadline when giving advice about urgency
- Mention specific goal progress when relevant to their questions
- Suggest practical steps to reach their goals based on their spending patterns
- Celebrate progress they've made on their goals
- Help them adjust goals if they seem unrealistic based on their financial situation
` : 'No savings goals set up yet. Consider suggesting they create financial goals.'}

${currentBudget ? `
Current Budget:
${JSON.stringify(currentBudget, null, 2)}
` : 'No current budget data available.'}

Recent Transaction Data (positive is an outflow of money, negative is an inflow):
${userContext.transactionData ? JSON.stringify(format(userContext.transactionData), null, 2) : 'No transaction data available.'}
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

Please provide a helpful response.`;    logger.info(
      `${TAG} Generating AI response for user message: ${userMessage}`
    );
    logger.info(`${TAG} User has Plaid data: ${userContext.hasPlaidData}`);
    if (userContext.transactionData && userContext.transactionData.length > 0) {
      logger.info(
        `${TAG} Using ${userContext.transactionData.length} transactions for context`
      );
    }
    if (accountBalances && accountBalances.length > 0) {
      logger.info(
        `${TAG} Using ${accountBalances.length} account balances for context`
      );
    }
    if (savingsGoals && savingsGoals.length > 0) {
      logger.info(
        `${TAG} Using ${savingsGoals.length} savings goals for context`
      );
    }
    logger.info(`${TAG} systemPrompt: ${systemPrompt}`);

    const input = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ]
    const tools = [
      {
        "type": "function",
        "name": "create_goal",
        "description": "Creates a savings goal when the user expresses interest in saving for a specific purpose.",
        "parameters": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "Name of the savings goal (required)"
            },
            "amount": {
              "type": "number",
              "description": "Target amount for the savings goal (required, must be greater than 0)"
            },
            "description": {
              "type": "string",
              "description": "Description of the savings goal (optional)"
            },
            "deadline": {
              "type": "string",
              "description": "End date for the savings goal in YYYY-MM-DD format (optional)"
            },
            "category": {
              "type": "string",
              "description": "Category of the goal: savings, debt, investment, purchase, emergency (optional)"
            },
            "priority": {
              "type": "string",
              "enum": ["low", "medium", "high"],
              "description": "Priority level (optional, defaults to medium)"
            },
            "icon": {
              "type": "string",
              "description": "Icon for the goal. Must be one of: 💰 (money), 🏠 (house), ✈️ (travel), 💻 (technology), 📈 (investment), 💳 (debt), 🛡️ (emergency), 🎓 (education), 🚗 (car), 🏥 (health), 🎯 (target), ⭐ (star) (optional)"
            },
            "color": {
              "type": "string",
              "description": "Color for the goal (hex color code like #4CAF50) (optional)"
            },
            "current_amount": {
              "type": "number",
              "description": "Current progress amount (optional, defaults to 0)"
            }
          },
          "required": ["title", "amount", "description", "deadline", "category", "priority", "icon", "color", "current_amount"],
          "additionalProperties": false
        },
        "strict": true
      },
      {
        "type": "function",
        "name": "update_goal",
        "description": "Updates an existing savings goal when the user wants to modify goal details like amount, deadline, or progress.",
        "parameters": {
          "type": "object",
          "properties": {
            "goal_id": {
              "type": "number",
              "description": "ID of the goal to update (required)"
            },
            "title": {
              "type": "string",
              "description": "New name of the savings goal (required)"
            },
            "amount": {
              "type": "number",
              "description": "New target amount for the savings goal (required, must be greater than 0)"
            },
            "description": {
              "type": "string",
              "description": "New description of the savings goal (required)"
            },
            "deadline": {
              "type": "string",
              "description": "New end date for the savings goal in YYYY-MM-DD format (required)"
            },
            "category": {
              "type": "string",
              "description": "New category of the goal: savings, debt, investment, purchase, emergency (required)"
            },
            "priority": {
              "type": "string",
              "enum": ["low", "medium", "high"],
              "description": "New priority level (required)"
            },
            "icon": {
              "type": "string",
              "description": "New icon for the goal. Must be one of: 💰 (money), 🏠 (house), ✈️ (travel), 💻 (technology), 📈 (investment), 💳 (debt), 🛡️ (emergency), 🎓 (education), 🚗 (car), 🏥 (health), 🎯 (target), ⭐ (star) (required)"
            },
            "color": {
              "type": "string",
              "description": "New color for the goal (hex color code like #4CAF50) (required)"
            },
            "current_amount": {
              "type": "number",
              "description": "New current progress amount (required)"
            }
          },
          "required": ["goal_id", "title", "amount", "description", "deadline", "category", "priority", "icon", "color", "current_amount"],
          "additionalProperties": false
        },
        "strict": true
      },
      {
        "type": "function",
        "name": "update_budget",
        "description": "Updates the user's budget when they ask for help creating or adjusting a reasonable budget based on their financial situation. Provide the user with a suggested budget based on the information you know about them. Only do the tool call if the user accepts the budget with numbers that you provide.",
        "parameters": {
          "type": "object",
          "properties": {
            "overall": {
              "type": "number",
              "description": "Total monthly budget amount (required, must be greater than 0)"
            },
            "housing": {
              "type": "number",
              "description": "Monthly budget for housing and utilities (required, must be greater than or equal to 0)"
            },
            "food": {
              "type": "number",
              "description": "Monthly budget for food and dining (required, must be greater than or equal to 0)"
            },
            "transportation": {
              "type": "number",
              "description": "Monthly budget for transportation (required, must be greater than or equal to 0)"
            },
            "health": {
              "type": "number",
              "description": "Monthly budget for health and insurance (required, must be greater than or equal to 0)"
            },
            "personal": {
              "type": "number",
              "description": "Monthly budget for personal and lifestyle expenses (required, must be greater than or equal to 0)"
            },
            "entertainment": {
              "type": "number",
              "description": "Monthly budget for entertainment and leisure (required, must be greater than or equal to 0)"
            },
            "financial": {
              "type": "number",
              "description": "Monthly budget for financial and savings (required, must be greater than or equal to 0)"
            },
            "gifts": {
              "type": "number",
              "description": "Monthly budget for gifts and donations (required, must be greater than or equal to 0)"
            }
          },
          "required": ["overall", "housing", "food", "transportation", "health", "personal", "entertainment", "financial", "gifts"],
          "additionalProperties": false
        },
        "strict": true
      }
    ]
    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: input,
      tools: tools
    });

    logger.info(`${TAG} OpenAI API call successful`);
    logger.info(`${TAG} Response received, output length: ${completion.output_text?.length || 0} characters`);
    
    // Handle tool calls if any
    let hasToolCalls = false;
    for (const toolCall of completion.output) {
      if (toolCall.type !== "function_call") {
          continue;
      }

      hasToolCalls = true;
      const name = toolCall.name;
      const args = JSON.parse(toolCall.arguments);
      
      logger.info(`${TAG} Processing tool call: ${name} with call_id: ${toolCall.call_id}`);
      
      if(name === "create_goal") {
        logger.info(`${TAG} Creating savings goal with args:`, args);
        
        try {
          // Map the tool call arguments to the database format
          const goalData = {
            title: args.title,
            description: args.description,
            amount: args.amount,
            deadline: args.deadline,
            category: args.category,
            priority: args.priority,
            icon: args.icon,
            color: args.color,
            current_amount: args.current_amount || 0
          };
          
          const result = await savingsGoalsDb.create(userId, goalData);
          
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Savings goal "${result.title}" created successfully! Target amount: $${result.amount}, Deadline: ${result.deadline ? new Date(result.deadline).toLocaleDateString() : 'No deadline'}`
          });
          
          logger.info(`${TAG} Savings goal created successfully with ID: ${result.id}`);
        } catch (error) {
          logger.error(`${TAG} Error creating savings goal: ${error.message}`);
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Failed to create savings goal: ${error.message}`
          });
        }
      } else if(name === "update_goal") {
        logger.info(`${TAG} Updating savings goal with args:`, args);
        
        try {
          // Map the tool call arguments to the database format
          const updateData = {
            title: args.title,
            description: args.description,
            amount: args.amount,
            deadline: args.deadline,
            category: args.category,
            priority: args.priority,
            icon: args.icon,
            color: args.color,
            current_amount: args.current_amount
          };
          
          const result = await savingsGoalsDb.update(args.goal_id, userId, updateData);
          
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Savings goal "${result.title}" updated successfully! Target amount: $${result.amount}, Current progress: $${result.current_amount}, Deadline: ${result.deadline ? new Date(result.deadline).toLocaleDateString() : 'No deadline'}`
          });
          
          logger.info(`${TAG} Savings goal updated successfully with ID: ${result.id}`);
        } catch (error) {
          logger.error(`${TAG} Error updating savings goal: ${error.message}`);
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Failed to update savings goal: ${error.message}`
          });
        }
      } else if(name === "update_budget") {
        logger.info(`${TAG} Updating budget with args:`, args);
        
        try {
          // Map the tool call arguments to the database format
          const budgetData = {
            overall: args.overall,
            housing: args.housing,
            food: args.food,
            transportation: args.transportation,
            health: args.health,
            personal: args.personal,
            entertainment: args.entertainment,
            financial: args.financial,
            gifts: args.gifts
          };
          
          // Check if user already has a budget
          const existingBudget = await budgetsDb.getCurrentByUserId(userId);
          
          let result;
          if (existingBudget) {
            // Update existing budget
            result = await budgetsDb.update(existingBudget.id, budgetData);
            logger.info(`${TAG} Updated existing budget with ID: ${result.id}`);
          } else {
            // Create new budget
            result = await budgetsDb.create(userId, budgetData);
            logger.info(`${TAG} Created new budget with ID: ${result.id}`);
          }
          
          const action = existingBudget ? "updated" : "created";
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Budget ${action} successfully! Total monthly budget: $${result.overall.toLocaleString()}. Breakdown: Housing $${result.housing.toLocaleString()}, Food $${result.food.toLocaleString()}, Transportation $${result.transportation.toLocaleString()}, Health $${result.health.toLocaleString()}, Personal $${result.personal.toLocaleString()}, Entertainment $${result.entertainment.toLocaleString()}, Financial $${result.financial.toLocaleString()}, Gifts $${result.gifts.toLocaleString()}`
          });
          
        } catch (error) {
          logger.error(`${TAG} Error updating budget: ${error.message}`);
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Failed to update budget: ${error.message}`
          });
        }
      }
    }
    
    // If there were tool calls, make a second API call to get the final response
    if (hasToolCalls) {
      logger.info(`${TAG} Making follow-up API call after tool execution`);
      try {
        const finalResponse = await openai.responses.create({
          model: "gpt-4.1",
          input: input
          // No tools needed for follow-up call
        });
        logger.info(`${TAG} Final response received after tool execution: ${finalResponse.output_text?.substring(0, 100)}...`);
        
        // Validate the final response
        if (!finalResponse.output_text || finalResponse.output_text.trim() === '') {
          logger.error(`${TAG} Empty final response after tool execution`);
          const toolResults = input.filter(msg => msg.type === "function_call_output")
            .map(msg => msg.output)
            .join("\n");
          return `I've processed your request. ${toolResults}`;
        }
        
        return finalResponse.output_text;
      } catch (error) {
        logger.error(`${TAG} Error in follow-up API call: ${error.message}`);
        // If follow-up fails, return a fallback message with the tool results
        const toolResults = input.filter(msg => msg.type === "function_call_output")
          .map(msg => msg.output)
          .join("\n");
        return `I've processed your request. ${toolResults}`;
      }
    }

    // Validate the original response
    if (!completion.output_text || completion.output_text.trim() === '') {
      logger.error(`${TAG} Empty original response from OpenAI`);
      return "I'm sorry, I'm having trouble generating a response right now. Please try again.";
    }

    return completion.output_text;
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

async function deleteConversation(conversationID, userID) {
  // First, verify the conversation belongs to the user
  const conversation = await getByID(conversationID);
  if (!conversation || conversation.length === 0) {
    throw new Error('Conversation not found');
  }
  
  if (conversation[0].user_id !== userID) {
    throw new Error('Access denied to this conversation');
  }

  // Delete all messages for this conversation first (due to foreign key constraint)
  await sql`DELETE FROM conversation_message WHERE conversation_id = ${conversationID}`;
  
  // Then delete the conversation
  const result = await sql`DELETE FROM bot_conversations WHERE id = ${conversationID} AND user_id = ${userID}`;
  
  return result;
}


module.exports = {
  getByID: getByID,
  getUserConversations: getUserConversations,
  getFullConversation: getFullConversation,
  createConversation: createConversation,
  addMessageToConversation: addMessageToConversation,
  deleteConversation: deleteConversation,
  generateAIResponse: generateAIResponse,
};
