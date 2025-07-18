import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
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
  DialogContentText,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Chat as ChatIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import capySVG from "../assets/capyy.svg";
import communistCapy from "../assets/communist-capy.svg";
import babyCapy from "../assets/baby-capy.svg";
import conservativeCapy from "../assets/conservative-capy.svg";
import riskyCapy from "../assets/risky-capy.svg";
import neutralCapy from "../assets/neutral-capy.svg";
import {
  botConversationService,
  plaidService,
  authService,
} from "../services/api";
import type { ConversationSummary, Conversation } from "../types";
import TransactionTableCard from "../components/TransactionTableCard";

const DRAWER_WIDTH = 320;
const COLLAPSED_DRAWER_WIDTH = 80;

// Function to get the appropriate capy image based on personality
const getCapyImage = (personality: number) => {
  // Map personality numbers to specific capy images
  // For now, we'll use the available capySVG for all personalities
  // In the future, you can import and return specific capy images for each personality
  switch (personality) {
    case -1: // Conservative
      return conservativeCapy;
    case 0: // Neutral
      return neutralCapy;
    case 1: // Risky
      return riskyCapy;
    case 2: // Communist
      return communistCapy;
    case 3: // Baby
      return babyCapy;
    default:
      return capySVG;
  }
};

// Helper to extract transaction table from markdown
function extractTransactionTable(markdown: string): string | null {
  // Look for a markdown table with the expected header
  const tableRegex = /\|\s*Date\s*\|\s*Amount\s*\|\s*Merchant\s*\|\s*Category\s*\|[\s\S]+?(\n\s*\n|$)/;
  const match = markdown.match(tableRegex);
  return match ? match[0].trim() : null;
}

// Helper to remove the transaction table from markdown
function removeTransactionTable(markdown: string): string {
  const tableRegex = /\|\s*Date\s*\|\s*Amount\s*\|\s*Merchant\s*\|\s*Category\s*\|[\s\S]+?(\n\s*\n|$)/;
  return markdown.replace(tableRegex, '').trim();
}

