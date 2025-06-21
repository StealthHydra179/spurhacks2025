import axios from 'axios';
import type { 
  User, 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  ConversationSummary,
  Conversation
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
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
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

  refreshToken: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/users/refresh');
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/api/users/profile');
    return response.data;
  },

  getPersonality: async (): Promise<{ personality: number; personality_description: string; status: string }> => {
    const response = await api.get<{ personality: number; personality_description: string; status: string }>('/api/users/personality');
    return response.data;
  },

  setPersonality: async (personality: number): Promise<{ message: string; personality: number; status: string }> => {
    const response = await api.post<{ message: string; personality: number; status: string }>('/api/users/personality', { personality });
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
    const response = await api.post<{ link_token: string }>('/api/plaid/create_link_token', { 
      user_id: userId
    });
    return response.data;
  },
  exchangePublicToken: async (publicToken: string, userId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/plaid/exchange_public_token', { 
      public_token: publicToken,
      user_id: userId
    });
    return response.data;
  },

  getItemStatus: async (userId: string): Promise<{ has_linked_item: boolean }> => {
    const response = await api.get<{ has_linked_item: boolean }>(`/api/plaid/item-status/${userId}`);
    return response.data;
  },

  getTransactions: async (userId: string, startDate?: string, endDate?: string): Promise<{ transactions: any[] }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get<any[]>(`/api/plaid/transactions/${userId}?${params.toString()}`);
    // The response is now just an array, so wrap it in the expected format
    return { transactions: response.data };
  },

  getChatResponse: async (conversationId: number, userMessage: string): Promise<any> => {
    const response = await api.post('/api/plaid/chat-response', {
      conversation_id: conversationId,
      user_message: userMessage
    });
    return response.data;
  },

  getBalances: async (userId: string): Promise<any> => {
    const response = await api.get(`/api/plaid/balances/${userId}`);
    return response.data;
  },
};

export const botConversationService = {
  getUserConversationSummaries: async (): Promise<ConversationSummary[]> => {
    const response = await api.get<ConversationSummary[]>('/api/bot_conversations/getUserConversationSummaries');
    return response.data;
  },

  getFullConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/api/bot_conversations/getFullConversation/${conversationId}`);
    return response.data;
  },

  askCapy: async (userId: number, question: string): Promise<{ conversation_id: number }> => {
    const response = await api.post<{ conversation_id: number }>('/api/bot_conversations/ask-capy', {
      user_id: userId,
      question: question
    });
    return response.data;
  },

  addMessage: async (conversationId: string, message: string, sender: 'user' | 'bot'): Promise<any> => {
    const response = await api.post(`/api/bot_conversations/addMessage/${conversationId}`, {
      message: message,
      sender: sender
    });
    return response.data;
  },

  deleteConversation: async (conversationId: string): Promise<{ message: string; status: string }> => {
    const response = await api.delete<{ message: string; status: string }>(`/api/bot_conversations/deleteConversation/${conversationId}`);
    return response.data;
  },
};

export default api;