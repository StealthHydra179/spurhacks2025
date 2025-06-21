import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  Link as LinkIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';

interface PlaidRouteProps {
  children: React.ReactNode;
}

const PlaidRoute: React.FC<PlaidRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [hasLinkedItem, setHasLinkedItem] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPlaidStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await plaidService.getItemStatus(user.id.toString());
        setHasLinkedItem(response.has_linked_item);
      } catch (err: any) {
        console.error('Failed to check Plaid status:', err);
        setError('Failed to check bank account status');
        setHasLinkedItem(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPlaidStatus();
  }, [user?.id]);

  // Show loading spinner while checking Plaid status
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  // If user doesn't have a linked Plaid account, show the setup page
  if (hasLinkedItem === false) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          py: 4,
          position: 'relative'
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => window.history.back()}
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
                Go Back
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
                  Bank Account Required
                </Typography>
                <Typography variant="body1" color={alpha(theme.palette.common.white, 0.8)}>
                  Link your bank account to access this feature
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Setup Card */}
          <Card
            elevation={8}
            sx={{
              borderRadius: 2,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                  mx: 'auto',
                  mb: 3
                }}
              >
                <BankIcon sx={{ fontSize: 40 }} />
              </Avatar>
              
              <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
                Connect Your Bank Account
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                To access detailed financial insights, transactions, and spending analysis, 
                you need to securely link your bank account using Plaid.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LinkIcon />}
                  onClick={() => window.location.href = '/settings'}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  Link Bank Account
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => window.location.href = '/dashboard'}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
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

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                🔒 Your data is encrypted and secure. We use Plaid to safely connect to your bank.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // If user has a linked Plaid account, render the protected content
  return <>{children}</>;
};

export default PlaidRoute; 