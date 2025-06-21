import React, { useState } from 'react';
import { useSavingsGoalOperations } from '../hooks';
import type { CreateSavingsGoalRequest } from '../types';

const SavingsGoalsExample: React.FC = () => {  const {
    savingsGoals,
    loading,
    error,
    createSavingsGoal,
    deleteSavingsGoal,
    createLoading,
    deleteLoading,
  } = useSavingsGoalOperations();

  const [newGoal, setNewGoal] = useState<CreateSavingsGoalRequest>({
    amount: 0,
    start_timestamp: '',
    end_timestamp: '',
  });

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.amount > 0 && newGoal.start_timestamp && newGoal.end_timestamp) {
      const success = await createSavingsGoal(newGoal);
      if (success) {
        setNewGoal({
          amount: 0,
          start_timestamp: '',
          end_timestamp: '',
        });
      }
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      await deleteSavingsGoal(id.toString());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && savingsGoals.length === 0) {
    return <div>Loading savings goals...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Savings Goals</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {/* Create New Goal Form */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Create New Savings Goal</h3>
        <form onSubmit={handleCreateGoal}>
          <div style={{ marginBottom: '15px' }}>
            <label>
              Amount: $
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newGoal.amount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, amount: parseFloat(e.target.value) || 0 })}
                style={{ marginLeft: '10px', padding: '5px', width: '150px' }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>
              Start Date:
              <input
                type="datetime-local"
                value={newGoal.start_timestamp}
                onChange={(e) => setNewGoal({ ...newGoal, start_timestamp: e.target.value })}
                style={{ marginLeft: '10px', padding: '5px' }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>
              End Date:
              <input
                type="datetime-local"
                value={newGoal.end_timestamp}
                onChange={(e) => setNewGoal({ ...newGoal, end_timestamp: e.target.value })}
                style={{ marginLeft: '10px', padding: '5px' }}
                required
              />
            </label>
          </div>
          <button 
            type="submit" 
            disabled={createLoading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: createLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {createLoading ? 'Creating...' : 'Create Goal'}
          </button>
        </form>
      </div>

      {/* Savings Goals List */}
      <div>
        <h3>Your Savings Goals</h3>
        {savingsGoals.length === 0 ? (
          <p>No savings goals yet. Create your first goal above!</p>
        ) : (
          <div>
            {savingsGoals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  marginBottom: '15px',
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0' }}>Goal #{goal.id}</h4>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Target Amount:</strong> ${goal.amount.toFixed(2)}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Start Date:</strong> {formatDate(goal.start_timestamp)}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>End Date:</strong> {formatDate(goal.end_timestamp)}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={deleteLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: deleteLoading ? 'not-allowed' : 'pointer',
                        marginLeft: '10px',
                      }}
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoalsExample;
