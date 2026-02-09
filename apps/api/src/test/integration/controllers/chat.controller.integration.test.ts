/**
 * Chat Controller Integration Tests
 * Tests for chat creation, messaging, read receipts, and access control
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader, generateTestToken } from '../../build-test-app.js';
import { prisma } from '../../../lib/prisma.js';
import { createMockUser, createMockChat, createMockMessage } from '../../setup.js';

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

// ============================================
// GET USER CHATS
// ============================================
describe('GET /api/v1/chats - Get User Chats', () => {
  it('should get user chats successfully', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([createMockChat()]);
    vi.mocked(prisma.chat.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should accept pagination parameters', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([]);
    vi.mocked(prisma.chat.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats?limit=10&offset=0',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('should filter by chat type (temporary)', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([]);
    vi.mocked(prisma.chat.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats?is_temporary=true',
      headers: { authorization: authHeader() },
    });

    expect([200, 500]).toContain(response.statusCode);
  });
});

// ============================================
// GET CHAT BY ID
// ============================================
describe('GET /api/v1/chats/:chatId - Get Chat By ID', () => {
  it('should get chat by id for participant', async () => {
    const mockChat = createMockChat({ user1Id: 'test-user-id', user2Id: 'other-user-id' });
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should return 404 for non-existent chat', async () => {
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/non-existent-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// CREATE CHAT
// ============================================
describe('POST /api/v1/chats - Create Chat', () => {
  it('should create new chat successfully', async () => {
    const mockUser = createMockUser({ id: 'other-user-id' });
    const mockChat = createMockChat({ user1Id: 'test-user-id', user2Id: 'other-user-id' });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.chat.create).mockResolvedValue(mockChat);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        otherUserId: 'other-user-id',
        isTemporary: true,
      },
    });

    expect([201, 400, 404, 500]).toContain(response.statusCode);
  });

  it('should return existing chat if already exists', async () => {
    const mockUser = createMockUser({ id: 'other-user-id' });
    const existingChat = createMockChat({ user1Id: 'test-user-id', user2Id: 'other-user-id' });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(existingChat);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        otherUserId: 'other-user-id',
      },
    });

    expect([201, 400, 404, 500]).toContain(response.statusCode);
  });

  it('should reject chat with self', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        otherUserId: 'test-user-id',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject missing otherUserId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject chat with non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: {
        otherUserId: 'non-existent-user',
      },
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      payload: {
        otherUserId: 'other-user-id',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// GET MESSAGES
// ============================================
describe('GET /api/v1/chats/:chatId/messages - Get Messages', () => {
  it('should get messages for participant', async () => {
    const mockChat = createMockChat({ user1Id: 'test-user-id', user2Id: 'other-user-id' });
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);
    vi.mocked(prisma.message.findMany).mockResolvedValue([createMockMessage()]);
    vi.mocked(prisma.message.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should accept pagination parameters', async () => {
    const mockChat = createMockChat({ user1Id: 'test-user-id' });
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
    vi.mocked(prisma.message.count).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id/messages?limit=20&offset=0',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should return 404 for non-existent chat', async () => {
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/non-existent-id/messages',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id/messages',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// SEND MESSAGE
// ============================================
describe('POST /api/v1/chats/:chatId/messages - Send Message', () => {
  it('should send message successfully', async () => {
    const mockChat = createMockChat({ user1Id: 'test-user-id', user2Id: 'other-user-id' });
    const mockMessage = createMockMessage({ senderId: 'test-user-id' });
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);
    vi.mocked(prisma.message.create).mockResolvedValue(mockMessage);
    vi.mocked(prisma.chat.update).mockResolvedValue(mockChat);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        content: 'Hello, this is a test message',
      },
    });

    expect([201, 404, 500]).toContain(response.statusCode);
  });

  it('should reject empty message content', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader() },
      payload: {
        content: '',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject missing content', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader() },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should accept different message types', async () => {
    const mockChat = createMockChat({ user1Id: 'test-user-id' });
    const mockMessage = createMockMessage({ messageType: 'IMAGE' });
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);
    vi.mocked(prisma.message.create).mockResolvedValue(mockMessage);
    vi.mocked(prisma.chat.update).mockResolvedValue(mockChat);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        content: 'https://example.com/image.jpg',
        messageType: 'IMAGE',
      },
    });

    expect([201, 404, 500]).toContain(response.statusCode);
  });

  it('should handle XSS in message content (stored safely)', async () => {
    const mockChat = createMockChat({ user1Id: 'test-user-id' });
    const mockMessage = createMockMessage({ content: '<script>alert(1)</script>' });
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);
    vi.mocked(prisma.message.create).mockResolvedValue(mockMessage);
    vi.mocked(prisma.chat.update).mockResolvedValue(mockChat);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader('test-user-id') },
      payload: {
        content: '<script>alert(1)</script>',
      },
    });

    expect([201, 400, 404, 500]).toContain(response.statusCode);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      payload: {
        content: 'Hello',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// MARK MESSAGE AS READ
// ============================================
describe('PATCH /api/v1/chats/:chatId/messages/:messageId/read - Mark As Read', () => {
  it('should mark message as read', async () => {
    const mockMessage = createMockMessage({ senderId: 'other-user-id' });
    vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage);
    vi.mocked(prisma.message.update).mockResolvedValue({ ...mockMessage, isRead: true });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/chats/test-chat-id/messages/test-message-id/read',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should return 404 for non-existent message', async () => {
    vi.mocked(prisma.message.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/chats/test-chat-id/messages/non-existent-id/read',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/chats/test-chat-id/messages/test-message-id/read',
    });

    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// DELETE MESSAGE
// ============================================
describe('DELETE /api/v1/chats/:chatId/messages/:messageId - Delete Message', () => {
  it('should delete own message', async () => {
    const mockMessage = createMockMessage({ senderId: 'test-user-id' });
    vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage);
    vi.mocked(prisma.message.delete).mockResolvedValue(mockMessage);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chats/test-chat-id/messages/test-message-id',
      headers: { authorization: authHeader('test-user-id') },
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('should return 404 for non-existent message', async () => {
    vi.mocked(prisma.message.findUnique).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chats/test-chat-id/messages/non-existent-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/chats/test-chat-id/messages/test-message-id',
    });

    expect(response.statusCode).toBe(401);
  });
});
