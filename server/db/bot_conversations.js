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

module.exports = {
    getByID: getByID,
    getUserConversations: getUserConversations,
    getFullConversation: getFullConversation
};