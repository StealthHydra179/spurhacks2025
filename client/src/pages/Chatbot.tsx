import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Drawer,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,

  Add as AddIcon,
  Menu as MenuIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';
import { botConversationService, plaidService } from '../services/api';
import type { ConversationSummary, Conversation } from '../types';

const DRAWER_WIDTH = 320;

const Chatbot: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef<HTMLDivElement>(null);  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages, botTyping]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id.toString() === conversationId);
      if (conversation) {
        fetchConversation(conversationId);
      }
    } else if (!conversationId && conversations.length > 0) {
      // If no conversation selected, select the most recent one
      const mostRecent = conversations[0];
      navigate(`/chat/${mostRecent.id}`, { replace: true });
    }
  }, [conversationId, conversations]);
  const fetchConversations = async () => {
    try {
      const data = await botConversationService.getUserConversationSummaries();
      // Sort by create_timestamp descending (most recent first)
      const sortedConversations = data.sort((a: ConversationSummary, b: ConversationSummary) => 
        new Date(b.create_timestamp).getTime() - new Date(a.create_timestamp).getTime()
      );
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };  const fetchConversation = async (id: string) => {
    try {
      const data = await botConversationService.getFullConversation(id);
      setSelectedConversation(data);
      setCurrentConversationId(id);
      setBotTyping(false); // Clear typing indicator when switching conversations
      if (isMobile) {
        setMobileDrawerOpen(false);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setBotTyping(false); // Clear typing indicator on error
    }
  };const createNewConversation = async () => {
    const question = 'Hello! I\'d like to start a new conversation about my finances.';
    try {
      const data = await botConversationService.askCapy(1, question); // TODO: Get actual user ID from auth context
      await fetchConversations(); // Refresh conversations list
      
      // Load the new conversation directly instead of navigating
      await fetchConversation(data.conversation_id.toString());
      
      // Update URL without causing a page refresh
      window.history.pushState(null, '', `/chat/${data.conversation_id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentConversationId) return;

    setSending(true);
    const messageToSend = newMessage;
    setNewMessage('');    try {
      await botConversationService.addMessage(currentConversationId, messageToSend, 'user');
      await fetchConversation(currentConversationId);
      
      // Add bot response with typing indicator
      setTimeout(async () => {
        setBotTyping(true); // Show typing indicator
        await addBotResponse(messageToSend);
      }, 500); // Small delay to make it feel more natural
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageToSend);
      setBotTyping(false);
    } finally {
      setSending(false);
    }
  };  const addBotResponse = async (userMessage: string) => {
    if (!currentConversationId) return;

    try {
      // Call the chat response endpoint to get AI response
      await plaidService.getChatResponse(parseInt(currentConversationId), userMessage);
      
      // Refresh the conversation to show the new bot message
      await fetchConversation(currentConversationId);
      await fetchConversations(); // Update sidebar with latest message time
    } catch (error) {
      console.error('Error adding bot response:', error);
    } finally {
      // Hide bot typing indicator
      setBotTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const handleConversationSelect = async (conversation: ConversationSummary) => {
    // Load the conversation directly instead of navigating
    await fetchConversation(conversation.id.toString());
    
    // Update URL without causing a page refresh
    window.history.pushState(null, '', `/chat/${conversation.id}`);
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            component="img"
            src={capyImage}
            alt="Capy"
            sx={{ width: 32, height: 32, objectFit: 'contain' }}
          />
          <Typography variant="h6" fontWeight={600}>
            Chat with Capy
          </Typography>
        </Box>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={createNewConversation}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            py: 1
          }}
        >
          New Conversation
        </Button>
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Start a new conversation to begin chatting with Capy
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {conversations.map((conversation) => (
              <ListItem key={conversation.id} disablePadding>                <ListItemButton
                  selected={conversation.id.toString() === currentConversationId}
                  onClick={() => handleConversationSelect(conversation)}
                  sx={{
                    py: 2,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderRight: `3px solid ${theme.palette.primary.main}`
                    }
                  }}
                >                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: theme.palette.primary.main
                      }}
                    >
                      <img src={capyImage} alt="Bot" style={{ width: 18, height: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {conversation.summary}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(conversation.create_timestamp).toLocaleDateString()}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Back to Dashboard */}
      <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Paper
          elevation={2}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            borderRadius: 0,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          {sidebarContent}
        </Paper>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          position: 'relative'
        }}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                borderRadius: 0,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isMobile && (
                  <IconButton onClick={() => setMobileDrawerOpen(true)}>
                    <MenuIcon />
                  </IconButton>
                )}
                <Box
                  component="img"
                  src={capyImage}
                  alt="Capy"
                  sx={{ width: 32, height: 32, objectFit: 'contain' }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Capy Assistant
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedConversation.summary[0]?.summary}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {selectedConversation.messages?.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >                  {message.sender === 'bot' && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: theme.palette.primary.main
                      }}
                    >
                      <img src={capyImage} alt="Bot" style={{ width: 18, height: 18 }} />
                    </Avatar>
                  )}
                  
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      borderRadius: 2,
                      background: message.sender === 'user' 
                        ? theme.palette.primary.main 
                        : alpha(theme.palette.background.paper, 0.9),
                      color: message.sender === 'user' 
                        ? theme.palette.primary.contrastText 
                        : theme.palette.text.primary
                    }}
                  >
                    <Typography variant="body1">{message.message}</Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7,
                        display: 'block',
                        mt: 0.5
                      }}
                    >
                      {new Date(message.message_timestamp).toLocaleTimeString()}
                    </Typography>
                  </Paper>

                  {message.sender === 'user' && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: theme.palette.secondary.main
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>                  )}
                </Box>
              ))}
              
              {/* Bot typing indicator */}
              {botTyping && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    justifyContent: 'flex-start'
                  }}
                >                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: theme.palette.primary.main
                    }}
                  >
                    <img src={capyImage} alt="Bot" style={{ width: 18, height: 18 }} />
                  </Avatar>
                    <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.9),
                      color: theme.palette.text.primary,
                      minWidth: 60,
                      '& .typing-dots': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        height: 20,
                        '& .dot': {
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.text.secondary,
                          animation: 'typing-bounce 1.4s infinite ease-in-out',
                          '&:nth-of-type(1)': { animationDelay: '0s' },
                          '&:nth-of-type(2)': { animationDelay: '0.2s' },
                          '&:nth-of-type(3)': { animationDelay: '0.4s' }
                        }
                      },
                      '@keyframes typing-bounce': {
                        '0%, 80%, 100%': {
                          opacity: 0.3,
                          transform: 'scale(0.8)'
                        },
                        '40%': {
                          opacity: 1,
                          transform: 'scale(1)'
                        }
                      }
                    }}
                  >
                    <Box className="typing-dots">
                      <Box className="dot" />
                      <Box className="dot" />
                      <Box className="dot" />
                    </Box>
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                borderRadius: 0,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sending}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  sx={{
                    minWidth: 'auto',
                    width: 48,
                    height: 48,
                    borderRadius: 2
                  }}
                >
                  {sending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SendIcon />
                  )}
                </Button>
              </Box>
            </Paper>
          </>
        ) : (
          // No conversation selected state
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              p: 4,
              textAlign: 'center'
            }}
          >
            {isMobile && (
              <Fab
                color="primary"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ position: 'absolute', top: 16, left: 16 }}
              >
                <MenuIcon />
              </Fab>
            )}
            <Box
              component="img"
              src={capyImage}
              alt="Capy"
              sx={{ width: 80, height: 80, objectFit: 'contain', opacity: 0.6 }}
            />
            <Typography variant="h5" fontWeight={600} color="text.secondary">
              Welcome to Capy Chat
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={400}>
              Select a conversation from the sidebar to continue chatting, or start a new conversation to begin.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createNewConversation}
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
            >
              Start New Conversation
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Chatbot;
