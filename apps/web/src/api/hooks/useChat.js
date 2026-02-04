/**
 * useChat Hook
 * React hook for chat and messaging operations
 */

import { useState } from 'react';
import { chatService } from '../services/chatService';

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get user's chats
   */
  const getChats = async (params) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.getChats(params);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get chats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get chat by ID
   */
  const getChatById = async (chatId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.getChatById(chatId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get chat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create or get chat with user
   */
  const createOrGetChat = async (otherUserId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.createOrGetChat(otherUserId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get messages in a chat
   */
  const getMessages = async (chatId, params) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.getMessages(chatId, params);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get messages');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send a message
   */
  const sendMessage = async (chatId, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.sendMessage(chatId, data);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark message as read
   */
  const markMessageAsRead = async (chatId, messageId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.markMessageAsRead(chatId, messageId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark message as read');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete message
   */
  const deleteMessage = async (chatId, messageId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.deleteMessage(chatId, messageId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getChats,
    getChatById,
    createOrGetChat,
    getMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    loading,
    error
  };
}
