require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const port = 3000;
const { logger } = require("./logger");
const sql = require("./db/db");

const TAG = "server_index";

// CORS middleware for credentials
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173"); // Vite dev server
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true"); // Important for cookies

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(cookieParser()); // Parse cookies

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const apiUsers = require("./routes/api/users");
app.use("/api/users", apiUsers);
const apiTransactions = require("./routes/api/transactions");
app.use("/api/transactions", apiTransactions);
const apiBotConversations = require("./routes/api/bot_conversations");
app.use("/api/bot_conversations", apiBotConversations);
const apiPlaid = require("./routes/api/plaid");
app.use("/api/plaid", apiPlaid);
const apiSavingsGoals = require("./routes/api/savings_goals");
app.use("/api/savings_goals", apiSavingsGoals);
const apiBudgets = require("./routes/api/budgets");
app.use("/api/budgets", apiBudgets);

app.listen(port, () => {
  logger.info(`${TAG} Server listening on port ${port}`);

  // Initialize Plaid data fetching after server starts
  setTimeout(() => {
    initializePlaidDataFetching();
  }, 5000); // Wait 5 seconds for server to fully initialize
});

// Initialize Plaid data fetching
async function initializePlaidDataFetching() {
  const plaid = require("./plaid/plaid");

  // Fetch plaid information once on boot
  try {
    logger.info(`${TAG} Fetching initial Plaid information on server boot`);
    const summary = await plaid.getPlaidSummary();
    logger.info(`${TAG} Plaid summary: ${JSON.stringify(summary)}`);

    if (summary.connectedUsers > 0) {
      const initialData = await plaid.fetchPlaidInfo();
      logger.info(
        `${TAG} Initial Plaid data fetched successfully for ${
          Object.keys(initialData).length
        } users`
      );
    }
  } catch (error) {
    logger.error(
      `${TAG} Error fetching initial plaid information: ${error.message}`
    );
  }

  // Set an interval to fetch plaid information every 12 hours
  setInterval(async () => {
    try {
      logger.info(`${TAG} Running scheduled Plaid data fetch`);
      const data = await plaid.fetchPlaidInfo();
      logger.info(`${TAG} Scheduled Plaid information fetched successfully`);
    } catch (error) {
      logger.error(`${TAG} Error in scheduled plaid fetch: ${error.message}`);
    }
  }, 12 * 60 * 60 * 1000); // 12 hours in milliseconds

  // Set an interval to fetch last day's transactions every hour
  setInterval(async () => {
    try {
      const data = await plaid.fetchLastDayPlaidInfo();
      logger.info(`${TAG} Last day's transactions fetched successfully`);
    } catch (error) {
      logger.error(
        `${TAG} Error fetching last day's transactions: ${error.message}`
      );
    }
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  logger.info(`${TAG} Plaid data fetching intervals initialized`);
}