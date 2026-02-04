/**
 * useUser Hook
 * React hook for user operations
 */

import { useState } from 'react';
import { userService } from '../services/userService';

export function useUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get user by ID
   */
  const getUserById = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.getUserById(userId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (userId, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.updateProfile(userId, data);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search users
   */
  const searchUsers = async (params) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.searchUsers(params);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search users');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get user statistics
   */
  const getUserStats = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.getUserStats(userId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get user stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Block user
   */
  const blockUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.blockUser(userId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unblock user
   */
  const unblockUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.unblockUser(userId);
      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete user
   */
  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.deleteUser(userId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getUserById,
    updateProfile,
    searchUsers,
    getUserStats,
    blockUser,
    unblockUser,
    deleteUser,
    loading,
    error
  };
}
