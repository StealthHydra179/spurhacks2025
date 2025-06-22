import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
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
import capyImage from '../assets/hscapy.svg';

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
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.primary.dark} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
          animation: 'float 6s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.05)} 0%, transparent 70%)`,
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Box
            component="img"
            src={capyImage}
            alt="CapySpend Logo"
            sx={{
              width: 400,
              height: 400,
              objectFit: 'contain',
              mx: 'auto',
              mb: 2,
              mt: 3,
              boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.4)}`,
              animation: 'bounce 3s ease-in-out infinite',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' }
              }
            }}
          />
          
          <Typography
            variant="h1"
            component="h1"
            fontWeight={900}
            sx={{
              mb: 3,
              color: theme.palette.common.white,
              textShadow: `0 6px 12px ${alpha(theme.palette.common.black, 0.6)}`,
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              letterSpacing: '-0.02em'
            }}
          >
            CapySpend
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              mb: 6,
              color: alpha(theme.palette.common.white, 0.95),
              fontWeight: 300,
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.4,
              textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`
            }}
          >
            Your intelligent personal finance companion with advanced security and real-time tracking
          </Typography>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            justifyContent="center"
            sx={{ mb: 8 }}
          >
            {isAuthenticated ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<DashboardIcon />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  py: 3,
                  px: 6,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.25)} 0%, ${alpha(theme.palette.common.white, 0.15)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `2px solid ${alpha(theme.palette.common.white, 0.4)}`,
                  color: theme.palette.common.white,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.35)} 0%, ${alpha(theme.palette.common.white, 0.25)} 100%)`,
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: `0 12px 35px ${alpha(theme.palette.common.black, 0.4)}`,
                    borderColor: alpha(theme.palette.common.white, 0.6)
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
                    py: 3,
                    px: 6,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.25)} 0%, ${alpha(theme.palette.common.white, 0.15)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `2px solid ${alpha(theme.palette.common.white, 0.4)}`,
                    color: theme.palette.common.white,
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.35)} 0%, ${alpha(theme.palette.common.white, 0.25)} 100%)`,
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: `0 12px 35px ${alpha(theme.palette.common.black, 0.4)}`,
                      borderColor: alpha(theme.palette.common.white, 0.6)
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
                    py: 3,
                    px: 6,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    borderRadius: 4,
                    borderColor: alpha(theme.palette.common.white, 0.6),
                    borderWidth: 2,
                    color: theme.palette.common.white,
                    backdropFilter: 'blur(20px)',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: theme.palette.common.white,
                      background: alpha(theme.palette.common.white, 0.15),
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: `0 12px 35px ${alpha(theme.palette.common.black, 0.4)}`
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
        <Box sx={{ py: 10 }}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            sx={{
              mb: 8,
              color: theme.palette.common.white,
              fontWeight: 800,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
              textShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.4)}`
            }}
          >
            Why Choose CapySpend?
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(33.333% - 22px)' }, maxWidth: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 22px)' } }}>
                <Card
                  elevation={16}
                  sx={{
                    height: '100%',
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                    transition: 'all 0.4s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: `0 25px 50px ${alpha(theme.palette.common.black, 0.4)}`,
                      borderColor: alpha(theme.palette.common.white, 0.5)
                    }
                  }}
                >
                  <CardContent sx={{ p: 5, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        mx: 'auto',
                        mb: 4,
                        boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)'
                        }
                      }}
                    >
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h5" component="h3" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              color: alpha(theme.palette.common.white, 0.8),
              fontWeight: 400,
              fontSize: '1.1rem'
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