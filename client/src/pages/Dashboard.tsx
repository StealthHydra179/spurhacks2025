import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { plaidService } from '../services/api';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Divider,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  TrendingUp,
  Receipt,
  MonetizationOn,
  Search as SearchIcon,
  Settings as SettingsIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import capyImage from '../assets/capy.png';
import { useNavigate } from 'react-router-dom';
import { botConversationService } from '../services/api';

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category: string[] | null;
  payment_channel: string;
  pending: boolean;
  merchant_name: string | null;
  logo_url: string | null;
  personal_finance_category: {
    primary: string;
    detailed: string;
    confidence_level: string;
  } | null;
  counterparties: Array<{
    name: string;
    type: string;
    logo_url: string | null;
    website: string | null;
  }> | null;
  location: {
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
  } | null;
  iso_currency_code: string;
  transaction_type: string;
  authorized_date: string | null;
  datetime: string | null;
}

interface MonthlySummary {
  income: number;
  expenses: number;
  netChange: number;
  transactionCount: number;
  month: string;
  year: number;
}

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'debt' | 'investment' | 'purchase' | 'emergency';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  icon: string;
  color: string;
}

// Mock goals data
const mockGoals: FinancialGoal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    description: 'Build a 6-month emergency fund for unexpected expenses',
    targetAmount: 15000,
    currentAmount: 8500,
    deadline: '2025-12-31',
    category: 'emergency',
    priority: 'high',
    status: 'active',
    createdAt: '2024-01-15',
    icon: '🛡️',
    color: '#FF6B6B'
  },
  {
    id: '2',
    title: 'Vacation Fund',
    description: 'Save for a dream vacation to Japan',
    targetAmount: 8000,
    currentAmount: 3200,
    deadline: '2025-06-30',
    category: 'savings',
    priority: 'medium',
    status: 'active',
    createdAt: '2024-02-01',
    icon: '✈️',
    color: '#4ECDC4'
  },
  {
    id: '3',
    title: 'Pay Off Credit Card',
    description: 'Eliminate high-interest credit card debt',
    targetAmount: 5000,
    currentAmount: 3500,
    deadline: '2025-03-31',
    category: 'debt',
    priority: 'high',
    status: 'active',
    createdAt: '2024-01-01',
    icon: '💳',
    color: '#45B7D1'
  },
  {
    id: '4',
    title: 'Investment Portfolio',
    description: 'Start building a diversified investment portfolio',
    targetAmount: 10000,
    currentAmount: 1200,
    deadline: '2025-12-31',
    category: 'investment',
    priority: 'medium',
    status: 'active',
    createdAt: '2024-03-01',
    icon: '📈',
    color: '#96CEB4'
  },
  {
    id: '5',
    title: 'New Laptop',
    description: 'Save for a new MacBook Pro for work',
    targetAmount: 2500,
    currentAmount: 1800,
    deadline: '2025-04-30',
    category: 'purchase',
    priority: 'low',
    status: 'active',
    createdAt: '2024-02-15',
    icon: '💻',
    color: '#FFEAA7'
  },
  {
    id: '6',
    title: 'Home Down Payment',
    description: 'Save for a 20% down payment on a house',
    targetAmount: 80000,
    currentAmount: 15000,
    deadline: '2027-12-31',
    category: 'savings',
    priority: 'high',
    status: 'active',
    createdAt: '2023-06-01',
    icon: '🏠',
    color: '#DDA0DD'
  }
];

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    income: 0,
    expenses: 0,
    netChange: 0,
    transactionCount: 0,
    month: '',
    year: 0
  });  const [recentTransactions, setRecentTransactions] = useState<PlaidTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAskingCapy, setIsAskingCapy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [isPlaidLinked, setIsPlaidLinked] = useState<boolean | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>(mockGoals);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'accounts'>('overview');
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [balances, setBalances] = useState<any>(null);
  const [isBalancesLoading, setIsBalancesLoading] = useState(false);

  // Get current month's date range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of current month
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      monthName: startDate.toLocaleDateString('en-US', { month: 'long' }),
      year: year
    };
  };

  // Calculate monthly summary from transactions
  const calculateMonthlySummary = (transactions: PlaidTransaction[]): MonthlySummary => {
    const { monthName, year } = getCurrentMonthRange();
    
    let income = 0;
    let expenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.amount < 0) {
        // Negative amounts are deposits (money coming into account)
        income += Math.abs(transaction.amount);
      } else {
        // Positive amounts are expenses (money going out of account)
        expenses += transaction.amount;
      }
    });
    
    return {
      income,
      expenses,
      netChange: income - expenses,
      transactionCount: transactions.length,
      month: monthName,
      year
    };
  };

  // Process category data for pie chart
  const processCategoryData = (transactions: PlaidTransaction[]) => {
    const categoryMap = new Map<string, number>();
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];

    // Function to format category names for better display
    const formatCategoryName = (category: string): string => {
      return category
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Only process expense transactions (positive amounts)
    transactions.forEach(transaction => {
      if (transaction.amount > 0) {
        const category = transaction.personal_finance_category?.primary || 
                        transaction.category?.[0] || 
                        'Uncategorized';
        const formattedCategory = formatCategoryName(category);
        categoryMap.set(formattedCategory, (categoryMap.get(formattedCategory) || 0) + transaction.amount);
      }
    });
    
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
    
    setCategoryData(categoryData);
  };

  // Fetch transactions for current month
  const fetchMonthlyData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { startDate, endDate } = getCurrentMonthRange();
      
      console.log('🔍 Fetching monthly transactions:', {
        userId: user.id,
        startDate,
        endDate
      });
      
      const response = await plaidService.getTransactions(user.id.toString(), startDate, endDate);
      const transactions = response.transactions || [];
      
      console.log('✅ Monthly transactions received:', {
        count: transactions.length,
        sample: transactions.slice(0, 3).map(t => ({
          name: t.name,
          amount: t.amount,
          date: t.date
        }))
      });
      
      const summary = calculateMonthlySummary(transactions);
      setMonthlySummary(summary);
      
      // Get recent transactions (last 5)
      const recent = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecentTransactions(recent);
      
      // Process category data for pie chart
      processCategoryData(transactions);
      
    } catch (err: any) {
      console.error('❌ Failed to fetch monthly data:', err);
      setError(err.response?.data?.message || 'Failed to fetch monthly data');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if Plaid is linked
  useEffect(() => {
    const checkPlaidLinked = async () => {
      if (!user?.id) return;
      try {
        const res = await plaidService.getItemStatus(user.id.toString());
        setIsPlaidLinked(res.has_linked_item);
      } catch (err) {
        setIsPlaidLinked(false); // fallback: treat as not linked
      }
    };
    checkPlaidLinked();
  }, [user?.id]);

  // Only fetch transactions if Plaid is linked
  useEffect(() => {
    if (!user?.id || isPlaidLinked !== true) return;
    fetchMonthlyData();
    // eslint-disable-next-line
  }, [user?.id, isPlaidLinked]);

  // Fetch balances for all accounts
  const fetchBalances = async () => {
    if (!user?.id) return;
    try {
      setIsBalancesLoading(true);
      const data = await plaidService.getBalances(user.id.toString());
      setBalances(data);
    } catch (err: any) {
      setBalances(null);
      // Optionally setError(err.response?.data?.message || 'Failed to fetch balances');
    } finally {
      setIsBalancesLoading(false);
    }
  };

  // Fetch balances when Plaid is linked
  useEffect(() => {
    if (!user?.id || isPlaidLinked !== true) return;
    fetchBalances();
    // eslint-disable-next-line
  }, [user?.id, isPlaidLinked]);

  // Profile menu handlers
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const handleLogoutClick = async () => {
    handleProfileMenuClose();
    await logout();
  };

  const handleSearchSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // If no input, navigate to chat page
      navigate('/chat');
      return;
    }

    setIsAskingCapy(true);
    try {
      // Call the ask-capy API to create a new conversation
      const data = await botConversationService.askCapy(user?.id || 1, searchQuery);
      // Navigate to the new conversation
      navigate(`/chat/${data.conversation_id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback: just navigate to chat page
      navigate('/chat');
    } finally {
      setIsAskingCapy(false);
    }
  };

  const handleSearchButtonClick = () => {
    if (!searchQuery.trim()) {
      // If no input, navigate to chat page
      navigate('/chat');
    } else {
      // If there's input, submit the search
      handleSearchSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Fix timezone issue: Parse the date string and convert to local timezone
    const date = new Date(dateString + 'T00:00:00'); // Add time to ensure proper parsing
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Goals helper functions
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings': return '💰';
      case 'debt': return '💳';
      case 'investment': return '📈';
      case 'purchase': return '🛒';
      case 'emergency': return '🛡️';
      default: return '🎯';
    }
  };

  const handleGoalClick = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setIsGoalDialogOpen(true);
  };

  const handleCloseGoalDialog = () => {
    setIsGoalDialogOpen(false);
    setSelectedGoal(null);
  };

  // Helper for tab navigation
  const renderTabNavigation = () => (
    <Box sx={{ display: 'flex', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, mb: 3 }}>
      <Button
        onClick={() => setActiveTab('overview')}
        sx={{
          flex: 1,
          py: 2,
          borderRadius: 0,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          color: activeTab === 'overview' ? theme.palette.primary.main : theme.palette.text.secondary,
          borderBottom: activeTab === 'overview' ? `3px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: activeTab === 'overview' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }
        }}
      >
        Overview
      </Button>
      <Button
        onClick={() => setActiveTab('goals')}
        sx={{
          flex: 1,
          py: 2,
          borderRadius: 0,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          color: activeTab === 'goals' ? theme.palette.primary.main : theme.palette.text.secondary,
          borderBottom: activeTab === 'goals' ? `3px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: activeTab === 'goals' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }
        }}
      >
        <FlagIcon sx={{ mr: 1, fontSize: 20 }} />
        Financial Goals
      </Button>
      <Button
        onClick={() => setActiveTab('accounts')}
        sx={{
          flex: 1,
          py: 2,
          borderRadius: 0,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          color: activeTab === 'accounts' ? theme.palette.primary.main : theme.palette.text.secondary,
          borderBottom: activeTab === 'accounts' ? `3px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: activeTab === 'accounts' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }
        }}
      >
        <MonetizationOn sx={{ mr: 1, fontSize: 20 }} />
        Accounts
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        py: 4,
        position: 'relative'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={capyImage}
                alt="CapySpend Logo"
                sx={{
                  width: 60,
                  height: 60,
                  objectFit: 'contain',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                }}
              />
              <Box>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  CapySpend
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Welcome back!
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center', mx: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>                <TextField
                  variant="outlined"
                  placeholder={isAskingCapy ? "Capy is thinking..." : "Ask capy a question about your finances"}
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {isAskingCapy && (
                          <CircularProgress size={20} color="primary" />
                        )}
                      </InputAdornment>
                    ),
                  }}
                  disabled={isAskingCapy}
                  sx={{
                    minWidth: { xs: 200, sm: 250, md: 300, lg: 400 },
                    maxWidth: { xs: 250, sm: 350, md: 450, lg: 600 },
                    width: { xs: '100%', sm: '80%', md: '70%', lg: '60%' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary,
                      '&::placeholder': {
                        color: theme.palette.text.secondary,
                        opacity: 1,
                      },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleSearchButtonClick}
                  sx={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: '50%',
                    px: 0,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    border: `2px solid ${theme.palette.primary.main}`,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      border: `2px solid ${theme.palette.primary.dark}`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    transition: 'all 0.2s ease',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 20 }} />
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Profile menu">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  onMouseEnter={handleProfileMenuOpen}
                  sx={{
                    p: 0,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                      cursor: 'pointer'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 24 }} />
                  </Avatar>
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
                onMouseLeave={handleProfileMenuClose}
                disableScrollLock={true}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 250,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`
                  }
                }}
              >
                {/* User Info Section */}
                <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {user?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <MenuItem onClick={handleSettingsClick} sx={{ py: 1.5 }}>
                  <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogoutClick} sx={{ py: 1.5, color: theme.palette.error.main }}>
                  <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>

        {/* Plaid linked status loading */}
        {isPlaidLinked === null && (
          <Card elevation={8} sx={{ mb: 4, borderRadius: 2, background: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(20px)', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Checking Plaid account status...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we check your account connection.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Plaid not linked CTA */}
        {isPlaidLinked === false && (
          <Card elevation={8} sx={{ mb: 4, borderRadius: 2, background: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(20px)', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Link your bank account to get started
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                To see your financial summary, please link your account with Plaid.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 2, borderRadius: 2, px: 4, py: 1 }}
                onClick={() => navigate('/settings')}
              >
                Link with Plaid
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Only show dashboard if Plaid is linked */}
        {isPlaidLinked && (
          <>
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <>
                {/* Monthly Summary Header */}
                <Card
                  elevation={4}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {renderTabNavigation()}

                    {/* Stats Grid */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {/* Total Balance Card */}
                      <Card
                        elevation={4}
                        sx={{
                          flex: '1 1 200px',
                          borderRadius: 2,
                          background: alpha(theme.palette.background.paper, 0.95),
                          backdropFilter: 'blur(20px)',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[12]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                              mx: 'auto',
                              mb: 2
                            }}
                          >
                            <MonetizationOn sx={{ fontSize: 25 }} />
                          </Avatar>
                          {isBalancesLoading ? (
                            <CircularProgress size={30} sx={{ mb: 2 }} />
                          ) : (
                            <Typography variant="h5" fontWeight={700} gutterBottom color="primary.main">
                              {balances && balances.accounts
                                ? formatCurrency(balances.accounts.reduce((sum: number, acc: any) => sum + (acc.balances?.current || 0), 0))
                                : '--'}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Total Balance
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card
                        elevation={4}
                        onClick={() => navigate('/income')}
                        sx={{
                          flex: '1 1 200px',
                          borderRadius: 2,
                          backdropFilter: 'blur(20px)',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[12]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,
                              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                              mx: 'auto',
                              mb: 2
                            }}
                          >
                            <TrendingUp sx={{ fontSize: 25 }} />
                          </Avatar>
                          {isLoading ? (
                            <CircularProgress size={30} sx={{ mb: 2 }} />
                          ) : (
                            <Typography variant="h5" fontWeight={700} gutterBottom color="success.main">
                              {formatCurrency(monthlySummary.income)}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Total Income
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card
                        elevation={4}
                        onClick={() => navigate('/expenses')}
                        sx={{
                          flex: '1 1 200px',
                          borderRadius: 2,
                          background: alpha(theme.palette.background.paper, 0.95),
                          backdropFilter: 'blur(20px)',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[12]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,
                              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                              mx: 'auto',
                              mb: 2
                            }}
                          >
                            <Receipt sx={{ fontSize: 25 }} />
                          </Avatar>
                          {isLoading ? (
                            <CircularProgress size={30} sx={{ mb: 2 }} />
                          ) : (
                            <Typography variant="h5" fontWeight={700} gutterBottom color="warning.main">
                              {formatCurrency(monthlySummary.expenses)}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Total Expenses
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card
                        elevation={4}
                        onClick={() => navigate('/transactions')}
                        sx={{
                          flex: '1 1 200px',
                          borderRadius: 2,
                          background: alpha(theme.palette.background.paper, 0.95),
                          backdropFilter: 'blur(20px)',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[12]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,
                              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                              mx: 'auto',
                              mb: 2
                            }}
                          >
                            <MonetizationOn sx={{ fontSize: 25 }} />
                          </Avatar>
                          {isLoading ? (
                            <CircularProgress size={30} sx={{ mb: 2 }} />
                          ) : (
                            <Typography 
                              variant="h5" 
                              fontWeight={700} 
                              gutterBottom 
                              color={monthlySummary.netChange >= 0 ? "success.main" : "error.main"}
                            >
                              {formatCurrency(monthlySummary.netChange)}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Net Change
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </CardContent>
                </Card>

                {/* Spending by Category Pie Chart */}
                {categoryData.length > 0 && (
                  <Card
                    elevation={4}
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.95),
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Spending by Category
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Breakdown of your expenses this month
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
                        <Box sx={{ width: { xs: '100%', md: '50%' }, height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                labelFormatter={(label) => `Category: ${label}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                        
                        <Box sx={{ flex: 1, width: { xs: '100%', md: '50%' } }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Category Breakdown
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {categoryData.slice(0, 8).map((category, index) => (
                              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: category.color,
                                    flexShrink: 0
                                  }}
                                />
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {category.name}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {formatCurrency(category.value)}
                                </Typography>
                              </Box>
                            ))}
                            {categoryData.length > 8 && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                +{categoryData.length - 8} more categories
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                )}

                {/* Recent Activity */}
                <Card
                  elevation={8}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Recent Activity
                      </Typography>
                      <Button
                        variant="text"
                        onClick={() => navigate('/transactions')}
                        sx={{
                          color: theme.palette.primary.main,
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        View All Transactions
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    
                    {isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : recentTransactions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          No recent transactions found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your recent transactions will appear here
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {recentTransactions.map((transaction) => (
                          <Box key={transaction.transaction_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                              {transaction.logo_url ? (
                                <Avatar
                                  src={transaction.logo_url}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: alpha(transaction.amount < 0 ? theme.palette.success.main : theme.palette.error.main, 0.1)
                                  }}
                                />
                              ) : (
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: alpha(transaction.amount < 0 ? theme.palette.success.main : theme.palette.error.main, 0.1),
                                    color: transaction.amount < 0 ? theme.palette.success.main : theme.palette.error.main
                                  }}
                                >
                                  {transaction.personal_finance_category?.primary?.charAt(0) || transaction.name.charAt(0)}
                                </Avatar>
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight={500}>
                                  {transaction.merchant_name || transaction.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {transaction.personal_finance_category?.primary || transaction.category?.join(', ') || 'Uncategorized'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(transaction.date)}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography 
                                variant="body1" 
                                color={transaction.amount < 0 ? "success.main" : "error.main"} 
                                fontWeight={600}
                              >
                                {transaction.amount < 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                              </Typography>
                              {transaction.pending && (
                                <Chip 
                                  label="Pending" 
                                  size="small" 
                                  color="warning" 
                                  sx={{ fontSize: '0.7rem', height: 20, mt: 0.5 }}
                                />
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Goals Tab Content */}
            {activeTab === 'goals' && (
              <>
                {/* Goals Header */}
                <Card
                  elevation={4}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {renderTabNavigation()}

                    {/* Goals Summary Stats */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Card
                        elevation={2}
                        sx={{
                          flex: '1 1 200px',
                          borderRadius: 2,
                          background: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {goals.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Goals
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card
                        elevation={2}
                        sx={{
                          flex: '1 1 200px',
                          borderRadius: 2,
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="info.main">
                            {formatCurrency(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Saved
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card
                        elevation={2}
                        sx={{
                          flex: '1 1 200px',
                          borderRadius: 2,
                          background: alpha(theme.palette.warning.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="warning.main">
                            {goals.filter(goal => getDaysUntilDeadline(goal.deadline) <= 30).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Due Soon
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </CardContent>
                </Card>

                {/* Goals Grid */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {goals.map((goal) => (
                    <Box
                      key={goal.id}
                      sx={{
                        flex: '1 1 300px',
                        minWidth: 0
                      }}
                    >
                      <Card
                        elevation={4}
                        onClick={() => handleGoalClick(goal)}
                        sx={{
                          borderRadius: 2,
                          background: alpha(theme.palette.background.paper, 0.95),
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${alpha(goal.color, 0.2)}`,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[12],
                            border: `1px solid ${goal.color}`
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          {/* Goal Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 2,
                                background: alpha(goal.color, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                              }}
                            >
                              {goal.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {goal.title}
                              </Typography>
                              <Chip
                                label={goal.priority}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(getPriorityColor(goal.priority), 0.1),
                                  color: getPriorityColor(goal.priority),
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Goal Description */}
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {goal.description}
                          </Typography>

                          {/* Progress Bar */}
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                Progress
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {getProgressPercentage(goal.currentAmount, goal.targetAmount).toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getProgressPercentage(goal.currentAmount, goal.targetAmount)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(goal.color, 0.2),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: goal.color,
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>

                          {/* Amount and Deadline */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Saved
                              </Typography>
                              <Typography variant="h6" fontWeight={700} color={goal.color}>
                                {formatCurrency(goal.currentAmount)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary">
                                Target
                              </Typography>
                              <Typography variant="h6" fontWeight={700}>
                                {formatCurrency(goal.targetAmount)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Deadline */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {getDaysUntilDeadline(goal.deadline) > 0 
                                ? `${getDaysUntilDeadline(goal.deadline)} days left`
                                : 'Overdue'
                              }
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Accounts Tab Content */}
            {activeTab === 'accounts' && (
              <>
                {/* Accounts Header */}
                <Card
                  elevation={4}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {renderTabNavigation()}

                    {/* Total Balance Summary */}
                    <Card
                      elevation={2}
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        background: alpha(theme.palette.success.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Balance Across All Accounts
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                          {isBalancesLoading ? (
                            <CircularProgress size={30} />
                          ) : (
                            balances && balances.accounts
                              ? formatCurrency(balances.accounts.reduce((sum: number, acc: any) => sum + (acc.balances?.current || 0), 0))
                              : '--'
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                {/* Individual Accounts Grid */}
                {isBalancesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : balances && balances.accounts && balances.accounts.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {balances.accounts.map((account: any, index: number) => (
                      <Card
                        key={account.account_id}
                        elevation={4}
                        sx={{
                          flex: '1 1 300px',
                          minWidth: 0,
                          borderRadius: 2,
                          background: alpha(theme.palette.background.paper, 0.95),
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[12]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          {/* Account Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                              sx={{
                                width: 50,
                                height: 50,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                              }}
                            >
                              <MonetizationOn sx={{ fontSize: 25 }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {account.name}
                              </Typography>
                              <Chip
                                label={account.type}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  textTransform: 'capitalize'
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Account Details */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Account Number
                            </Typography>
                            <Typography variant="body1" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                              ****{account.mask || '****'}
                            </Typography>
                          </Box>

                          {/* Balance Information */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Current Balance
                              </Typography>
                              <Typography variant="h6" fontWeight={700} color="success.main">
                                {formatCurrency(account.balances?.current || 0)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Available Balance
                              </Typography>
                              <Typography variant="h6" fontWeight={700} color="info.main">
                                {formatCurrency(account.balances?.available || 0)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Account Status */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: account.balances?.current ? theme.palette.success.main : theme.palette.warning.main
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {account.balances?.current ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Card
                    elevation={4}
                    sx={{
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.95),
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No accounts found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No linked accounts are available. Please check your Plaid connection.
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Ask Capy Loading Overlay */}
      {isAskingCapy && (
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
            sx={{
              width: 80,
              height: 80,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.8,
                  transform: 'scale(1)'
                },
                '50%': {
                  opacity: 1,
                  transform: 'scale(1.05)'
                }
              }
            }}
          />
          <Typography variant="h6" color="text.primary" textAlign="center">
            Capy is thinking...
          </Typography>
          <CircularProgress size={40} thickness={4} />
        </Box>
      )}

      {/* Goal Detail Dialog */}
      <Dialog
        open={isGoalDialogOpen}
        onClose={handleCloseGoalDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        {selectedGoal && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    background: alpha(selectedGoal.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px'
                  }}
                >
                  {selectedGoal.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {selectedGoal.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={selectedGoal.category}
                      size="small"
                      sx={{
                        backgroundColor: alpha(selectedGoal.color, 0.1),
                        color: selectedGoal.color,
                        fontWeight: 600
                      }}
                    />
                    <Chip
                      label={selectedGoal.priority}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getPriorityColor(selectedGoal.priority), 0.1),
                        color: getPriorityColor(selectedGoal.priority),
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedGoal.description}
              </Typography>

              {/* Progress Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Progress
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color={selectedGoal.color}>
                    {getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount)}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: alpha(selectedGoal.color, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: selectedGoal.color,
                      borderRadius: 6
                    }
                  }}
                />
              </Box>

              {/* Amount Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Amount
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {formatCurrency(selectedGoal.currentAmount)}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Target Amount
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="info.main">
                      {formatCurrency(selectedGoal.targetAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Remaining Amount */}
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  background: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  mb: 3
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Remaining to Save
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount)}
                  </Typography>
                </CardContent>
              </Card>

              {/* Deadline Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, background: alpha(theme.palette.grey[100], 0.5) }}>
                <CalendarIcon sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Deadline
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedGoal.deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getDaysUntilDeadline(selectedGoal.deadline) > 0 
                      ? `${getDaysUntilDeadline(selectedGoal.deadline)} days remaining`
                      : 'Overdue'
                    }
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button onClick={handleCloseGoalDialog} color="inherit">
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ borderRadius: 2 }}
              >
                Edit Goal
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Dashboard;
