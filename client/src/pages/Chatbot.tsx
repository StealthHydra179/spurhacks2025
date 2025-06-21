import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import capySVG from '../assets/capyy.svg';
import capyImage from '../assets/capy.png';
import { botConversationService, plaidService } from '../services/api';
import type { ConversationSummary, Conversation } from '../types';

const DRAWER_WIDTH = 320;

const Chatbot: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [newMessage, setNewMessage] = useState('');const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

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
    if (creatingConversation) return; // Don't auto-navigate when creating a conversation
    
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
  }, [conversationId, conversations, creatingConversation]);
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
    }  };const createNewConversation = async () => {
    if (creatingConversation) return; // Prevent multiple simultaneous requests
      setCreatingConversation(true);
    
    // Clear current conversation immediately to hide old chat
    setSelectedConversation(null);
    setCurrentConversationId(null);
    
    // Close mobile drawer if open
    setMobileDrawerOpen(false);
      const question = 'Hello! I\'d like to start a new conversation about my finances.';    
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      const data = await botConversationService.askCapy(user.id, question);
      
      // Set the new conversation ID immediately to prevent race conditions
      const newConversationId = data.conversation_id.toString();
      setCurrentConversationId(newConversationId);
      
      // Navigate to the new conversation first
      navigate(`/chat/${newConversationId}`, { replace: true });
      
      // Then refresh conversations list and load conversation data
      await fetchConversations();
      await fetchConversation(newConversationId);
        // Check if conversation has messages, if not wait a bit longer
      let attempts = 0;
      const maxAttempts = 10; // Maximum 5 seconds (10 * 500ms)
      
      const checkConversationReady = () => {
        attempts++;
        if (selectedConversation && selectedConversation.messages && selectedConversation.messages.length >= 2) {
          // We have both user and bot messages
          setCreatingConversation(false);
        } else if (attempts < maxAttempts) {
          // Wait a bit more and check again
          setTimeout(checkConversationReady, 500);
        } else {
          // Timeout - hide loading anyway
          setCreatingConversation(false);
        }
      };
      
      // Start checking after a short delay
      setTimeout(checkConversationReady, 1000);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      setCreatingConversation(false);
    }
  };const sendMessage = async () => {
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
    await fetchConversation(conversation.id.toString());
  };

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent conversation selection when clicking delete
    
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      setDeletingConversation(conversationToDelete);
      await botConversationService.deleteConversation(conversationToDelete);
      
      // Remove the conversation from the list
      setConversations(prev => prev.filter(c => c.id.toString() !== conversationToDelete));
      
      // If the deleted conversation was the currently selected one, clear the selection
      if (currentConversationId === conversationToDelete) {
        setSelectedConversation(null);
        setCurrentConversationId(null);
        navigate('/chat', { replace: true });
      }
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      // You could add a snackbar here for better UX
    } finally {
      setDeletingConversation(null);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
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
            sx={{ width: 32, objectFit: 'contain', display: 'block' }}
          />
          <Typography variant="h6" fontWeight={600}>
            Chat with Capy
          </Typography>
        </Box>        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={createNewConversation}
          disabled={creatingConversation}
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
              <ListItem key={conversation.id} disablePadding>
                <ListItemButton
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
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: theme.palette.primary.main,
                        flexShrink: 0
                      }}
                    >
                      <img 
                        src={capyImage} 
                        alt="Bot" 
                        style={{ 
                          width: '70%', 
                          height: '70%', 
                          objectFit: 'contain',
                          display: 'block',
                          margin: 'auto'
                        }} 
                      />
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
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteConversation(conversation.id.toString(), e)}
                    disabled={deletingConversation === conversation.id.toString()}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'error.main',
                        backgroundColor: alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                  >
                    {deletingConversation === conversation.id.toString() ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DeleteIcon fontSize="small" />
                    )}
                  </IconButton>
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
          background: '#FFF3E0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Capybara SVG in bottom left, behind input box */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            bottom: 10,
            zIndex: 1,
            opacity: 1,
            width: { xs: 150, sm: 220, md: 250 },
            pointerEvents: 'none',
          }}
        >
          <img src={capySVG} alt="Capybara SVG" style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} />
        </Box>
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
                  sx={{ width: 32, objectFit: 'contain', display: 'block' }}
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
                p: '16px 40px 16px 16px',
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
                    width: '100%',
                    justifyContent: 'flex-end',
                    flexDirection: 'row',
                  }}
                >
                  {/* For bot: Avatar left, Paper right. For user: Paper left, Avatar right. */}
                  {message.sender === 'bot' && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: theme.palette.primary.main,
                        flexShrink: 0
                      }}
                    >
                      <img src={capyImage} alt="Capy" style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block', margin: 'auto' }} />
                    </Avatar>
                  )}
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      borderRadius: 2,
                      background: message.sender === 'user'
                        ? '#FFE2B6'
                        : '#FFFCF9',
                      color: message.sender === 'user'
                        ? theme.palette.text.primary
                        : theme.palette.text.primary,
                      boxShadow: message.sender === 'user' ? '0 2px 8px 0 rgba(0,0,0,0.08)' : undefined,
                      ml: 0,
                      mr: 0,
                      mb: message.sender === 'bot' ? { xs: 10, sm: 15, md: 20} : 0,
                    }}
                  >
                    {message.sender === 'bot' ? (
                      <Box className="markdown-content">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <Typography variant="body1" component="span" sx={{ display: 'block', mb: 1 }}>
                                {children}
                              </Typography>
                            ),
                          h1: ({ children }) => (
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {children}
                            </Typography>
                          ),
                          h2: ({ children }) => (
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {children}
                            </Typography>
                          ),
                          h3: ({ children }) => (
                            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {children}
                            </Typography>
                          ),
                          strong: ({ children }) => (
                            <Typography component="strong" sx={{ fontWeight: 'bold' }}>
                              {children}
                            </Typography>
                          ),
                          em: ({ children }) => (
                            <Typography component="em" sx={{ fontStyle: 'italic' }}>
                              {children}
                            </Typography>
                          ),
                          code: ({ children }) => (
                            <Typography 
                              component="code" 
                              sx={{ 
                                backgroundColor: alpha(theme.palette.background.default, 0.8),
                                padding: '2px 4px',
                                borderRadius: 1,
                                fontFamily: 'monospace',
                                fontSize: '0.9em'
                              }}
                            >
                              {children}
                            </Typography>
                          ),
                          pre: ({ children }) => (
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor: alpha(theme.palette.background.default, 0.8),
                                padding: 2,
                                borderRadius: 1,
                                overflow: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                                my: 1
                              }}
                            >
                              {children}
                            </Box>
                          ),
                          ul: ({ children }) => (
                            <Typography component="ul" sx={{ pl: 2, my: 1 }}>
                              {children}
                            </Typography>
                          ),
                          ol: ({ children }) => (
                            <Typography component="ol" sx={{ pl: 2, my: 1 }}>
                              {children}
                            </Typography>
                          ),
                          li: ({ children }) => (
                            <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
                              {children}
                            </Typography>
                          ),
                          blockquote: ({ children }) => (
                            <Box
                              component="blockquote"
                              sx={{
                                borderLeft: `4px solid ${theme.palette.primary.main}`,
                                paddingLeft: 2,
                                margin: '1em 0',
                                fontStyle: 'italic',
                                color: theme.palette.text.secondary
                              }}
                            >
                              {children}
                            </Box>
                          )
                        }}                        >
                          {message.message}
                        </ReactMarkdown>
                      </Box>
                    ) : (
                      <Typography variant="body1">{message.message}</Typography>
                    )}
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
                    </Avatar>
                  )}
                </Box>
              ))}
              
              {/* Bot typing indicator */}
              {botTyping && (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2, ml: { xs: '150px', sm: '200px', md: '250px' } }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: '#FFFCF9',
                      color: theme.palette.text.primary,
                      fontSize: '1.25rem',
                      fontWeight: 500,
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                      minWidth: 80,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Typing</span>
                      <Box sx={{ display: 'inline-flex', ml: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: theme.palette.text.secondary, mx: 0.2, animation: 'typing-bounce 1.4s infinite ease-in-out', animationDelay: '0s' }} />
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: theme.palette.text.secondary, mx: 0.2, animation: 'typing-bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }} />
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: theme.palette.text.secondary, mx: 0.2, animation: 'typing-bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
                      </Box>
                    </Box>
                    <style>{`
                      @keyframes typing-bounce {
                        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                        40% { opacity: 1; transform: scale(1); }
                      }
                    `}</style>
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', p: 2, zIndex: 2, position: 'relative', background: 'transparent' }}>
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
                    borderRadius: 2,
                    background: '#FFE2B6',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                    border: 'none',
                    '& fieldset': {
                      border: 'none',
                    },
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
              sx={{ width: 80, objectFit: 'contain', display: 'block', mx: 'auto', opacity: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }}
            />
            <Typography variant="h5" fontWeight={600} color="text.secondary">
              Welcome to Capy Chat
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={400}>
              Select a conversation from the sidebar to continue chatting, or start a new conversation to begin.
            </Typography>            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createNewConversation}
              disabled={creatingConversation}
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
            >
              Start New Conversation
            </Button></Box>
        )}
      </Box>

      {/* New Conversation Loading Overlay */}
      {creatingConversation && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.background.default, 0.8),
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: theme.zIndex.modal,
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Box
            component="img"
            src={capyImage}
            alt="Capy"
            sx={{ width: 80, objectFit: 'contain', display: 'block', mx: 'auto', animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { opacity: 0.8, transform: 'scale(1)' }, '50%': { opacity: 1, transform: 'scale(1.05)' } } }}
          />
          <Typography variant="h6" color="text.primary" textAlign="center">
            Starting new conversation...
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 300 }}>
            Capy is preparing to chat with you about your finances
          </Typography>
          <CircularProgress size={40} thickness={4} />
        </Box>
      )}

