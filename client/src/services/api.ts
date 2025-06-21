import axios from 'axios';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  ApiResponse 
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000', // Backend server URL
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This allows cookies to be sent with requests
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Redirect to login page
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error('Access forbidden');
    }

    return Promise.reject(error);
  }
);

// API service functions
export const authService = {
  login: async (username: string, password: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/users/login', { username, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/users/register', { username, email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/users/logout');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/api/users/profile');
    return response.data;
  },
};

export const userService = {
  getUsers: async (): Promise<{ message: string; status: string }> => {
    const response = await api.get<{ message: string; status: string }>('/api/users');
    return response.data;
  },
};

export const transactionService = {
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/api/transactions');
    return response.data;
  },

  createTransaction: async (transactionData: CreateTransactionRequest): Promise<Transaction> => {
    const response = await api.post<Transaction>('/api/transactions', transactionData);
    return response.data;
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/api/transactions/${id}`);
    return response.data;
  },

  updateTransaction: async (id: string, transactionData: UpdateTransactionRequest): Promise<Transaction> => {
    const response = await api.put<Transaction>(`/api/transactions/${id}`, transactionData);
    return response.data;
  },

  deleteTransaction: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/api/transactions/${id}`);
    return response.data;
  },
};

export const plaidService = {
  createLinkToken: async (userId: string): Promise<{ link_token: string }> => {
    const response = await api.post<{ link_token: string }>('/api/plaid/create_link_token', { user_id: userId });
    return response.data;
  },

  exchangePublicToken: async (publicToken: string, userId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/plaid/exchange_public_token', { 
      public_token: publicToken,
      user_id: userId 
    });
    return response.data;
  },
};

export default api; 