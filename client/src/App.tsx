import './App.css'
import { Route, Routes } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PlaidRoute from './components/PlaidRoute'
import PublicRoute from './routes/PublicRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Settings from './pages/Settings'
import Transactions from './pages/Transactions'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import Chatbot from './pages/Chatbot'
import { theme } from './theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />          <Route 
            path="/transactions"
            element={
              <ProtectedRoute>
                <PlaidRoute>
                  <Transactions />
                </PlaidRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/income"
            element={
              <ProtectedRoute>
                <PlaidRoute>
                  <Income />
                </PlaidRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expenses"
            element={
              <ProtectedRoute>
                <PlaidRoute>
                  <Expenses />
                </PlaidRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
