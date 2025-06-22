import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { plaidService } from "../services/api";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import capyImage from "../assets/capy.png";

interface ExpenseTransaction {
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
  iso_currency_code: string;
  transaction_type: string;
}

interface ExpenseSummary {
  totalExpenses: number;
  averageExpense: number;
  expenseCount: number;
  topCategory: string;
  monthlyTrend: number;
}

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [expenseTransactions, setExpenseTransactions] = useState<
    ExpenseTransaction[]
  >([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    ExpenseTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Set default date range (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const formatDateForInput = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    setStartDate(formatDateForInput(sixMonthsAgo));
    setEndDate(formatDateForInput(today));
    setAppliedStartDate(formatDateForInput(sixMonthsAgo));
    setAppliedEndDate(formatDateForInput(today));
  }, []);

  // Fetch expense transactions from Plaid
  const fetchExpenseData = async (start?: string, end?: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const startToUse = start || appliedStartDate;
      const endToUse = end || appliedEndDate;

      const response = await plaidService.getTransactions(
        user.id.toString(),
        startToUse,
        endToUse
      );

      // Filter for expense transactions (positive amounts are expenses)
      const expenseData = (response.transactions || []).filter(
        (transaction) => transaction.amount > 0
      );

      setExpenseTransactions(expenseData);
      setFilteredTransactions(expenseData);
    } catch (err: any) {
      console.error("Failed to fetch expense data:", err);
      setError(err.response?.data?.message || "Failed to fetch expense data");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (appliedStartDate && appliedEndDate) {
      fetchExpenseData();
    }
  }, [appliedStartDate, appliedEndDate, user?.id]);

  // Filter transactions
  useEffect(() => {
    let filtered = expenseTransactions;

    if (merchantFilter !== "all") {
      filtered = filtered.filter(
        (transaction) =>
          transaction.merchant_name === merchantFilter ||
          transaction.name === merchantFilter
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((transaction) => {
        const categories = [
          ...(transaction.category || []),
          transaction.personal_finance_category?.primary,
          transaction.personal_finance_category?.detailed,
        ].filter((cat): cat is string => Boolean(cat));

        return categories.some(
          (cat) => formatCategoryName(cat) === categoryFilter
        );
      });
    }

    setFilteredTransactions(filtered);
  }, [expenseTransactions, merchantFilter, categoryFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchExpenseData().finally(() => setIsRefreshing(false));
  };

  const setQuickDateRange = (months: number) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - months);

    const formatDateForInput = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    setStartDate(formatDateForInput(startDate));
    setEndDate(formatDateForInput(today));
    setAppliedStartDate(formatDateForInput(startDate));
    setAppliedEndDate(formatDateForInput(today));
  };

  const applyDateRange = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  // Function to format category names
  const formatCategoryName = (category: string): string => {
    return category
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate expense summary
  const calculateExpenseSummary = (): ExpenseSummary => {
    const totalExpenses = filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const averageExpense =
      filteredTransactions.length > 0
        ? totalExpenses / filteredTransactions.length
        : 0;

    // Find top expense category
    const categoryMap = new Map<string, number>();
    filteredTransactions.forEach((transaction) => {
      const category =
        transaction.personal_finance_category?.primary ||
        transaction.category?.[0] ||
        "Uncategorized";
      const formattedCategory = formatCategoryName(category);
      categoryMap.set(
        formattedCategory,
        (categoryMap.get(formattedCategory) || 0) + transaction.amount
      );
    });

    const topCategory =
      Array.from(categoryMap.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "Unknown";

    // Calculate monthly trend from actual data
    const monthlyTrend = calculateMonthlyTrend();

    return {
      totalExpenses,
      averageExpense,
      expenseCount: filteredTransactions.length,
      topCategory,
      monthlyTrend,
    };
  };

  // Calculate monthly trend by comparing current month with previous month
  const calculateMonthlyTrend = (): number => {
    if (expenseTransactions.length === 0) return 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get current month's expenses
    const currentMonthExpenses = expenseTransactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    // Get previous month's expenses
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthExpenses = expenseTransactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === previousMonth &&
          transactionDate.getFullYear() === previousYear
        );
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    // Calculate percentage change
    if (previousMonthExpenses === 0) {
      return currentMonthExpenses > 0 ? 100 : 0; // If no previous month data, show 100% increase if current month has expenses
    }

    const percentageChange =
      ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) *
      100;
    return Math.round(percentageChange * 10) / 10; // Round to 1 decimal place
  };

  // Prepare chart data
  const prepareChartData = () => {
    const monthlyData = new Map<string, number>();

    filteredTransactions.forEach((transaction) => {
      const month = new Date(transaction.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      monthlyData.set(
        month,
        (monthlyData.get(month) || 0) + transaction.amount
      );
    });

    return Array.from(monthlyData.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );
  };

  const getUniqueMerchants = () => {
    const merchants = new Set<string>();
    expenseTransactions.forEach((transaction) => {
      merchants.add(transaction.merchant_name || transaction.name);
    });
    return Array.from(merchants).sort();
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    expenseTransactions.forEach((transaction) => {
      if (transaction.personal_finance_category) {
        categories.add(
          formatCategoryName(transaction.personal_finance_category.primary)
        );
        categories.add(
          formatCategoryName(transaction.personal_finance_category.detailed)
        );
      }
      transaction.category?.forEach((cat) =>
        categories.add(formatCategoryName(cat))
      );
    });
    return Array.from(categories).sort();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const expenseSummary = calculateExpenseSummary();
  const chartData = prepareChartData();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        py: 4,
        position: "relative",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard")}
              sx={{
                borderRadius: 2,
                borderColor: alpha(theme.palette.common.white, 0.3),
                color: theme.palette.common.white,
                "&:hover": {
                  borderColor: theme.palette.common.white,
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              Back to Dashboard
            </Button>

            <Tooltip title="Refresh expense data">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.common.white, 0.3),
                  color: theme.palette.common.white,
                  "&:hover": {
                    borderColor: theme.palette.common.white,
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="img"
              src={capyImage}
              alt="CapySpend Logo"
              sx={{
                width: 60,
                height: 60,
                objectFit: "contain",
                boxShadow: `0 4px 12px ${alpha(
                  theme.palette.primary.main,
                  0.4
                )}`,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                component="h1"
                fontWeight={700}
                color="white"
              >
                Expense Analysis
              </Typography>
              <Typography
                variant="body1"
                color={alpha(theme.palette.common.white, 0.8)}
              >
                Track and analyze your spending patterns and categories
              </Typography>
              {appliedStartDate && appliedEndDate && (
                <Typography
                  variant="body2"
                  color={alpha(theme.palette.common.white, 0.7)}
                  sx={{ mt: 0.5 }}
                >
                  📅 Showing expenses from{" "}
                  {new Date(
                    appliedStartDate + "T00:00:00"
                  ).toLocaleDateString()}{" "}
                  to{" "}
                  {new Date(appliedEndDate + "T00:00:00").toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Filters */}
        <Card
          elevation={8}
          sx={{
            mb: 4,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Filters Row */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                <FormControl sx={{ flex: "1 1 200px" }}>
                  <InputLabel>Merchant</InputLabel>
                  <Select
                    value={merchantFilter}
                    label="Merchant"
                    onChange={(e) => setMerchantFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Merchants</MenuItem>
                    {getUniqueMerchants().map((merchant) => (
                      <MenuItem key={merchant} value={merchant}>
                        {merchant}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: "1 1 200px" }}>
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

                <TextField
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{ flex: "1 1 150px" }}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />

                <TextField
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{ flex: "1 1 150px" }}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />

                <Button
                  variant="contained"
                  onClick={applyDateRange}
                  sx={{
                    borderRadius: 2,
                    height: 56,
                    px: 3,
                  }}
                >
                  Apply Date Range
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Expense Summary Cards */}
            <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(
                      theme.palette.warning.main,
                      0.2
                    )}`,
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      <ReceiptIcon sx={{ fontSize: 25 }} />
                    </Avatar>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="warning.main"
                    >
                      {formatCurrency(expenseSummary.totalExpenses)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      <TimelineIcon sx={{ fontSize: 25 }} />
                    </Avatar>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {formatCurrency(expenseSummary.averageExpense)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Per Transaction
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      <ShoppingCartIcon sx={{ fontSize: 25 }} />
                    </Avatar>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {expenseSummary.expenseCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expense Transactions
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        background: `linear-gradient(135deg, ${
                          expenseSummary.monthlyTrend < 0
                            ? theme.palette.success.main
                            : expenseSummary.monthlyTrend > 0
                            ? theme.palette.error.main
                            : theme.palette.info.main
                        } 0%, ${
                          expenseSummary.monthlyTrend < 0
                            ? theme.palette.success.light
                            : expenseSummary.monthlyTrend > 0
                            ? theme.palette.error.light
                            : theme.palette.info.light
                        } 100%)`,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      {expenseSummary.monthlyTrend < 0 ? (
                        <TrendingDownIcon sx={{ fontSize: 25 }} />
                      ) : expenseSummary.monthlyTrend > 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 25 }} />
                      ) : (
                        <TimelineIcon sx={{ fontSize: 25 }} />
                      )}
                    </Avatar>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={
                        expenseSummary.monthlyTrend < 0
                          ? "success.main"
                          : expenseSummary.monthlyTrend > 0
                          ? "error.main"
                          : "info.main"
                      }
                    >
                      {expenseSummary.monthlyTrend > 0 ? "+" : ""}
                      {expenseSummary.monthlyTrend}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {expenseSummary.monthlyTrend === 0
                        ? "No Change"
                        : "Monthly Trend"}
                    </Typography>
                    {expenseSummary.monthlyTrend === 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Insufficient data
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Charts */}
            <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
              {/* Expense Trend Chart */}
              <Box sx={{ flex: "1 1 100%", minWidth: 400 }}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(
                      theme.palette.common.white,
                      0.2
                    )}`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Expense Trend Over Time
                    </Typography>
                    <Box sx={{ height: 300, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip
                            formatter={(value: number) => [
                              formatCurrency(value),
                              "Expenses",
                            ]}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke={theme.palette.warning.main}
                            strokeWidth={3}
                            dot={{
                              fill: theme.palette.warning.main,
                              strokeWidth: 2,
                              r: 4,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Recent Expense Transactions */}
            <Card
              elevation={4}
              sx={{
                borderRadius: 2,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: "blur(20px)",
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Recent Expense Transactions
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {filteredTransactions.length === 0 ? (
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      textAlign="center"
                      py={4}
                    >
                      No expense transactions found for the selected filters
                    </Typography>
                  ) : (
                    filteredTransactions.slice(0, 10).map((transaction) => (
                      <Box
                        key={transaction.transaction_id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          mb: 1,
                          borderRadius: 2,
                          backgroundColor: alpha(
                            theme.palette.warning.main,
                            0.05
                          ),
                          border: `1px solid ${alpha(
                            theme.palette.warning.main,
                            0.1
                          )}`,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              backgroundColor: alpha(
                                theme.palette.warning.main,
                                0.1
                              ),
                              color: theme.palette.warning.main,
                            }}
                          >
                            <ReceiptIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {transaction.merchant_name || transaction.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(transaction.date)} •{" "}
                              {transaction.payment_channel}
                            </Typography>
                            {transaction.personal_finance_category && (
                              <Chip
                                label={formatCategoryName(
                                  transaction.personal_finance_category.primary
                                )}
                                size="small"
                                sx={{ mt: 0.5, fontSize: "0.7rem", height: 20 }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="warning.main"
                        >
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Expenses;
