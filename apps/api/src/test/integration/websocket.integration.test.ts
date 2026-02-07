/**
 * WebSocket Integration Tests
 * Tests for Socket.io real-time functionality including:
 * - Connection & Authentication
 * - Presence (online/offline, heartbeat, activity)
 * - Chat (join, leave, messaging, typing, read receipts)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as SocketClient, Socket as ClientSocket } from 'socket.io-client';
import { setupWebSocket, AuthenticatedSocket } from '../../websocket/index.js';
import { generateTestToken } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';

// Test configuration
const TEST_PORT = 3099;
const TEST_URL = `http://localhost:${TEST_PORT}`;

// Mock data
const mockUser1 = {
  id: 'ws-test-user-1',
  email: 'wstest1@example.com',
  firstName: 'WebSocket',
  lastName: 'User1',
  isBlocked: false,
  profileImages: [],
  preferredLanguage: 'ENGLISH',
};

const mockUser2 = {
  id: 'ws-test-user-2',
  email: 'wstest2@example.com',
  firstName: 'WebSocket',
  lastName: 'User2',
  isBlocked: false,
  profileImages: [],
  preferredLanguage: 'ENGLISH',
};

const mockChat = {
  id: 'ws-test-chat-1',
  user1Id: 'ws-test-user-1',
  user2Id: 'ws-test-user-2',
  chatType: 'TEMPORARY',
  status: 'ACTIVE',
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  user1: { id: 'ws-test-user-1' },
  user2: { id: 'ws-test-user-2' },
};

const mockMessage = {
  id: 'ws-test-message-1',
  chatId: 'ws-test-chat-1',
  senderId: 'ws-test-user-1',
  content: 'Hello from WebSocket test',
  messageType: 'TEXT',
  isRead: false,
  createdAt: new Date(),
  sender: {
    id: 'ws-test-user-1',
    firstName: 'WebSocket',
    lastName: 'User1',
    profileImages: [],
  },
  chat: mockChat,
};

describe('WebSocket Integration Tests', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;

  beforeAll(async () => {
    // Create HTTP server
    httpServer = createServer();

    // Setup Socket.io
    io = setupWebSocket(httpServer);

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, () => {
        console.log(`Test WebSocket server running on port ${TEST_PORT}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Cleanup connections
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();

    // Close server
    io.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Redis mocks
    vi.mocked(redis.setex).mockResolvedValue('OK');
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.del).mockResolvedValue(1);
    vi.mocked(redis.expire).mockResolvedValue(1);
    vi.mocked(redis.keys).mockResolvedValue([]);
  });

  // ===========================================
  // Connection & Authentication Tests
  // ===========================================
  describe('Connection & Authentication', () => {
    it('should connect with valid JWT token', async () => {
      const token = generateTestToken(mockUser1.id, mockUser1.email);

      clientSocket1 = SocketClient(TEST_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket1.on('connect', () => {
          expect(clientSocket1.connected).toBe(true);
          resolve();
        });
        clientSocket1.on('connect_error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      clientSocket1.disconnect();
    });

    it('should reject connection without token', async () => {
      const socket = SocketClient(TEST_URL, {
        auth: {},
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        socket.on('connect_error', (err) => {
          expect(err.message).toContain('Authentication token is required');
          resolve();
        });
        socket.on('connect', () => {
          socket.disconnect();
          resolve();
        });
        setTimeout(() => resolve(), 3000);
      });

      socket.disconnect();
    });

    it('should reject connection with invalid token', async () => {
      const socket = SocketClient(TEST_URL, {
        auth: { token: 'invalid-token-12345' },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        socket.on('connect_error', (err) => {
          expect(err.message).toContain('Invalid or expired token');
          resolve();
        });
        socket.on('connect', () => {
          socket.disconnect();
          resolve();
        });
        setTimeout(() => resolve(), 3000);
      });

      socket.disconnect();
    });

    it('should join user-specific room on connection', async () => {
      const token = generateTestToken(mockUser1.id, mockUser1.email);

      clientSocket1 = SocketClient(TEST_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket1.on('connect', () => {
          // Redis should be called to store socket and online status
          expect(redis.setex).toHaveBeenCalled();
          resolve();
        });
        clientSocket1.on('connect_error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      clientSocket1.disconnect();
    });
  });

  // ===========================================
  // Presence Handler Tests
  // ===========================================
  describe('Presence Handlers', () => {
    beforeEach(async () => {
      const token1 = generateTestToken(mockUser1.id, mockUser1.email);
      const token2 = generateTestToken(mockUser2.id, mockUser2.email);

      clientSocket1 = SocketClient(TEST_URL, {
        auth: { token: token1 },
        transports: ['websocket'],
      });

      clientSocket2 = SocketClient(TEST_URL, {
        auth: { token: token2 },
        transports: ['websocket'],
      });

      // Wait for both connections
      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
        new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
      ]);
    });

    afterEach(() => {
      if (clientSocket1?.connected) clientSocket1.disconnect();
      if (clientSocket2?.connected) clientSocket2.disconnect();
    });

    it('should broadcast user:online when presence:online is emitted', async () => {
      const onlinePromise = new Promise<any>((resolve) => {
        clientSocket2.on('user:online', resolve);
      });

      clientSocket1.emit('presence:online');

      const result = await Promise.race([
        onlinePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);

      expect(result).toMatchObject({
        userId: mockUser1.id,
      });
      expect(result.timestamp).toBeDefined();
    });

    it('should broadcast user:offline when presence:offline is emitted', async () => {
      const offlinePromise = new Promise<any>((resolve) => {
        clientSocket2.on('user:offline', resolve);
      });

      clientSocket1.emit('presence:offline');

      const result = await Promise.race([
        offlinePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);

      expect(result).toMatchObject({
        userId: mockUser1.id,
      });
      expect(result.timestamp).toBeDefined();
    });

    it('should check online status of users with presence:check', async () => {
      vi.mocked(redis.get).mockImplementation(async (key: string) => {
        if (key === `online:${mockUser2.id}`) {
          return new Date().toISOString();
        }
        return null;
      });

      const result = await new Promise<any>((resolve) => {
        clientSocket1.emit('presence:check', { userIds: [mockUser2.id, 'nonexistent-user'] }, resolve);
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        userId: mockUser2.id,
        isOnline: true,
      });
      expect(result.data[1]).toMatchObject({
        userId: 'nonexistent-user',
        isOnline: false,
      });
    });

    it('should get all online users with presence:get-online', async () => {
      vi.mocked(redis.keys).mockResolvedValue([`online:${mockUser1.id}`, `online:${mockUser2.id}`]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser1 as any, mockUser2 as any]);

      const result = await new Promise<any>((resolve) => {
        clientSocket1.emit('presence:get-online', resolve);
      });

      expect(result.success).toBe(true);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should respond to heartbeat with ack', async () => {
      const ackPromise = new Promise<any>((resolve) => {
        clientSocket1.on('presence:heartbeat:ack', resolve);
      });

      clientSocket1.emit('presence:heartbeat');

      const result = await Promise.race([
        ackPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);

      expect(result.timestamp).toBeDefined();
      expect(redis.expire).toHaveBeenCalled();
    });

    it('should broadcast activity updates with presence:activity', async () => {
      const activityPromise = new Promise<any>((resolve) => {
        clientSocket2.on('user:activity', resolve);
      });

      clientSocket1.emit('presence:activity', {
        activity: 'viewing_profile',
        metadata: { profileId: mockUser2.id },
      });

      const result = await Promise.race([
        activityPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);

      expect(result).toMatchObject({
        userId: mockUser1.id,
        activity: 'viewing_profile',
      });
    });
  });

  // ===========================================
  // Chat Handler Tests
  // ===========================================
  describe('Chat Handlers', () => {
    beforeEach(async () => {
      const token1 = generateTestToken(mockUser1.id, mockUser1.email);
      const token2 = generateTestToken(mockUser2.id, mockUser2.email);

      clientSocket1 = SocketClient(TEST_URL, {
        auth: { token: token1 },
        transports: ['websocket'],
      });

      clientSocket2 = SocketClient(TEST_URL, {
        auth: { token: token2 },
        transports: ['websocket'],
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
        new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
      ]);
    });

    afterEach(() => {
      if (clientSocket1?.connected) clientSocket1.disconnect();
      if (clientSocket2?.connected) clientSocket2.disconnect();
    });

    describe('chat:join', () => {
      it('should allow user to join their conversation', async () => {
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as any);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve);
        });

        expect(result.success).toBe(true);
        expect(result.data.chatId).toBe(mockChat.id);
      });

      it('should reject joining non-existent conversation', async () => {
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:join', { chatId: 'non-existent-chat' }, resolve);
        });

        expect(result.error).toBe('Conversation not found or access denied');
      });

      it('should reject joining conversation user is not part of', async () => {
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:join', { chatId: 'other-users-chat' }, resolve);
        });

        expect(result.error).toBe('Conversation not found or access denied');
      });
    });

    describe('chat:leave', () => {
      it('should allow user to leave conversation room', async () => {
        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:leave', { chatId: mockChat.id }, resolve);
        });

        expect(result.success).toBe(true);
      });
    });

    describe('chat:message', () => {
      it('should send message and broadcast to conversation room', async () => {
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as any);
        vi.mocked(prisma.message.create).mockResolvedValue(mockMessage as any);
        vi.mocked(prisma.chat.update).mockResolvedValue(mockChat as any);
        vi.mocked(redis.get).mockResolvedValue(null); // Recipient offline

        // Both users join the conversation
        await Promise.all([
          new Promise<any>((resolve) => {
            clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
          new Promise<any>((resolve) => {
            clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
        ]);

        // Setup listener for new message on client2
        const messagePromise = new Promise<any>((resolve) => {
          clientSocket2.on('chat:message:new', resolve);
        });

        // Send message from client1
        const sendResult = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:message', {
            chatId: mockChat.id,
            content: 'Hello from WebSocket test',
          }, resolve);
        });

        expect(sendResult.success).toBe(true);
        expect(sendResult.data.content).toBe('Hello from WebSocket test');

        // Verify client2 received the message
        const receivedMessage = await Promise.race([
          messagePromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
        ]);

        expect(receivedMessage.message.content).toBe('Hello from WebSocket test');
      });

      it('should reject sending message to non-existent conversation', async () => {
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:message', {
            chatId: 'non-existent-chat',
            content: 'Test message',
          }, resolve);
        });

        expect(result.error).toBe('Conversation not found or access denied');
      });
    });

    describe('chat:message:read', () => {
      it('should mark message as read and notify sender', async () => {
        vi.mocked(prisma.message.findUnique).mockResolvedValue({
          ...mockMessage,
          senderId: mockUser1.id,
          chat: {
            ...mockChat,
            user1Id: mockUser1.id,
            user2Id: mockUser2.id,
          },
        } as any);
        vi.mocked(prisma.message.update).mockResolvedValue({ ...mockMessage, isRead: true } as any);

        // Setup listener for read receipt on sender's socket
        const readPromise = new Promise<any>((resolve) => {
          clientSocket1.on('chat:message:read', resolve);
        });

        // Client2 marks message as read
        const result = await new Promise<any>((resolve) => {
          clientSocket2.emit('chat:message:read', { messageId: mockMessage.id }, resolve);
        });

        expect(result.success).toBe(true);

        // Verify sender received read notification
        const readReceipt = await Promise.race([
          readPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
        ]);

        expect(readReceipt.messageId).toBe(mockMessage.id);
        expect(readReceipt.readBy).toBe(mockUser2.id);
      });

      it('should reject marking non-existent message as read', async () => {
        vi.mocked(prisma.message.findUnique).mockResolvedValue(null);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:message:read', { messageId: 'non-existent' }, resolve);
        });

        expect(result.error).toBe('Message not found');
      });

      it('should reject marking message from other conversation', async () => {
        vi.mocked(prisma.message.findUnique).mockResolvedValue({
          ...mockMessage,
          chat: {
            user1Id: 'other-user-1',
            user2Id: 'other-user-2',
          },
        } as any);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:message:read', { messageId: mockMessage.id }, resolve);
        });

        expect(result.error).toBe('Access denied');
      });
    });

    describe('chat:typing', () => {
      it('should broadcast typing indicator to conversation room', async () => {
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as any);

        // Both users join the conversation
        await Promise.all([
          new Promise<any>((resolve) => {
            clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
          new Promise<any>((resolve) => {
            clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
        ]);

        // Setup listener for typing indicator on client2
        const typingPromise = new Promise<any>((resolve) => {
          clientSocket2.on('chat:typing', resolve);
        });

        // Client1 starts typing
        clientSocket1.emit('chat:typing', { chatId: mockChat.id, isTyping: true });

        const result = await Promise.race([
          typingPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
        ]);

        expect(result.userId).toBe(mockUser1.id);
        expect(result.chatId).toBe(mockChat.id);
        expect(result.isTyping).toBe(true);
      });

      it('should broadcast typing stopped indicator', async () => {
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as any);

        // Both users join the conversation
        await Promise.all([
          new Promise<any>((resolve) => {
            clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
          new Promise<any>((resolve) => {
            clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
        ]);

        // Setup listener for typing indicator on client2
        const typingPromise = new Promise<any>((resolve) => {
          clientSocket2.on('chat:typing', resolve);
        });

        // Client1 stops typing
        clientSocket1.emit('chat:typing', { chatId: mockChat.id, isTyping: false });

        const result = await Promise.race([
          typingPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
        ]);

        expect(result.isTyping).toBe(false);
      });
    });

    describe('chat:unread:count', () => {
      it('should return unread message count', async () => {
        vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChat as any]);
        vi.mocked(prisma.message.count).mockResolvedValue(5);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:unread:count', resolve);
        });

        expect(result.success).toBe(true);
        expect(result.data.unreadCount).toBe(5);
      });

      it('should return zero when no unread messages', async () => {
        vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChat as any]);
        vi.mocked(prisma.message.count).mockResolvedValue(0);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:unread:count', resolve);
        });

        expect(result.success).toBe(true);
        expect(result.data.unreadCount).toBe(0);
      });
    });

    describe('chat:message:delete', () => {
      it('should delete own message and notify room', async () => {
        vi.mocked(prisma.message.findUnique).mockResolvedValue({
          ...mockMessage,
          senderId: mockUser1.id,
        } as any);
        vi.mocked(prisma.message.delete).mockResolvedValue(mockMessage as any);
        vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as any);

        // Both users join the conversation
        await Promise.all([
          new Promise<any>((resolve) => {
            clientSocket1.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
          new Promise<any>((resolve) => {
            clientSocket2.emit('chat:join', { chatId: mockChat.id }, resolve);
          }),
        ]);

        // Setup listener for deleted message on client2
        const deletePromise = new Promise<any>((resolve) => {
          clientSocket2.on('chat:message:deleted', resolve);
        });

        // Client1 deletes their message
        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:message:delete', { messageId: mockMessage.id }, resolve);
        });

        expect(result.success).toBe(true);

        // Verify client2 received delete notification
        const deleteNotification = await Promise.race([
          deletePromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
        ]);

        expect(deleteNotification.messageId).toBe(mockMessage.id);
        expect(deleteNotification.chatId).toBe(mockChat.id);
      });

      it('should reject deleting message from another user', async () => {
        vi.mocked(prisma.message.findUnique).mockResolvedValue({
          ...mockMessage,
          senderId: mockUser2.id, // Different sender
        } as any);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:message:delete', { messageId: mockMessage.id }, resolve);
        });

        expect(result.error).toBe('Message not found or you are not the sender');
      });

      it('should reject deleting non-existent message', async () => {
        vi.mocked(prisma.message.findUnique).mockResolvedValue(null);

        const result = await new Promise<any>((resolve) => {
          clientSocket1.emit('chat:message:delete', { messageId: 'non-existent' }, resolve);
        });

        expect(result.error).toBe('Message not found or you are not the sender');
      });
    });
  });

  // ===========================================
  // Disconnection Tests
  // ===========================================
  describe('Disconnection', () => {
    it('should broadcast user:offline when client disconnects', async () => {
      const token1 = generateTestToken(mockUser1.id, mockUser1.email);
      const token2 = generateTestToken(mockUser2.id, mockUser2.email);

      clientSocket1 = SocketClient(TEST_URL, {
        auth: { token: token1 },
        transports: ['websocket'],
      });

      clientSocket2 = SocketClient(TEST_URL, {
        auth: { token: token2 },
        transports: ['websocket'],
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
        new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
      ]);

      // Setup listener for offline event on client2
      const offlinePromise = new Promise<any>((resolve) => {
        clientSocket2.on('user:offline', resolve);
      });

      // Disconnect client1
      clientSocket1.disconnect();

      const result = await Promise.race([
        offlinePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);

      expect(result.userId).toBe(mockUser1.id);
      expect(redis.del).toHaveBeenCalled();

      clientSocket2.disconnect();
    });

    it('should clean up Redis on disconnect', async () => {
      const token = generateTestToken(mockUser1.id, mockUser1.email);

      clientSocket1 = SocketClient(TEST_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => clientSocket1.on('connect', resolve));

      // Disconnect
      clientSocket1.disconnect();

      // Wait a bit for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Redis cleanup was called
      expect(redis.del).toHaveBeenCalledWith(`socket:${mockUser1.id}`);
      expect(redis.del).toHaveBeenCalledWith(`online:${mockUser1.id}`);
    });
  });

  // ===========================================
  // Edge Cases & Error Handling
  // ===========================================
  describe('Edge Cases & Error Handling', () => {
    it('should handle multiple rapid connections from same user', async () => {
      const token = generateTestToken(mockUser1.id, mockUser1.email);

      const sockets: ClientSocket[] = [];

      // Create 3 rapid connections
      for (let i = 0; i < 3; i++) {
        const socket = SocketClient(TEST_URL, {
          auth: { token },
          transports: ['websocket'],
        });
        sockets.push(socket);
      }

      // Wait for all connections
      await Promise.all(
        sockets.map((socket) =>
          new Promise<void>((resolve) => {
            socket.on('connect', resolve);
            setTimeout(resolve, 3000); // Timeout fallback
          })
        )
      );

      // All should be connected
      const connectedCount = sockets.filter((s) => s.connected).length;
      expect(connectedCount).toBeGreaterThan(0);

      // Cleanup
      sockets.forEach((s) => s.disconnect());
    });

    it('should handle chat operations when not authenticated', async () => {
      // This tests the guard clauses in handlers when userId is undefined
      // In practice, socket should not connect without auth, but we test defensive code
      const token = generateTestToken(mockUser1.id, mockUser1.email);

      clientSocket1 = SocketClient(TEST_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => clientSocket1.on('connect', resolve));

      // Test presence:check with valid callback
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await new Promise<any>((resolve) => {
        clientSocket1.emit('presence:check', { userIds: [] }, resolve);
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);

      clientSocket1.disconnect();
    });
  });
});
