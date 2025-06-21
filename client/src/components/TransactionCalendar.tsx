import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

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

interface TransactionCalendarProps {
  transactions: PlaidTransaction[];
  month: string;
  year: number;
}

interface DayData {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  transactions: PlaidTransaction[];
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

const TransactionCalendar: React.FC<TransactionCalendarProps> = ({
  transactions,
  month,
  year
}) => {
  const theme = useTheme();

  // Generate calendar data for the month
  const generateCalendarData = (): DayData[] => {
    const days: DayData[] = [];
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, new Date(`${month} 1, ${year}`).getMonth(), 1);
    const lastDay = new Date(year, firstDay.getMonth() + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty days for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(firstDay);
      prevDate.setDate(prevDate.getDate() - (firstDayOfWeek - i));
      days.push({
        date: prevDate.toISOString().split('T')[0],
        day: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        transactions: [],
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0
      });
    }
    
    // Add days for current month
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, firstDay.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(t => t.date === dateString);
      
      const totalIncome = dayTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = dayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      days.push({
        date: dateString,
        day,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        transactions: dayTransactions,
        totalIncome,
        totalExpenses,
        transactionCount: dayTransactions.length
      });
    }
    
    // Add empty days for next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(lastDay);
      nextDate.setDate(nextDate.getDate() + i);
      days.push({
        date: nextDate.toISOString().split('T')[0],
        day: nextDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        transactions: [],
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0
      });
    }
    
    return days;
  };

  const calendarData = generateCalendarData();
  
  // Calculate max values for heatmap intensity
  const maxTransactions = Math.max(...calendarData.map(d => d.transactionCount));
  const maxAmount = Math.max(
    ...calendarData.map(d => Math.max(d.totalIncome, d.totalExpenses))
  );

  const getDayColor = (dayData: DayData) => {
    if (!dayData.isCurrentMonth) {
      return alpha(theme.palette.text.disabled, 0.1);
    }
    
    if (dayData.transactionCount === 0) {
      return alpha(theme.palette.background.paper, 0.3);
    }
    
    // Calculate intensity based on transaction count and amount
    const transactionIntensity = dayData.transactionCount / Math.max(maxTransactions, 1);
    const amountIntensity = Math.max(dayData.totalIncome, dayData.totalExpenses) / Math.max(maxAmount, 1);
    const intensity = (transactionIntensity + amountIntensity) / 2;
    
    // Use different colors for income vs expenses
    if (dayData.totalIncome > dayData.totalExpenses) {
      return alpha(theme.palette.success.main, 0.2 + intensity * 0.6);
    } else if (dayData.totalExpenses > dayData.totalIncome) {
      return alpha(theme.palette.error.main, 0.2 + intensity * 0.6);
    } else {
      return alpha(theme.palette.primary.main, 0.2 + intensity * 0.6);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        Transaction Activity - {month} {year}
      </Typography>
      
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.success.main, 0.6)
            }}
          />
          <Typography variant="caption">Income</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.error.main, 0.6)
            }}
          />
          <Typography variant="caption">Expenses</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.6)
            }}
          />
          <Typography variant="caption">Mixed</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.3)
            }}
          />
          <Typography variant="caption">No Activity</Typography>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {/* Weekday headers */}
        {weekdays.map(day => (
          <Box
            key={day}
            sx={{
              p: 1,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: theme.palette.text.secondary
            }}
          >
            {day}
          </Box>
        ))}
        
        {/* Calendar days */}
        {calendarData.map((dayData, index) => (
          <Tooltip
            key={index}
            title={
              dayData.isCurrentMonth ? (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {formatDate(dayData.date)}
                  </Typography>
                  <Typography variant="body2">
                    {dayData.transactionCount} transaction{dayData.transactionCount !== 1 ? 's' : ''}
                  </Typography>
                  {dayData.totalIncome > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <TrendingUp sx={{ fontSize: 12, color: theme.palette.success.main }} />
                      <Typography variant="caption" color="success.main">
                        +{formatCurrency(dayData.totalIncome)}
                      </Typography>
                    </Box>
                  )}
                  {dayData.totalExpenses > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingDown sx={{ fontSize: 12, color: theme.palette.error.main }} />
                      <Typography variant="caption" color="error.main">
                        -{formatCurrency(dayData.totalExpenses)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2">
                  {formatDate(dayData.date)}
                </Typography>
              )
            }
            arrow
          >
            <Box
              sx={{
                aspectRatio: '1',
                p: 1,
                borderRadius: 1,
                backgroundColor: getDayColor(dayData),
                border: dayData.isToday ? `2px solid ${theme.palette.primary.main}` : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: theme.shadows[4]
                },
                position: 'relative'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: dayData.isToday ? 700 : 500,
                  color: dayData.isCurrentMonth 
                    ? theme.palette.text.primary 
                    : theme.palette.text.disabled,
                  fontSize: '0.875rem'
                }}
              >
                {dayData.day}
              </Typography>
              
              {/* Transaction indicator dots */}
              {dayData.transactionCount > 0 && (
                <Box sx={{ display: 'flex', gap: 0.25, mt: 0.5 }}>
                  {dayData.transactions.slice(0, 3).map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: dayData.totalIncome > dayData.totalExpenses
                          ? theme.palette.success.main
                          : theme.palette.error.main
                      }}
                    />
                  ))}
                  {dayData.transactionCount > 3 && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                      +{dayData.transactionCount - 3}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>
      
      {/* Summary */}
      <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Typography variant="body2" color="text.secondary">
          Hover over days to see transaction details. Darker colors indicate more activity.
        </Typography>
      </Box>
    </Paper>
  );
};

export default TransactionCalendar; 