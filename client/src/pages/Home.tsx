import React from 'react';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="home">
      <header className="home-header">
        <h1>Welcome to SpurHacks 2025</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>
      
      <div className="home-content">
        <h2>Dashboard</h2>
        {user && (
          <div className="user-info">
            <h3>Welcome, {user.username}!</h3>
            <p>Email: {user.email}</p>
          </div>
        )}
        <p>This is your protected home page. You can only see this if you're authenticated.</p>
      </div>
    </div>
  );
};

export default Home; 