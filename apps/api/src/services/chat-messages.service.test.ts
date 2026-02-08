/**
 * Chat Service Tests - Messages
 *
 * Tests for getMessages and sendMessage operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chat.service.js';
import { mockPrisma, createMockChat, createMockMessage, MessageType } from './chat-test-helpers.js';

describe('chatService - getMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('chatService - sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
