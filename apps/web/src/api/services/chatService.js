/**
 * Chat Service
 * Handles all chat and messaging-related API calls
 */

import { apiClient } from '../client/apiClient';

export const chatService = {
  /**
   * Get user's chats
   * @param {object} params - { limit, offset }
   * @returns {Promise<{chats, total}>}
   */
  async getChats(params = {}) {
    const response = await apiClient.get('/chats', { params });
    return response.data;
  },

  /**
   * Get chat by ID
   * @param {string} chatId
   * @returns {Promise<{chat}>}
   */
  async getChatById(chatId) {
    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data;
  },

  /**
   * Create or get chat with user
   * @param {string} otherUserId
   * @returns {Promise<{chat}>}
   */
  async createOrGetChat(otherUserId) {
    const response = await apiClient.post('/chats', { otherUserId });
    return response.data;
  },

  /**
   * Get messages in a chat
   * @param {string} chatId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{messages, total}>}
   */
  async getMessages(chatId, params = {}) {
    const response = await apiClient.get(`/chats/${chatId}/messages`, { params });
    return response.data;
  },

  /**
   * Send a message
   * @param {string} chatId
   * @param {object} data - { content, type }
   * @returns {Promise<{message}>}
   */
  async sendMessage(chatId, data) {
    const response = await apiClient.post(`/chats/${chatId}/messages`, data);
    return response.data;
  },

  /**
   * Mark message as read
   * @param {string} chatId
   * @param {string} messageId
   * @returns {Promise<{message}>}
   */
  async markMessageAsRead(chatId, messageId) {
    const response = await apiClient.patch(`/chats/${chatId}/messages/${messageId}/read`);
    return response.data;
  },

  /**
   * Delete message
   * @param {string} chatId
   * @param {string} messageId
   * @returns {Promise<{message}>}
   */
  async deleteMessage(chatId, messageId) {
    const response = await apiClient.delete(`/chats/${chatId}/messages/${messageId}`);
    return response.data;
  }
};
