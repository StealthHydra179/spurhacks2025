# CapySpend 
<img src="client/src/assets/neutral-capy.svg" alt="Capy the Capybara" width="150" height="150">

## Inspiration
Managing personal finances can be incredibly overwhelming, especially when trying to create and maintain a budget manually. Many people struggle with:

- **Complex Spreadsheet Management**: Creating and maintaining detailed Excel or Google Sheets to manage budgets requires significant time and effort. Users often spend hours categorizing transactions, updating formulas, and ensuring data accuracy across multiple sheets.

- **Inconsistent Tracking**: Life gets busy, and manual budget tracking often falls by the wayside. Users start strong but quickly abandon their spreadsheets when they miss a few days or weeks of data entry.

- **Lack of Real-Time Insights**: Traditional budgeting methods provide static snapshots rather than dynamic, actionable insights. Users can't easily see spending patterns or get personalized recommendations for improvement.

- **Overwhelming Financial Decisions**: Without proper guidance, users struggle to make informed financial decisions. They may not know if their spending is reasonable, how to adjust their budget, or what financial goals are realistic for their situation.

**The Solution**: CapySpend was born from the idea that financial management should be **automated, intelligent, and user-friendly**. By leveraging AI and secure bank integration, we eliminate the manual work while providing personalized, actionable financial advice. Instead of spending hours on spreadsheets, users can focus on what matters most: **achieving their financial goals**.

## What does CapySpend do?
CapySpend is a personal finance management website that helps users track their spending, manage budgets, and gain insights into their financial habits. It integrates with Plaid to securely connect to users' bank accounts and provides a user-friendly interface for managing finances, while implementing an AI assistant to offer personalized financial advice and insights based on the user's financial information.

## How does CapySpend work?
CapySpend works by integrating with Plaid and the OpenAI API to provide a comprehensive personal finance management solution. Users can securely connect their bank accounts through Plaid, allowing the application to access transaction data, account balances, and other financial information. The AI assistant uses this data to analyze spending patterns, suggest budget adjustments, and provide personalized financial advice. The application also features a user-friendly interface for managing budgets, tracking expenses, and visualizing financial health.

## Technologies Used
- **Frontend**: React, Vite, Material-UI
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
The CapySpend application is split into 2 components: the client (frontend) and the server (backend). The client is built using React and Vite, providing a responsive and user-friendly interface. The server is built with Node.js and Express, handling API requests, user authentication, and integration with Plaid and OpenAI APIs.

