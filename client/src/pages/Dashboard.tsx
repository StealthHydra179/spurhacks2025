import React from 'react';
import { useAuth } from '../context/AuthContext';
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
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Logout as LogoutIcon,
  TrendingUp,
  Receipt,
  MonetizationOn,
  Search as SearchIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
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
              <Typography variant="h4" fontWeight={700} gutterBottom>
                $2,450
              </Typography>
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
              <Typography variant="h4" fontWeight={700} gutterBottom>
                $1,280
              </Typography>
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
              <Typography variant="h4" fontWeight={700} gutterBottom>
                $1,170
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Net Savings
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    Coffee Shop
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Food & Dining
                  </Typography>
                </Box>
                <Typography variant="body1" color="error.main" fontWeight={600}>
                  -$4.50
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    Salary Deposit
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Income
                  </Typography>
                </Box>
                <Typography variant="body1" color="success.main" fontWeight={600}>
                  +$2,500.00
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    Gas Station
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Transportation
                  </Typography>
                </Box>
                <Typography variant="body1" color="error.main" fontWeight={600}>
                  -$45.00
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Dashboard;
