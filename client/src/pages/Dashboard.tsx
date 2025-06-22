import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { plaidService, savingsGoalsService, botConversationService, budgetService, authService } from '../services/api';
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
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import capySVG from '../assets/capyy.svg';
import communistCapy from '../assets/communist-capy.svg';
import babyCapy from '../assets/baby-capy.svg';
import conservativeCapy from '../assets/conservative-capy.svg';
import riskyCapy from '../assets/risky-capy.svg';
import neutralCapy from '../assets/neutral-capy.svg';
import { useNavigate } from 'react-router-dom';
import type { Budget } from '../types';

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
  budget_category?: string;
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
  id: number;
  user_id: number;
  title: string;
  description: string;
  amount: number;
  current_amount: number;
  deadline: string | null;
  category: string | null;
  priority: 'low' | 'medium' | 'high';
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string | null;
}

// Function to get the appropriate capy image based on personality
const getCapyImage = (personality: number) => {
  switch (personality) {
    case -1: // Conservative
      return conservativeCapy;
    case 0:  // Neutral
      return neutralCapy;
    case 1:  // Risky
      return riskyCapy;
    case 2:  // Communist
      return communistCapy;
    case 3:  // Baby
      return babyCapy;
    default:
      return capySVG;
  }
};

const Dashboard: React.FC = () => {
  const { user, logout, personality } = useAuth();
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
  const [allMonthlyTransactions, setAllMonthlyTransactions] = useState<PlaidTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAskingCapy, setIsAskingCapy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [isPlaidLinked, setIsPlaidLinked] = useState<boolean | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isGoalsLoading, setIsGoalsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'accounts' | 'budget'>('overview');
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [editingGoalForm, setEditingGoalForm] = useState({
    title: '',
    description: '',
    amount: '',
    current_amount: '',
    deadline: null as Dayjs | null,
    category: 'savings' as string,
    priority: 'medium' as 'low' | 'medium' | 'high',
    icon: '💰',
    color: '#4CAF50'
  });
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    amount: '',
    current_amount: '',
    deadline: null as Dayjs | null,
    category: 'savings' as string,
    priority: 'medium' as 'low' | 'medium' | 'high',
    icon: '💰',
    color: '#4CAF50'
  });
  const [balances, setBalances] = useState<any>(null);
  const [isBalancesLoading, setIsBalancesLoading] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState([
    { id: 1, name: 'Housing & Utilities', amount: 0, spent: 0, icon: '🏠' },
    { id: 2, name: 'Food & Dining', amount: 0, spent: 0, icon: '🍽️' },
    { id: 3, name: 'Transportation', amount: 0, spent: 0, icon: '🚗' },
    { id: 4, name: 'Health & Insurance', amount: 0, spent: 0, icon: '🏥' },
    { id: 5, name: 'Personal & Lifestyle', amount: 0, spent: 0, icon: '👕' },
    { id: 6, name: 'Entertainment & Leisure', amount: 0, spent: 0, icon: '🎬' },
    { id: 7, name: 'Financial & Savings', amount: 0, spent: 0, icon: '💰' },
    { id: 8, name: 'Gifts & Donations', amount: 0, spent: 0, icon: '🎁' },
  ]);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);

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
      
      // Store all transactions for the month
      setAllMonthlyTransactions(transactions);
      
      // Get recent transactions (last 5)
      const recent = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecentTransactions(recent);
      
      // Process category data for pie chart
      processCategoryData(transactions);
      
      // Update budget categories with actual spending
      updateBudgetFromTransactions(transactions);
      
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

  // Fetch savings goals from API
  const fetchSavingsGoals = async () => {
    if (!user?.id) return;
    try {
      setIsGoalsLoading(true);
      const goalsData = await savingsGoalsService.getSavingsGoals();
      setGoals(goalsData);
    } catch (err: any) {
      console.error('Failed to fetch savings goals:', err);
      setError(err.response?.data?.message || 'Failed to fetch savings goals');
    } finally {
      setIsGoalsLoading(false);
    }
  };

  // Fetch balances when user is available
  useEffect(() => {
    if (user?.id && isPlaidLinked === true) {
      fetchBalances();
    }
  }, [user?.id, isPlaidLinked]);

  // Fetch savings goals when user is available
  useEffect(() => {
    if (user?.id) {
      fetchSavingsGoals();
    }
  }, [user?.id]);

  // Fetch budgets when user is available
  useEffect(() => {
    if (user?.id) {
      fetchBudgets();
    }
  }, [user?.id]);

  // Update budget spending when transactions are loaded
  useEffect(() => {
    if (allMonthlyTransactions.length > 0) {
      updateBudgetFromTransactions(allMonthlyTransactions);
    }
  }, [allMonthlyTransactions]);

  // Fetch budgets from API
  const fetchBudgets = async () => {
    if (!user?.id) return;
    
    try {
      setIsBudgetLoading(true);
      const budgets = await budgetService.getBudgets();
      
      // Get the most recent budget (first in the list since they're ordered by created_at DESC)
      if (budgets.length > 0) {
        const latestBudget = budgets[0];
        setCurrentBudget(latestBudget);
        
        // Update budget categories with amounts from API
        const updatedCategories = budgetCategories.map(cat => {
          let amount = 0;
          switch (cat.name) {
            case 'Housing & Utilities':
              amount = latestBudget.housing || 0;
              break;
            case 'Food & Dining':
              amount = latestBudget.food || 0;
              break;
            case 'Transportation':
              amount = latestBudget.transportation || 0;
              break;
            case 'Health & Insurance':
              amount = latestBudget.health || 0;
              break;
            case 'Personal & Lifestyle':
              amount = latestBudget.personal || 0;
              break;
            case 'Entertainment & Leisure':
              amount = latestBudget.entertainment || 0;
              break;
            case 'Financial & Savings':
              amount = latestBudget.financial || 0;
              break;
            case 'Gifts & Donations':
              amount = latestBudget.gifts || 0;
              break;
          }
          return { ...cat, amount };
        });
        
        setBudgetCategories(updatedCategories);
      } else {
        // No budget exists, create a default budget
        console.log('No budget found, creating default budget...');
        const defaultBudgetData = {
          overall: 5000, // Default $5000 monthly budget
          housing: 1500, // 30% of budget
          food: 800,     // 16% of budget
          transportation: 400, // 8% of budget
          health: 300,   // 6% of budget
          personal: 400, // 8% of budget
          entertainment: 300, // 6% of budget
          financial: 800, // 16% of budget
          gifts: 200,    // 4% of budget
        };
        
        try {
          const newBudget = await budgetService.createBudget(defaultBudgetData);
          setCurrentBudget(newBudget);
          
          // Update budget categories with default amounts
          const updatedCategories = budgetCategories.map(cat => {
            let amount = 0;
            switch (cat.name) {
              case 'Housing & Utilities':
                amount = newBudget.housing || 0;
                break;
              case 'Food & Dining':
                amount = newBudget.food || 0;
                break;
              case 'Transportation':
                amount = newBudget.transportation || 0;
                break;
              case 'Health & Insurance':
                amount = newBudget.health || 0;
                break;
              case 'Personal & Lifestyle':
                amount = newBudget.personal || 0;
                break;
              case 'Entertainment & Leisure':
                amount = newBudget.entertainment || 0;
                break;
              case 'Financial & Savings':
                amount = newBudget.financial || 0;
                break;
              case 'Gifts & Donations':
                amount = newBudget.gifts || 0;
                break;
            }
            return { ...cat, amount };
          });
          
          setBudgetCategories(updatedCategories);
          console.log('Default budget created successfully');
        } catch (createError) {
          console.error('Error creating default budget:', createError);
          // If creating fails, keep the current state (all zeros)
        }
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsBudgetLoading(false);
    }
  };

  // Save budget to API
  const saveBudget = async () => {
    if (!user?.id) return;
    
    try {
      setIsBudgetLoading(true);
      
      const budgetData = {
        overall: calculateTotalBudget(),
        housing: budgetCategories.find(cat => cat.name === 'Housing & Utilities')?.amount || 0,
        food: budgetCategories.find(cat => cat.name === 'Food & Dining')?.amount || 0,
        transportation: budgetCategories.find(cat => cat.name === 'Transportation')?.amount || 0,
        health: budgetCategories.find(cat => cat.name === 'Health & Insurance')?.amount || 0,
        personal: budgetCategories.find(cat => cat.name === 'Personal & Lifestyle')?.amount || 0,
        entertainment: budgetCategories.find(cat => cat.name === 'Entertainment & Leisure')?.amount || 0,
        financial: budgetCategories.find(cat => cat.name === 'Financial & Savings')?.amount || 0,
        gifts: budgetCategories.find(cat => cat.name === 'Gifts & Donations')?.amount || 0,
      };
      
      if (currentBudget) {
        // Update existing budget
        const updatedBudget = await budgetService.updateBudget(currentBudget.id.toString(), budgetData);
        setCurrentBudget(updatedBudget);
      } else {
        // Create new budget
        const newBudget = await budgetService.createBudget(budgetData);
        setCurrentBudget(newBudget);
      }
      
      setIsEditingBudget(false);
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsBudgetLoading(false);
    }
  };

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
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isDateValid = (date: Dayjs | null): boolean => {
    if (!date) return false;
    return date.isAfter(dayjs(), 'day') || date.isSame(dayjs(), 'day');
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

  const getPersonalityName = (personality: number) => {
    switch (personality) {
      case -1: return 'Conservative Capy';
      case 0: return 'Neutral Capy';
      case 1: return 'Risky Capy';
      case 2: return 'Communist Capy';
      case 3: return 'Baby Capy';
      default: return 'Neutral Capy';
    }
  };

  const getBudgetProgress = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getBudgetStatusColor = (spent: number, budget: number) => {
    if (budget === 0) return theme.palette.grey[500];
    const percentage = (spent / budget) * 100;
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 75) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const calculateTotalBudget = () => {
    return budgetCategories.reduce((sum, category) => sum + category.amount, 0);
  };

  const calculateTotalSpent = () => {
    return budgetCategories.reduce((sum, category) => sum + category.spent, 0);
  };

  const categorizeTransaction = (transaction: PlaidTransaction) => {
    // Use the budget_category field from the API response if available
    if (transaction.budget_category) {
      return transaction.budget_category;
    }
    
    // Fallback to original categorization logic if budget_category is not available
    const category = transaction.personal_finance_category?.primary?.toLowerCase() || 
                    transaction.category?.[0]?.toLowerCase() || '';
    
    // Map transaction categories to budget categories
    if (category.includes('food') || category.includes('dining') || category.includes('restaurant') || 
        category.includes('grocery') || category.includes('meal')) {
      return 'Food & Dining';
    } else if (category.includes('transport') || category.includes('car') || category.includes('gas') || 
               category.includes('uber') || category.includes('lyft') || category.includes('parking') ||
               category.includes('public') || category.includes('bus') || category.includes('train')) {
      return 'Transportation';
    } else if (category.includes('health') || category.includes('medical') || category.includes('doctor') ||
               category.includes('pharmacy') || category.includes('dental') || category.includes('vision') ||
               category.includes('hospital') || category.includes('insurance')) {
      return 'Health & Insurance';
    } else if (category.includes('utility') || category.includes('electric') || category.includes('water') ||
               category.includes('gas') || category.includes('internet') || category.includes('phone') ||
               category.includes('cable') || category.includes('waste') || category.includes('rent') ||
               category.includes('mortgage') || category.includes('property')) {
      return 'Housing & Utilities';
    } else if (category.includes('clothing') || category.includes('apparel') || category.includes('grooming') ||
               category.includes('gym') || category.includes('fitness') || category.includes('hobby') ||
               category.includes('subscription') || category.includes('personal')) {
      return 'Personal & Lifestyle';
    } else if (category.includes('entertainment') || category.includes('movie') || category.includes('theater') ||
               category.includes('sport') || category.includes('game') || category.includes('travel') ||
               category.includes('vacation') || category.includes('leisure')) {
      return 'Entertainment & Leisure';
    } else if (category.includes('financial') || category.includes('savings') || category.includes('investment') ||
               category.includes('debt') || category.includes('loan') || category.includes('tax') ||
               category.includes('bank') || category.includes('credit')) {
      return 'Financial & Savings';
    } else if (category.includes('gift') || category.includes('donation') || category.includes('charity') ||
               category.includes('contribution') || category.includes('fundraiser')) {
      return 'Gifts & Donations';
    }
    
    // Default to Personal & Lifestyle for uncategorized transactions
    return 'Personal & Lifestyle';
  };

  const updateBudgetFromTransactions = (transactions: PlaidTransaction[]) => {
    const categorySpending = new Map<string, number>();
    
    // Initialize all categories with 0 spending
    budgetCategories.forEach(cat => {
      categorySpending.set(cat.name, 0);
    });

    // Calculate spending for each category from transactions
    transactions.forEach(transaction => {
      if (transaction.amount > 0) { // Only count expenses (positive amounts)
        // Use budget_category from API response if available, otherwise use categorizeTransaction
        const budgetCategory = transaction.budget_category || categorizeTransaction(transaction);
        const currentSpending = categorySpending.get(budgetCategory) || 0;
        categorySpending.set(budgetCategory, currentSpending + transaction.amount);
      }
    });
    
    // Update budget categories with actual spending
    const updatedCategories = budgetCategories.map(cat => ({
      ...cat,
      spent: categorySpending.get(cat.name) || 0
    }));
    
    setBudgetCategories(updatedCategories);
  };

  const handleGoalClick = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setIsGoalDialogOpen(true);
  };

  const handleCloseGoalDialog = () => {
    setIsGoalDialogOpen(false);
    setSelectedGoal(null);
  };

  const handleAddGoal = async () => {
    try {
      const goalData = {
        title: newGoal.title,
        description: newGoal.description,
        amount: parseFloat(newGoal.amount) || 0,
        current_amount: parseFloat(newGoal.current_amount) || 0,
        deadline: newGoal.deadline?.toISOString() || undefined,
        category: newGoal.category,
        priority: newGoal.priority,
        icon: newGoal.icon,
        color: newGoal.color
      };
      
      await savingsGoalsService.createSavingsGoal(goalData);
      
      // Reset form
      setNewGoal({
        title: '',
        description: '',
        amount: '',
        current_amount: '',
        deadline: null as Dayjs | null,
        category: 'savings',
        priority: 'medium',
        icon: '💰',
        color: '#4CAF50'
      });
      
      handleCloseAddGoalDialog();
      
      // Refresh goals list
      await fetchSavingsGoals();
    } catch (err: any) {
      console.error('Failed to create savings goal:', err);
      setError(err.response?.data?.message || 'Failed to create savings goal');
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      await savingsGoalsService.deleteSavingsGoal(goalId.toString());
      
      // Close dialog if the deleted goal was selected
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(null);
        setIsGoalDialogOpen(false);
      }
      
      // Refresh goals list
      await fetchSavingsGoals();
    } catch (err: any) {
      console.error('Failed to delete savings goal:', err);
      setError(err.response?.data?.message || 'Failed to delete savings goal');
    }
  };

  const handleOpenAddGoalDialog = () => {
    setIsAddGoalDialogOpen(true);
  };

  const handleCloseAddGoalDialog = () => {
    setIsAddGoalDialogOpen(false);
    setNewGoal({
      title: '',
      description: '',
      amount: '',
      current_amount: '',
      deadline: null as Dayjs | null,
      category: 'savings',
      priority: 'medium',
      icon: '💰',
      color: '#4CAF50'
    });
  };

  const handleOpenEditGoalDialog = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setEditingGoalForm({
      title: goal.title,
      description: goal.description,
      amount: goal.amount.toString(),
      current_amount: goal.current_amount.toString(),
      deadline: goal.deadline ? dayjs(goal.deadline) : null,
      category: goal.category || 'savings',
      priority: goal.priority,
      icon: goal.icon || '💰',
      color: goal.color || '#4CAF50'
    });
    setIsEditGoalDialogOpen(true);
    setIsGoalDialogOpen(false); // Close the view dialog
  };

  const handleCloseEditGoalDialog = () => {
    setIsEditGoalDialogOpen(false);
    setEditingGoal(null);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    
    try {
      const goalData = {
        title: editingGoalForm.title,
        description: editingGoalForm.description,
        amount: parseFloat(editingGoalForm.amount) || 0,
        current_amount: parseFloat(editingGoalForm.current_amount) || 0,
        deadline: editingGoalForm.deadline?.toISOString() || undefined,
        category: editingGoalForm.category || undefined,
        priority: editingGoalForm.priority,
        icon: editingGoalForm.icon || undefined,
        color: editingGoalForm.color || undefined
      };
      
      await savingsGoalsService.updateSavingsGoal(editingGoal.id.toString(), goalData);
      
      handleCloseEditGoalDialog();
      
      // Refresh goals list
      await fetchSavingsGoals();
    } catch (err: any) {
      console.error('Failed to update savings goal:', err);
      setError(err.response?.data?.message || 'Failed to update savings goal');
    }
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
          color: activeTab === 'overview' ? '#2C1810' : theme.palette.text.secondary,
          borderBottom: activeTab === 'overview' ? `3px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: activeTab === 'overview' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: activeTab === 'overview' ? '#2C1810' : theme.palette.text.secondary,
            borderColor: theme.palette.primary.main,
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
          color: activeTab === 'goals' ? '#2C1810' : theme.palette.text.secondary,
          borderBottom: activeTab === 'goals' ? `3px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: activeTab === 'goals' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: activeTab === 'goals' ? '#2C1810' : theme.palette.text.secondary,
            borderColor: theme.palette.primary.main,
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
          color: activeTab === 'accounts' ? '#2C1810' : theme.palette.text.secondary,
          borderBottom: activeTab === 'accounts' ? `3px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: activeTab === 'accounts' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: activeTab === 'accounts' ? '#2C1810' : theme.palette.text.secondary,
            borderColor: theme.palette.primary.main,
          }
        }}
      >
        <MonetizationOn sx={{ mr: 1, fontSize: 20 }} />
        Accounts
      </Button>
      <Button
        onClick={() => setActiveTab('budget')}
        sx={{
          flex: 1,
          py: 2,
          borderRadius: 0,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          color: activeTab === 'budget' ? '#2C1810' : theme.palette.text.secondary,
          borderBottom: activeTab === 'budget' ? `3px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: activeTab === 'budget' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: activeTab === 'budget' ? '#2C1810' : theme.palette.text.secondary,
            borderColor: theme.palette.primary.main,
          }
        }}
      >
        <Receipt sx={{ mr: 1, fontSize: 20 }} />
        Budget
      </Button>
    </Box>
  );

  // Helper functions for number input handling
  const isValidNumber = (value: string): boolean => {
    if (value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  };

  const formatNumberInput = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  const handleNumberInputChange = (value: string, setter: (value: string) => void) => {
    const formatted = formatNumberInput(value);
    if (formatted === '' || isValidNumber(formatted)) {
      setter(formatted);
    }
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
                src={getCapyImage(personality)}
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
                  placeholder={isAskingCapy ? "Capy is thinking..." : "Ask Capy a question about your finances"}
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
                    outline: 'none',
                    borderRadius: 2,
                    border: 'none',
                    backgroundColor: theme.palette.background.paper,
                    '& .MuiOutlinedInput-root': {
                      outline: 'none',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.background.paper}`,
                      borderInline: 'none',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'black',
                      }
                    }
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
                    backgroundColor: theme.palette.background.paper,
                    border: `2px solid ${theme.palette.background.paper}`,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      border: `2px solid ${theme.palette.common.black}`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    transition: 'all 0.2s ease',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 20, color: 'black' }} />
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
                      background: `linear-gradient(135deg, #8B4513 0%, #A0522D 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                      cursor: 'pointer'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />
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
                        background: `linear-gradient(135deg, #8B4513 0%, #A0522D 100%)`,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {user?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email}
                      </Typography>
                      <Chip
                        label={getPersonalityName(personality)}
                        size="small"
                        sx={{
                          mt: 0.5,
                          ml: 2,
                          fontSize: '0.7rem',
                          height: 20,
                          backgroundColor: '#2C1810',
                          color: '#FFFFFF',
                          fontWeight: 600,
                        }}
                      />
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
              <Typography variant="h6" component="div" fontWeight={700} gutterBottom>
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
              <Typography variant="h6" component="div" fontWeight={700} gutterBottom>
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
                            <Typography variant="h6" component="div" fontWeight={700} gutterBottom color="primary.main">
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
                            <Typography variant="h6" component="div" fontWeight={700} gutterBottom color="success.main">
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
                            <Typography variant="h6" component="div" fontWeight={700} gutterBottom color="warning.main">
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
                              variant="h6" 
                              component="div"
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
                      <Typography variant="h6" component="div" fontWeight={600} gutterBottom>
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
                      <Typography variant="h6" component="div" fontWeight={600}>
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

                    {/* Goals Summary */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                      <Card
                        elevation={2}
                        sx={{
                          borderRadius: 2,
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="info.main">
                            {formatCurrency(goals.reduce((sum, goal) => sum + Number(goal.amount), 0))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Target
                          </Typography>
                        </CardContent>
                      </Card>
                      <Card
                        elevation={2}
                        sx={{
                          borderRadius: 2,
                          background: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {formatCurrency(goals.reduce((sum, goal) => sum + Number(goal.current_amount), 0))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Saved
                          </Typography>
                        </CardContent>
                      </Card>
                      <Card
                        elevation={2}
                        sx={{
                          borderRadius: 2,
                          background: alpha(theme.palette.warning.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="warning.main">
                            {goals.filter(goal => getDaysUntilDeadline(goal.deadline || '') <= 30).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Due Soon
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    {/* Add Goal Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddGoalDialog}
                        sx={{ borderRadius: 2 }}
                      >
                        Add New Goal
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Goals Grid */}
                {isGoalsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : goals.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {goals.map((goal) => (
                      <Card
                        key={goal.id}
                        elevation={4}
                        onClick={() => handleGoalClick(goal)}
                        sx={{
                          flex: '1 1 350px',
                          minWidth: 0,
                          borderRadius: 2,
                          background: alpha(theme.palette.background.paper, 0.95),
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${alpha(goal.color || '#FAC984', 0.2)}`,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[12],
                            border: `1px solid ${goal.color || '#FAC984'}`
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
                                background: alpha(goal.color || '#FAC984', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                              }}
                            >
                              {goal.icon || '💰'}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" component="div" fontWeight={700}>
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
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGoal(goal.id);
                              }}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                  color: 'error.main',
                                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
                                {getProgressPercentage(goal.current_amount, goal.amount).toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getProgressPercentage(goal.current_amount, goal.amount)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(goal.color || '#FAC984', 0.2),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: goal.color || '#FAC984',
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
                              <Typography variant="h6" component="div" fontWeight={700} color={goal.color || '#FAC984'}>
                                {formatCurrency(goal.current_amount)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary">
                                Target
                              </Typography>
                              <Typography variant="h6" component="div" fontWeight={700}>
                                {formatCurrency(goal.amount)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Deadline */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {getDaysUntilDeadline(goal.deadline || '') > 0 
                                ? `${getDaysUntilDeadline(goal.deadline || '')} days left`
                                : 'Overdue'
                              }
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
                      <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                        No savings goals yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Create your first savings goal to start tracking your progress
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddGoalDialog}
                        sx={{ borderRadius: 2 }}
                      >
                        Create Your First Goal
                      </Button>
                    </CardContent>
                  </Card>
                )}
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
                              <Typography variant="h6" component="div" fontWeight={600} gutterBottom>
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
                              <Typography variant="h6" component="div" fontWeight={700} color="success.main">
                                {formatCurrency(account.balances?.current || 0)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Available Balance
                              </Typography>
                              <Typography variant="h6" component="div" fontWeight={700} color="info.main">
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
                      <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
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

            {/* Budget Tab Content */}
            {activeTab === 'budget' && (
              <>
                {/* Budget Header */}
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

                    {/* Current Month Display */}
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                        {getCurrentMonthRange().monthName} {getCurrentMonthRange().year}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Budget tracking based on your actual transactions
                      </Typography>
                    </Box>

                    {/* Budget Summary */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                      <Card
                        elevation={2}
                        sx={{
                          borderRadius: 2,
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="info.main">
                            {formatCurrency(calculateTotalBudget())}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Budget
                          </Typography>
                        </CardContent>
                      </Card>
                      <Card
                        elevation={2}
                        sx={{
                          borderRadius: 2,
                          background: alpha(theme.palette.warning.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="warning.main">
                            {formatCurrency(calculateTotalSpent())}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Spent
                          </Typography>
                        </CardContent>
                      </Card>
                      <Card
                        elevation={2}
                        sx={{
                          borderRadius: 2,
                          background: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {formatCurrency(calculateTotalBudget() - calculateTotalSpent())}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Remaining
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    {/* Edit Budget Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
                      {isEditingBudget && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setIsEditingBudget(false);
                            // Reset to original values if we have a current budget
                            if (currentBudget) {
                              fetchBudgets();
                            }
                          }}
                          disabled={isBudgetLoading}
                          sx={{ borderRadius: 2 }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        startIcon={isEditingBudget ? (isBudgetLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />) : <EditIcon />}
                        onClick={isEditingBudget ? saveBudget : () => setIsEditingBudget(true)}
                        disabled={isBudgetLoading}
                        sx={{ borderRadius: 2 }}
                      >
                        {isEditingBudget ? (isBudgetLoading ? 'Saving...' : 'Save Budget') : 'Edit Budget'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Budget Categories Grid */}
                {isBudgetLoading && !currentBudget ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {budgetCategories.map((category) => (
                      <Card
                        key={category.id}
                        elevation={4}
                        sx={{
                          flex: '1 1 350px',
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
                          {/* Category Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 2,
                                background: alpha(getBudgetStatusColor(category.spent, category.amount), 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                              }}
                            >
                              {category.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" component="div" fontWeight={600}>
                                {category.name}
                              </Typography>
                              <Chip
                                label={`${getBudgetProgress(category.spent, category.amount).toFixed(1)}%`}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(getBudgetStatusColor(category.spent, category.amount), 0.1),
                                  color: getBudgetStatusColor(category.spent, category.amount),
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Budget Input (when editing) */}
                          {isEditingBudget && (
                            <Box sx={{ mb: 2 }}>
                              <TextField
                                fullWidth
                                label="Budget Amount"
                                type="text"
                                value={category.amount === 0 ? '' : category.amount.toString()}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty string or valid numbers
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    const numValue = value === '' ? 0 : Number(value);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                      const newCategories = budgetCategories.map(cat =>
                                        cat.id === category.id
                                          ? { ...cat, amount: numValue }
                                          : cat
                                      );
                                      setBudgetCategories(newCategories);
                                    }
                                  }
                                }}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                sx={{ mb: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Spent amount is automatically calculated from your transactions
                              </Typography>
                            </Box>
                          )}

                          {/* Budget Progress */}
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                Progress
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatCurrency(category.spent)} / {formatCurrency(category.amount)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getBudgetProgress(category.spent, category.amount)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(getBudgetStatusColor(category.spent, category.amount), 0.2),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getBudgetStatusColor(category.spent, category.amount),
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>

                          {/* Budget Status */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: getBudgetStatusColor(category.spent, category.amount)
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {category.amount === 0 ? 'No budget set' :
                               category.spent >= category.amount ? 'Over budget' :
                               category.spent >= category.amount * 0.9 ? 'Near limit' : 'On track'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* Transactions List */}
                <Card
                  elevation={4}
                  sx={{
                    mt: 4,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Transactions This Month
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Showing expenses categorized into your budget categories
                    </Typography>
                    
                    {allMonthlyTransactions.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {allMonthlyTransactions
                          .filter(transaction => transaction.amount > 0) // Only show expenses
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
                          .map((transaction, index) => (
                            <Box
                              key={`${transaction.transaction_id}-${index}`}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                borderRadius: 1,
                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    background: alpha(getBudgetStatusColor(0, 100), 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px'
                                  }}
                                >
                                  {budgetCategories.find(cat => cat.name === (transaction.budget_category || categorizeTransaction(transaction)))?.icon || '💰'}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {transaction.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(transaction.date)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                  label={transaction.budget_category || categorizeTransaction(transaction)}
                                  size="small"
                                  sx={{
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}
                                />
                                <Typography variant="body2" fontWeight={600} color="error.main">
                                  {formatCurrency(transaction.amount)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No transactions found for this month
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
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
            src={getCapyImage(personality)}
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
          <Typography variant="h6" component="div" color="text.primary" textAlign="center">
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
                    background: alpha(selectedGoal.color || '', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px'
                  }}
                >
                  {selectedGoal.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="div" fontWeight={700}>
                    {selectedGoal.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={selectedGoal.category}
                      size="small"
                      sx={{
                        backgroundColor: alpha(selectedGoal.color || '', 0.1),
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
                  <Typography variant="h6" component="div" fontWeight={600}>
                    Progress
                  </Typography>
                  <Typography variant="h6" component="div" fontWeight={700} color={selectedGoal.color || '#FAC984'}>
                    {getProgressPercentage(selectedGoal.current_amount, selectedGoal.amount).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage(selectedGoal.current_amount, selectedGoal.amount)}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: alpha(selectedGoal.color || '#FAC984', 0.2),
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
                    <Typography variant="h6" component="div" fontWeight={700} color="success.main">
                      {formatCurrency(selectedGoal.current_amount)}
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
                    <Typography variant="h6" component="div" fontWeight={700} color="info.main">
                      {formatCurrency(selectedGoal.amount)}
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
                  <Typography variant="h6" component="div" fontWeight={700} color="warning.main">
                    {formatCurrency(selectedGoal.amount - selectedGoal.current_amount)}
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
                    {selectedGoal.deadline ? new Date(selectedGoal.deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No deadline'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedGoal.deadline ? `${getDaysUntilDeadline(selectedGoal.deadline)} days remaining` : 'No deadline'}
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
                onClick={() => selectedGoal && handleOpenEditGoalDialog(selectedGoal)}
                sx={{ borderRadius: 2 }}
              >
                Edit Goal
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog
        open={isAddGoalDialogOpen}
        onClose={handleCloseAddGoalDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" fontWeight={700}>
            Create New Financial Goal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Set up a new financial goal with custom tracking and automation
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 2 }}>
            {/* Basic Information */}
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Goal Title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Target Amount"
                type="text"
                value={newGoal.amount}
                onChange={(e) => handleNumberInputChange(e.target.value, (value) => setNewGoal({ ...newGoal, amount: value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Current Progress"
                type="text"
                value={newGoal.current_amount}
                onChange={(e) => handleNumberInputChange(e.target.value, (value) => setNewGoal({ ...newGoal, current_amount: value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="How much you've already saved towards this goal"
                sx={{ mb: 2 }}
              />
              
              <DatePicker
                label="Deadline"
                value={newGoal.deadline}
                onChange={(newValue) => setNewGoal({ ...newGoal, deadline: newValue })}
                minDate={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 2 },
                    error: newGoal.deadline ? !isDateValid(newGoal.deadline) : false,
                    helperText: newGoal.deadline && !isDateValid(newGoal.deadline) 
                      ? 'Deadline cannot be in the past' 
                      : ''
                  }
                }}
              />
            </Box>
            
            {/* Category and Priority */}
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newGoal.category}
                  label="Category"
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as string })}
                >
                  <MenuItem value="savings">💰 Savings</MenuItem>
                  <MenuItem value="debt">💳 Debt Repayment</MenuItem>
                  <MenuItem value="investment">📈 Investment</MenuItem>
                  <MenuItem value="purchase">🛒 Purchase</MenuItem>
                  <MenuItem value="emergency">🛡️ Emergency Fund</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newGoal.priority}
                  label="Priority"
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as 'low' | 'medium' | 'high' })}
                >
                  <MenuItem value="low">Low Priority</MenuItem>
                  <MenuItem value="medium">Medium Priority</MenuItem>
                  <MenuItem value="high">High Priority</MenuItem>
                </Select>
              </FormControl>
              
              {/* Icon Selection */}
              <Typography variant="subtitle2" gutterBottom>
                Choose an Icon
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {['💰', '🏠', '✈️', '💻', '📈', '💳', '🛡️', '🎓', '🚗', '🏥', '🎯', '⭐'].map((icon) => (
                  <IconButton
                    key={icon}
                    onClick={() => setNewGoal({ ...newGoal, icon: icon as string })}
                    sx={{
                      fontSize: '24px',
                      border: newGoal.icon === icon ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    {icon}
                  </IconButton>
                ))}
              </Box>
              
              {/* Color Selection */}
              <Typography variant="subtitle2" gutterBottom>
                Choose a Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B', '#E91E63'].map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setNewGoal({ ...newGoal, color: color as string })}
                    sx={{
                      backgroundColor: color,
                      width: 40,
                      height: 40,
                      border: newGoal.color === color ? `3px solid ${theme.palette.common.white}` : '3px solid transparent',
                      boxShadow: newGoal.color === color ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseAddGoalDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddGoal}
            disabled={!newGoal.title || !newGoal.description || newGoal.amount === '' || !newGoal.deadline}
            sx={{ borderRadius: 2 }}
          >
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog
        open={isEditGoalDialogOpen}
        onClose={handleCloseEditGoalDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" fontWeight={700}>
            Edit Financial Goal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update your financial goal with custom tracking and automation
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 2 }}>
            {/* Basic Information */}
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Goal Title"
                value={editingGoalForm.title}
                onChange={(e) => setEditingGoalForm({ ...editingGoalForm, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingGoalForm.description}
                onChange={(e) => setEditingGoalForm({ ...editingGoalForm, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Target Amount"
                type="text"
                value={editingGoalForm.amount}
                onChange={(e) => handleNumberInputChange(e.target.value, (value) => setEditingGoalForm({ ...editingGoalForm, amount: value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Current Progress"
                type="text"
                value={editingGoalForm.current_amount}
                onChange={(e) => handleNumberInputChange(e.target.value, (value) => setEditingGoalForm({ ...editingGoalForm, current_amount: value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="How much you've already saved towards this goal"
                sx={{ mb: 2 }}
              />
              
              <DatePicker
                label="Deadline"
                value={editingGoalForm.deadline}
                onChange={(newValue) => setEditingGoalForm({ ...editingGoalForm, deadline: newValue })}
                minDate={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 2 },
                    error: editingGoalForm.deadline ? !isDateValid(editingGoalForm.deadline) : false,
                    helperText: editingGoalForm.deadline && !isDateValid(editingGoalForm.deadline) 
                      ? 'Deadline cannot be in the past' 
                      : ''
                  }
                }}
              />
            </Box>
            
            {/* Category and Priority */}
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingGoalForm.category}
                  label="Category"
                  onChange={(e) => setEditingGoalForm({ ...editingGoalForm, category: e.target.value as string })}
                >
                  <MenuItem value="savings">💰 Savings</MenuItem>
                  <MenuItem value="debt">💳 Debt Repayment</MenuItem>
                  <MenuItem value="investment">📈 Investment</MenuItem>
                  <MenuItem value="purchase">🛒 Purchase</MenuItem>
                  <MenuItem value="emergency">🛡️ Emergency Fund</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editingGoalForm.priority}
                  label="Priority"
                  onChange={(e) => setEditingGoalForm({ ...editingGoalForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                >
                  <MenuItem value="low">Low Priority</MenuItem>
                  <MenuItem value="medium">Medium Priority</MenuItem>
                  <MenuItem value="high">High Priority</MenuItem>
                </Select>
              </FormControl>
              
              {/* Icon Selection */}
              <Typography variant="subtitle2" gutterBottom>
                Choose an Icon
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {['💰', '🏠', '✈️', '💻', '📈', '💳', '🛡️', '🎓', '🚗', '🏥', '🎯', '⭐'].map((icon) => (
                  <IconButton
                    key={icon}
                    onClick={() => setEditingGoalForm({ ...editingGoalForm, icon: icon as string })}
                    sx={{
                      fontSize: '24px',
                      border: editingGoalForm.icon === icon ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    {icon}
                  </IconButton>
                ))}
              </Box>
              
              {/* Color Selection */}
              <Typography variant="subtitle2" gutterBottom>
                Choose a Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B', '#E91E63'].map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setEditingGoalForm({ ...editingGoalForm, color: color as string })}
                    sx={{
                      backgroundColor: color,
                      width: 40,
                      height: 40,
                      border: editingGoalForm.color === color ? `3px solid ${theme.palette.common.white}` : '3px solid transparent',
                      boxShadow: editingGoalForm.color === color ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
          
          {/* Automation Suggestions */}
          <Box sx={{ mt: 3 }}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                background: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <CardContent>
                <Typography variant="h6" component="div" fontWeight={600} gutterBottom>
                  🤖 Automation Suggestions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Capy can help automate your goal progress tracking:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    Track savings from specific income sources
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    Monitor spending in related categories
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    Send reminders when off track
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    Suggest budget adjustments
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseEditGoalDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateGoal}
            disabled={!editingGoalForm.title || !editingGoalForm.description || editingGoalForm.amount === '' || !editingGoalForm.deadline}
            sx={{ borderRadius: 2 }}
          >
            Update Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
