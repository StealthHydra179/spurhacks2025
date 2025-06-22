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
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  MonetizationOn as MoneyIcon,
  AccountBalance as BankIcon,
  Timeline as TimelineIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import capyImage from "../assets/capy.png";

interface IncomeTransaction {
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

interface IncomeSummary {
  totalIncome: number;
  averageIncome: number;
  incomeCount: number;
  topSource: string;
  monthlyTrend: number;
}

const Income: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [incomeTransactions, setIncomeTransactions] = useState<
    IncomeTransaction[]
  >([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    IncomeTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
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

  // Fetch income transactions from Plaid
  const fetchIncomeData = async (start?: string, end?: string) => {
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

      // Filter for income transactions (negative amounts are deposits/income)
      const incomeData = (response.transactions || []).filter(
        (transaction) => transaction.amount < 0
      );

      setIncomeTransactions(incomeData);
      setFilteredTransactions(incomeData);
    } catch (err: any) {
      console.error("Failed to fetch income data:", err);
      setError(err.response?.data?.message || "Failed to fetch income data");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (appliedStartDate && appliedEndDate) {
      fetchIncomeData();
    }
  }, [appliedStartDate, appliedEndDate, user?.id]);

  // Filter transactions
  useEffect(() => {
    let filtered = incomeTransactions;

    if (sourceFilter !== "all") {
      filtered = filtered.filter(
        (transaction) =>
          transaction.merchant_name === sourceFilter ||
          transaction.name === sourceFilter
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
  }, [incomeTransactions, sourceFilter, categoryFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchIncomeData().finally(() => setIsRefreshing(false));
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

  // Calculate income summary
  const calculateIncomeSummary = (): IncomeSummary => {
    const totalIncome = filteredTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0
    );
    const averageIncome =
      filteredTransactions.length > 0
        ? totalIncome / filteredTransactions.length
        : 0;

    // Find top income source
    const sourceMap = new Map<string, number>();
    filteredTransactions.forEach((transaction) => {
      const source = transaction.merchant_name || transaction.name;
      sourceMap.set(
        source,
        (sourceMap.get(source) || 0) + Math.abs(transaction.amount)
      );
    });

    const topSource =
      Array.from(sourceMap.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "Unknown";

    // Calculate monthly trend from actual data
    const monthlyTrend = calculateMonthlyTrend();

    return {
      totalIncome,
      averageIncome,
      incomeCount: filteredTransactions.length,
      topSource,
      monthlyTrend,
    };
  };

  // Calculate monthly trend by comparing current month with previous month
  const calculateMonthlyTrend = (): number => {
    if (incomeTransactions.length === 0) return 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get current month's income
    const currentMonthIncome = incomeTransactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    // Get previous month's income
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthIncome = incomeTransactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === previousMonth &&
          transactionDate.getFullYear() === previousYear
        );
      })
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    // Calculate percentage change
    if (previousMonthIncome === 0) {
      return currentMonthIncome > 0 ? 100 : 0; // If no previous month data, show 100% increase if current month has income
    }

    const percentageChange =
      ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100;
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
        (monthlyData.get(month) || 0) + Math.abs(transaction.amount)
      );
    });

    return Array.from(monthlyData.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );
  };

  const prepareSourceData = () => {
    const sourceMap = new Map<string, number>();

    filteredTransactions.forEach((transaction) => {
      const source = transaction.merchant_name || transaction.name;
      sourceMap.set(
        source,
        (sourceMap.get(source) || 0) + Math.abs(transaction.amount)
      );
    });

    return Array.from(sourceMap.entries())
      .map(([source, amount]) => ({ source, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  const getUniqueSources = () => {
    const sources = new Set<string>();
    incomeTransactions.forEach((transaction) => {
      sources.add(transaction.merchant_name || transaction.name);
    });
    return Array.from(sources).sort();
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    incomeTransactions.forEach((transaction) => {
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

  const incomeSummary = calculateIncomeSummary();
  const chartData = prepareChartData();
  const sourceData = prepareSourceData();

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C80",
    "#8DD1E1",
    "#D084D0",
  ];

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

            <Tooltip title="Refresh income data">
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
                Income Analysis
              </Typography>
              <Typography
                variant="body1"
                color={alpha(theme.palette.common.white, 0.8)}
              >
                Track and analyze your income sources and patterns
              </Typography>
              {appliedStartDate && appliedEndDate && (
                <Typography
                  variant="body2"
                  color={alpha(theme.palette.common.white, 0.7)}
                  sx={{ mt: 0.5 }}
                >
                  📅 Showing income from{" "}
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
                  <InputLabel>Income Source</InputLabel>
                  <Select
                    value={sourceFilter}
                    label="Income Source"
                    onChange={(e) => setSourceFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Sources</MenuItem>
                    {getUniqueSources().map((source) => (
                      <MenuItem key={source} value={source}>
                        {source}
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
            {/* Income Summary Cards */}
            <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      <MoneyIcon sx={{ fontSize: 25 }} />
                    </Avatar>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatCurrency(incomeSummary.totalIncome)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Income
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
                      {formatCurrency(incomeSummary.averageIncome)}
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
                      <BankIcon sx={{ fontSize: 25 }} />
                    </Avatar>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {incomeSummary.incomeCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Income Transactions
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
                        background: `linear-gradient(135deg, ${
                          incomeSummary.monthlyTrend > 0
                            ? theme.palette.success.main
                            : incomeSummary.monthlyTrend < 0
                            ? theme.palette.warning.main
                            : theme.palette.info.main
                        } 0%, ${
                          incomeSummary.monthlyTrend > 0
                            ? theme.palette.success.light
                            : incomeSummary.monthlyTrend < 0
                            ? theme.palette.warning.light
                            : theme.palette.info.light
                        } 100%)`,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      {incomeSummary.monthlyTrend > 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 25 }} />
                      ) : incomeSummary.monthlyTrend < 0 ? (
                        <TrendingDownIcon sx={{ fontSize: 25 }} />
                      ) : (
                        <TimelineIcon sx={{ fontSize: 25 }} />
                      )}
                    </Avatar>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={
                        incomeSummary.monthlyTrend > 0
                          ? "success.main"
                          : incomeSummary.monthlyTrend < 0
                          ? "warning.main"
                          : "info.main"
                      }
                    >
                      {incomeSummary.monthlyTrend > 0 ? "+" : ""}
                      {incomeSummary.monthlyTrend}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {incomeSummary.monthlyTrend === 0
                        ? "No Change"
                        : "Monthly Trend"}
                    </Typography>
                    {incomeSummary.monthlyTrend === 0 && (
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
              {/* Income Trend Chart */}
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
                      Income Trend Over Time
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
                              "Income",
                            ]}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke={theme.palette.success.main}
                            strokeWidth={3}
                            dot={{
                              fill: theme.palette.success.main,
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

            {/* Recent Income Transactions */}
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
                  Recent Income Transactions
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {filteredTransactions.length === 0 ? (
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      textAlign="center"
                      py={4}
                    >
                      No income transactions found for the selected filters
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
                            theme.palette.success.main,
                            0.05
                          ),
                          border: `1px solid ${alpha(
                            theme.palette.success.main,
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
                                theme.palette.success.main,
                                0.1
                              ),
                              color: theme.palette.success.main,
                            }}
                          >
                            <MoneyIcon />
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
                          color="success.main"
                        >
                          {formatCurrency(Math.abs(transaction.amount))}
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

export default Income;
