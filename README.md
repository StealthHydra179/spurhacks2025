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
- **Frontend**: React, Next.js, Material-UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **APIs**: Plaid API for bank account integration, OpenAI API for AI assistant functionality
- **Authentication**: JWT for secure user authentication
- **Design**: 

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
The CabySpend application is split into 2 components: the client (frontend) and the server (backend). The client is built using React and Next.js, providing a responsive and user-friendly interface. The server is built with Node.js and Express, handling API requests, user authentication, and integration with Plaid and OpenAI APIs.

**Client**:
- **React**: The client is built using React, providing a dynamic and interactive user interface.
- **Next.js**: Next.js is used for server-side rendering and routing, enhancing performance and SEO.
- **Axios**: Axios is used for making HTTP requests to the server, allowing the client to interact with the backend APIs.
- **Material-UI**: The client uses Material-UI for a modern and responsive design, providing a consistent user experience across devices.
- **TypeScript**: TypeScript is used for type safety and better development experience, ensuring code quality and reducing runtime errors.

**Server**:
- **Node.js**: The server is built using Node.js, providing a robust backend for
    - **Express**: The server uses Express.js to handle HTTP requests and manage routes for the application.
    - **Winston**: Winston is used for logging server activities, errors, and important events, providing insights into server operations and storing persistent logs.
- **PostgreSQL**: The database is managed using PostgreSQL, storing user data, transaction history, and budget information.
- **Plaid API**: The server integrates with the Plaid API to securely connect to users' bank accounts, fetch transaction data, and manage user accounts.
- **OpenAI API**: The server uses the OpenAI API to power the AI assistant, and the server provides context consisting of user financial data to the AI model for personalized advice.
- **Restful API**: The server exposes RESTful API endpoints for the client to interact with, allowing users to manage their accounts, budgets, and transactions.
- **JWT Authentication**: The server implements JWT authentication to secure user sessions and protect sensitive financial data.

### Database Layout
The database is structured to store user information, transaction history, budgets, and AI assistant interactions. Key tables include:


## Challenges Faced

## Accomplishments that we're proud of

## What we learned

## What's next for CabySpend