**Client**:
- **React**: The client is built using React, providing a dynamic and interactive user interface.
- **Vite**: Vite is used as the build tool and development server, offering fast hot module replacement (HMR) and optimized production builds.
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
![Database Layout](https://github.com/StealthHydra179/spurhacks2025/raw/main/devpost_images/database_layout.png)
The database consists of 7 tables:
- **users**: Stores user information.
- **plaid_users**: Links users to their Plaid access tokens.
- **accounts**: Stores detailed information about connected bank accounts.
- **budgets**: Stores user budget allocations.
- **savings_goals**: Stores user saving goals.
- **bot_conversations**: Stores high-level conversation metadata between users and the AI assistant.
- **conversation_message**: Stores individual messages within conversations.

## Challenges Faced

## Accomplishments that we're proud of

**Agentic AI Capabilities**: We're particularly proud of implementing advanced agentic features that enable our AI assistant to not just provide advice, but to take direct action on user data. The AI can:

- **Create and Update Savings Goals**: Automatically create new financial goals with appropriate details, deadlines, and progress tracking based on user conversations
- **Manage Budgets Proactively**: The AI can analyze user spending patterns and automatically create or update monthly budgets with personalized category allocations
- **Execute Financial Actions**: Through secure tool calls, the AI can directly modify user data in the database, eliminating the need for manual data entry
- **Contextual Decision Making**: The AI understands user financial context and can make informed decisions about budget allocations, goal priorities, and financial recommendations
- **Seamless Integration**: All agentic actions are performed securely through structured tool calls, ensuring data integrity while providing a conversational user experience

**Real Banking Integration**: Successfully integrated with Plaid API to provide real-time access to bank account data, transaction history, and account balances.

**Intelligent Transaction Categorization**: Implemented AI-powered transaction categorization that automatically assigns budget categories to transactions, reducing manual work for users.

**Personalized AI Personality System**: Created a unique system where users can choose their AI assistant's personality (Conservative, Aggressive, Communist, Baby, etc.), making financial advice more relatable and engaging.

**Modern, Responsive UI**: Built a beautiful, intuitive interface using Material-UI that works seamlessly across desktop and mobile devices, providing an excellent user experience.

## What we learned

**Agentic AI and Tool Calls**: We gained deep insights into implementing agentic AI systems that can take action on user data:

- **Tool Call Architecture**: Learned how to design and implement structured tool calls that allow AI to execute specific actions while maintaining security and data integrity. This involved creating function definitions with proper parameter validation and error handling.

- **Context Management**: Discovered the importance of providing rich context to AI models, including user financial data, transaction history, and current goals, enabling the AI to make informed decisions and take appropriate actions.

- **Security Considerations**: Understood the critical importance of validating all AI-generated actions before execution, implementing proper authentication and authorization checks, and ensuring that tool calls can only modify data for the authenticated user.

- **User Experience Design**: Learned how to balance automation with user control - the AI can take actions automatically, but users always have visibility into what's happening and can override or modify decisions.

- **Error Handling**: Developed robust error handling for tool calls, ensuring that failed AI actions don't break the user experience and providing meaningful feedback when operations can't be completed.

- **Conversation Flow**: Mastered the art of designing conversational interfaces where AI actions feel natural and contextual, rather than jarring or unexpected.

**Financial Data Integration**: Gained expertise in securely handling sensitive financial information:

- **Plaid API Integration**: Learned the complexities of integrating with financial APIs, including handling different account types, transaction formats, and error scenarios.

- **Data Synchronization**: Understood the challenges of keeping financial data up-to-date and handling cases where external data might be temporarily unavailable.

- **Privacy and Security**: Developed best practices for storing and processing sensitive financial information while maintaining user privacy and regulatory compliance.

**AI-Powered Categorization**: Discovered the nuances of using AI for transaction categorization:

- **Pattern Recognition**: Learned how to train and fine-tune AI models to recognize spending patterns and assign appropriate categories to transactions.

- **Fallback Strategies**: Implemented robust fallback mechanisms when AI categorization fails, ensuring users always have categorized transactions.

- **User Feedback Integration**: Developed systems to learn from user corrections and improve categorization accuracy over time.

**Modern Web Development**: Enhanced our skills in building complex web applications:

- **State Management**: Learned effective techniques for managing complex application state, especially when dealing with real-time financial data and AI interactions.

- **Real-time Updates**: Implemented systems for updating the UI in real-time as AI actions are performed, providing immediate feedback to users.

- **Responsive Design**: Mastered creating interfaces that work seamlessly across different devices and screen sizes while maintaining functionality and usability.

## What's next for CapySpend

**Enhanced AI Capabilities**:
- **Investment Recommendations**: Expand the AI to provide personalized investment advice based on user risk tolerance, financial goals, and market conditions
- **Debt Management Tools**: Add AI-powered debt payoff strategies, including snowball vs. avalanche method recommendations and automatic payment scheduling
- **Expense Forecasting**: Implement predictive analytics to forecast future expenses and help users prepare for upcoming financial obligations
- **Tax Optimization**: Integrate tax planning features to help users maximize deductions and optimize their tax strategy

**Advanced Financial Features**:
- **Multi-Currency Support**: Add support for international users with multi-currency accounts and real-time exchange rate tracking
- **Bill Payment Integration**: Automate bill payments and provide reminders for upcoming due dates
- **Credit Score Monitoring**: Integrate with credit bureaus to track credit scores and provide improvement recommendations
- **Insurance Analysis**: Help users analyze their insurance coverage and identify potential gaps or over-insurance

**Social and Collaborative Features**:
- **Family Budget Sharing**: Allow families to share budgets and financial goals while maintaining individual privacy
- **Financial Advisor Integration**: Connect users with certified financial advisors for more complex financial planning needs
- **Community Features**: Create a community where users can share financial tips and success stories (anonymously)
- **Mentorship Programs**: Pair users with financial mentors based on their goals and experience level

**Mobile and Accessibility**:
- **Native Mobile Apps**: Develop dedicated iOS and Android applications for better mobile experience
- **Voice Assistant Integration**: Add voice commands for hands-free financial management
- **Accessibility Features**: Implement comprehensive accessibility features for users with disabilities
- **Offline Mode**: Allow basic functionality when internet connectivity is limited

**Advanced Analytics and Insights**:
- **Behavioral Analysis**: Use machine learning to identify spending triggers and help users develop better financial habits
- **Goal Achievement Predictions**: Provide realistic timelines for achieving financial goals based on current spending patterns
- **Comparative Analysis**: Allow users to compare their financial health with similar demographics (anonymously)
- **Financial Health Score**: Create a comprehensive financial health score that considers savings, debt, investments, and spending habits

**Integration and Partnerships**:
- **Retirement Account Integration**: Connect with 401(k), IRA, and other retirement accounts for comprehensive financial planning
- **Real Estate Investment Tools**: Add features for tracking real estate investments and rental property management
- **Cryptocurrency Support**: Integrate with cryptocurrency exchanges for users who invest in digital assets
- **Small Business Features**: Expand to support small business financial management with invoicing and expense tracking

**Security and Compliance**:
- **Advanced Security Features**: Implement biometric authentication, hardware security keys, and advanced fraud detection
- **Regulatory Compliance**: Ensure compliance with financial regulations across different jurisdictions
- **Data Portability**: Allow users to easily export their financial data in standard formats
- **Privacy Controls**: Give users granular control over what data is shared and with whom
