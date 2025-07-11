import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlaidLink } from 'react-plaid-link';
import { plaidService, authService } from '../services/api';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Avatar,
  Chip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Balance as BalanceIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Whatshot as WhatshotIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import capyImage from '../assets/capy.png';

type CapyPersonality = 'conservative' | 'neutral' | 'risky' | 'communist' | 'baby';

interface CapyOption {
  value: CapyPersonality;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  personalityValue: number; // -1 for conservative, 0 for neutral, 1 for risky, 2 for communist
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, personality, setPersonality } = useAuth();
  const theme = useTheme();
  const [selectedCapy, setSelectedCapy] = useState<CapyPersonality>('neutral');
  const [isBankLinked, setIsBankLinked] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPersonality, setIsSavingPersonality] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load current personality on component mount
  React.useEffect(() => {
    // Map the personality value from context to the UI state
    if (personality === -1) {
      setSelectedCapy('conservative');
    } else if (personality === 0) {
      setSelectedCapy('neutral');
    } else if (personality === 1) {
      setSelectedCapy('risky');
    } else if (personality === 2) {
      setSelectedCapy('communist');
    } else if (personality === 3) {
      setSelectedCapy('baby');
    }
  }, [personality]);

  // Check initial item status
  React.useEffect(() => {
    const checkItemStatus = async () => {
      if (!user?.id) return;
      
      try {
        const response = await plaidService.getItemStatus(user.id.toString());
        setIsBankLinked(response.has_linked_item);
      } catch (err: any) {
        console.error('Failed to check item status:', err);
        // Don't set error here as it's not critical for the UI
      }
    };

    checkItemStatus();
  }, [user?.id]);

  // Fetch link token from backend
  React.useEffect(() => {
    const fetchLinkToken = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await plaidService.createLinkToken(user.id.toString());
        setLinkToken(response.link_token);
      } catch (err: any) {
        console.error('Failed to create link token:', err);
        setError(err.response?.data?.message || 'Failed to create link token');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkToken();
  }, [user?.id]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        console.log('Plaid Link Success!', public_token, metadata);
        await plaidService.exchangePublicToken(public_token, user?.id?.toString() || '');
        setIsBankLinked(true);
        setError(null);
      } catch (err: any) {
        console.error('Failed to exchange public token:', err);
        setError(err.response?.data?.message || 'Failed to link bank account');
      }
    },
    onExit: (err, metadata) => {
      console.log('Plaid Link Exit:', err, metadata);
      if (err) {
        setError(err.display_message || 'Failed to link bank account');
      }
    },
  });

  const capyOptions: CapyOption[] = [
    {
      value: 'conservative',
      label: 'Conservative Capy',
      description: 'Gentle and encouraging tone. Uses supportive language and celebrates small wins. Perfect for those who prefer a nurturing approach to financial advice.',
      icon: <SecurityIcon />,
      color: theme.palette.success.main,
      personalityValue: -1
    },
    {
      value: 'neutral',
      label: 'Neutral Capy',
      description: 'Balanced and practical communication style. Provides clear, straightforward advice with a friendly but informative tone.',
      icon: <BalanceIcon />,
      color: theme.palette.primary.main,
      personalityValue: 0
    },
    {
      value: 'risky',
      label: 'Aggressive Capy',
      description: 'Direct and assertive communication. Uses strong language and provides clear action items with urgency when needed.',
      icon: <TrendingUpIcon />,
      color: theme.palette.warning.main,
      personalityValue: 1
    },
    {
      value: 'communist',
      label: 'Communist Capy',
      description: 'Revolutionary financial advisor with socialist principles. Emphasizes collective responsibility and community support.',
      icon: <WhatshotIcon />,
      color: theme.palette.error.main,
      personalityValue: 2
    },
    {
      value: 'baby',
      label: 'Baby Capy',
      description: 'Perfect for beginners! Teaches financial basics step-by-step with simple explanations, helpful tips, and gentle guidance for young people new to money management.',
      icon: <SchoolIcon />,
      color: theme.palette.info.main,
      personalityValue: 3
    }
  ];

  // Auto-save personality when selection changes
  const handlePersonalityChange = async (newPersonality: CapyPersonality) => {
    if (newPersonality === selectedCapy) return; // No change needed
    
    setSelectedCapy(newPersonality);
    setIsSavingPersonality(true);
    setError(null);
    
    try {
      // Find the selected option to get the personality value
      const selectedOption = capyOptions.find(option => option.value === newPersonality);
      if (!selectedOption) {
        throw new Error('Invalid personality selection');
      }
      
      setPersonality(selectedOption.personalityValue);
      setSuccessMessage(`${selectedOption.label} selected successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Failed to save personality:', err);
      setError(err.response?.data?.message || 'Failed to save personality preference');
      // Revert to previous selection on error
      setSelectedCapy(selectedCapy);
    } finally {
      setIsSavingPersonality(false);
    }
  };

  const handlePlaidLink = () => {
    open();
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
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
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
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
              Back to Dashboard
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
                Settings
              </Typography>
              <Typography variant="body1" color={alpha(theme.palette.common.white, 0.8)}>
                Customize your CapySpend experience
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Settings Content */}
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
            {/* Capy Personality Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
                Choose Your Capy Personality
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the type of financial advice you'd like to receive from Capy
              </Typography>

              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={selectedCapy}
                  onChange={(e) => handlePersonalityChange(e.target.value as CapyPersonality)}
                >
                  {capyOptions.map((option) => (
                    <Card
                      key={option.value}
                      elevation={2}
                      onClick={() => handlePersonalityChange(option.value)}
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        border: selectedCapy === option.value 
                          ? `2px solid ${option.color}` 
                          : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        transition: 'all 0.2s ease',
                        cursor: isSavingPersonality ? 'not-allowed' : 'pointer',
                        userSelect: 'none',
                        opacity: isSavingPersonality && selectedCapy !== option.value ? 0.6 : 1,
                        '&:hover': {
                          borderColor: isSavingPersonality ? undefined : option.color,
                          boxShadow: isSavingPersonality ? undefined : `0 4px 12px ${alpha(option.color, 0.2)}`
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Radio
                            checked={selectedCapy === option.value}
                            disabled={isSavingPersonality}
                            sx={{ color: option.color }}
                          />
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,
                              backgroundColor: alpha(option.color, 0.1),
                              color: option.color
                            }}
                          >
                            {isSavingPersonality && selectedCapy === option.value ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              option.icon
                            )}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" fontWeight={600}>
                                {option.label}
                              </Typography>
                              {selectedCapy === option.value && (
                                <Chip
                                  label={isSavingPersonality ? "Saving..." : "Selected"}
                                  size="small"
                                  color="primary"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Bank Account Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
                Link Your Plaid Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Link your Plaid account to enable automatic transactions and better financial insights.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {isBankLinked ? (
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    border: `2px solid ${theme.palette.success.main}`,
                    backgroundColor: alpha(theme.palette.success.main, 0.05)
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main
                        }}
                      >
                        <CheckCircleIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} color={theme.palette.success.main}>
                          Plaid Account Linked
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your Plaid account is successfully connected. You can now view transactions and get personalized financial insights.
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.5)
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main
                        }}
                      >
                        <AccountBalanceIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          No Plaid Account Linked
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Link your Plaid account to unlock automatic transaction tracking and personalized financial advice.
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AccountBalanceIcon />}
                      onClick={handlePlaidLink}
                      disabled={!ready || isLoading}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        textTransform: 'none',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                        }
                      }}
                    >
                      {isLoading ? 'Loading...' : ready ? 'Link Plaid Account' : 'Initializing...'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
      {successMessage && (
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            {successMessage}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Settings; 