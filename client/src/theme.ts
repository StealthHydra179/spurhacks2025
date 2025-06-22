import { createTheme } from '@mui/material';

// Create a warm cream and golden theme
export const theme = createTheme({
  palette: {
    primary: {
      main: '#FAC984', // Soft golden
      dark: '#F0B76B', // Darker golden
      light: '#FDD4A3', // Lighter golden
    },
    secondary: {
      main: '#E6B17A', // Complementary warm brown
      dark: '#D4A06A', // Darker brown
      light: '#EEC492', // Lighter brown
    },
    background: {
      default: '#FFF3E0', // Warm cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C1810', // Darker brown for better contrast
      secondary: '#4A3429', // Darker medium brown
    },
    success: {
      main: '#66BB6A',
      light: '#A5D6A7',
      dark: '#388E3C',
    },
    warning: {
      main: '#FFA726',
      light: '#FFCC80',
      dark: '#F57C00',
    },
    error: {
      main: '#EF5350',
      light: '#E57373',
      dark: '#D32F2F',
    },
    info: {
      main: '#42A5F5',
      light: '#90CAF9',
      dark: '#1976D2',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      color: '#2C1810',
    },
    h2: {
      fontWeight: 700,
      color: '#2C1810',
    },
    h3: {
      fontWeight: 600,
      color: '#2C1810',
    },
    h4: {
      fontWeight: 600,
      color: '#2C1810',
    },
    h5: {
      fontWeight: 600,
      color: '#2C1810',
    },
    h6: {
      fontWeight: 600,
      color: '#2C1810',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(250, 201, 132, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(250, 201, 132, 0.4)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#FAC984',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FAC984',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(250, 201, 132, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(250, 201, 132, 0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
}); 