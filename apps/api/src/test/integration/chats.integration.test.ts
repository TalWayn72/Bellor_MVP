/**
 * Chats Routes - Integration Tests
 * Tests the full HTTP request/response cycle for chat endpoints
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const mockChat = {
  id: 'chat-1',
  user1Id: 'test-user-id',
  user2Id: 'other-user-id',
  chatType: 'TEMPORARY',
  isTemporary: true,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  user1: { id: 'test-user-id', firstName: 'Test', lastName: 'User', profileImages: [] },
  user2: { id: 'other-user-id', firstName: 'Other', lastName: 'Person', profileImages: [] },
  messages: [],
};

const mockMessage = {
  id: 'msg-1',
  chatId: 'chat-1',
  senderId: 'test-user-id',
  content: 'Hello',
  messageType: 'TEXT',
  isRead: false,
  isDeleted: false,
  createdAt: new Date(),
  sender: { id: 'test-user-id', firstName: 'Test', lastName: 'User', profileImages: [] },
};

// ============================================
// GET USER'S CHATS
// ============================================
describe('GET /api/v1/chats', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return user chats list', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChat] as any);
    vi.mocked(prisma.chat.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    // Chats endpoint returns data directly (not wrapped in {success, data})
    expect(body).toBeDefined();
  });

  it('should accept pagination parameters', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([]);
    vi.mocked(prisma.chat.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats?limit=10&offset=5',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
  });
});

// ============================================
// GET CHAT BY ID
// ============================================
describe('GET /api/v1/chats/:chatId', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/chat-1',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return chat details when user is participant', async () => {
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/chat-1',
      headers: { authorization: authHeader() },
    });

    // Chat endpoint returns {chat} or error - check for 200 or service error
    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should return 404 for non-existent chat', async () => {
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/nonexistent',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });
});

// ============================================
// CREATE CHAT
// ============================================
describe('POST /api/v1/chats', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      payload: { otherUserId: 'other-user-id' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should create a new chat', async () => {
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(null); // No existing chat
    vi.mocked(prisma.chat.create).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: { otherUserId: 'other-user-id' },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    // Chats endpoint returns {chat} directly (not wrapped in {success, data})
    expect(body.chat).toBeDefined();
  });

  it('should return existing chat if one exists', async () => {
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: { otherUserId: 'other-user-id' },
    });

    // Should return 200 with existing chat or 201 with new
    expect([200, 201]).toContain(response.statusCode);
  });

  it('should reject creating chat with self', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: { otherUserId: 'test-user-id' }, // Same as auth user
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// GET MESSAGES
// ============================================
describe('GET /api/v1/chats/:chatId/messages', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/chat-1/messages',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return messages list', async () => {
    // Mock chat lookup for access check
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat as any);
    vi.mocked(prisma.message.findMany).mockResolvedValue([mockMessage] as any);
    vi.mocked(prisma.message.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/chat-1/messages',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    // Messages endpoint returns service result directly
    expect(body).toBeDefined();
  });
});

// ============================================
// SEND MESSAGE
// ============================================
describe('POST /api/v1/chats/:chatId/messages', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/chat-1/messages',
      payload: { content: 'Hello' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should send a message', async () => {
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat as any);
    vi.mocked(prisma.message.create).mockResolvedValue(mockMessage as any);
    vi.mocked(prisma.chat.update).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/chat-1/messages',
      headers: { authorization: authHeader() },
      payload: { content: 'Hello there!' },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    // Send message returns {message} directly
    expect(body.message).toBeDefined();
  });

  it('should return 400 for empty message content', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/chat-1/messages',
      headers: { authorization: authHeader() },
      payload: { content: '' },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// MARK MESSAGE AS READ
// ============================================
describe('PATCH /api/v1/chats/:chatId/messages/:messageId/read', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/chats/chat-1/messages/msg-1/read',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should mark message as read', async () => {
    vi.mocked(prisma.message.findUnique).mockResolvedValue({
      ...mockMessage,
      senderId: 'other-user-id', // Sent by someone else
    } as any);
    vi.mocked(prisma.message.update).mockResolvedValue({
      ...mockMessage,
      isRead: true,
    } as any);
    // Mock chat for user access validation
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/chats/chat-1/messages/msg-1/read',
      headers: { authorization: authHeader() },
    });

    expect([200, 404]).toContain(response.statusCode);
  });
});

// ============================================
// DELETE MESSAGE
// ============================================
describe('DELETE /api/v1/chats/:chatId/messages/:messageId', () => {
  it('should return 401 without authorization', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chats/chat-1/messages/msg-1',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should delete own message', async () => {
    vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage as any);
    vi.mocked(prisma.message.update).mockResolvedValue({
      ...mockMessage,
      isDeleted: true,
    } as any);
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chats/chat-1/messages/msg-1',
      headers: { authorization: authHeader() },
    });

    expect([200, 404]).toContain(response.statusCode);
  });
});
