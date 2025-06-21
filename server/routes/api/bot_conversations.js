var express = require('express'),
    router = express.Router();

const { sql } = require('../../db/db');
const { logger } = require('../../logger');

const botConversationsDb = require('../../db/bot_conversations');

const TAG = 'api_bot_conversations';

router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the Bot Conversations API',
        status: 'success'
    });
})

router.get('/getUsersConversations', async function (req, res) {
    const conversations = await botConversationsDb.getUserConversations(req.user.userID)

    return conversations
})

module.exports = router;
