var express = require('express'),
    router = express.Router();

const { sql } = require('../../db/db');
const { logger } = require('../../logger');
const authenticateToken = require('../../jwt');

const botConversationsDb = require('../../db/bot_conversations');
const plaidUsersDb = require('../../db/plaid_users');

const TAG = 'api_bot_conversations';

router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the Bot Conversations API',
        status: 'success'
    });
})

router.post('/create', authenticateToken, async function (req, res) {
    try {
        const { summary } = req.body;
        
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

router.post('/addMessage/:conversationId', authenticateToken, async function (req, res) {
    try {
        const conversationId = req.params.conversationId;
        const { message, sender } = req.body;
        
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

router.get('/getUserConversationSummaries', authenticateToken, async function (req, res) {
    try {
        const userID = req.user.userID;
        const conversations = await botConversationsDb.getUserConversations(userID);

        res.json(conversations);
    } catch (error) {
        logger.error(`${TAG}: Error fetching user conversations: ${error.message}`);
        res.status(500).json({
            message: 'Internal server error',
            status: 'error'
        });
    }
});

router.get('/getFullConversation/:id', authenticateToken, async function (req, res) {
    try {
        const conversationID = req.params.id;
        
        const userID = req.user.userID;

        const conversation = await botConversationsDb.getFullConversation(conversationID);

        if (!conversation.summary || !conversation.messages) {
            return res.status(400).json({ message: "Invalid message" });
        }

        if (conversation.summary[0].user_id !== userID) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        return res.status(200).json(conversation);
    } catch (error) {
        logger.error(`${TAG}: Error fetching conversation: ${error.message}`);
        res.status(500).json({
            message: 'Internal server error',
            status: 'error'
        });
    }
});

/**
 * POST /api/bot_conversations/ask-capy
 * Handle "ask capy a question" submission and create/redirect to chatbot conversation
 */
router.post('/ask-capy', authenticateToken, async (req, res) => {
  try {
    const { user_id, question } = req.body;
    
    // Use authenticated user ID instead of passed user_id
    const userID = req.user.userID;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Create a new bot conversation with the initial question
    const summary = question.length > 50 ? question.substring(0, 50) + '...' : question;
    const newConversation = await botConversationsDb.createConversation(userID, summary);
    
    // Add the user's initial message to the conversation
    await botConversationsDb.addMessageToConversation(newConversation.id, question, 'user');
    
    logger.info(`${TAG}: Created new conversation ${newConversation.id} for user ${userID} with question: ${question}`);
    
    // Generate AI response
    try {
      // Check if user has Plaid data for context
      const plaidUsers = await plaidUsersDb.getByUserID(userID);
      const userContext = {
        hasPlaidData: plaidUsers && plaidUsers.length > 0
      };
      
      const aiResponse = await botConversationsDb.generateAIResponse(question, userContext);
      
      // Add AI response to the conversation
      await botConversationsDb.addMessageToConversation(newConversation.id, aiResponse, 'bot');
      
      logger.info(`${TAG}: Added AI response to conversation ${newConversation.id}`);
    } catch (aiError) {
      logger.error(`${TAG}: Error generating AI response for conversation ${newConversation.id}: ${aiError.message}`);
      // Continue without AI response - conversation still created
    }
    
    res.json({
      success: true,
      conversation_id: newConversation.id,
      redirect_url: `/chat/${newConversation.id}`,
      message: 'Conversation created successfully'
    });
    
  } catch (error) {
    logger.error(`${TAG} Error creating capy conversation: ${error.message}`);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

module.exports = router;
