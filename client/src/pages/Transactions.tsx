import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { plaidService } from '../services/api';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';

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

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PlaidTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentChannelFilter, setPaymentChannelFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const formatDateForInput = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    setStartDate(formatDateForInput(thirtyDaysAgo));
    setEndDate(formatDateForInput(today));
    setAppliedStartDate(formatDateForInput(thirtyDaysAgo));
    setAppliedEndDate(formatDateForInput(today));
  }, []);

  // Fetch transactions from Plaid
  const fetchTransactions = async (start?: string, end?: string) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const startToUse = start || appliedStartDate;
      const endToUse = end || appliedEndDate;
      
      console.log('🔍 Fetching transactions with params:', {
        userId: user.id.toString(),
        startDate: startToUse || 'not set',
        endDate: endToUse || 'not set',
        startDateType: typeof startToUse,
        endDateType: typeof endToUse,
        startDateValid: startToUse ? !isNaN(new Date(startToUse).getTime()) : false,
        endDateValid: endToUse ? !isNaN(new Date(endToUse).getTime()) : false
      });
      
      // Log the exact URL that will be called
      const params = new URLSearchParams();
      if (startToUse) params.append('start_date', startToUse);
      if (endToUse) params.append('end_date', endToUse);
      const url = `/api/plaid/transactions/${user.id.toString()}?${params.toString()}`;
      console.log('🔗 API URL:', url);
      
      const response = await plaidService.getTransactions(user.id.toString(), startToUse, endToUse);
      
      console.log('✅ Transactions API response received:', {
        hasTransactions: !!response.transactions,
        transactionCount: response.transactions ? response.transactions.length : 0,
        sampleTransactions: response.transactions ? response.transactions.slice(0, 3).map(t => ({
          id: t.transaction_id,
          name: t.name,
          amount: t.amount,
          date: t.date,
          category: t.category
        })) : []
      });
      
      // Check for transactions outside the date range
      if (response.transactions && (startToUse || endToUse)) {
        const outOfRangeTransactions = response.transactions.filter(t => {
          const txDate = new Date(t.date);
          const startDate = startToUse ? new Date(startToUse) : null;
          const endDate = endToUse ? new Date(endToUse) : null;
          
          // Reset time to start of day for comparison
          txDate.setHours(0, 0, 0, 0);
          if (startDate) startDate.setHours(0, 0, 0, 0);
          if (endDate) endDate.setHours(0, 0, 0, 0);
          
          const afterStart = !startDate || txDate >= startDate;
          const beforeEnd = !endDate || txDate <= endDate;
          
          return !(afterStart && beforeEnd);
        });
        
        if (outOfRangeTransactions.length > 0) {
          console.warn('⚠️ Found transactions outside date range:', outOfRangeTransactions.map(t => ({
            date: t.date,
            name: t.name,
            amount: t.amount
          })));
        }
      }
      
      setTransactions(response.transactions || []);
      setFilteredTransactions(response.transactions || []);
    } catch (err: any) {
      console.error('❌ Failed to fetch transactions:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (appliedStartDate && appliedEndDate) {
      fetchTransactions();
    }
  }, [user?.id, appliedStartDate, appliedEndDate]);

  // Handle date range application
  const applyDateRange = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }
    
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setError(null);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions().finally(() => setIsRefreshing(false));
  };

  // Handle quick date range selection
  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    
    const formatDateForInput = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    setStartDate(formatDateForInput(startDate));
    setEndDate(formatDateForInput(today));
    setAppliedStartDate(formatDateForInput(startDate));
    setAppliedEndDate(formatDateForInput(today));
  };

  // Filter transactions based on search and filters
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category?.some(cat => cat?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        transaction.personal_finance_category?.primary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.personal_finance_category?.detailed.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(transaction =>
        transaction.category?.includes(categoryFilter) ||
        transaction.personal_finance_category?.primary === categoryFilter ||
        transaction.personal_finance_category?.detailed === categoryFilter
      );
    }

    // Payment channel filter
    if (paymentChannelFilter !== 'all') {
      filtered = filtered.filter(transaction =>
        transaction.payment_channel === paymentChannelFilter
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, categoryFilter, paymentChannelFilter]);

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    transactions.forEach(transaction => {
      // Add personal finance categories
      if (transaction.personal_finance_category) {
        categories.add(transaction.personal_finance_category.primary);
        categories.add(transaction.personal_finance_category.detailed);
      }
      // Add regular categories
      transaction.category?.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  };

  const getUniquePaymentChannels = () => {
    const channels = new Set<string>();
    transactions.forEach(transaction => {
      channels.add(transaction.payment_channel);
    });
    return Array.from(channels).sort();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    // Fix timezone issue: Parse the date string and convert to local timezone
    const date = new Date(dateString + 'T00:00:00'); // Add time to ensure proper parsing
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (category: string[] | null) => {
    if (category?.some(cat => cat.toLowerCase().includes('food'))) {
      return <ReceiptIcon />;
    }
    return <TrendingDownIcon />;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? theme.palette.error.main : theme.palette.success.main;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPaymentChannelFilter('all');
    // Don't clear date filters by default, just clear the search and category filters
  };

  const clearDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const formatDateForInput = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    setStartDate(formatDateForInput(thirtyDaysAgo));
    setEndDate(formatDateForInput(today));
    setAppliedStartDate(formatDateForInput(thirtyDaysAgo));
    setAppliedEndDate(formatDateForInput(today));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{
                borderRadius: 2,
                borderColor: alpha(theme.palette.common.white, 0.3),
                color: theme.palette.common.white,
                '&:hover': {
                  borderColor: theme.palette.common.white,
                  backgroundColor: alpha(theme.palette.common.white, 0.1)
                }
              }}
            >
              Back to Dashboard
            </Button>
            
            <Tooltip title="Refresh transactions">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.common.white, 0.3),
                  color: theme.palette.common.white,
                  '&:hover': {
                    borderColor: theme.palette.common.white,
                    backgroundColor: alpha(theme.palette.common.white, 0.1)
                  }
                }}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Tooltip>
          </Box>
          
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
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" fontWeight={700} color="white">
                Transactions
              </Typography>
              <Typography variant="body1" color={alpha(theme.palette.common.white, 0.8)}>
                View and manage your financial transactions
              </Typography>
              {appliedStartDate && appliedEndDate && (
                <Typography variant="body2" color={alpha(theme.palette.common.white, 0.7)} sx={{ mt: 0.5 }}>
                  📅 Showing transactions from {new Date(appliedStartDate + 'T00:00:00').toLocaleDateString()} to {new Date(appliedEndDate + 'T00:00:00').toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Filters and Search */}
        <Card
          elevation={8}
          sx={{
            mb: 4,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Search Row */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: '1 1 300px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>

              {/* Quick Date Range Presets */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  Quick ranges:
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQuickDateRange(7)}
                  sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                >
                  Last 7 days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQuickDateRange(30)}
                  sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                >
                  Last 30 days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQuickDateRange(90)}
                  sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                >
                  Last 90 days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQuickDateRange(365)}
                  sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                >
                  Last year
                </Button>
              </Box>

              {/* Filters Row */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <FormControl sx={{ flex: '1 1 200px' }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {getUniqueCategories().map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: '1 1 200px' }}>
                  <InputLabel>Payment Channel</InputLabel>
                  <Select
                    value={paymentChannelFilter}
                    label="Payment Channel"
                    onChange={(e) => setPaymentChannelFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Channels</MenuItem>
                    {getUniquePaymentChannels().map((channel) => (
                      <MenuItem key={channel} value={channel}>
                        {channel}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: '1 1 150px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <TextField
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: '1 1 150px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <Button
                  variant="contained"
                  onClick={applyDateRange}
                  startIcon={<CalendarIcon />}
                  sx={{
                    borderRadius: 2,
                    height: 56,
                    px: 3,
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    }
                  }}
                >
                  Apply Date Range
                </Button>

                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{
                    borderRadius: 2,
                    height: 56,
                    px: 3,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  Clear Filters
                </Button>

                <Button
                  variant="outlined"
                  onClick={clearDateRange}
                  sx={{
                    borderRadius: 2,
                    height: 56,
                    px: 3,
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                    }
                  }}
                >
                  Reset Dates
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card
          elevation={8}
          sx={{
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {error && (
              <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Transaction</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            {searchTerm || categoryFilter !== 'all' || paymentChannelFilter !== 'all'
                              ? 'No transactions match your filters'
                              : 'No transactions found'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.transaction_id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {transaction.logo_url ? (
                                <Avatar
                                  src={transaction.logo_url}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: alpha(getTransactionColor(transaction.amount), 0.1)
                                  }}
                                />
                              ) : (
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: alpha(getTransactionColor(transaction.amount), 0.1),
                                    color: getTransactionColor(transaction.amount)
                                  }}
                                >
                                  {getTransactionIcon(transaction.category)}
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {transaction.merchant_name || transaction.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.payment_channel} • {transaction.transaction_type}
                                </Typography>
                                {transaction.location?.city && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    📍 {transaction.location.city}{transaction.location.region ? `, ${transaction.location.region}` : ''}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {transaction.personal_finance_category ? (
                                <Chip
                                  label={transaction.personal_finance_category.primary}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ) : transaction.category?.slice(0, 2).map((cat, index) => (
                                <Chip
                                  key={index}
                                  label={cat}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ))}
                              {transaction.category?.length && transaction.category.length > 2 && (
                                <Chip
                                  label={`+${transaction.category.length - 2}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(transaction.date)}
                            </Typography>
                            {transaction.authorized_date && transaction.authorized_date !== transaction.date && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Auth: {formatDate(transaction.authorized_date)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={getTransactionColor(transaction.amount)}
                            >
                              {formatAmount(transaction.amount)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.iso_currency_code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.pending ? 'Pending' : 'Completed'}
                              size="small"
                              color={transaction.pending ? 'warning' : 'success'}
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Transactions; 