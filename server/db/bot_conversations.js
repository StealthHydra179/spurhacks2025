const {sql} = require('./db');
const OpenAI = require('openai');
const { logger } = require('../logger');

const TAG = 'bot_conversations';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI response using OpenAI GPT-4 mini
 */
async function generateAIResponse(userMessage, userContext = {}) {
  try {
    const systemPrompt = `You are Capy, a friendly and helpful capybara financial assistant for the CapySpend app. 
You help users manage their finances, understand their spending patterns, and make better financial decisions.
Be conversational, supportive, and provide actionable advice.
Keep responses concise but helpful.
If you need specific financial data to answer a question, let the user know what information would be helpful.`;

    const userPrompt = `User question: ${userMessage}
    
Context: The user is using CapySpend, a personal finance app that connects to their bank accounts via Plaid.
${userContext.hasPlaidData ? 'The user has connected their bank accounts.' : 'The user may not have connected their bank accounts yet.'}

Please provide a helpful response.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          "role": "system",
          "content": systemPrompt
        },
        {
          "role": "user", 
          "content": userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logger.error(`${TAG} Error generating AI response: ${error.message}`);
    return "I'm sorry, I'm having trouble generating a response right now. Please try again later, or feel free to ask me about your finances and spending habits!";
  }
}

async function getByID(id) {
    return await sql`SELECT * FROM bot_conversations WHERE id = ${id}`
}

async function getUserConversations(userID){
    return await sql`SELECT * FROM bot_conversations WHERE user_id = ${userID}`
}

async function getFullConversation(conversationID) {
    const summary = await getByID(conversationID)
    const messages = await sql`SELECT * FROM conversation_message WHERE conversation_id = ${conversationID}`
    return {summary: summary, messages: messages}
}

async function createConversation(userID, summary) {
    const result = await sql`
        INSERT INTO bot_conversations (user_id, summary, create_timestamp)
        VALUES (${userID}, ${summary}, NOW())
        RETURNING id, user_id, summary, create_timestamp
    `
    return result[0]
}

async function addMessageToConversation(conversationID, message, sender) {
    // Get the highest message_number for this conversation
    const maxMessageResult = await sql`
        SELECT COALESCE(MAX(message_number), 0) as max_message_number 
        FROM conversation_message 
        WHERE conversation_id = ${conversationID}
    `
    
    const nextMessageNumber = maxMessageResult[0].max_message_number + 1
    
    // Insert the new message
    const result = await sql`
        INSERT INTO conversation_message (conversation_id, message, message_number, sender, message_timestamp)
        VALUES (${conversationID}, ${message}, ${nextMessageNumber}, ${sender}, NOW())
        RETURNING id, conversation_id, message, message_number, sender, message_timestamp
    `
    
    return result[0]
}

module.exports = {
    getByID: getByID,
    getUserConversations: getUserConversations,
    getFullConversation: getFullConversation,
    createConversation: createConversation,
    addMessageToConversation: addMessageToConversation,
    generateAIResponse: generateAIResponse
};