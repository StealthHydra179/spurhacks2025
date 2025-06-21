const {sql} = require('./db');

async function getByID(id) {
    return await sql`SELECT * FROM bot_conversations WHERE id = ${id}`
}

async function getUserConversations(userID){
    return await sql`SELECT * FROM bot_conversations WHERE user_id = ${userID}`
}

module.exports = {
    getByID: getByID,
    getUserConversations: getUserConversations
};