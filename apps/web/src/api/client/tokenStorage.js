/**
 * Token Storage Utility
 * Handles storing and retrieving JWT tokens from localStorage
 */

const ACCESS_TOKEN_KEY = 'bellor_access_token';
const REFRESH_TOKEN_KEY = 'bellor_refresh_token';
const USER_KEY = 'bellor_user';

export const tokenStorage = {
  /**
   * Get the access token
   * @returns {string | null}
   */
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Set the access token
   * @param {string} token
   */
  setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  /**
   * Get the refresh token
   * @returns {string | null}
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Set the refresh token
   * @param {string} token
   */
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  /**
   * Set both access and refresh tokens
   * @param {string} accessToken
   * @param {string} refreshToken
   */
  setTokens(accessToken, refreshToken) {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },

  /**
   * Clear all tokens
   */
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Get the stored user data
   * @returns {object | null}
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Set the user data
   * @param {object} user
   */
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }
};
