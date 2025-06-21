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

router.get('/getUserConversationSummaries', async function (req, res) {
    const conversations = await botConversationsDb.getUserConversations(req.user.userID)

    res.json(conversations)
})

router.get('/getFullConversation/:id', async function (req, res) {
    const conversationID = req.params.id
    //todo temp
    req.user = {}
    req.user.userID = 1
    const userID = req.user.userID

    const conversation = await botConversationsDb.getFullConversation(conversationID)

    if (!conversation.summary || !conversation.messages) {
        return res.status(400).json({ message: "Invalid message"})
    }

    if (conversation.summary[0].user_id !== userID) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    return res.status(200).json(conversation)
})

module.exports = router;
