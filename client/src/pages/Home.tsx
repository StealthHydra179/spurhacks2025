import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  Home as HomeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Secure Authentication',
      description: 'Bank-level security with JWT tokens and HTTP-only cookies'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Real-time Tracking',
      description: 'Monitor your spending and income in real-time with instant updates'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Smart Analytics',
      description: 'Get insights into your spending patterns and financial health'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        position: 'relative'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Box
            component="img"
            src={capyImage}
            alt="CapySpend Logo"
            sx={{
              width: 100,
              height: 100,
              objectFit: 'contain',
              mx: 'auto',
              mb: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`
            }}
          />
          
          <Typography
            variant="h2"
            component="h1"
            fontWeight={800}
            sx={{
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.common.white, 0.8)} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.3)}`
            }}
          >
            CapySpend
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              color: alpha(theme.palette.common.white, 0.9),
              fontWeight: 300,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Your personal finance companion with advanced security and real-time tracking
          </Typography>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 6 }}
          >
            {isAuthenticated ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<DashboardIcon />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  background: alpha(theme.palette.common.white, 0.2),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  color: theme.palette.common.white,
                  '&:hover': {
                    background: alpha(theme.palette.common.white, 0.3),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.3)}`
                  }
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    background: alpha(theme.palette.common.white, 0.2),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                    color: theme.palette.common.white,
                    '&:hover': {
                      background: alpha(theme.palette.common.white, 0.3),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.3)}`
                    }
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<RegisterIcon />}
                  onClick={() => navigate('/register')}
                  sx={{
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    borderColor: alpha(theme.palette.common.white, 0.5),
                    color: theme.palette.common.white,
                    backdropFilter: 'blur(20px)',
                    '&:hover': {
                      borderColor: theme.palette.common.white,
                      background: alpha(theme.palette.common.white, 0.1),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.3)}`
                    }
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            sx={{
              mb: 6,
              color: theme.palette.common.white,
              fontWeight: 700
            }}
          >
            Why Choose CapySpend?
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {features.map((feature, index) => (
              <Card
                key={index}
                elevation={12}
                sx={{
                  flex: '1 1 300px',
                  borderRadius: 4,
                  background: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`
                  }
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      mx: 'auto',
                      mb: 3,
                      boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h5" component="h3" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: alpha(theme.palette.common.white, 0.7),
              fontWeight: 300
            }}
          >
            © 2025 CapySpend. Built with ❤️ for secure personal finance management.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;