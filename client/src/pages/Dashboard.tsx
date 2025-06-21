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
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Logout as LogoutIcon,
  TrendingUp,
  Receipt,
  MonetizationOn
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();

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
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                '&:hover': {
                  borderColor: theme.palette.error.dark,
                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* User Info Card */}
        <Card
          elevation={8}
          sx={{
            mb: 4,
            borderRadius: 3,
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
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card
            elevation={4}
            sx={{
              flex: '1 1 300px',
              borderRadius: 3,
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
            sx={{
              flex: '1 1 300px',
              borderRadius: 3,
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
              borderRadius: 3,
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
            borderRadius: 3,
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
