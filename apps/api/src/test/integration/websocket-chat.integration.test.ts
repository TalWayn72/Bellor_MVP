/**
 * WebSocket Integration Tests - Chat Join/Leave, Messages & Typing
 *
 * Tests for chat join/leave, messaging, and typing indicators.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as SocketClient, Socket as ClientSocket } from 'socket.io-client';
import { setupWebSocket } from '../../websocket/index.js';
import { generateTestToken } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { mockUser1, mockUser2, mockChat, mockMessage, SocketAck } from './websocket-test-helpers.js';
import type { Chat, Message } from '@prisma/client';

const TEST_PORT = 3096;
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe('[P1][chat] WebSocket - Chat Join/Leave & Messaging', () => {
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
    (redis.setex as Mock).mockResolvedValue('OK');
    (redis.get as Mock).mockResolvedValue(null);
    (redis.del as Mock).mockResolvedValue(1);
    (redis.expire as Mock).mockResolvedValue(1);
    (redis.keys as Mock).mockResolvedValue([]);

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

  describe('chat:join', () => {
    it('should allow user to join their conversation', async () => {
      (prisma.chat.findFirst as Mock).mockResolvedValue(mockChat as unknown as Chat);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve); });
      expect(result.success).toBe(true);
      expect(result.data.chatId).toBe(mockChat.id);
    });

    it('should reject joining non-existent conversation', async () => {
      (prisma.chat.findFirst as Mock).mockResolvedValue(null);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:join', { chatId: 'non-existent-chat' }, resolve); });
      expect(result.error).toBe('Conversation not found or access denied');
    });

    it('should reject joining conversation user is not part of', async () => {
      (prisma.chat.findFirst as Mock).mockResolvedValue(null);
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:join', { chatId: 'other-users-chat' }, resolve); });
      expect(result.error).toBe('Conversation not found or access denied');
    });
  });

  describe('chat:leave', () => {
    it('should allow user to leave conversation room', async () => {
      const result = await new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:leave', { chatId: mockChat.id }, resolve); });
      expect(result.success).toBe(true);
    });
  });

  describe('chat:message', () => {
    it('should send message and broadcast to conversation room', async () => {
      (prisma.chat.findFirst as Mock).mockResolvedValue(mockChat as unknown as Chat);
      (prisma.message.create as Mock).mockResolvedValue(mockMessage as unknown as Message);
      (prisma.chat.update as Mock).mockResolvedValue(mockChat as unknown as Chat);

      await Promise.all([
        new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve); }),
        new Promise<SocketAck>((resolve) => { clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve); }),
      ]);

      const messagePromise = new Promise<SocketAck>((resolve) => { clientSocket2.on('chat:message:new', resolve); });
      const sendResult = await new Promise<SocketAck>((resolve) => {
        clientSocket1.emit('chat:message', { chatId: mockChat.id, content: 'Hello from WebSocket test' }, resolve);
      });

      expect(sendResult.success).toBe(true);
      expect(sendResult.data.content).toBe('Hello from WebSocket test');

      const receivedMessage = await Promise.race([
        messagePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);
      expect(receivedMessage.message.content).toBe('Hello from WebSocket test');
    });

    it('should reject sending message to non-existent conversation', async () => {
      (prisma.chat.findFirst as Mock).mockResolvedValue(null);
      const result = await new Promise<SocketAck>((resolve) => {
        clientSocket1.emit('chat:message', { chatId: 'non-existent-chat', content: 'Test message' }, resolve);
      });
      expect(result.error).toBe('Conversation not found or access denied');
    });
  });

  describe('chat:typing', () => {
    it('should broadcast typing indicator to conversation room', async () => {
      (prisma.chat.findFirst as Mock).mockResolvedValue(mockChat as unknown as Chat);
      await Promise.all([
        new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve); }),
        new Promise<SocketAck>((resolve) => { clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve); }),
      ]);
      const typingPromise = new Promise<SocketAck>((resolve) => { clientSocket2.on('chat:typing', resolve); });
      clientSocket1.emit('chat:typing', { chatId: mockChat.id, isTyping: true });
      const result = await Promise.race([typingPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))]);
      expect(result.userId).toBe(mockUser1.id);
      expect(result.chatId).toBe(mockChat.id);
      expect(result.isTyping).toBe(true);
    });

    it('should broadcast typing stopped indicator', async () => {
      (prisma.chat.findFirst as Mock).mockResolvedValue(mockChat as unknown as Chat);
      await Promise.all([
        new Promise<SocketAck>((resolve) => { clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve); }),
        new Promise<SocketAck>((resolve) => { clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve); }),
      ]);
      const typingPromise = new Promise<SocketAck>((resolve) => { clientSocket2.on('chat:typing', resolve); });
      clientSocket1.emit('chat:typing', { chatId: mockChat.id, isTyping: false });
      const result = await Promise.race([typingPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))]);
      expect(result.isTyping).toBe(false);
    });
  });
});
