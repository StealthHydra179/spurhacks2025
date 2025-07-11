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
  logger.info(`${TAG} transactionDATA: ${JSON.stringify(transactionData)}`);
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
      account_mask: account.mask || "****",
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
    const progressPercentage =
      goal.amount > 0
        ? (((goal.current_amount || 0) / goal.amount) * 100).toFixed(1)
        : 0;
    const remainingAmount = Math.max(
      0,
      goal.amount - (goal.current_amount || 0)
    );

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
      color: goal.color || "#4CAF50",
    };
  });
}

/**
 * Generate AI response using OpenAI GPT-4 mini
 */
async function generateAIResponse(
  userMessage,
  userContext = {},
  userId = null
) {
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
        logger.warn(
          `${TAG} Could not fetch personality for user ${userId}: ${error.message}`
        );
        personalityMode = 0;
      }
    } // Fetch account balance data if user has connected accounts
    let accountBalances = [];
    if (userId && userContext.hasPlaidData) {
      try {
        logger.info(`${TAG} Fetching account balances for user ${userId}`);
        const balanceData = await plaid.getBalances(userId);
        accountBalances = formatAccountBalances(balanceData);
        logger.info(
          `${TAG} Retrieved ${accountBalances.length} account balances`
        );
      } catch (error) {
        logger.warn(
          `${TAG} Could not fetch account balances for user ${userId}: ${error.message}`
        );
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
        logger.warn(
          `${TAG} Could not fetch savings goals for user ${userId}: ${error.message}`
        );
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
        logger.warn(
          `${TAG} Could not fetch current budget for user ${userId}: ${error.message}`
        );
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
      case 3:
        personalityDescription = `You are BABY CAPY - a friendly, educational financial advisor perfect for beginners!
Focus on teaching financial basics in simple, easy-to-understand terms. Explain financial concepts step-by-step.
Use encouraging language and celebrate every small financial win. Be patient and never make users feel bad about their financial knowledge level.
Provide gentle guidance with lots of explanations. Use analogies and simple examples to explain complex financial concepts.
Use phrases like "let me explain", "here's how it works", "great question!", and "don't worry, this is totally normal for beginners".
Always include educational tidbits and explain WHY certain financial practices are important.
Your first message should be welcoming and educational, emphasizing that you're here to teach and guide them through their financial journey!`;
        break;
      case 0:
      default:
        personalityDescription = `You should be BALANCED in your approach - neither too gentle nor too aggressive.
Provide clear, practical advice while being understanding of the user's situation.
Use a friendly but informative tone that encourages good financial habits.`;
        break;
    }
    const systemPrompt = `You are Capy, a capybara financial assistant for the CapySpend app.
Your job is to help users manage their finances, understand their spending patterns, and make better financial decisions. You are conversational, supportive, and provide actionable advice. Keep responses concise but helpful. If you need specific financial data to answer a question, let the user know what information would be helpful.

---

### PERSONALITY MODE

${personalityDescription}

---

### GENERAL RESPONSE FORMATTING

- Use **bold text** for important points.
- Use *italic text* for financial terms or concepts.
- Use bullet points (- or *) for lists of tips or suggestions.
- Use numbered lists (1., 2., etc.) for step-by-step instructions.
- Use \`code formatting\` for specific dollar amounts or percentages.
- Use ### headings for organizing longer responses into sections.
- Always use Markdown formatting for clarity and readability.

**Examples:**
- "I recommend **reducing your dining out budget** by $50 per month."
- "Here are *three key strategies* for building an emergency fund:"

---

### INTRODUCTION

When you first respond to a user, introduce yourself as Capy and explain that you are here to help them with their finances.  
Mention that you are not a certified financial advisor, but you can provide general financial tips and advice based on the user's spending habits and financial goals.

---

### CONTEXTUAL DATA

- **Current Date:** ${new Date().toISOString().split("T")[0]} (YYYY-MM-DD format)
- **Account Balances:**  
  ${accountBalances.length > 0 ? JSON.stringify(accountBalances, null, 2) : "No account balance data available."}
- **Savings Goals:**  
  ${savingsGoals.length > 0 ? JSON.stringify(savingsGoals, null, 2) : "No savings goals set up yet. Consider suggesting they create financial goals."}
- **Current Budget:**  
  ${currentBudget ? JSON.stringify(currentBudget, null, 2) : "No current budget data available."}
- **Recent Transaction Data:**  
  ${userContext.transactionData ? JSON.stringify(format(userContext.transactionData), null, 2) : "No transaction data available."}

---

### TRANSACTION DATA RULES

- **Negative values (-$100)** represent **deposits/income** (money coming in).
- **Positive values (+$100)** represent **withdrawals/purchases** (money going out).
- When discussing transactions, always clarify whether it's income or spending.
- Format amounts as: "You spent $50 at [merchant]" for positive values.
- Format amounts as: "You received $100 from [source]" for negative values.
- When analyzing spending patterns, focus on positive values (outflows).
- When discussing income, focus on negative values (inflows).
- Whenever there is a value that is a dollar amount, format it as $100.00
 for clarity.

---

### BUDGET & GOALS GUIDANCE

- Use the \`progress_percentage\` to understand how close the user is to their goals.
- Consider \`days_until_deadline\` when giving advice about urgency.
- Mention specific goal progress when relevant to their questions.
- Suggest practical steps to reach their goals based on their spending patterns.
- Celebrate progress they've made on their goals.
- Help them adjust goals if they seem unrealistic based on their financial situation.

---

### TOOL CALLS

#### CREATE_GOAL FUNCTION
- Use this tool call when the user expresses interest in saving for a specific purpose.
- Only use the tool call after confirming with the user that they want to add a goal to their account.
- The tool call will create a new savings goal with the provided details.
- After doing the tool call, return a message confirming the goal was created successfully and that the user can see it in their dashboard.

#### UPDATE_BUDGET FUNCTION
- Use this tool call when the user seeks help for designing their budget.
- Analyze the user's transactions to determine their monthly income and spending patterns.
- Suggest a budget personalized to these transactions.
- Use the tool call ONLY after you propose a budget with exact numbers for each category and the user accepts this budget.

#### PROPOSE_BUDGET FUNCTION
- You MUST call this tool ANY time you suggest, recommend, propose, or discuss specific budget numbers, changes, or breakdowns for any category, even if the user only hints at wanting a budget or budget change.
- Use this tool for ALL budget proposals, modifications, or recommendations, no matter how small or tentative.
- This tool displays the proposed budget in a nice table.
- **IMPORTANT:** Always use this tool when you suggest specific budget numbers for each category.
- Use this tool even if the user hasn't explicitly asked for a budget to be created.
- Examples of when to use: "I suggest spending $X on housing", "Your budget should be $X", "Here's a breakdown: $X for food, $Y for transportation", "Maybe try reducing your food budget to $Y".
- The tool will display a beautiful table with the budget breakdown.

**When the user asks you to create a new budget, you should critically analyze their current budget and spending patterns. Do not be afraid to make big changes to the budget if the current allocations are unrealistic, unbalanced, or not aligned with the user's goals. Clearly explain your rationale for any major changes you propose.**

---

### BUDGET CALCULATION INSTRUCTIONS

When the user asks for information about their budget, such as the total budget, you must follow these steps exactly (do not skip or combine steps, and do not make assumptions):

1. **Extract the category budgets**: Retrieve each individual category budget (housing, food, transportation, health, personal, entertainment, financial, gifts) from the current budget data provided.
2. **Calculate the total budget**: Add together all the category budgets to compute the total budget. Do not use any pre-existing or previously calculated total—always sum the categories directly.
3. **Double-check your calculation**: Assume your calculation may be incorrect. Carefully repeat the addition, step by step, to ensure accuracy.
4. **Explicitly verify the result**: Compare your calculated total budget to the sum of the category budgets. Ensure this verification process is done internally.
5. **If there is any discrepancy**: If the total budget does not exactly match the sum of the category budgets, start over from step 1 and repeat the process until the values match exactly.
6. **Do NOT show your work**: Do NOT show the user the values for each category, the steps of your calculation, or the detailed math. Only present the final result and a concise rationale if needed.

Always follow these steps in order, and never skip or summarize them. Do NOT show your calculation or verification process to the user—only present the final answer and a brief explanation if necessary.

---

### TRANSACTION TABLES

- When you discuss specific transactions or the user asks about specific transactions, ALWAYS include a transaction table at the end of your response.
- Use this exact format for transaction tables (as an indented code block):\n\n    | Date | Amount | Merchant | Category |\n    |------|--------|----------|----------|\n    | 2024-01-15 | -$100.00 | Salary Deposit | Income |\n    | 2024-01-16 | +$25.50 | Starbucks | Food & Dining |\n    | 2024-01-17 | +$45.00 | Target | Shopping |\n
- Include ALL relevant transactions that support your analysis or answer.
- Use negative amounts (-$X) for income/deposits and positive amounts (+$X) for spending.
- Keep the table concise but include all important transaction details.
- **IMPORTANT:** The frontend will automatically detect this table and display it as a beautiful card, hiding the raw table text from the user.
- **ALWAYS** include the table at the very end of your response, even if you've already discussed the transactions in your text.

---

**Remember:**  
- Be clear and concise in your reasoning, but do NOT show your calculations or step-by-step math to the user.
- Only present the final result and a brief rationale for your answer.
- Never skip required steps or make assumptions about the data.
- If you are unsure, ask the user for clarification.
`;

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
    ];
    const tools = [
      {
        type: "function",
        name: "create_goal",
        description:
          "Creates a savings goal when the user expresses interest in saving for a specific purpose.",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Name of the savings goal (required)",
            },
            amount: {
              type: "number",
              description:
                "Target amount for the savings goal (required, must be greater than 0)",
            },
            description: {
              type: "string",
              description: "Description of the savings goal (optional)",
            },
            deadline: {
              type: "string",
              description:
                "End date for the savings goal in YYYY-MM-DD format (optional)",
            },
            category: {
              type: "string",
              description:
                "Category of the goal: savings, debt, investment, purchase, emergency (optional)",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Priority level (optional, defaults to medium)",
            },
            icon: {
              type: "string",
              description:
                "Icon for the goal. Must be one of: 💰 (money), 🏠 (house), ✈️ (travel), 💻 (technology), 📈 (investment), 💳 (debt), 🛡️ (emergency), 🎓 (education), 🚗 (car), 🏥 (health), 🎯 (target), ⭐ (star) (optional)",
            },
            color: {
              type: "string",
              description:
                "Color for the goal (hex color code like #4CAF50) (optional)",
            },
            current_amount: {
              type: "number",
              description: "Current progress amount (optional, defaults to 0)",
            },
          },
          required: [
            "title",
            "amount",
            "description",
            "deadline",
            "category",
            "priority",
            "icon",
            "color",
            "current_amount",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
      {
        type: "function",
        name: "update_goal",
        description:
          "Updates an existing savings goal when the user wants to modify goal details like amount, deadline, or progress.",
        parameters: {
          type: "object",
          properties: {
            goal_id: {
              type: "number",
              description: "ID of the goal to update (required)",
            },
            title: {
              type: "string",
              description: "New name of the savings goal (required)",
            },
            amount: {
              type: "number",
              description:
                "New target amount for the savings goal (required, must be greater than 0)",
            },
            description: {
              type: "string",
              description: "New description of the savings goal (required)",
            },
            deadline: {
              type: "string",
              description:
                "New end date for the savings goal in YYYY-MM-DD format (required)",
            },
            category: {
              type: "string",
              description:
                "New category of the goal: savings, debt, investment, purchase, emergency (required)",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "New priority level (required)",
            },
            icon: {
              type: "string",
              description:
                "New icon for the goal. Must be one of: 💰 (money), 🏠 (house), ✈️ (travel), 💻 (technology), 📈 (investment), 💳 (debt), 🛡️ (emergency), 🎓 (education), 🚗 (car), 🏥 (health), 🎯 (target), ⭐ (star) (required)",
            },
            color: {
              type: "string",
              description:
                "New color for the goal (hex color code like #4CAF50) (required)",
            },
            current_amount: {
              type: "number",
              description: "New current progress amount (required)",
            },
          },
          required: [
            "goal_id",
            "title",
            "amount",
            "description",
            "deadline",
            "category",
            "priority",
            "icon",
            "color",
            "current_amount",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
      {
        type: "function",
        name: "update_budget",
        description:
          "Updates the user's budget when they ask for help creating or adjusting a reasonable budget based on their financial situation. Provide the user with a suggested budget based on the information you know about them. Only do the tool call if the user accepts the budget with numbers that you provide.",
        parameters: {
          type: "object",
          properties: {
            overall: {
              type: "number",
              description:
                "Total monthly budget amount (required, must be greater than 0)",
            },
            housing: {
              type: "number",
              description:
                "Monthly budget for housing and utilities (required, must be greater than or equal to 0)",
            },
            food: {
              type: "number",
              description:
                "Monthly budget for food and dining (required, must be greater than or equal to 0)",
            },
            transportation: {
              type: "number",
              description:
                "Monthly budget for transportation (required, must be greater than or equal to 0)",
            },
            health: {
              type: "number",
              description:
                "Monthly budget for health and insurance (required, must be greater than or equal to 0)",
            },
            personal: {
              type: "number",
              description:
                "Monthly budget for personal and lifestyle expenses (required, must be greater than or equal to 0)",
            },
            entertainment: {
              type: "number",
              description:
                "Monthly budget for entertainment and leisure (required, must be greater than or equal to 0)",
            },
            financial: {
              type: "number",
              description:
                "Monthly budget for financial and savings (required, must be greater than or equal to 0)",
            },
            gifts: {
              type: "number",
              description:
                "Monthly budget for gifts and donations (required, must be greater than or equal to 0)",
            },
          },
          required: [
            "overall",
            "housing",
            "food",
            "transportation",
            "health",
            "personal",
            "entertainment",
            "financial",
            "gifts",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
      {
        type: "function",
        name: "propose_budget",
        description:
          "You MUST call this tool ANY time you suggest, recommend, propose, or discuss specific budget numbers, changes, or breakdowns for any category, even if the user only hints at wanting a budget or budget change. Use this tool for ALL budget proposals, modifications, or recommendations, no matter how small or tentative. This tool displays the proposed budget in a nice table. Always call this tool for any budget suggestion or breakdown.",
        parameters: {
          type: "object",
          properties: {
            overall: {
              type: "number",
              description:
                "Total monthly budget amount (required, must be greater than 0)",
            },
            housing: {
              type: "number",
              description:
                "Monthly budget for housing and utilities (required, must be greater than or equal to 0)",
            },
            food: {
              type: "number",
              description:
                "Monthly budget for food and dining (required, must be greater than or equal to 0)",
            },
            transportation: {
              type: "number",
              description:
                "Monthly budget for transportation (required, must be greater than or equal to 0)",
            },
            health: {
              type: "number",
              description:
                "Monthly budget for health and insurance (required, must be greater than or equal to 0)",
            },
            personal: {
              type: "number",
              description:
                "Monthly budget for personal and lifestyle expenses (required, must be greater than or equal to 0)",
            },
            entertainment: {
              type: "number",
              description:
                "Monthly budget for entertainment and leisure (required, must be greater than or equal to 0)",
            },
            financial: {
              type: "number",
              description:
                "Monthly budget for financial and savings (required, must be greater than or equal to 0)",
            },
            gifts: {
              type: "number",
              description:
                "Monthly budget for gifts and donations (required, must be greater than or equal to 0)",
            },
            title: {
              type: "string",
              description:
                "Title for the budget proposal (required, e.g., 'Recommended Monthly Budget')",
            },
            description: {
              type: "string",
              description:
                "Describe the budget you proposed. Provide a few sentences of rationale for the budget breakdown and how it aligns with the user's financial goals. (required)",
            },
          },
          required: [
            "overall",
            "housing",
            "food",
            "transportation",
            "health",
            "personal",
            "entertainment",
            "financial",
            "gifts",
            "title",
            "description",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
    ];
    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: input,
      tools: tools,
    });

    logger.info(`${TAG} OpenAI API call successful`);
    logger.info(
      `${TAG} Response received, output length: ${
        completion.output_text?.length || 0
      } characters`
    );

    // Handle tool calls if any
    let hasToolCalls = false;
    for (const toolCall of completion.output) {
      if (toolCall.type !== "function_call") {
        continue;
      }

      hasToolCalls = true;
      const name = toolCall.name;
      const args = JSON.parse(toolCall.arguments);

      logger.info(
        `${TAG} Processing tool call: ${name} with call_id: ${toolCall.call_id}`
      );

      if (name === "create_goal") {
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
            current_amount: args.current_amount || 0,
          };

          const result = await savingsGoalsDb.create(userId, goalData);

          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Savings goal "${
              result.title
            }" created successfully! Target amount: $${
              result.amount
            }, Deadline: ${
              result.deadline
                ? new Date(result.deadline).toLocaleDateString()
                : "No deadline"
            }`,
          });

          logger.info(
            `${TAG} Savings goal created successfully with ID: ${result.id}`
          );
        } catch (error) {
          logger.error(`${TAG} Error creating savings goal: ${error.message}`);
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Failed to create savings goal: ${error.message}`,
          });
        }
      } else if (name === "update_goal") {
        logger.info(`${TAG} Updating savings goal with args:`, args);
        logger.info(`${TAG} Current amount from args:`, args.current_amount);
        logger.info(`${TAG} Current amount type:`, typeof args.current_amount);

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
            current_amount:
              args.current_amount !== undefined ? args.current_amount : 0,
          };

          logger.info(`${TAG} Update data being sent to database:`, updateData);

          const result = await savingsGoalsDb.update(
            args.goal_id,
            userId,
            updateData
          );

          logger.info(`${TAG} Database update result:`, result);

          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Savings goal "${
              result.title
            }" updated successfully! Target amount: $${
              result.amount
            }, Current progress: $${result.current_amount}, Deadline: ${
              result.deadline
                ? new Date(result.deadline).toLocaleDateString()
                : "No deadline"
            }`,
          });

          logger.info(
            `${TAG} Savings goal updated successfully with ID: ${result.id}`
          );
        } catch (error) {
          logger.error(`${TAG} Error updating savings goal: ${error.message}`);
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Failed to update savings goal: ${error.message}`,
          });
        }
      } else if (name === "update_budget") {
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
            gifts: args.gifts,
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
            output: `Budget ${action} successfully! Total monthly budget: $${result.overall.toLocaleString()}. Breakdown: Housing $${result.housing.toLocaleString()}, Food $${result.food.toLocaleString()}, Transportation $${result.transportation.toLocaleString()}, Health $${result.health.toLocaleString()}, Personal $${result.personal.toLocaleString()}, Entertainment $${result.entertainment.toLocaleString()}, Financial $${result.financial.toLocaleString()}, Gifts $${result.gifts.toLocaleString()}`,
          });
        } catch (error) {
          logger.error(`${TAG} Error updating budget: ${error.message}`);
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Failed to update budget: ${error.message}`,
          });
        }
      } else if (name === "propose_budget") {
        logger.info(`${TAG} Proposing budget with args:`, args);

        try {
          // Create a formatted budget proposal message
          const budgetProposal = `📊 **${args.title}**

**Total Monthly Budget: $${args.overall.toLocaleString()}**

**Reasoning:** ${args.description}

**Budget Breakdown:**
- Housing: $${args.housing.toLocaleString()}
- Food: $${args.food.toLocaleString()}
- Transportation: $${args.transportation.toLocaleString()}
- Health: $${args.health.toLocaleString()}
- Personal: $${args.personal.toLocaleString()}
- Entertainment: $${args.entertainment.toLocaleString()}
- Financial: $${args.financial.toLocaleString()}
- Gifts: $${args.gifts.toLocaleString()}

Would you like me to implement this budget for you?`;

          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: budgetProposal,
          });

          logger.info(`${TAG} Budget proposal displayed successfully`);
        } catch (error) {
          logger.error(`${TAG} Error proposing budget: ${error.message}`);
          input.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: `Failed to display budget proposal: ${error.message}`,
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
          input: input,
          // No tools needed for follow-up call
        });
        logger.info(
          `${TAG} Final response received after tool execution: ${finalResponse.output_text?.substring(
            0,
            100
          )}...`
        );

        // Validate the final response
        if (
          !finalResponse.output_text ||
          finalResponse.output_text.trim() === ""
        ) {
          logger.error(`${TAG} Empty final response after tool execution`);
          const toolResults = input
            .filter((msg) => msg.type === "function_call_output")
            .map((msg) => msg.output)
            .join("\n");
          return `I've processed your request. ${toolResults}`;
        }

        return finalResponse.output_text;
      } catch (error) {
        logger.error(`${TAG} Error in follow-up API call: ${error.message}`);
        // If follow-up fails, return a fallback message with the tool results
        const toolResults = input
          .filter((msg) => msg.type === "function_call_output")
          .map((msg) => msg.output)
          .join("\n");
        return `I've processed your request. ${toolResults}`;
      }
    }

    // Validate the original response
    if (!completion.output_text || completion.output_text.trim() === "") {
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
    throw new Error("Conversation not found");
  }

  if (conversation[0].user_id !== userID) {
    throw new Error("Access denied to this conversation");
  }

  // Delete all messages for this conversation first (due to foreign key constraint)
  await sql`DELETE FROM conversation_message WHERE conversation_id = ${conversationID}`;

  // Then delete the conversation
  const result =
    await sql`DELETE FROM bot_conversations WHERE id = ${conversationID} AND user_id = ${userID}`;

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
