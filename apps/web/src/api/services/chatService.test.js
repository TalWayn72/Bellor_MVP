import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chatService';
import { apiClient } from '../client/apiClient';

// Mock apiClient
vi.mock('../client/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('[P1][chat] chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrGetChat', () => {
    it('should throw error when otherUserId is undefined', async () => {
      await expect(chatService.createOrGetChat(undefined))
        .rejects.toThrow('Invalid user ID: userId is required for createOrGetChat');
    });

    it('should throw error when otherUserId is null', async () => {
      await expect(chatService.createOrGetChat(null))
        .rejects.toThrow('Invalid user ID: userId is required for createOrGetChat');
    });

    it('should throw error when otherUserId is empty string', async () => {
      await expect(chatService.createOrGetChat(''))
        .rejects.toThrow('Invalid user ID: userId is required for createOrGetChat');
    });

    it('should return mock chat for demo users', async () => {
      const result = await chatService.createOrGetChat('demo-user-123');

      expect(result.demo).toBe(true);
      expect(result.chat).toBeDefined();

      // Should NOT call the API
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should return mock chat for demo-match-user', async () => {
      const result = await chatService.createOrGetChat('demo-match-user-1-romantic');

      expect(result.demo).toBe(true);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should call API for valid non-demo user', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { chat: { id: 'real-chat-123' } }
        }
      };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await chatService.createOrGetChat('real-user-id-456');

      expect(apiClient.post).toHaveBeenCalledWith('/chats', { otherUserId: 'real-user-id-456' });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getChats', () => {
    it('should call API with params', async () => {
      const mockResponse = { data: { chats: [], total: 0 } };
      apiClient.get.mockResolvedValue(mockResponse);

      await chatService.getChats({ limit: 10, offset: 0 });

      expect(apiClient.get).toHaveBeenCalledWith('/chats', {
        params: { limit: 10, offset: 0 }
      });
    });
  });

  describe('getChatById', () => {
    it('should call API with chat ID', async () => {
      const mockResponse = { data: { chat: { id: 'chat-123' } } };
      apiClient.get.mockResolvedValue(mockResponse);

      await chatService.getChatById('chat-123');

      expect(apiClient.get).toHaveBeenCalledWith('/chats/chat-123');
    });
  });

  describe('sendMessage', () => {
    it('should call API with chat ID and message data', async () => {
      const mockResponse = { data: { message: { id: 'msg-123' } } };
      apiClient.post.mockResolvedValue(mockResponse);

      await chatService.sendMessage('chat-123', { content: 'Hello', type: 'text' });

      expect(apiClient.post).toHaveBeenCalledWith('/chats/chat-123/messages', {
        content: 'Hello',
        type: 'text'
      });
    });
  });
});
