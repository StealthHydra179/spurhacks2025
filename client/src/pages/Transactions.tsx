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
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';

interface PlaidTransaction {
  id: string;
  amount: number;
  date: string;
  name: string;
  category: string[];
  payment_channel: string;
  pending: boolean;
  account_id: string;
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

  // Fetch transactions from Plaid
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await plaidService.getTransactions(user.id.toString(), startDate || undefined, endDate || undefined);
        setTransactions(response.transactions || []);
        setFilteredTransactions(response.transactions || []);
      } catch (err: any) {
        console.error('Failed to fetch transactions:', err);
        setError(err.response?.data?.message || 'Failed to fetch transactions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.id, startDate, endDate]);

  // Filter transactions based on search and filters
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(transaction =>
        transaction.category.includes(categoryFilter)
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
      transaction.category.forEach(cat => categories.add(cat));
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (category: string[]) => {
    if (category.some(cat => cat.toLowerCase().includes('food'))) {
      return <ReceiptIcon />;
    }
    return <TrendingDownIcon />;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPaymentChannelFilter('all');
    setStartDate('');
    setEndDate('');
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
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700} color="white">
                Transactions
              </Typography>
              <Typography variant="body1" color={alpha(theme.palette.common.white, 0.8)}>
                View and manage your financial transactions
              </Typography>
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
                  sx={{ flex: '1 1 150px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <TextField
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 150px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

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
                        <TableRow key={transaction.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {transaction.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.payment_channel}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {transaction.category.slice(0, 2).map((cat, index) => (
                                <Chip
                                  key={index}
                                  label={cat}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ))}
                              {transaction.category.length > 2 && (
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
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={getTransactionColor(transaction.amount)}
                            >
                              {formatAmount(transaction.amount)}
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