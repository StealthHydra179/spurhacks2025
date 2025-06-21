import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Avatar,
  Button,
  Paper,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  IconButton,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Logout as LogoutIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.light, 0.3)} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.light, 0.3)} 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, ${alpha(theme.palette.info.light, 0.3)} 0%, transparent 50%)
          `,
          animation: 'gradientShift 15s ease infinite'
        }
      }}
    >
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          zIndex: 1100
        }}
      >
        <Toolbar>
          <Avatar
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              mr: 2,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            <DashboardIcon />
          </Avatar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            SpurHacks 2025 Dashboard
          </Typography>
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SettingsIcon />
          </IconButton>
          <Button
            onClick={handleLogout}
            variant="outlined"
            startIcon={<LogoutIcon />}
            sx={{
              borderRadius: 2,
              borderColor: alpha(theme.palette.primary.main, 0.5),
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Welcome Section */}
        <Card
          elevation={24}
          sx={{
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            background: alpha(theme.palette.background.paper, 0.95),
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
            mb: 4,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[24]
            }
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  mr: 3,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  Welcome back, {user?.username}!
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="action" />
                  <Typography variant="body1" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Chip
                    label="Verified"
                    color="success"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </Box>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Welcome to your SpurHacks 2025 dashboard. Here you can manage your hackathon journey, 
              track your progress, and access all the tools you need for an amazing experience.
            </Typography>
          </CardContent>
        </Card>        {/* Dashboard Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3
          }}
        >
          <Paper
            elevation={12}
            sx={{
              p: 3,
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[20],
                borderColor: alpha(theme.palette.primary.main, 0.3)
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                  mr: 2
                }}
              >
                <TrendingUpIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                Progress Tracker
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Track your hackathon milestones and achievements throughout the event.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                }
              }}
            >
              View Progress
            </Button>
          </Paper>

          <Paper
            elevation={12}
            sx={{
              p: 3,
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[20],
                borderColor: alpha(theme.palette.secondary.main, 0.3)
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                  mr: 2
                }}
              >
                <AccountBalanceIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                Financial Tools
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Access Plaid integration and financial management tools for your projects.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`
                }
              }}
            >
              Explore Tools
            </Button>
          </Paper>

          <Paper
            elevation={12}
            sx={{
              p: 3,
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[20],
                borderColor: alpha(theme.palette.info.main, 0.3)
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                  mr: 2
                }}
              >
                <DashboardIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                Project Hub
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage your hackathon projects, collaborate with teammates, and submit your work.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`
                }
              }}
            >
              Open Hub
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;