/**
 * useAuth Hook
 * React hook for authentication operations
 */

import { useState } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Register a new user
   */
  const register = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.register(data);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.login(credentials);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change password
   */
  const changePassword = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.changePassword(data);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current user
   */
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.getCurrentUser();
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    login,
    logout,
    changePassword,
    getCurrentUser,
    isAuthenticated: authService.isAuthenticated(),
    storedUser: authService.getStoredUser(),
    loading,
    error
  };
}