const Chatbot: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, personality } = useAuth();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(conversationId || null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState<
    string | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
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
      const conversation = conversations.find(
        (c) => c.id.toString() === conversationId
      );
      if (conversation) {
        fetchConversation(conversationId);
      }
    } else if (!conversationId && conversations.length > 0) {
      // If no conversation selected, select the most recent one
      const mostRecent = conversations[0];
      navigate(`/chat/${mostRecent.id}`, { replace: true });
    }
  }, [conversationId, conversations, creatingConversation]);

  // Load conversation when URL changes
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId]);

  // Load conversations and user personality on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await botConversationService.getUserConversationSummaries();
      // Sort by create_timestamp descending (most recent first)
      const sortedConversations = data.sort(
        (a: ConversationSummary, b: ConversationSummary) =>
          new Date(b.create_timestamp).getTime() -
          new Date(a.create_timestamp).getTime()
      );
      setConversations(sortedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (id: string) => {
    try {
      setLoadingConversation(true);
      const conversation = await botConversationService.getFullConversation(id);

      if (conversation && conversation.messages) {
        setSelectedConversation(conversation);
        setCurrentConversationId(id);
        // Ensure messages are sorted by message_number
        const sortedMessages = conversation.messages.sort(
          (a, b) => a.message_number - b.message_number
        );
        setSelectedConversation({
          ...conversation,
          messages: sortedMessages,
        });
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoadingConversation(false);
    }
  };

  const createNewConversation = async () => {
    if (creatingConversation) return; // Prevent multiple simultaneous requests
    setCreatingConversation(true);

    try {
      // Create a new conversation
      const result = await botConversationService.askCapy(
        user?.id || 0,
        "Hey Capy, I'd like to start a new conversation about my finances."
      );

      // Wait a bit for the conversation to be fully created
      const checkConversationReady = () => {
        setTimeout(async () => {
          try {
            await fetchConversations(); // Refresh the conversations list
            await fetchConversation(result.conversation_id.toString()); // Load the new conversation
            navigate(`/chat/${result.conversation_id}`, { replace: true });
          } catch (error) {
            console.error("Error loading new conversation:", error);
            // Retry once more
            setTimeout(async () => {
              try {
                await fetchConversations();
                await fetchConversation(result.conversation_id.toString());
                navigate(`/chat/${result.conversation_id}`, { replace: true });
              } catch (retryError) {
                console.error("Retry failed:", retryError);
              }
            }, 1000);
          }
        }, 500);
      };

      checkConversationReady();
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setCreatingConversation(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversationId || sending) return;

    const messageToSend = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // Add user message to conversation immediately
      await botConversationService.addMessage(
        currentConversationId,
        messageToSend,
        "user"
      );

      // Refresh the conversation to show the new user message
      await fetchConversation(currentConversationId);

      // Add bot response with typing indicator
      setTimeout(async () => {
        setBotTyping(true); // Show typing indicator
        await addBotResponse(messageToSend);
      }, 500); // Small delay to make it feel more natural
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore the message if sending failed
      setNewMessage(messageToSend);
      setBotTyping(false);
    } finally {
      setSending(false);
    }
  };

  const addBotResponse = async (userMessage: string) => {
    if (!currentConversationId) return;

    try {
      // Call the chat response endpoint to get AI response
      await plaidService.getChatResponse(
        parseInt(currentConversationId),
        userMessage
      );

      // Refresh the conversation to show the new bot message
      await fetchConversation(currentConversationId);
      await fetchConversations(); // Update sidebar with latest message time
    } catch (error) {
      console.error("Error adding bot response:", error);
    } finally {
      // Hide bot typing indicator
      setBotTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to detect if a goal was created from the bot message
  const detectAction = (message: string) => {
    // Look for patterns that indicate a goal was created
    const goalCreatedPattern =
      /Savings goal "([^"]+)" created successfully! Target amount: \$([\d,]+), Deadline: ([^\.]+)/;
    const goalUpdatedPattern =
      /Savings goal "([^"]+)" updated successfully! Target amount: \$([\d,]+), Current progress: \$([\d,]+), Deadline: ([^\.]+)/;
    const budgetUpdatedPattern =
      /Budget (created|updated) successfully! Total monthly budget: \$([\d,]+)\. Breakdown: Housing \$([\d,]+), Food \$([\d,]+), Transportation \$([\d,]+), Health \$([\d,]+), Personal \$([\d,]+), Entertainment \$([\d,]+), Financial \$([\d,]+), Gifts \$([\d,]+)/;
    const budgetProposalPattern =
      /📊 \*\*([^*]+)\*\*\s*\*\*Total Monthly Budget: \$([\d,]+)\*\*\s*\*\*Reasoning:\*\* ([^*]+)\s*\*\*Budget Breakdown:\*\*\s*- Housing: \$([\d,]+)\s*- Food: \$([\d,]+)\s*- Transportation: \$([\d,]+)\s*- Health: \$([\d,]+)\s*- Personal: \$([\d,]+)\s*- Entertainment: \$([\d,]+)\s*- Financial: \$([\d,]+)\s*- Gifts: \$([\d,]+)/;

    const createdMatch = message.match(goalCreatedPattern);
    const updatedMatch = message.match(goalUpdatedPattern);
    const budgetMatch = message.match(budgetUpdatedPattern);
    const budgetProposalMatch = message.match(budgetProposalPattern);

    if (createdMatch) {
      return {
        type: "goal",
        title: createdMatch[1],
        amount: parseFloat(createdMatch[2].replace(/,/g, "")),
        deadline: createdMatch[3] === "No deadline" ? null : createdMatch[3],
        isCreated: true,
        isUpdated: false,
      };
    }

    if (updatedMatch) {
      return {
        type: "goal",
        title: updatedMatch[1],
        amount: parseFloat(updatedMatch[2].replace(/,/g, "")),
        currentAmount: parseFloat(updatedMatch[3].replace(/,/g, "")),
        deadline: updatedMatch[4] === "No deadline" ? null : updatedMatch[4],
        isCreated: false,
        isUpdated: true,
      };
    }

    if (budgetMatch) {
      return {
        type: "budget",
        action: budgetMatch[1],
        total: parseFloat(budgetMatch[2].replace(/,/g, "")),
        housing: parseFloat(budgetMatch[3].replace(/,/g, "")),
        food: parseFloat(budgetMatch[4].replace(/,/g, "")),
        transportation: parseFloat(budgetMatch[5].replace(/,/g, "")),
        health: parseFloat(budgetMatch[6].replace(/,/g, "")),
        personal: parseFloat(budgetMatch[7].replace(/,/g, "")),
        entertainment: parseFloat(budgetMatch[8].replace(/,/g, "")),
        financial: parseFloat(budgetMatch[9].replace(/,/g, "")),
        gifts: parseFloat(budgetMatch[10].replace(/,/g, "")),
      };
    }

    if (budgetProposalMatch) {
      return {
        type: "budget_proposal",
        title: budgetProposalMatch[1],
        total: parseFloat(budgetProposalMatch[2].replace(/,/g, "")),
        description: budgetProposalMatch[3],
        housing: parseFloat(budgetProposalMatch[4].replace(/,/g, "")),
        food: parseFloat(budgetProposalMatch[5].replace(/,/g, "")),
        transportation: parseFloat(budgetProposalMatch[6].replace(/,/g, "")),
        health: parseFloat(budgetProposalMatch[7].replace(/,/g, "")),
        personal: parseFloat(budgetProposalMatch[8].replace(/,/g, "")),
        entertainment: parseFloat(budgetProposalMatch[9].replace(/,/g, "")),
        financial: parseFloat(budgetProposalMatch[10].replace(/,/g, "")),
        gifts: parseFloat(budgetProposalMatch[11].replace(/,/g, "")),
      };
    }

    return null;
  };

  // Goal Card Component
  const GoalCard = ({ goal }: { goal: any }) => (
    <Card
      elevation={2}
      sx={{
        mt: 2,
        borderRadius: 2,
        background: goal.isUpdated
          ? alpha(theme.palette.info.main, 0.05)
          : alpha(theme.palette.success.main, 0.05),
        border: `1px solid ${
          goal.isUpdated
            ? alpha(theme.palette.info.main, 0.2)
            : alpha(theme.palette.success.main, 0.2)
        }`,
        maxWidth: "400px",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: goal.isUpdated
                ? alpha(theme.palette.info.main, 0.1)
                : alpha(theme.palette.success.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            💰
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" fontWeight={600}>
              {goal.title}
            </Typography>
            <Chip
              label={goal.isUpdated ? "Goal Updated" : "New Goal Created"}
              size="small"
              icon={<CheckCircleIcon />}
              sx={{
                backgroundColor: goal.isUpdated
                  ? alpha(theme.palette.info.main, 0.1)
                  : alpha(theme.palette.success.main, 0.1),
                color: goal.isUpdated
                  ? theme.palette.info.main
                  : theme.palette.success.main,
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Target Amount
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={goal.isUpdated ? "info.main" : "success.main"}
          >
            ${goal.amount.toLocaleString()}
          </Typography>
        </Box>

        {goal.isUpdated && goal.currentAmount !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Progress
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              ${goal.currentAmount.toLocaleString()}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(goal.currentAmount / goal.amount) * 100}
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {((goal.currentAmount / goal.amount) * 100).toFixed(1)}% complete
            </Typography>
          </Box>
        )}

        {goal.deadline && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Deadline
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {goal.deadline}
            </Typography>
          </Box>
        )}

        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/dashboard")}
          sx={{ borderRadius: 2 }}
        >
          View in Dashboard
        </Button>
      </CardContent>
    </Card>
  );

  // Budget Card Component
  const BudgetCard = ({ budget }: { budget: any }) => {
    // Compute the total as the sum of all categories
    const computedTotal = [
      budget.housing,
      budget.food,
      budget.transportation,
      budget.health,
      budget.personal,
      budget.entertainment,
      budget.financial,
      budget.gifts
    ].reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

    return (
      <Card
        elevation={2}
        sx={{
          mt: 2,
          borderRadius: 2,
          background: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          maxWidth: "500px",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              📊
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" fontWeight={600}>
                Monthly Budget
              </Typography>
              <Chip
                label={`Budget ${
                  budget.action === "created" ? "Created" : "Updated"
                }`}
                size="small"
                icon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Monthly Budget
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              ${computedTotal.toLocaleString()}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Housing
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.housing.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Food
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.food.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Transportation
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.transportation.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Health
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.health.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Personal
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.personal.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Entertainment
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.entertainment.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Financial
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.financial.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Gifts
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${budget.gifts.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/dashboard")}
            sx={{ borderRadius: 2 }}
          >
            View in Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Budget Proposal Card Component
  const BudgetProposalCard = ({ proposal }: { proposal: any }) => {
    // Compute the total as the sum of all categories
    const computedTotal = [
      proposal.housing,
      proposal.food,
      proposal.transportation,
      proposal.health,
      proposal.personal,
      proposal.entertainment,
      proposal.financial,
      proposal.gifts
    ].reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

    return (
      <Card
        elevation={2}
        sx={{
          mt: 2,
          borderRadius: 2,
          background: alpha(theme.palette.warning.main, 0.05),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          maxWidth: "600px",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: alpha(theme.palette.warning.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              📊
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" fontWeight={600}>
                {proposal.title}
              </Typography>
              <Chip
                label="Budget Proposal"
                size="small"
                icon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Monthly Budget
            </Typography>
            <Typography variant="h6" fontWeight={700} color="warning.main">
              ${computedTotal.toLocaleString()}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 1 }}
            >
              Budget Breakdown
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                "& > div": {
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                },
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  🏠 Housing & Utilities
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.housing.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.housing / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  🍽️ Food & Dining
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.food.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.food / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  🚗 Transportation
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.transportation.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.transportation / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  🏥 Health & Insurance
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.health.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.health / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  👤 Personal & Lifestyle
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.personal.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.personal / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  🎮 Entertainment & Leisure
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.entertainment.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.entertainment / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  💰 Financial & Savings
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.financial.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.financial / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  🎁 Gifts & Donations
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${proposal.gifts.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((proposal.gifts / computedTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const handleConversationSelect = async (
    conversation: ConversationSummary
  ) => {
    setBotTyping(false); // Clear typing indicator when switching conversations
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
    await fetchConversation(conversation.id.toString());
  };

  const handleDeleteConversation = async (
    conversationId: string,
    event: React.MouseEvent
  ) => {
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
      setConversations((prev) =>
        prev.filter((c) => c.id.toString() !== conversationToDelete)
      );

      // If the deleted conversation was the currently selected one, clear the selection
      if (currentConversationId === conversationToDelete) {
        setSelectedConversation(null);
        setCurrentConversationId(null);
        navigate("/chat", { replace: true });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
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

  const toggleSidebar = () => {
    if (sidebarCollapsed) {
      // Expanding - show text after animation completes
      setSidebarCollapsed(false);
      setTimeout(() => {
        setTextVisible(true);
      }, 300); // Match the sidebar transition duration
    } else {
      // Collapsing - hide text immediately
      setTextVisible(false);
      setSidebarCollapsed(true);
    }
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, ml: 1 }}
        >
          {/* Only show collapsible button on desktop */}
          {!isMobile && (
            <IconButton
              onClick={toggleSidebar}
              sx={{
                p: 0,
                "&:hover": {
                  transform: "scale(1.05)",
                },
                transition: "transform 0.2s ease",
              }}
            >
              <Box
                component="img"
                src={getCapyImage(personality)}
                alt="Capy"
                sx={{
                  width: 32,
                  height: 32,
                  objectFit: "contain",
                  display: "block",
                  cursor: "pointer",
                }}
              />
            </IconButton>
          )}
          {/* Show Capy image without collapsible functionality on mobile */}
          {isMobile && (
            <Box
              component="img"
              src={getCapyImage(personality)}
              alt="Capy"
              sx={{
                width: 32,
                height: 32,
                objectFit: "contain",
                display: "block",
              }}
            />
          )}
          {/* Show text based on device and state */}
          {(isMobile || (!isMobile && textVisible)) && (
            <Typography variant="h6" fontWeight={600}>
              Chat with Capy
            </Typography>
          )}
        </Box>
        {/* Show buttons based on device and state */}
        {(isMobile || (!isMobile && !sidebarCollapsed)) && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={createNewConversation}
            disabled={creatingConversation}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              py: 1,
            }}
          >
            New Conversation
          </Button>
        )}
        {!isMobile && sidebarCollapsed && (
          <Button
            variant="contained"
            onClick={createNewConversation}
            disabled={creatingConversation}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              py: 1,
              minWidth: "auto",
              width: 48,
              height: 48,
            }}
          >
            <AddIcon />
          </Button>
        )}
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            {isMobile || (!isMobile && !sidebarCollapsed) ? (
              <>
                <ChatIcon
                  sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No conversations yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start a new conversation to begin chatting with Capy
                </Typography>
              </>
            ) : (
              <ChatIcon sx={{ fontSize: 40, color: "text.secondary" }} />
            )}
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {conversations.map((conversation) => (
              <ListItem key={conversation.id} disablePadding>
                <ListItemButton
                  selected={
                    conversation.id.toString() === currentConversationId
                  }
                  onClick={() => handleConversationSelect(conversation)}
                  sx={{
                    py: 2,
                    px: !isMobile && sidebarCollapsed ? 1 : 2,
                    justifyContent:
                      !isMobile && sidebarCollapsed ? "center" : "flex-start",
                    borderLeft: `5px solid transparent`,
                    "&.Mui-selected": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderLeft: `5px solid ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <ListItemAvatar
                    sx={{
                      minWidth: !isMobile && sidebarCollapsed ? "auto" : 40,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: theme.palette.primary.main,
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={getCapyImage(personality)}
                        alt="Bot"
                        style={{
                          width: "70%",
                          height: "70%",
                          objectFit: "contain",
                          display: "block",
                          margin: "auto",
                        }}
                      />
                    </Avatar>
                  </ListItemAvatar>
                  {(isMobile || (!isMobile && !sidebarCollapsed)) && (
                    <>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {conversation.summary}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {new Date(
                              conversation.create_timestamp
                            ).toLocaleDateString()}
                          </Typography>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) =>
                          handleDeleteConversation(
                            conversation.id.toString(),
                            e
                          )
                        }
                        disabled={
                          deletingConversation === conversation.id.toString()
                        }
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            color: "error.main",
                            backgroundColor: alpha(
                              theme.palette.error.main,
                              0.1
                            ),
                          },
                        }}
                      >
                        {deletingConversation === conversation.id.toString() ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Back to Dashboard and Settings */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {isMobile || (!isMobile && !sidebarCollapsed) ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard")}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                color: "secondary.dark",
              }}
            >
              Dashboard
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate("/settings")}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                color: "secondary.dark",
              }}
            >
              Settings
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard")}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                minWidth: "auto",
                width: 48,
                height: 48,
              }}
            >
              <ArrowBackIcon />
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/settings")}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                minWidth: "auto",
                width: 48,
                height: 48,
              }}
            >
              <SettingsIcon />
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Paper
          elevation={2}
          sx={{
            width: sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
            flexShrink: 0,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
            borderRadius: 0,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: "width 0.3s ease",
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
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: "blur(20px)",
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#FFF3E0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Mobile Menu Button */}
        {isMobile && (
          <Fab
            color="primary"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
            }}
          >
            <MenuIcon />
          </Fab>
        )}

        {/* Capybara SVG in bottom left, behind input box */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            bottom: 10,
            zIndex: 1,
            opacity: 1,
            width: { xs: 150, sm: 220, md: 250 },
            pointerEvents: "none",
          }}
        >
          <Box sx={{ position: "relative" }}>
            <img
              src={getCapyImage(personality)}
              alt="Capybara SVG"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>
        </Box>
        {selectedConversation ? (
          <>
            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: "auto", position: "relative" }}>
              <Box sx={{ p: 2, pb: 8 }}>
                {selectedConversation.messages.map((message, index) => (
                  <Box
                    key={`${message.id}-${index}`}
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      mb: 2,
                      ml:
                        message.sender === "user"
                          ? { xs: "150px", sm: "200px", md: "250px" }
                          : { xs: "160px", sm: "200px", md: "240px" },
                      mr: 0,
                      justifyContent:
                        message.sender === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background:
                          message.sender === "user"
                            ? theme.palette.primary.main
                            : "#FFFCF9",
                        color:
                          message.sender === "user"
                            ? "white"
                            : theme.palette.text.primary,
                        fontSize: "1.25rem",
                        fontWeight: 500,
                        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
                        width: "80%",
                        wordBreak: "break-word",
                      }}
                    >
                      {message.sender === "bot" ? (
                        <Box className="markdown-content">
                          {/* Render Transaction Table Card if present */}
                          {(() => {
                            const table = extractTransactionTable(message.message);
                            if (table) {
                              return <TransactionTableCard markdownTable={table} />;
                            }
                            return null;
                          })()}
                          {/* Render markdown, but remove the table if present */}
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <Typography
                                  variant="body1"
                                  component="span"
                                  sx={{ display: "block", mb: 1 }}
                                >
                                  {children}
                                </Typography>
                              ),
                              h1: ({ children }) => (
                                <Typography
                                  variant="h5"
                                  component="h1"
                                  sx={{ fontWeight: "bold", mb: 1 }}
                                >
                                  {children}
                                </Typography>
                              ),
                              h2: ({ children }) => (
                                <Typography
                                  variant="h6"
                                  component="h2"
                                  sx={{ fontWeight: "bold", mb: 1 }}
                                >
                                  {children}
                                </Typography>
                              ),
                              h3: ({ children }) => (
                                <Typography
                                  variant="subtitle1"
                                  component="h3"
                                  sx={{ fontWeight: "bold", mb: 0.5 }}
                                >
                                  {children}
                                </Typography>
                              ),
                              strong: ({ children }) => (
                                <Typography
                                  component="strong"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {children}
                                </Typography>
                              ),
                              em: ({ children }) => (
                                <Typography
                                  component="em"
                                  sx={{ fontStyle: "italic" }}
                                >
                                  {children}
                                </Typography>
                              ),
                              code: ({ children }) => (
                                <Typography
                                  component="code"
                                  sx={{
                                    backgroundColor: alpha(
                                      theme.palette.background.default,
                                      0.8
                                    ),
                                    padding: "2px 4px",
                                    borderRadius: 1,
                                    fontFamily: "monospace",
                                    fontSize: "0.9em",
                                  }}
                                >
                                  {children}
                                </Typography>
                              ),
                              pre: ({ children }) => (
                                <Box
                                  component="pre"
                                  sx={{
                                    backgroundColor: alpha(
                                      theme.palette.background.default,
                                      0.8
                                    ),
                                    padding: 2,
                                    borderRadius: 1,
                                    overflow: "auto",
                                    fontFamily: "monospace",
                                    fontSize: "0.9em",
                                    my: 1,
                                  }}
                                >
                                  {children}
                                </Box>
                              ),
                              ul: ({ children }) => (
                                <Typography
                                  component="ul"
                                  sx={{ pl: 2, my: 1 }}
                                >
                                  {children}
                                </Typography>
                              ),
                              ol: ({ children }) => (
                                <Typography
                                  component="ol"
                                  sx={{ pl: 2, my: 1 }}
                                >
                                  {children}
                                </Typography>
                              ),
                              li: ({ children }) => (
                                <Typography
                                  component="li"
                                  variant="body1"
                                  sx={{ mb: 0.5 }}
                                >
                                  {children}
                                </Typography>
                              ),
                              blockquote: ({ children }) => (
                                <Box
                                  component="blockquote"
                                  sx={{
                                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    paddingLeft: 2,
                                    margin: "1em 0",
                                    fontStyle: "italic",
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                                  {children}
                                </Box>
                              ),
                              table: ({node, ...props}) => {
                                // Hide the table if we already rendered it as a card
                                const table = extractTransactionTable(message.message);
                                if (table) return null;
                                return <table {...props} />;
                              },
                            }}
                          >
                            {(() => {
                              const table = extractTransactionTable(message.message);
                              if (table) {
                                return removeTransactionTable(message.message);
                              }
                              return message.message;
                            })()}
                          </ReactMarkdown>

                          {/* Display goal card if a goal was created */}
                          {(() => {
                            const action = detectAction(message.message);
                            if (!action) return null;

                            if (action.type === "goal") {
                              return <GoalCard goal={action} />;
                            } else if (action.type === "budget") {
                              return <BudgetCard budget={action} />;
                            } else if (action.type === "budget_proposal") {
                              return <BudgetProposalCard proposal={action} />;
                            }

                            return null;
                          })()}
                        </Box>
                      ) : (
                        <Typography variant="body1">
                          {message.message}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        {new Date(
                          message.message_timestamp
                        ).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                    {message.sender === "user" && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          ml: 1,
                          background: theme.palette.secondary.main,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    )}
                  </Box>
                ))}

                {/* Bot typing indicator */}
                {botTyping && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      mb: 7,
                      ml: { xs: "160px", sm: "200px", md: "240px" },
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: "#FFFCF9",
                        color: theme.palette.text.primary,
                        fontSize: "1.25rem",
                        fontWeight: 500,
                        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
                        minWidth: 60,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: theme.palette.text.secondary,
                              animation:
                                "typing-bounce 1.4s infinite ease-in-out",
                              animationDelay: "0s",
                            }}
                          />
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: theme.palette.text.secondary,
                              animation:
                                "typing-bounce 1.4s infinite ease-in-out",
                              animationDelay: "0.2s",
                            }}
                          />
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: theme.palette.text.secondary,
                              animation:
                                "typing-bounce 1.4s infinite ease-in-out",
                              animationDelay: "0.4s",
                            }}
                          />
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
            </Box>

            {/* Message Input */}
            {/* Message Input Overlay */}
            <Box
              sx={{
                position: "absolute", // or 'fixed' if you want it stuck to the bottom of the screen
                bottom: 0,
                left: 0,
                right: 0,
                display: "flex",
                gap: 2,
                alignItems: "flex-end",
                p: 2,
                zIndex: 10,
                background: "transparent",
                pointerEvents: "none", // allow interactions only on children
              }}
            >
              <Box sx={{ flex: 1, pointerEvents: "auto" }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sending}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }}
                  sx={{
                    borderRadius: 2,
                    background: alpha("#FFE2B6", 0.5),
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    px: 2,
                    py: 1.5,
                  }}
                />
              </Box>
              <Button
                variant="contained"
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                sx={{
                  minWidth: "auto",
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  pointerEvents: "auto",
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 2,
              p: 4,
              textAlign: "center",
            }}
          >
            <Box
              component="img"
              src={getCapyImage(personality)}
              alt="Capy"
              sx={{
                width: 80,
                objectFit: "contain",
                display: "block",
                mx: "auto",
                opacity: 1,
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))",
              }}
            />
            <Typography variant="h5" fontWeight={600} color="text.secondary">
              Welcome to Capy Chat
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              maxWidth={400}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              Select a conversation from the sidebar to continue chatting, or
              start a new conversation to begin.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createNewConversation}
              disabled={creatingConversation}
              sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}
            >
              Start New Conversation
            </Button>
          </Box>
        )}
      </Box>

      {/* New Conversation Loading Overlay */}
      {creatingConversation && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.background.default, 0.8),
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: theme.zIndex.modal,
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box
            component="img"
            src={getCapyImage(personality)}
            alt="Capy"
            sx={{
              width: 80,
              objectFit: "contain",
              display: "block",
              mx: "auto",
              animation: "pulse 1.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 0.8, transform: "scale(1)" },
                "50%": { opacity: 1, transform: "scale(1.05)" },
              },
            }}
          />
          <Typography variant="h6" color="text.primary" textAlign="center">
            Starting new conversation...
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ maxWidth: 300 }}
          >
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
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        }}
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            pb: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <DeleteIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText
            id="alert-dialog-description"
            sx={{
              color: "text.primary",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete this conversation? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={cancelDelete}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              minWidth: 80,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deletingConversation !== null}
            startIcon={
              deletingConversation ? (
                <CircularProgress size={16} />
              ) : (
                <DeleteIcon />
              )
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              minWidth: 80,
            }}
          >
            {deletingConversation ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chatbot;
