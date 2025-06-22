import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  user: User | null;
  personality: number;
  setPersonality: (personality: number) => Promise<void>;
  refreshPersonality: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [personality, setPersonalityState] = useState<number>(0);

  // Check for existing authentication on component mount
  React.useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Try to fetch user profile to check if user is authenticated
        const userData = await authService.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Load personality after authentication
        await refreshPersonality();
      } catch (error) {
        // User is not authenticated or session expired
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Set up automatic token refresh
  React.useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh token every 6 days (before the 7-day expiration)
    const refreshInterval = setInterval(async () => {
      try {
        await authService.refreshToken();
        console.log('Token refreshed automatically');
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // If refresh fails, user will need to log in again
        setIsAuthenticated(false);
        setUser(null);
      }
    }, 6 * 24 * 60 * 60 * 1000); // 6 days in milliseconds

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = async (username: string, password: string) => {
    try {
      // Call the login API
      await authService.login(username, password);
      
      // Fetch user profile after successful login
      const userData = await authService.getProfile();
      setUser(userData);
      setIsAuthenticated(true);
      
      // Load personality after login
      await refreshPersonality();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setPersonalityState(0); // Reset personality on logout
    }
  };

  const setPersonality = async (newPersonality: number) => {
    try {
      await authService.setPersonality(newPersonality);
      setPersonalityState(newPersonality);
    } catch (error) {
      console.error('Failed to set personality:', error);
      throw error;
    }
  };

  const refreshPersonality = async () => {
    try {
      const response = await authService.getPersonality();
      setPersonalityState(response.personality);
    } catch (error) {
      console.error('Failed to load personality:', error);
      // Keep default personality (0) if loading fails
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    user,
    personality,
    setPersonality,
    refreshPersonality,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 