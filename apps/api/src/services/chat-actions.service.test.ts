/**
 * Chat Service Tests - Message Actions
 *
 * Tests for markMessageAsRead and deleteMessage operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chat.service.js';
import { mockPrisma, createMockChat, createMockMessage } from './chat-test-helpers.js';

describe('[P1][chat] chatService - markMessageAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('[P1][chat] chatService - deleteMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
