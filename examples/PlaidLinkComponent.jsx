// Example client-side implementation for Plaid Link integration
// This would typically go in your React frontend

import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';

const PlaidLinkComponent = ({ userId }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Step 1: Get link token from your server
  const generateLinkToken = async () => {
    try {
      const response = await fetch('/api/plaid/create_link_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error creating link token:', error);
    }
  };

  // Step 2 & 3: Handle successful link and exchange public token
  const onSuccess = async (public_token, metadata) => {
    try {
      const response = await fetch('/api/plaid/exchange_public_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          public_token,
          user_id: userId 
        }),
      });
      const data = await response.json();
      console.log('Link successful!', data);
      setAccessToken(data.access_token);
      
      // Now you can fetch account data
      fetchAccountData();
    } catch (error) {
      console.error('Error exchanging public token:', error);
    }
  };

  // Step 4: Fetch account data
  const fetchAccountData = async () => {
    try {
      const response = await fetch(`/api/plaid/accounts/${userId}`);
      const accountData = await response.json();
      console.log('Account data:', accountData);
    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/plaid/transactions/${userId}`);
      const transactionData = await response.json();
      console.log('Transaction data:', transactionData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Initialize link token on component mount
  useEffect(() => {
    generateLinkToken();
  }, [userId]);

  // Configure Plaid Link
  const config = {
    token: linkToken,
    onSuccess,
    onExit: (err, metadata) => {
      if (err != null) {
        console.error('Plaid Link exit with error:', err);
      }
    },
    onEvent: (eventName, metadata) => {
      console.log('Plaid Link event:', eventName, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <div>
      <button 
        onClick={() => open()} 
        disabled={!ready || !linkToken}
      >
        Connect Bank Account
      </button>
      
      {accessToken && (
        <div>
          <h3>Bank account connected successfully!</h3>
          <button onClick={fetchAccountData}>Get Account Data</button>
          <button onClick={fetchTransactions}>Get Transactions</button>
        </div>
      )}
    </div>
  );
};

export default PlaidLinkComponent;
