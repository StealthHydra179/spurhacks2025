// User related types
export interface User {
  id: number;
  username: string;
  email: string;
  mode: number; // 0 for light mode, 1 for dark mode
  created_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
}

// Transaction related types
export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  created_at?: string;
}

export interface CreateTransactionRequest {
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

export interface UpdateTransactionRequest {
  amount?: number;
  description?: string;
  category?: string;
  type?: 'income' | 'expense';
  date?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface ErrorResponse {
  message: string;
  status?: number;
}

// JWT Token payload
export interface JWTPayload {
  username: string;
  userID: number;
  iat: number;
  exp: number;
}

// Bot conversation related types
export interface Message {
  id: number;
  message: string;
  sender: 'user' | 'bot';
  message_timestamp: string;
  message_number: number;
}

export interface ConversationSummary {
  id: number;
  user_id: number;
  summary: string;
  create_timestamp: string;
}

export interface Conversation {
  summary: ConversationSummary[];
  messages: Message[];
}

// Savings Goal related types
export interface SavingsGoal {
  id: number;
  user_id: number;
  amount: number;
  start_timestamp: string;
  end_timestamp: string;
}

export interface CreateSavingsGoalRequest {
  amount: number;
  start_timestamp: string;
  end_timestamp: string;
}

export interface UpdateSavingsGoalRequest {
  amount?: number;
  start_timestamp?: string;
  end_timestamp?: string;
}