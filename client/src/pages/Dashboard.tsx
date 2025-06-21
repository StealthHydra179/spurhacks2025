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
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  TrendingUp,
  Receipt,
  MonetizationOn,
  Search as SearchIcon,
  Settings as SettingsIcon,
  CalendarToday as CalendarIcon
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
  });
  const [recentTransactions, setRecentTransactions] = useState<PlaidTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; color: string }>>([]);

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

  // Fetch data on component mount
  useEffect(() => {
    fetchMonthlyData();
  }, [user?.id]);

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

    try {
      // Call the ask-capy API to create a new conversation
      const data = await botConversationService.askCapy(user?.id || 1, searchQuery);
      // Navigate to the new conversation
      navigate(`/chat/${data.conversation_id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback: just navigate to chat page
      navigate('/chat');
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>
                <TextField
                  variant="outlined"
                  placeholder="ask capy a question"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 25 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {monthlySummary.month} {monthlySummary.year} Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {monthlySummary.transactionCount} transactions this month
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                onClick={fetchMonthlyData}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} /> : <CalendarIcon />}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>

            {/* Stats Grid */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Card
                elevation={4}
                onClick={() => navigate('/income')}
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
                sx={{
                  flex: '1 1 200px',
                  borderRadius: 2,
                  background: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: 'blur(20px)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
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
      </Container>
    </Box>
  );
};

export default Dashboard;
