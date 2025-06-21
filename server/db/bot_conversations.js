const {sql} = require('./db');

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
    addMessageToConversation: addMessageToConversation
};