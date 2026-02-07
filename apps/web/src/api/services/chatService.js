/**
 * Chat Service
 * Handles all chat and messaging-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateRequiredId, validateUserId, validateDataObject } from '../utils/validation';
import { isDemoUser, isDemoId, createDemoChat, getDemoMessages } from '@/data/demoData';

export const chatService = {
  /**
   * Get user's chats
   * @param {object} params - { limit, offset }
   * @returns {Promise<{chats, total, pagination}>}
   */
  async getChats(params = {}) {
    const response = await apiClient.get('/chats', { params });
    // API returns { chats: [...] } or { success, data: [...] }
    // Normalize to { chats, total, pagination }
    const result = response.data;
    const chats = result.chats || result.data || [];
    return {
      chats,
      total: result.pagination?.total || result.total || chats.length,
      pagination: result.pagination,
    };
  },

  /**
   * Get chat by ID
   * @param {string} chatId
   * @returns {Promise<{chat}>}
   */
  async getChatById(chatId) {
    // Handle demo chats
    if (isDemoId(chatId)) {
      const otherUserId = chatId.replace('demo-chat-', '');
      return { chat: createDemoChat(otherUserId) };
    }

    validateRequiredId(chatId, 'chatId', 'getChatById');

    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data;
  },

  /**
   * Create or get chat with user
   * @param {string} otherUserId
   * @returns {Promise<{chat}>}
   */
  async createOrGetChat(otherUserId) {
    // Validate user ID
    validateUserId(otherUserId, 'createOrGetChat');

    // Skip API call for demo users - return mock chat
    if (isDemoUser(otherUserId)) {
      return {
        chat: createDemoChat(otherUserId),
        demo: true,
      };
    }
    const response = await apiClient.post('/chats', { otherUserId });
    // API returns { chat: {...} }
    return response.data;
  },

  /**
   * Get messages in a chat
   * @param {string} chatId
   * @param {object} params - { limit, offset }
   * @returns {Promise<{messages, total}>}
   */
  async getMessages(chatId, params = {}) {
    // Handle demo chats
    if (isDemoId(chatId)) {
      const messages = getDemoMessages(chatId);
      return { messages, total: messages.length };
    }

    validateRequiredId(chatId, 'chatId', 'getMessages');

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
    validateRequiredId(chatId, 'chatId', 'sendMessage');
    validateDataObject(data, 'sendMessage');

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
    validateRequiredId(chatId, 'chatId', 'markMessageAsRead');
    validateRequiredId(messageId, 'messageId', 'markMessageAsRead');

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
    validateRequiredId(chatId, 'chatId', 'deleteMessage');
    validateRequiredId(messageId, 'messageId', 'deleteMessage');

    const response = await apiClient.delete(`/chats/${chatId}/messages/${messageId}`);
    return response.data;
  }
};
