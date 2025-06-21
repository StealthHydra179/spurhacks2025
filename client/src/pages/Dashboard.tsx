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
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Logout as LogoutIcon,
  TrendingUp,
  Receipt,
  MonetizationOn,
  Search as SearchIcon,
  Settings as SettingsIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';
import { useNavigate } from 'react-router-dom';

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
      if (transaction.amount > 0) {
        income += transaction.amount;
      } else {
        expenses += Math.abs(transaction.amount);
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

  const handleLogout = async () => {
    await logout();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
        py: 4
      }}
    >
      <Container maxWidth="lg">
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
                  Welcome back, {user?.username}!
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center', mx: 4 }}>
              <TextField
                variant="outlined"
                placeholder="ask capy a question"
                size="small"
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/settings')}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  background: theme.palette.warning.main,
                  color: theme.palette.common.white,
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: theme.palette.warning.dark,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 3px 8px ${alpha(theme.palette.warning.main, 0.3)}`
                  }
                }}
              >
                Settings
              </Button>
              <Button
                variant="contained"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  background: theme.palette.error.main,
                  color: theme.palette.common.white,
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: theme.palette.error.dark,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 3px 8px ${alpha(theme.palette.error.main, 0.3)}`
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Box>

        {/* User Info Card */}
        <Card
          elevation={8}
          sx={{
            mb: 3,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {user?.username}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={user?.mode === 0 ? 'Light Mode' : 'Dark Mode'}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label="Active User"
                    color="success"
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          </CardContent>
        </Card>

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

        {/* Stats Grid */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card
            elevation={4}
            sx={{
              flex: '1 1 300px',
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
                  width: 60,
                  height: 60,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                  mx: 'auto',
                  mb: 2
                }}
              >
                <TrendingUp sx={{ fontSize: 30 }} />
              </Avatar>
              {isLoading ? (
                <CircularProgress size={40} sx={{ mb: 2 }} />
              ) : (
                <Typography variant="h4" fontWeight={700} gutterBottom color="success.main">
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
              flex: '1 1 300px',
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
                  width: 60,
                  height: 60,
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                  mx: 'auto',
                  mb: 2
                }}
              >
                <Receipt sx={{ fontSize: 30 }} />
              </Avatar>
              {isLoading ? (
                <CircularProgress size={40} sx={{ mb: 2 }} />
              ) : (
                <Typography variant="h4" fontWeight={700} gutterBottom color="warning.main">
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
              flex: '1 1 300px',
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
                  width: 60,
                  height: 60,
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                  mx: 'auto',
                  mb: 2
                }}
              >
                <MonetizationOn sx={{ fontSize: 30 }} />
              </Avatar>
              {isLoading ? (
                <CircularProgress size={40} sx={{ mb: 2 }} />
              ) : (
                <Typography 
                  variant="h4" 
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
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography 
                        variant="body1" 
                        color={transaction.amount > 0 ? "success.main" : "error.main"} 
                        fontWeight={600}
                      >
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
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
