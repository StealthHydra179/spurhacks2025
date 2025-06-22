# capyspend

Create .env file in root folder and follow this format:
```
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=_____________________________
PGPORT=5432
PGDATABASE=spurhacks2025
JWT_SECRET=_____________________________
```
To run server
```bash
npm run server
```


API Routes
Get:
localhost:3000/api/users/getByID/:ID


# CapySpend
## Inspiration

## What it does
CabySpend is a personal finance management website that helps users track their spending, manage budgets, and gain insights into their financial habits. It integrates with Plaid to securely connect to users' bank accounts and provides a user-friendly interface for managing finances, while implementing an AI assistant to offer personalized financial advice and insights based on the user's financial information.

## How it works
CabySpend works by integrating with Plaid and the OpenAI API to provide a comprehensive personal finance management solution. Users can securely connect their bank accounts through Plaid, allowing the application to access transaction data, account balances, and other financial information. The AI assistant uses this data to analyze spending patterns, suggest budget adjustments, and provide personalized financial advice. The application also features a user-friendly interface for managing budgets, tracking expenses, and visualizing financial health.

## Technologies Used
- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **APIs**: Plaid API for bank account integration, OpenAI API for AI assistant functionality
- **Authentication**: JWT for secure user authentication
- **Design**

## Features
**Key features:**
- **Secure Bank Account Integration**: Users can connect their bank accounts securely using Plaid, allowing for real-time transaction tracking and balance updates.
- **Personal Finance Management**: Users can create budgets, track expenses, and set financial goals.
- **AI Assistant**: An AI-powered assistant provides personalized financial advice, helps users understand their spending habits, and suggests ways to save money.
- **Goal Setting and Tracking**: Users can set financial goals, such as saving for a vacation or paying off debt, and track their progress towards these goals.

**Additional Features:**
- **Expense Categorization**: Automatically categorize transactions to help users understand where their money is going.
- **Visualizations**: Interactive charts and graphs to visualize spending patterns and budget performance.
- **Different Modes**: Users can switch between different modes, such as "Conservative" for more conservative advice or "Aggressive" for more risk-taking strategies, allowing the AI assistant to tailor its recommendations based on the user's financial goals and risk tolerance.

## How we built it

## Challenges Faced

## Accomplishments that we're proud of

## What we learned

## What's next for CabySpend
