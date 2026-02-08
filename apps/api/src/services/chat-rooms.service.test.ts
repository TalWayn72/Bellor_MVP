/**
 * Chat Service Tests - Rooms
 *
 * Tests for getUserChats, getChatById, and createOrGetChat operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chat.service.js';
import { mockPrisma, createMockUser, createMockChat, createMockMessage } from './chat-test-helpers.js';

describe('chatService - getUserChats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('chatService - getChatById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('chatService - createOrGetChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock target user lookup (validation added to createOrGetChat)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
  });

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
