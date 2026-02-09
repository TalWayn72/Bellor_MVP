/**
 * Chat Service Tests - Orchestrator
 *
 * Comprehensive tests for the main chat.service.ts orchestrator:
 * getUserChats, getChatById, createOrGetChat, and delegated method exports.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chat.service.js';
import { mockPrisma, createMockUser, createMockChat, createMockMessage } from './chat-test-helpers.js';

// ============================================
// getUserChats
// ============================================

describe('chatService.getUserChats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a list of chats for a user', async () => {
    const chats = [
      createMockChat({ id: 'chat-1', user1Id: 'user-1', user2Id: 'user-2' }),
      createMockChat({ id: 'chat-2', user1Id: 'user-3', user2Id: 'user-1' }),
    ];
    mockPrisma.chat.findMany.mockResolvedValue(chats);
    mockPrisma.chat.count.mockResolvedValue(2);

    const result = await chatService.getUserChats('user-1');

    expect(result.chats).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should return empty list when user has no chats', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    const result = await chatService.getUserChats('user-with-no-chats');

    expect(result.chats).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should apply pagination with custom limit and offset', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(50);

    const result = await chatService.getUserChats('user-1', { limit: 5, offset: 10 });

    expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, skip: 10 })
    );
    expect(result.total).toBe(50);
  });

  it('should use default pagination (limit=20, offset=0)', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    await chatService.getUserChats('user-1');

    expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20, skip: 0 })
    );
  });

  it('should filter by isTemporary=true when specified', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    await chatService.getUserChats('user-1', { isTemporary: true });

    expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isTemporary: true }),
      })
    );
  });

  it('should filter by isTemporary=false when specified', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    await chatService.getUserChats('user-1', { isTemporary: false });

    expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isTemporary: false }),
      })
    );
  });

  it('should not add isTemporary filter when not specified', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    await chatService.getUserChats('user-1', {});

    const callArgs = mockPrisma.chat.findMany.mock.calls[0][0];
    expect(callArgs.where.isTemporary).toBeUndefined();
  });

  it('should exclude DELETED chats from results', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    await chatService.getUserChats('user-1');

    expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: 'DELETED' },
        }),
      })
    );
  });

  it('should resolve otherUser as user2 when current user is user1', async () => {
    const chat = createMockChat({
      user1Id: 'me',
      user2Id: 'other-person',
      user1: createMockUser({ id: 'me', firstName: 'Me' }),
      user2: createMockUser({ id: 'other-person', firstName: 'Other' }),
    });
    mockPrisma.chat.findMany.mockResolvedValue([chat]);
    mockPrisma.chat.count.mockResolvedValue(1);

    const result = await chatService.getUserChats('me');

    expect(result.chats[0].otherUser.id).toBe('other-person');
    expect(result.chats[0].otherUser.first_name).toBe('Other');
  });

  it('should resolve otherUser as user1 when current user is user2', async () => {
    const chat = createMockChat({
      user1Id: 'other-person',
      user2Id: 'me',
      user1: createMockUser({ id: 'other-person', firstName: 'Other' }),
      user2: createMockUser({ id: 'me', firstName: 'Me' }),
    });
    mockPrisma.chat.findMany.mockResolvedValue([chat]);
    mockPrisma.chat.count.mockResolvedValue(1);

    const result = await chatService.getUserChats('me');

    expect(result.chats[0].otherUser.id).toBe('other-person');
    expect(result.chats[0].otherUser.first_name).toBe('Other');
  });

  it('should include last_message when messages exist', async () => {
    const lastMsg = createMockMessage({
      id: 'msg-latest',
      content: 'Latest message',
      senderId: 'user-2',
    });
    const chat = createMockChat({ messages: [lastMsg] });
    mockPrisma.chat.findMany.mockResolvedValue([chat]);
    mockPrisma.chat.count.mockResolvedValue(1);

    const result = await chatService.getUserChats('user-1');

    expect(result.chats[0].last_message).not.toBeNull();
    expect(result.chats[0].last_message?.content).toBe('Latest message');
    expect(result.chats[0].last_message?.sender_id).toBe('user-2');
  });

  it('should return null for last_message when chat has no messages', async () => {
    const chat = createMockChat({ messages: [] });
    mockPrisma.chat.findMany.mockResolvedValue([chat]);
    mockPrisma.chat.count.mockResolvedValue(1);

    const result = await chatService.getUserChats('user-1');

    expect(result.chats[0].last_message).toBeNull();
  });

  it('should return formatted chat fields using snake_case', async () => {
    const chat = createMockChat({
      isTemporary: true,
      isPermanent: false,
      expiresAt: new Date('2025-12-31'),
    });
    mockPrisma.chat.findMany.mockResolvedValue([chat]);
    mockPrisma.chat.count.mockResolvedValue(1);

    const result = await chatService.getUserChats('user-1');
    const formatted = result.chats[0];

    expect(formatted).toHaveProperty('is_temporary', true);
    expect(formatted).toHaveProperty('is_permanent', false);
    expect(formatted).toHaveProperty('expires_at');
    expect(formatted).toHaveProperty('created_at');
    expect(formatted).toHaveProperty('updated_at');
  });

  it('should order chats by updatedAt descending', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    await chatService.getUserChats('user-1');

    expect(mockPrisma.chat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: 'desc' },
      })
    );
  });

  it('should include user select fields (id, firstName, lastName, profileImages, isVerified, lastActiveAt)', async () => {
    mockPrisma.chat.findMany.mockResolvedValue([]);
    mockPrisma.chat.count.mockResolvedValue(0);

    await chatService.getUserChats('user-1');

    const callArgs = mockPrisma.chat.findMany.mock.calls[0][0];
    const expectedSelect = {
      id: true,
      firstName: true,
      lastName: true,
      profileImages: true,
      isVerified: true,
      lastActiveAt: true,
    };
    expect(callArgs.include.user1.select).toEqual(expectedSelect);
    expect(callArgs.include.user2.select).toEqual(expectedSelect);
  });

  it('should format otherUser profile fields as snake_case', async () => {
    const chat = createMockChat({
      user2: createMockUser({
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Doe',
        profileImages: ['img.jpg'],
        isVerified: true,
        lastActiveAt: new Date('2025-06-01'),
      }),
    });
    mockPrisma.chat.findMany.mockResolvedValue([chat]);
    mockPrisma.chat.count.mockResolvedValue(1);

    const result = await chatService.getUserChats('user-1');
    const otherUser = result.chats[0].otherUser;

    expect(otherUser).toHaveProperty('first_name', 'Jane');
    expect(otherUser).toHaveProperty('last_name', 'Doe');
    expect(otherUser).toHaveProperty('profile_images', ['img.jpg']);
    expect(otherUser).toHaveProperty('is_verified', true);
    expect(otherUser).toHaveProperty('last_active_at');
  });
});

// ============================================
// getChatById
// ============================================

describe('chatService.getChatById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return chat when user is a participant', async () => {
    const chat = createMockChat({ id: 'chat-42', user1Id: 'user-1', user2Id: 'user-2' });
    mockPrisma.chat.findFirst.mockResolvedValue(chat);

    const result = await chatService.getChatById('chat-42', 'user-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('chat-42');
  });

  it('should return null when chat is not found', async () => {
    mockPrisma.chat.findFirst.mockResolvedValue(null);

    const result = await chatService.getChatById('non-existent-id', 'user-1');

    expect(result).toBeNull();
  });

  it('should return null when user does not belong to the chat', async () => {
    // Prisma findFirst with OR condition returns null if user-3 is neither user1 nor user2
    mockPrisma.chat.findFirst.mockResolvedValue(null);

    const result = await chatService.getChatById('chat-1', 'user-3');

    expect(result).toBeNull();
  });

  it('should query with correct where clause (userId OR + not DELETED)', async () => {
    mockPrisma.chat.findFirst.mockResolvedValue(null);

    await chatService.getChatById('chat-99', 'user-5');

    expect(mockPrisma.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'chat-99',
          OR: [{ user1Id: 'user-5' }, { user2Id: 'user-5' }],
          status: { not: 'DELETED' },
        }),
      })
    );
  });

  it('should return otherUser as user2 when current user is user1', async () => {
    const chat = createMockChat({
      user1Id: 'current-user',
      user2Id: 'other-user',
      user1: createMockUser({ id: 'current-user' }),
      user2: createMockUser({ id: 'other-user', firstName: 'Bob' }),
    });
    mockPrisma.chat.findFirst.mockResolvedValue(chat);

    const result = await chatService.getChatById('chat-1', 'current-user');

    expect(result?.otherUser.id).toBe('other-user');
    expect(result?.otherUser.first_name).toBe('Bob');
  });

  it('should return otherUser as user1 when current user is user2', async () => {
    const chat = createMockChat({
      user1Id: 'other-user',
      user2Id: 'current-user',
      user1: createMockUser({ id: 'other-user', firstName: 'Alice' }),
      user2: createMockUser({ id: 'current-user' }),
    });
    mockPrisma.chat.findFirst.mockResolvedValue(chat);

    const result = await chatService.getChatById('chat-1', 'current-user');

    expect(result?.otherUser.id).toBe('other-user');
    expect(result?.otherUser.first_name).toBe('Alice');
  });

  it('should return formatted chat with snake_case properties', async () => {
    const chat = createMockChat({
      isTemporary: false,
      isPermanent: true,
      expiresAt: null,
    });
    mockPrisma.chat.findFirst.mockResolvedValue(chat);

    const result = await chatService.getChatById('chat-1', 'user-1');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('otherUser');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('is_temporary', false);
    expect(result).toHaveProperty('is_permanent', true);
    expect(result).toHaveProperty('expires_at', null);
    expect(result).toHaveProperty('created_at');
    expect(result).toHaveProperty('updated_at');
  });
});

// ============================================
// createOrGetChat
// ============================================

describe('chatService.createOrGetChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: target user exists
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
  });

  it('should return existing chat when one already exists between the two users', async () => {
    const existingChat = createMockChat({ id: 'existing-chat' });
    mockPrisma.chat.findFirst
      .mockResolvedValueOnce(existingChat) // existing chat lookup
      .mockResolvedValueOnce(existingChat); // getChatById call

    const result = await chatService.createOrGetChat('user-1', 'user-2');

    expect(result?.id).toBe('existing-chat');
    expect(mockPrisma.chat.create).not.toHaveBeenCalled();
  });

  it('should find existing chat regardless of user order (user2->user1)', async () => {
    const existingChat = createMockChat({ id: 'existing-chat', user1Id: 'user-2', user2Id: 'user-1' });
    mockPrisma.chat.findFirst
      .mockResolvedValueOnce(existingChat)
      .mockResolvedValueOnce(existingChat);

    const result = await chatService.createOrGetChat('user-1', 'user-2');

    expect(result?.id).toBe('existing-chat');
    expect(mockPrisma.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { user1Id: 'user-1', user2Id: 'user-2' },
            { user1Id: 'user-2', user2Id: 'user-1' },
          ],
        }),
      })
    );
  });

  it('should create new temporary chat when none exists (default)', async () => {
    const newChat = createMockChat({ id: 'new-chat', isTemporary: true, isPermanent: false });
    mockPrisma.chat.findFirst
      .mockResolvedValueOnce(null) // no existing chat
      .mockResolvedValueOnce(newChat); // getChatById after creation
    mockPrisma.chat.create.mockResolvedValue(newChat);

    const result = await chatService.createOrGetChat('user-1', 'user-2');

    expect(mockPrisma.chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user1Id: 'user-1',
          user2Id: 'user-2',
          isTemporary: true,
          isPermanent: false,
          expiresAt: expect.any(Date),
        }),
      })
    );
    expect(result?.is_temporary).toBe(true);
  });

  it('should create new permanent chat when isTemporary is false', async () => {
    const newChat = createMockChat({ id: 'perm-chat', isTemporary: false, isPermanent: true, expiresAt: null });
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

  it('should set expiresAt ~24h from now for temporary chats', async () => {
    const newChat = createMockChat();
    mockPrisma.chat.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(newChat);
    mockPrisma.chat.create.mockResolvedValue(newChat);

    const before = Date.now();
    await chatService.createOrGetChat('user-1', 'user-2', true);
    const after = Date.now();

    const createCall = mockPrisma.chat.create.mock.calls[0][0];
    const expiresAt = createCall.data.expiresAt as Date;
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + twentyFourHoursMs);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + twentyFourHoursMs);
  });

  it('should throw Error when target user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      chatService.createOrGetChat('user-1', 'non-existent-user')
    ).rejects.toThrow('Target user not found');

    expect(mockPrisma.chat.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.chat.create).not.toHaveBeenCalled();
  });

  it('should validate target user before checking existing chats', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
    mockPrisma.chat.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(createMockChat());
    mockPrisma.chat.create.mockResolvedValue(createMockChat());

    await chatService.createOrGetChat('user-1', 'user-2');

    // user.findUnique should be called first
    const userCallOrder = mockPrisma.user.findUnique.mock.invocationCallOrder[0];
    const chatCallOrder = mockPrisma.chat.findFirst.mock.invocationCallOrder[0];
    expect(userCallOrder).toBeLessThan(chatCallOrder);
  });

  it('should exclude DELETED chats when checking for existing', async () => {
    mockPrisma.chat.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(createMockChat());
    mockPrisma.chat.create.mockResolvedValue(createMockChat());

    await chatService.createOrGetChat('user-1', 'user-2');

    expect(mockPrisma.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: 'DELETED' },
        }),
      })
    );
  });
});

// ============================================
// Orchestrator: delegated method exports
// ============================================

describe('chatService - orchestrator delegation', () => {
  it('should expose getMessages method', () => {
    expect(typeof chatService.getMessages).toBe('function');
  });

  it('should expose sendMessage method', () => {
    expect(typeof chatService.sendMessage).toBe('function');
  });

  it('should expose markMessageAsRead method', () => {
    expect(typeof chatService.markMessageAsRead).toBe('function');
  });

  it('should expose deleteMessage method', () => {
    expect(typeof chatService.deleteMessage).toBe('function');
  });

  it('should expose adminDeleteMessage method', () => {
    expect(typeof chatService.adminDeleteMessage).toBe('function');
  });

  it('should expose getUserChats method', () => {
    expect(typeof chatService.getUserChats).toBe('function');
  });

  it('should expose getChatById method', () => {
    expect(typeof chatService.getChatById).toBe('function');
  });

  it('should expose createOrGetChat method', () => {
    expect(typeof chatService.createOrGetChat).toBe('function');
  });
});
