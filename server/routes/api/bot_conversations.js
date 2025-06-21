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

router.post('/create', async function (req, res) {
    try {
        const { summary } = req.body;
        
        // TODO: Remove this temp assignment when auth is properly implemented
        if (!req.user) {
            req.user = { userID: 1 };
        }
        
        const userID = req.user.userID;
        
        if (!summary) {
            return res.status(400).json({ 
                message: 'Summary is required',
                status: 'error'
            });
        }
        
        const newConversation = await botConversationsDb.createConversation(userID, summary);
        
        logger.info(`${TAG}: Created new conversation with ID ${newConversation.id} for user ${userID}`);
        
        res.status(201).json({
            message: 'Conversation created successfully',
            status: 'success',
            conversation: newConversation
        });
        
    } catch (error) {
        logger.error(`${TAG}: Error creating conversation: ${error.message}`);
        res.status(500).json({
            message: 'Internal server error',
            status: 'error'
        });
    }
});

router.post('/addMessage/:conversationId', async function (req, res) {
    try {
        const conversationId = req.params.conversationId;
        const { message, sender } = req.body;
        
        // TODO: Remove this temp assignment when auth is properly implemented
        if (!req.user) {
            req.user = { userID: 1 };
        }
        
        const userID = req.user.userID;
        
        // Validate required fields
        if (!message || !sender) {
            return res.status(400).json({
                message: 'Message and sender are required',
                status: 'error'
            });
        }
        
        // Validate sender is either 'user' or 'bot'
        if (!['user', 'bot'].includes(sender)) {
            return res.status(400).json({
                message: 'Sender must be either "user" or "bot"',
                status: 'error'
            });
        }
        
        // Check if conversation exists and belongs to the user
        const conversation = await botConversationsDb.getByID(conversationId);
        if (!conversation || conversation.length === 0) {
            return res.status(404).json({
                message: 'Conversation not found',
                status: 'error'
            });
        }
        
        if (conversation[0].user_id !== userID) {
            return res.status(403).json({
                message: 'Access denied to this conversation',
                status: 'error'
            });
        }
        
        // Add the message to the conversation
        const newMessage = await botConversationsDb.addMessageToConversation(conversationId, message, sender);
        
        logger.info(`${TAG}: Added message ${newMessage.message_number} to conversation ${conversationId} by ${sender}`);
        
        res.status(201).json({
            message: 'Message added successfully',
            status: 'success',
            messageData: newMessage
        });
        
    } catch (error) {
        logger.error(`${TAG}: Error adding message to conversation: ${error.message}`);
        res.status(500).json({
            message: 'Internal server error',
            status: 'error'
        });
    }
});

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
