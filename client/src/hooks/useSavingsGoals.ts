import { useState, useEffect } from 'react';
import { savingsGoalsService } from '../services/api';
import type { SavingsGoal, CreateSavingsGoalRequest, UpdateSavingsGoalRequest } from '../types';

// Hook for fetching savings goals
export const useSavingsGoals = () => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavingsGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const goals = await savingsGoalsService.getSavingsGoals();
      setSavingsGoals(goals);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch savings goals';
      setError(errorMessage);
      console.error('Error fetching savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  return {
    savingsGoals,
    loading,
    error,
    refetch: fetchSavingsGoals,
  };
};

// Hook for creating savings goals
export const useCreateSavingsGoal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSavingsGoal = async (goalData: CreateSavingsGoalRequest): Promise<SavingsGoal | null> => {
    try {
      setLoading(true);
      setError(null);
      const newGoal = await savingsGoalsService.createSavingsGoal(goalData);
      return newGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create savings goal';
      setError(errorMessage);
      console.error('Error creating savings goal:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSavingsGoal,
    loading,
    error,
  };
};

// Hook for updating savings goals
export const useUpdateSavingsGoal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSavingsGoal = async (id: string, goalData: UpdateSavingsGoalRequest): Promise<SavingsGoal | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedGoal = await savingsGoalsService.updateSavingsGoal(id, goalData);
      return updatedGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update savings goal';
      setError(errorMessage);
      console.error('Error updating savings goal:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateSavingsGoal,
    loading,
    error,
  };
};

// Hook for deleting savings goals
export const useDeleteSavingsGoal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSavingsGoal = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await savingsGoalsService.deleteSavingsGoal(id);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete savings goal';
      setError(errorMessage);
      console.error('Error deleting savings goal:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteSavingsGoal,
    loading,
    error,
  };
};

// Hook for fetching a single savings goal by ID
export const useSavingsGoal = (id: string | null) => {
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavingsGoal = async (goalId: string) => {
    try {
      setLoading(true);
      setError(null);
      const goal = await savingsGoalsService.getSavingsGoalById(goalId);
      setSavingsGoal(goal);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch savings goal';
      setError(errorMessage);
      console.error('Error fetching savings goal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSavingsGoal(id);
    }
  }, [id]);

  return {
    savingsGoal,
    loading,
    error,
    refetch: id ? () => fetchSavingsGoal(id) : undefined,
  };
};

// Combined hook for all savings goal operations
export const useSavingsGoalOperations = () => {
  const { savingsGoals, loading: fetchLoading, error: fetchError, refetch } = useSavingsGoals();
  const { createSavingsGoal, loading: createLoading, error: createError } = useCreateSavingsGoal();
  const { updateSavingsGoal, loading: updateLoading, error: updateError } = useUpdateSavingsGoal();
  const { deleteSavingsGoal, loading: deleteLoading, error: deleteError } = useDeleteSavingsGoal();

  const handleCreateSavingsGoal = async (goalData: CreateSavingsGoalRequest) => {
    const newGoal = await createSavingsGoal(goalData);
    if (newGoal) {
      refetch(); // Refresh the list after creating
    }
    return newGoal;
  };

  const handleUpdateSavingsGoal = async (id: string, goalData: UpdateSavingsGoalRequest) => {
    const updatedGoal = await updateSavingsGoal(id, goalData);
    if (updatedGoal) {
      refetch(); // Refresh the list after updating
    }
    return updatedGoal;
  };

  const handleDeleteSavingsGoal = async (id: string) => {
    const success = await deleteSavingsGoal(id);
    if (success) {
      refetch(); // Refresh the list after deleting
    }
    return success;
  };

  return {
    // Data
    savingsGoals,
    
    // Loading states
    loading: fetchLoading || createLoading || updateLoading || deleteLoading,
    fetchLoading,
    createLoading,
    updateLoading,
    deleteLoading,
    
    // Error states
    error: fetchError || createError || updateError || deleteError,
    fetchError,
    createError,
    updateError,
    deleteError,
    
    // Operations
    createSavingsGoal: handleCreateSavingsGoal,
    updateSavingsGoal: handleUpdateSavingsGoal,
    deleteSavingsGoal: handleDeleteSavingsGoal,
    refetch,
  };
};
