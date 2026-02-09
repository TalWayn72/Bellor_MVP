/**
 * Chat Endpoints - Contract Tests (Schema Compliance)
 * Verifies that chat API responses match shared Zod schemas
 * Catches API drift between frontend and backend
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import {
  ChatResponseSchema,
  MessageResponseSchema,
  CreateChatRequestSchema,
  SendMessageRequestSchema,
  ChatListResponseSchema,
  MessageListResponseSchema,
} from '@bellor/shared/schemas';

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
  id: 'test-chat-id',
  user1Id: 'user-1',
  user2Id: 'user-2',
  status: 'ACTIVE',
  isTemporary: false,
  isPermanent: true,
  isConvertedToPermanent: false,
  expiresAt: null,
  reportedCount: 0,
  messageCount: 5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  lastMessageAt: new Date('2024-06-01'),
};

const mockMessage = {
  id: 'test-message-id',
  chatId: 'test-chat-id',
  senderId: 'user-1',
  messageType: 'TEXT',
  content: 'Hello world',
  textContent: 'Hello world',
  isRead: false,
  isDeleted: false,
  createdAt: new Date('2024-06-01'),
  readAt: null,
};

// ============================================
// GET CHATS - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/chats - Schema Compliance', () => {
  it('returns chat list matching ChatListResponseSchema', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChat] as any);
    vi.mocked(prisma.chat.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats?limit=20&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    // Validate response structure
    const listResult = ChatListResponseSchema.safeParse({
      chats: body.data || body.chats || [],
      total: body.pagination?.total || body.total || 0,
      pagination: body.pagination,
    });

    if (!listResult.success) {
      // eslint-disable-next-line no-console
      console.error('Chat list schema errors:', listResult.error.errors);
    }

    expect(listResult.success).toBe(true);
  });

  it('validates each chat against ChatResponseSchema', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChat] as any);
    vi.mocked(prisma.chat.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const chats = body.data || body.chats || [];

    for (const chat of chats) {
      const result = ChatResponseSchema.safeParse(chat);

      if (!result.success) {
        // eslint-disable-next-line no-console
        console.error('Chat schema validation errors:', result.error.errors);
      }

      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// GET CHAT BY ID - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/chats/:id - Schema Compliance', () => {
  it('returns chat matching ChatResponseSchema', async () => {
    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    const result = ChatResponseSchema.safeParse(body.data);

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error('Chat schema validation errors:', result.error.errors);
    }

    expect(result.success).toBe(true);
  });
});

// ============================================
// CREATE CHAT - REQUEST/RESPONSE SCHEMA COMPLIANCE
// ============================================
describe('POST /api/v1/chats - Schema Compliance', () => {
  it('accepts valid CreateChatRequestSchema data', async () => {
    const validRequest = {
      otherUserId: 'other-user-id',
    };

    // Validate request against schema
    const requestResult = CreateChatRequestSchema.safeParse(validRequest);
    expect(requestResult.success).toBe(true);

    vi.mocked(prisma.chat.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.chat.create).mockResolvedValue(mockChat as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: validRequest,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);

    // Validate response against schema
    const responseResult = ChatResponseSchema.safeParse(body.data || body.chat);

    if (!responseResult.success) {
      // eslint-disable-next-line no-console
      console.error('Create chat response schema errors:', responseResult.error.errors);
    }

    expect(responseResult.success).toBe(true);
  });

  it('rejects invalid CreateChatRequestSchema data', async () => {
    const invalidRequest = {
      otherUserId: '', // Empty string
    };

    // Validate request against schema - should fail
    const requestResult = CreateChatRequestSchema.safeParse(invalidRequest);
    expect(requestResult.success).toBe(false);
  });
});

// ============================================
// GET MESSAGES - SCHEMA COMPLIANCE
// ============================================
describe('GET /api/v1/chats/:id/messages - Schema Compliance', () => {
  it('returns message list matching MessageListResponseSchema', async () => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([mockMessage] as any);
    vi.mocked(prisma.message.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id/messages?limit=50&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.success).toBe(true);

    // Validate response structure
    const listResult = MessageListResponseSchema.safeParse({
      messages: body.data || body.messages || [],
      total: body.total || 0,
    });

    if (!listResult.success) {
      // eslint-disable-next-line no-console
      console.error('Message list schema errors:', listResult.error.errors);
    }

    expect(listResult.success).toBe(true);
  });

  it('validates each message against MessageResponseSchema', async () => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([mockMessage] as any);
    vi.mocked(prisma.message.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const messages = body.data || body.messages || [];

    for (const message of messages) {
      const result = MessageResponseSchema.safeParse(message);

      if (!result.success) {
        // eslint-disable-next-line no-console
        console.error('Message schema validation errors:', result.error.errors);
      }

      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// SEND MESSAGE - REQUEST/RESPONSE SCHEMA COMPLIANCE
// ============================================
describe('POST /api/v1/chats/:id/messages - Schema Compliance', () => {
  it('accepts valid SendMessageRequestSchema data', async () => {
    const validRequest = {
      content: 'Hello world',
      type: 'TEXT' as const,
    };

    // Validate request against schema
    const requestResult = SendMessageRequestSchema.safeParse(validRequest);
    expect(requestResult.success).toBe(true);

    vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat as any);
    vi.mocked(prisma.message.create).mockResolvedValue(mockMessage as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader() },
      payload: validRequest,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);

    // Validate response against schema
    const responseResult = MessageResponseSchema.safeParse(body.data || body.message);

    if (!responseResult.success) {
      // eslint-disable-next-line no-console
      console.error('Send message response schema errors:', responseResult.error.errors);
    }

    expect(responseResult.success).toBe(true);
  });

  it('rejects invalid SendMessageRequestSchema data', async () => {
    const invalidRequest = {
      content: '', // Empty content
      type: 'INVALID_TYPE',
    };

    // Validate request against schema - should fail
    const requestResult = SendMessageRequestSchema.safeParse(invalidRequest);
    expect(requestResult.success).toBe(false);
  });

  it('validates message type enum', async () => {
    const validTypes = ['TEXT', 'VOICE', 'IMAGE', 'VIDEO', 'DRAWING'];

    for (const type of validTypes) {
      const result = SendMessageRequestSchema.safeParse({
        content: 'Test message',
        type,
      });

      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid message types', async () => {
    const invalidTypes = ['INVALID', 'text', 'voice', ''];

    for (const type of invalidTypes) {
      const result = SendMessageRequestSchema.safeParse({
        content: 'Test message',
        type,
      });

      expect(result.success).toBe(false);
    }
  });
});

// ============================================
// CHAT STATUS ENUM VALIDATION
// ============================================
describe('Chat Status Enum Validation', () => {
  it('validates chat status enum values', () => {
    const validStatuses = ['ACTIVE', 'EXPIRED', 'BLOCKED', 'DELETED'];

    for (const status of validStatuses) {
      const chat = { ...mockChat, status };
      const result = ChatResponseSchema.safeParse(chat);

      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid chat status values', () => {
    const invalidStatuses = ['INVALID', 'active', 'pending', ''];

    for (const status of invalidStatuses) {
      const chat = { ...mockChat, status };
      const result = ChatResponseSchema.safeParse(chat);

      expect(result.success).toBe(false);
    }
  });
});
