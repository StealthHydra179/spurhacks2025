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
  title: string;
  description: string;
  amount: number;
  current_amount: number;
  deadline: string | null;
  category: string | null;
  priority: 'low' | 'medium' | 'high';
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateSavingsGoalRequest {
  title: string;
  description?: string;
  amount: number;
  current_amount?: number;
  deadline?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  icon?: string;
  color?: string;
}

export interface UpdateSavingsGoalRequest {
  title?: string;
  description?: string;
  amount?: number;
  current_amount?: number;
  deadline?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  icon?: string;
  color?: string;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category: string[] | null;
  payment_channel: string;
  pending: boolean;
  merchant_name: string | null;
  logo_url: string | null;
  personal_finance_category: {
    primary: string;
    detailed: string;
    confidence_level: string;
  } | null;
  counterparties: Array<{
    name: string;
    type: string;
    logo_url: string | null;
    website: string | null;
  }> | null;
  location: {
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
  } | null;
  iso_currency_code: string;
  transaction_type: string;
  authorized_date: string | null;
  datetime: string | null;
  budget_category?: string;
}