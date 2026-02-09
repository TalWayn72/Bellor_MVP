/**
 * WebSocket Integration Tests - Chat Read Receipts, Unread & Delete
 *
 * Tests for message read receipts, unread counts, and message deletion.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as SocketClient, Socket as ClientSocket } from 'socket.io-client';
import { setupWebSocket } from '../../websocket/index.js';
import { generateTestToken } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import type { Chat, Message } from '@prisma/client';
import { mockUser1, mockUser2, mockChat, mockMessage, SocketAck } from './websocket-test-helpers.js';

const TEST_PORT = 3095;
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe('WebSocket - Chat Read/Unread/Delete', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;

  beforeAll(async () => {
    httpServer = createServer();
    io = setupWebSocket(httpServer);
    await new Promise<void>((resolve) => { httpServer.listen(TEST_PORT, () => resolve()); });
  });

  afterAll(async () => {
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();
    io.close();
    await new Promise<void>((resolve) => { httpServer.close(() => resolve()); });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(redis.setex).mockResolvedValue('OK');
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.del).mockResolvedValue(1);
    vi.mocked(redis.expire).mockResolvedValue(1);
    vi.mocked(redis.keys).mockResolvedValue([]);

    clientSocket1 = SocketClient(TEST_URL, { auth: { token: generateTestToken(mockUser1.id, mockUser1.email) }, transports: ['websocket'] });
    clientSocket2 = SocketClient(TEST_URL, { auth: { token: generateTestToken(mockUser2.id, mockUser2.email) }, transports: ['websocket'] });
    await Promise.all([
      new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
      new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
    ]);
  });

  afterEach(() => {
    clientSocket1?.removeAllListeners();
    clientSocket2?.removeAllListeners();
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();
  });

  describe('chat:message:read', () => {
    it('should mark message as read and notify sender', async () => {
      vi.mocked(prisma.message.findUnique).mockResolvedValue({
        ...mockMessage, senderId: mockUser1.id,
        chat: { ...mockChat, user1Id: mockUser1.id, user2Id: mockUser2.id },
      } as unknown as Message);
      vi.mocked(prisma.message.update).mockResolvedValue({ ...mockMessage, isRead: true } as unknown as Message);

      const readPromise = new Promise<SocketAck>((resolve) => { clientSocket1.on('chat:message:read', resolve); });
      const result = await new Promise<SocketAck>((resolve) => { clientSocket2.emit('chat:message:read', { messageId: mockMessage.id }, resolve); });
      expect(result.success).toBe(true);

      const readReceipt = await Promise.race([readPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))]);
      expect(readReceipt.messageId).toBe(mockMessage.id);
      expect(readReceipt.readBy).toBe(mockUser2.id);
    });

    it('should reject marking non-existent message as read', async () => {
      vi.mocked(prisma.message.findUnique).mockResolvedValue(null);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:message:read', { messageId: 'non-existent' }, resolve); });
      expect(result.error).toBe('Message not found');
    });

    it('should reject marking message from other conversation', async () => {
      vi.mocked(prisma.message.findUnique).mockResolvedValue({
        ...mockMessage, chat: { user1Id: 'other-user-1', user2Id: 'other-user-2' },
      } as unknown as Message);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:message:read', { messageId: mockMessage.id }, resolve); });
      expect(result.error).toBe('Access denied');
    });
  });

  describe('chat:unread:count', () => {
    it('should return unread message count', async () => {
      vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChat as unknown as Chat]);
      vi.mocked(prisma.message.count).mockResolvedValue(5);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:unread:count', resolve); });
      expect(result.success).toBe(true);
      expect(result.data.unreadCount).toBe(5);
    });

    it('should return zero when no unread messages', async () => {
      vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChat as unknown as Chat]);
      vi.mocked(prisma.message.count).mockResolvedValue(0);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:unread:count', resolve); });
      expect(result.success).toBe(true);
      expect(result.data.unreadCount).toBe(0);
    });
  });

  describe('chat:message:delete', () => {
    it('should delete own message and notify room', async () => {
      vi.mocked(prisma.message.findUnique).mockResolvedValue({ ...mockMessage, senderId: mockUser1.id } as unknown as Message);
      vi.mocked(prisma.message.delete).mockResolvedValue(mockMessage as unknown as Message);
      vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as unknown as Chat);

      await Promise.all([
        new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve); }),
        new Promise<SocketAck>((resolve) => { clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve); }),
      ]);

      const deletePromise = new Promise<SocketAck>((resolve) => { clientSocket2.on('chat:message:deleted', resolve); });
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:message:delete', { messageId: mockMessage.id }, resolve); });
      expect(result.success).toBe(true);

      const deleteNotification = await Promise.race([deletePromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))]);
      expect(deleteNotification.messageId).toBe(mockMessage.id);
      expect(deleteNotification.chatId).toBe(mockChat.id);
    });

    it('should reject deleting message from another user', async () => {
      vi.mocked(prisma.message.findUnique).mockResolvedValue({ ...mockMessage, senderId: mockUser2.id } as unknown as Message);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:message:delete', { messageId: mockMessage.id }, resolve); });
      expect(result.error).toBe('Message not found or you are not the sender');
    });

    it('should reject deleting non-existent message', async () => {
      vi.mocked(prisma.message.findUnique).mockResolvedValue(null);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:message:delete', { messageId: 'non-existent' }, resolve); });
      expect(result.error).toBe('Message not found or you are not the sender');
    });
  });
});