{/* Delete Dialog */}
<Dialog
open={deleteDialogOpen}
onClose={cancelDelete}
aria-labelledby="alert-dialog-title"
aria-describedby="alert-dialog-description"
PaperProps={{
  sx: {
    borderRadius: 2,
    background: alpha(theme.palette.background.paper, 0.95),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
  }
}}
>
<DialogTitle 
  id="alert-dialog-title"
  sx={{
    pb: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 1
  }}
>
  <DeleteIcon color="error" />
  Confirm Deletion
</DialogTitle>
<DialogContent sx={{ pb: 2 }}>
  <DialogContentText 
    id="alert-dialog-description"
    sx={{ 
      color: 'text.primary',
      fontSize: '1rem',
      lineHeight: 1.5
    }}
  >
    Are you sure you want to delete this conversation? This action cannot be undone.
  </DialogContentText>
</DialogContent>
<DialogActions sx={{ p: 2, pt: 0 }}>
  <Button 
    onClick={cancelDelete}
    variant="outlined"
    sx={{ 
      borderRadius: 2,
      textTransform: 'none',
      minWidth: 80
    }}
  >
    Cancel
  </Button>
  <Button 
    onClick={confirmDelete} 
    variant="contained"
    color="error"
    disabled={deletingConversation !== null}
    startIcon={deletingConversation ? <CircularProgress size={16} /> : <DeleteIcon />}
    sx={{ 
      borderRadius: 2,
      textTransform: 'none',
      minWidth: 80
    }}
  >
    {deletingConversation ? 'Deleting...' : 'Delete'}
  </Button>
</DialogActions>
</Dialog>
</Box>
);
};

export default Chatbot;
