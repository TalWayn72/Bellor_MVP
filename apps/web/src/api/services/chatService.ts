/**
 * Chat Service
 * Handles all chat and messaging-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateRequiredId, validateUserId, validateDataObject } from '../utils/validation';
import { isDemoUser, isDemoId, createDemoChat, getDemoMessages } from '@/data/demoData';

interface ChatListParams {
  limit?: number;
  offset?: number;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface Chat {
  id: string;
  is_temporary?: boolean;
  is_permanent?: boolean;
  expires_at?: string;
  otherUser?: { id: string; nickname?: string };
  [key: string]: unknown;
}

interface ChatListResponse {
  chats: Chat[];
  total: number;
  pagination?: Pagination;
}

interface ChatByIdResponse {
  chat: Chat;
}

interface CreateOrGetChatResponse {
  chat: Chat;
  demo?: boolean;
}

interface Message {
  id: string;
  content: string;
  type?: string;
  created_date?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface MessageListParams {
  limit?: number;
  offset?: number;
}

interface MessageListResponse {
  messages: Message[];
  total: number;
}

interface SendMessageData {
  content: string;
  type: string;
}

interface SendMessageResponse {
  message: Message;
}

export const chatService = {
  async getChats(params: ChatListParams = {}): Promise<ChatListResponse> {
    const response = await apiClient.get('/chats', { params });
    const result = response.data as { chats?: Chat[]; data?: Chat[]; total?: number; pagination?: Pagination };
    const chats = result.chats || result.data || [];
    return {
      chats,
      total: result.pagination?.total || result.total || chats.length,
      pagination: result.pagination,
    };
  },

  async getChatById(chatId: string): Promise<ChatByIdResponse> {
    if (isDemoId(chatId)) {
      const otherUserId = chatId.replace('demo-chat-', '');
      return { chat: createDemoChat(otherUserId) as Chat };
    }

    validateRequiredId(chatId, 'chatId', 'getChatById');

    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data as ChatByIdResponse;
  },

  async createOrGetChat(otherUserId: string, options?: { forceReal?: boolean }): Promise<CreateOrGetChatResponse> {
    validateUserId(otherUserId, 'createOrGetChat');

    if (!options?.forceReal && isDemoUser(otherUserId)) {
      return {
        chat: createDemoChat(otherUserId) as Chat,
        demo: true,
      };
    }
    const response = await apiClient.post('/chats', { otherUserId });
    return response.data as CreateOrGetChatResponse;
  },

  async getMessages(chatId: string, params: MessageListParams = {}): Promise<MessageListResponse> {
    if (isDemoId(chatId)) {
      const messages = getDemoMessages(chatId) as Message[];
      return { messages, total: messages.length };
    }

    validateRequiredId(chatId, 'chatId', 'getMessages');

    const response = await apiClient.get(`/chats/${chatId}/messages`, { params });
    return response.data as MessageListResponse;
  },

  async sendMessage(chatId: string, data: SendMessageData): Promise<SendMessageResponse> {
    validateRequiredId(chatId, 'chatId', 'sendMessage');
    validateDataObject(data, 'sendMessage');

    const response = await apiClient.post(`/chats/${chatId}/messages`, data);
    return response.data as SendMessageResponse;
  },

  async markMessageAsRead(chatId: string, messageId: string): Promise<{ message: Message }> {
    validateRequiredId(chatId, 'chatId', 'markMessageAsRead');
    validateRequiredId(messageId, 'messageId', 'markMessageAsRead');

    const response = await apiClient.patch(`/chats/${chatId}/messages/${messageId}/read`);
    return response.data as { message: Message };
  },

  async deleteMessage(chatId: string, messageId: string): Promise<{ message: Message }> {
    validateRequiredId(chatId, 'chatId', 'deleteMessage');
    validateRequiredId(messageId, 'messageId', 'deleteMessage');

    const response = await apiClient.delete(`/chats/${chatId}/messages/${messageId}`);
    return response.data as { message: Message };
  },
};
