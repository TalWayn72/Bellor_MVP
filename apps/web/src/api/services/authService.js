/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from '../client/apiClient';
import { tokenStorage } from '../client/tokenStorage';

export const authService = {
  /**
   * Register a new user
   * @param {object} data - { email, password, firstName, lastName, preferredLanguage }
   * @returns {Promise<{user, accessToken, refreshToken}>}
   */
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    const responseData = response.data.data || response.data;
    const { user, accessToken, refreshToken } = responseData;

    // Store tokens and user data
    tokenStorage.setTokens(accessToken, refreshToken);
    tokenStorage.setUser(user);

    return responseData;
  },

  /**
   * Login user
   * @param {object} credentials - { email, password }
   * @returns {Promise<{user, accessToken, refreshToken}>}
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    const responseData = response.data.data || response.data;
    const { user, accessToken, refreshToken } = responseData;

    // Store tokens and user data
    tokenStorage.setTokens(accessToken, refreshToken);
    tokenStorage.setUser(user);

    return responseData;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear tokens even if API call fails
      tokenStorage.clearTokens();
    }
  },

  /**
   * Refresh access token
   * @returns {Promise<{accessToken}>}
   */
  async refreshToken() {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const responseData = response.data.data || response.data;
    const { accessToken } = responseData;

    tokenStorage.setAccessToken(accessToken);

    return responseData;
  },

  /**
   * Change user password
   * @param {object} data - { oldPassword, newPassword }
   * @returns {Promise<{message}>}
   */
  async changePassword(data) {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  /**
   * Get current authenticated user
   * @returns {Promise<{user}>}
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    // Backend returns { success: true, data: user } - user is directly in data
    const user = response.data.data || response.data;

    // Update stored user data
    tokenStorage.setUser(user);

    return user;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return tokenStorage.isAuthenticated();
  },

  /**
   * Get stored user data
   * @returns {object | null}
   */
  getStoredUser() {
    return tokenStorage.getUser();
  }
};
