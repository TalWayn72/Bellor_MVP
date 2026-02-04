/**
 * Chat Service Tests
 * Tests for chat and messaging operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chat.service.js';
import { prisma } from '../lib/prisma.js';
import { ChatStatus, MessageType } from '@prisma/client';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  chat: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  message: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

// Test data factories
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  firstName: 'Test',
  lastName: 'User',
  profileImages: ['https://example.com/image.jpg'],
  isVerified: true,
  lastActiveAt: new Date('2024-01-01'),
  ...overrides,
});

const createMockChat = (overrides: Record<string, unknown> = {}) => ({
  id: 'chat-1',
  user1Id: 'user-1',
  user2Id: 'user-2',
  status: ChatStatus.ACTIVE,
  isTemporary: true,
  isPermanent: false,
  isConvertedToPermanent: false,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastMessageAt: null,
  user1: createMockUser({ id: 'user-1' }),
  user2: createMockUser({ id: 'user-2', firstName: 'Other' }),
  messages: [],
  ...overrides,
});

const createMockMessage = (overrides: Record<string, unknown> = {}) => ({
  id: 'message-1',
  chatId: 'chat-1',
  senderId: 'user-1',
  messageType: MessageType.TEXT,
  content: 'Hello!',
  textContent: 'Hello!',
  isRead: false,
  isDeleted: false,
  createdAt: new Date('2024-01-01'),
  readAt: null,
  sender: createMockUser({ id: 'user-1' }),
  ...overrides,
});

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== getUserChats ====================
  describe('getUserChats', () => {
    it('should return user chats with pagination', async () => {
      const mockChats = [
        createMockChat({ id: 'chat-1' }),
        createMockChat({ id: 'chat-2', user1Id: 'user-2', user2Id: 'user-1' }),
      ];

      mockPrisma.chat.findMany.mockResolvedValue(mockChats);
      mockPrisma.chat.count.mockResolvedValue(2);

      const result = await chatService.getUserChats('user-1', { limit: 10, offset: 0 });

      expect(result.chats).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        })
      );
    });

    it('should filter by isTemporary when specified', async () => {
      mockPrisma.chat.findMany.mockResolvedValue([]);
      mockPrisma.chat.count.mockResolvedValue(0);

      await chatService.getUserChats('user-1', { isTemporary: true });

      expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isTemporary: true,
          }),
        })
      );
    });

    it('should format other user info correctly for user1', async () => {
      const mockChat = createMockChat({
        user1Id: 'user-1',
        user2Id: 'user-2',
        user2: createMockUser({ id: 'user-2', firstName: 'Other' }),
      });
      mockPrisma.chat.findMany.mockResolvedValue([mockChat]);
      mockPrisma.chat.count.mockResolvedValue(1);

      const result = await chatService.getUserChats('user-1');

      expect(result.chats[0].otherUser.id).toBe('user-2');
      expect(result.chats[0].otherUser.first_name).toBe('Other');
    });

    it('should format other user info correctly for user2', async () => {
      const mockChat = createMockChat({
        user1Id: 'user-2',
        user2Id: 'user-1',
        user1: createMockUser({ id: 'user-2', firstName: 'Other' }),
        user2: createMockUser({ id: 'user-1' }),
      });
      mockPrisma.chat.findMany.mockResolvedValue([mockChat]);
      mockPrisma.chat.count.mockResolvedValue(1);

      const result = await chatService.getUserChats('user-1');

      expect(result.chats[0].otherUser.id).toBe('user-2');
    });

    it('should include last message when available', async () => {
      const mockChat = createMockChat({
        messages: [createMockMessage({ content: 'Last message' })],
      });
      mockPrisma.chat.findMany.mockResolvedValue([mockChat]);
      mockPrisma.chat.count.mockResolvedValue(1);

      const result = await chatService.getUserChats('user-1');

      expect(result.chats[0].last_message).not.toBeNull();
      expect(result.chats[0].last_message?.content).toBe('Last message');
    });

    it('should return null for last_message when no messages exist', async () => {
      const mockChat = createMockChat({ messages: [] });
      mockPrisma.chat.findMany.mockResolvedValue([mockChat]);
      mockPrisma.chat.count.mockResolvedValue(1);

      const result = await chatService.getUserChats('user-1');

      expect(result.chats[0].last_message).toBeNull();
    });

    it('should use default pagination values', async () => {
      mockPrisma.chat.findMany.mockResolvedValue([]);
      mockPrisma.chat.count.mockResolvedValue(0);

      await chatService.getUserChats('user-1');

      expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        })
      );
    });
  });

  // ==================== getChatById ====================
  describe('getChatById', () => {
    it('should return chat when user is participant', async () => {
      const mockChat = createMockChat();
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);

      const result = await chatService.getChatById('chat-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('chat-1');
    });

    it('should return null when chat not found', async () => {
      mockPrisma.chat.findFirst.mockResolvedValue(null);

      const result = await chatService.getChatById('non-existent', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null when user is not participant', async () => {
      mockPrisma.chat.findFirst.mockResolvedValue(null);

      const result = await chatService.getChatById('chat-1', 'user-3');

      expect(result).toBeNull();
    });

    it('should format other user correctly when current user is user1', async () => {
      const mockChat = createMockChat({
        user1Id: 'user-1',
        user2Id: 'user-2',
        user2: createMockUser({ id: 'user-2', firstName: 'Other' }),
      });
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);

      const result = await chatService.getChatById('chat-1', 'user-1');

      expect(result?.otherUser.id).toBe('user-2');
    });

    it('should format other user correctly when current user is user2', async () => {
      const mockChat = createMockChat({
        user1Id: 'user-1',
        user2Id: 'user-2',
        user1: createMockUser({ id: 'user-1', firstName: 'First' }),
        user2: createMockUser({ id: 'user-2' }),
      });
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);

      const result = await chatService.getChatById('chat-1', 'user-2');

      expect(result?.otherUser.id).toBe('user-1');
      expect(result?.otherUser.first_name).toBe('First');
    });
  });

  // ==================== createOrGetChat ====================
  describe('createOrGetChat', () => {
    it('should return existing chat if found', async () => {
      const existingChat = createMockChat();
      mockPrisma.chat.findFirst
        .mockResolvedValueOnce(existingChat) // For checking existing
        .mockResolvedValueOnce(existingChat); // For getChatById

      const result = await chatService.createOrGetChat('user-1', 'user-2');

      expect(result?.id).toBe('chat-1');
      expect(mockPrisma.chat.create).not.toHaveBeenCalled();
    });

    it('should create new temporary chat if none exists', async () => {
      const newChat = createMockChat({ isTemporary: true });
      mockPrisma.chat.findFirst
        .mockResolvedValueOnce(null) // No existing chat
        .mockResolvedValueOnce(newChat); // For getChatById after create
      mockPrisma.chat.create.mockResolvedValue(newChat);

      const result = await chatService.createOrGetChat('user-1', 'user-2', true);

      expect(mockPrisma.chat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user1Id: 'user-1',
            user2Id: 'user-2',
            isTemporary: true,
            isPermanent: false,
          }),
        })
      );
      expect(result?.is_temporary).toBe(true);
    });

    it('should create new permanent chat when isTemporary is false', async () => {
      const newChat = createMockChat({ isTemporary: false, isPermanent: true, expiresAt: null });
      mockPrisma.chat.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newChat);
      mockPrisma.chat.create.mockResolvedValue(newChat);

      const result = await chatService.createOrGetChat('user-1', 'user-2', false);

      expect(mockPrisma.chat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isTemporary: false,
            isPermanent: true,
            expiresAt: null,
          }),
        })
      );
      expect(result?.is_permanent).toBe(true);
    });

    it('should set expiresAt for temporary chats', async () => {
      const newChat = createMockChat();
      mockPrisma.chat.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(newChat);
      mockPrisma.chat.create.mockResolvedValue(newChat);

      await chatService.createOrGetChat('user-1', 'user-2', true);

      expect(mockPrisma.chat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );
    });
  });

  // ==================== getMessages ====================
  describe('getMessages', () => {
    it('should return messages for valid chat participant', async () => {
      const mockChat = createMockChat();
      const mockMessages = [
        createMockMessage({ id: 'msg-1', content: 'First' }),
        createMockMessage({ id: 'msg-2', content: 'Second' }),
      ];

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.findMany.mockResolvedValue(mockMessages);
      mockPrisma.message.count.mockResolvedValue(2);

      const result = await chatService.getMessages('chat-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result?.messages).toHaveLength(2);
      expect(result?.total).toBe(2);
    });

    it('should return null when user is not participant', async () => {
      mockPrisma.chat.findFirst.mockResolvedValue(null);

      const result = await chatService.getMessages('chat-1', 'user-3');

      expect(result).toBeNull();
    });

    it('should use pagination options', async () => {
      const mockChat = createMockChat();
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockPrisma.message.count.mockResolvedValue(0);

      await chatService.getMessages('chat-1', 'user-1', { limit: 25, offset: 10 });

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 10,
        })
      );
    });

    it('should use default pagination values', async () => {
      const mockChat = createMockChat();
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockPrisma.message.count.mockResolvedValue(0);

      await chatService.getMessages('chat-1', 'user-1');

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });

    it('should format messages correctly', async () => {
      const mockChat = createMockChat();
      const mockMessage = createMockMessage({
        content: 'Test message',
        messageType: MessageType.TEXT,
      });

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.findMany.mockResolvedValue([mockMessage]);
      mockPrisma.message.count.mockResolvedValue(1);

      const result = await chatService.getMessages('chat-1', 'user-1');

      expect(result?.messages[0].content).toBe('Test message');
      expect(result?.messages[0].message_type).toBe(MessageType.TEXT);
      expect(result?.messages[0].sender.first_name).toBe('Test');
    });

    it('should reverse messages for chronological order', async () => {
      const mockChat = createMockChat();
      const mockMessages = [
        createMockMessage({ id: 'msg-2', content: 'Second' }),
        createMockMessage({ id: 'msg-1', content: 'First' }),
      ];

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.findMany.mockResolvedValue(mockMessages);
      mockPrisma.message.count.mockResolvedValue(2);

      const result = await chatService.getMessages('chat-1', 'user-1');

      // Messages should be reversed
      expect(result?.messages[0].content).toBe('First');
      expect(result?.messages[1].content).toBe('Second');
    });
  });

  // ==================== sendMessage ====================
  describe('sendMessage', () => {
    it('should send text message successfully', async () => {
      const mockChat = createMockChat();
      const mockMessage = createMockMessage();

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.chat.update.mockResolvedValue(mockChat);

      const result = await chatService.sendMessage('chat-1', 'user-1', {
        content: 'Hello!',
        messageType: MessageType.TEXT,
      });

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Hello!');
      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should return null when sender is not participant', async () => {
      mockPrisma.chat.findFirst.mockResolvedValue(null);

      const result = await chatService.sendMessage('chat-1', 'user-3', {
        content: 'Hello!',
      });

      expect(result).toBeNull();
      expect(mockPrisma.message.create).not.toHaveBeenCalled();
    });

    it('should return null when chat is not active', async () => {
      mockPrisma.chat.findFirst.mockResolvedValue(null);

      const result = await chatService.sendMessage('chat-1', 'user-1', {
        content: 'Hello!',
      });

      expect(result).toBeNull();
    });

    it('should use default message type TEXT', async () => {
      const mockChat = createMockChat();
      const mockMessage = createMockMessage();

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.chat.update.mockResolvedValue(mockChat);

      await chatService.sendMessage('chat-1', 'user-1', { content: 'Hello!' });

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            messageType: MessageType.TEXT,
          }),
        })
      );
    });

    it('should store text content for TEXT messages', async () => {
      const mockChat = createMockChat();
      const mockMessage = createMockMessage();

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.chat.update.mockResolvedValue(mockChat);

      await chatService.sendMessage('chat-1', 'user-1', {
        content: 'Hello!',
        messageType: MessageType.TEXT,
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            textContent: 'Hello!',
          }),
        })
      );
    });

    it('should not store text content for non-TEXT messages', async () => {
      const mockChat = createMockChat();
      const mockMessage = createMockMessage({ messageType: MessageType.IMAGE });

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.chat.update.mockResolvedValue(mockChat);

      await chatService.sendMessage('chat-1', 'user-1', {
        content: 'https://example.com/image.jpg',
        messageType: MessageType.IMAGE,
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            textContent: null,
          }),
        })
      );
    });

    it('should update chat updatedAt timestamp', async () => {
      const mockChat = createMockChat();
      const mockMessage = createMockMessage();

      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.chat.update.mockResolvedValue(mockChat);

      await chatService.sendMessage('chat-1', 'user-1', { content: 'Hello!' });

      expect(mockPrisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
        data: { updatedAt: expect.any(Date) },
      });
    });
  });

  // ==================== markMessageAsRead ====================
  describe('markMessageAsRead', () => {
    it('should mark message as read for recipient', async () => {
      const mockMessage = {
        ...createMockMessage({ senderId: 'user-2' }),
        chat: createMockChat(),
      };

      mockPrisma.message.findFirst.mockResolvedValue(mockMessage);
      mockPrisma.message.update.mockResolvedValue({ ...mockMessage, isRead: true });

      const result = await chatService.markMessageAsRead('message-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result?.is_read).toBe(true);
    });

    it('should return null when message not found', async () => {
      mockPrisma.message.findFirst.mockResolvedValue(null);

      const result = await chatService.markMessageAsRead('non-existent', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null when user is sender (cannot mark own message as read)', async () => {
      const mockMessage = {
        ...createMockMessage({ senderId: 'user-1' }),
        chat: createMockChat(),
      };

      mockPrisma.message.findFirst.mockResolvedValue(mockMessage);

      const result = await chatService.markMessageAsRead('message-1', 'user-1');

      expect(result).toBeNull();
      expect(mockPrisma.message.update).not.toHaveBeenCalled();
    });

    it('should return null when user is not part of chat', async () => {
      const mockMessage = {
        ...createMockMessage({ senderId: 'user-2' }),
        chat: createMockChat({ user1Id: 'user-1', user2Id: 'user-2' }),
      };

      mockPrisma.message.findFirst.mockResolvedValue(mockMessage);

      const result = await chatService.markMessageAsRead('message-1', 'user-3');

      expect(result).toBeNull();
    });

    it('should work correctly when current user is user2', async () => {
      const mockMessage = {
        ...createMockMessage({ senderId: 'user-1' }),
        chat: createMockChat({ user1Id: 'user-1', user2Id: 'user-2' }),
      };

      mockPrisma.message.findFirst.mockResolvedValue(mockMessage);
      mockPrisma.message.update.mockResolvedValue({ ...mockMessage, isRead: true });

      const result = await chatService.markMessageAsRead('message-1', 'user-2');

      expect(result).not.toBeNull();
      expect(mockPrisma.message.update).toHaveBeenCalled();
    });
  });

  // ==================== deleteMessage ====================
  describe('deleteMessage', () => {
    it('should soft delete message by sender', async () => {
      const mockMessage = createMockMessage({ senderId: 'user-1' });

      mockPrisma.message.findFirst.mockResolvedValue(mockMessage);
      mockPrisma.message.update.mockResolvedValue({ ...mockMessage, isDeleted: true });

      const result = await chatService.deleteMessage('message-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: 'message-1' },
        data: { isDeleted: true },
      });
    });

    it('should return null when message not found', async () => {
      mockPrisma.message.findFirst.mockResolvedValue(null);

      const result = await chatService.deleteMessage('non-existent', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null when user is not the sender', async () => {
      mockPrisma.message.findFirst.mockResolvedValue(null);

      const result = await chatService.deleteMessage('message-1', 'user-2');

      expect(result).toBeNull();
      expect(mockPrisma.message.update).not.toHaveBeenCalled();
    });
  });
});
