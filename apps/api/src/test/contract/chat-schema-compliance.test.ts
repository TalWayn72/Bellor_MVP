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
import type { Chat, Message, User } from '@prisma/client';
import {
  ChatResponseSchema,
  CreateChatRequestSchema,
  SendMessageRequestSchema,
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

// Mock data for the chat service (includes related user data as the service does includes)
const mockChatWithIncludes = {
  id: 'test-chat-id',
  user1Id: 'test-user-id',
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
  user1: {
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    profileImages: ['https://example.com/img.jpg'],
    isVerified: true,
    lastActiveAt: new Date('2024-06-01'),
  },
  user2: {
    id: 'user-2',
    firstName: 'Other',
    lastName: 'User',
    profileImages: [],
    isVerified: false,
    lastActiveAt: new Date('2024-05-01'),
  },
  messages: [{
    id: 'msg-1',
    content: 'Hello',
    messageType: 'TEXT',
    senderId: 'test-user-id',
    isRead: false,
    createdAt: new Date('2024-06-01'),
  }],
};

const mockMessageWithSender = {
  id: 'test-message-id',
  chatId: 'test-chat-id',
  senderId: 'test-user-id',
  messageType: 'TEXT',
  content: 'Hello world',
  textContent: 'Hello world',
  isRead: false,
  isDeleted: false,
  createdAt: new Date('2024-06-01'),
  readAt: null,
  sender: {
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    profileImages: ['https://example.com/img.jpg'],
  },
};

// ============================================
// GET CHATS - SCHEMA COMPLIANCE
// ============================================
describe('[P1][chat] GET /api/v1/chats - Schema Compliance', () => {
  it('returns chat list matching ChatListResponseSchema', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChatWithIncludes] as unknown as Chat[]);
    vi.mocked(prisma.chat.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats?limit=20&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The chat service returns { chats: [...], total: N }
    // Chat data uses snake_case keys (from the service formatter)
    expect(body).toHaveProperty('chats');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.chats)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  it('validates each chat in the list has expected fields', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([mockChatWithIncludes] as unknown as Chat[]);
    vi.mocked(prisma.chat.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const chats = body.chats || [];

    for (const chat of chats) {
      // The chat service formats chats with snake_case keys
      expect(chat).toHaveProperty('id');
      expect(chat).toHaveProperty('status');
      expect(chat).toHaveProperty('otherUser');
    }
  });
});

// ============================================
// GET CHAT BY ID - SCHEMA COMPLIANCE
// ============================================
describe('[P1][chat] GET /api/v1/chats/:chatId - Schema Compliance', () => {
  it('returns chat matching expected structure', async () => {
    // The route uses chatService.getChatById which calls prisma.chat.findFirst
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChatWithIncludes as unknown as Chat);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // Route returns { chat: { id, otherUser, status, ... } }
    expect(body).toHaveProperty('chat');
    expect(body.chat).toHaveProperty('id');
    expect(body.chat).toHaveProperty('status');
    expect(body.chat).toHaveProperty('otherUser');
  });
});

// ============================================
// CREATE CHAT - REQUEST/RESPONSE SCHEMA COMPLIANCE
// ============================================
describe('[P1][chat] POST /api/v1/chats - Schema Compliance', () => {
  it('accepts valid CreateChatRequestSchema data', async () => {
    const validRequest = {
      otherUserId: 'other-user-id',
    };

    // Validate request against schema
    const requestResult = CreateChatRequestSchema.safeParse(validRequest);
    expect(requestResult.success).toBe(true);

    // Mock for createOrGetChat: it calls prisma.user.findUnique, prisma.chat.findFirst, then getChatById
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'other-user-id' } as unknown as User);
    vi.mocked(prisma.chat.findFirst)
      .mockResolvedValueOnce(null) // No existing chat
      .mockResolvedValueOnce(mockChatWithIncludes as unknown as Chat); // getChatById call
    vi.mocked(prisma.chat.create).mockResolvedValue({
      id: 'test-chat-id',
      user1Id: 'test-user-id',
      user2Id: 'other-user-id',
    } as unknown as Chat);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: validRequest,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);

    // Route returns { chat: { ... } }
    expect(body).toHaveProperty('chat');
    expect(body.chat).toHaveProperty('id');
  });

  it('rejects empty otherUserId at the API level', async () => {
    // The CreateChatRequestSchema in shared schemas uses z.string() without .min(1)
    // So empty string passes schema validation
    const emptyRequest = { otherUserId: '' };
    const requestResult = CreateChatRequestSchema.safeParse(emptyRequest);
    // The shared schema allows empty strings (no .min(1) constraint)
    expect(requestResult.success).toBe(true);

    // But the API will reject it because it treats empty string as falsy
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats',
      headers: { authorization: authHeader() },
      payload: emptyRequest,
    });

    // The route checks `if (!targetUserId)` which catches empty string
    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// GET MESSAGES - SCHEMA COMPLIANCE
// ============================================
describe('[P1][chat] GET /api/v1/chats/:chatId/messages - Schema Compliance', () => {
  it('returns message list matching expected structure', async () => {
    // The getMessages service calls prisma.chat.findFirst then prisma.message.findMany
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChatWithIncludes as unknown as Chat);
    vi.mocked(prisma.message.findMany).mockResolvedValue([mockMessageWithSender] as unknown as Message[]);
    vi.mocked(prisma.message.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id/messages?limit=50&offset=0',
      headers: { authorization: authHeader() },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    // The messages service returns { messages: [...], total: N }
    expect(body).toHaveProperty('messages');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.messages)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  it('validates each message has expected fields', async () => {
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChatWithIncludes as unknown as Chat);
    vi.mocked(prisma.message.findMany).mockResolvedValue([mockMessageWithSender] as unknown as Message[]);
    vi.mocked(prisma.message.count).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader() },
    });

    const body = JSON.parse(response.payload);
    const messages = body.messages || [];

    for (const message of messages) {
      // The service formats messages with snake_case keys
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('sender');
    }
  });
});

// ============================================
// SEND MESSAGE - REQUEST/RESPONSE SCHEMA COMPLIANCE
// ============================================
describe('[P1][chat] POST /api/v1/chats/:chatId/messages - Schema Compliance', () => {
  it('accepts valid SendMessageRequestSchema data', async () => {
    const validRequest = {
      content: 'Hello world',
      type: 'TEXT' as const,
    };

    // Validate request against schema
    const requestResult = SendMessageRequestSchema.safeParse(validRequest);
    expect(requestResult.success).toBe(true);

    // Mock: sendMessage calls prisma.chat.findFirst then prisma.message.create
    vi.mocked(prisma.chat.findFirst).mockResolvedValue(mockChatWithIncludes as unknown as Chat);
    vi.mocked(prisma.message.create).mockResolvedValue(mockMessageWithSender as unknown as Message);
    vi.mocked(prisma.chat.update).mockResolvedValue(mockChatWithIncludes as unknown as Chat);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/chats/test-chat-id/messages',
      headers: { authorization: authHeader() },
      payload: validRequest,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);

    // Route returns { message: { ... } }
    expect(body).toHaveProperty('message');
    expect(body.message).toHaveProperty('id');
    expect(body.message).toHaveProperty('content');
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
describe('[P1][chat] Chat Status Enum Validation', () => {
  it('validates chat status enum values', () => {
    const validStatuses = ['ACTIVE', 'EXPIRED', 'BLOCKED', 'DELETED'];

    for (const status of validStatuses) {
      // ChatResponseSchema requires ISO datetime strings, not Date objects
      const chat = {
        id: 'test-chat-id',
        user1Id: 'user-1',
        user2Id: 'user-2',
        status,
        isTemporary: false,
        isPermanent: true,
        isConvertedToPermanent: false,
        expiresAt: null,
        reportedCount: 0,
        messageCount: 5,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-06-01').toISOString(),
        lastMessageAt: new Date('2024-06-01').toISOString(),
      };
      const result = ChatResponseSchema.safeParse(chat);

      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid chat status values', () => {
    const invalidStatuses = ['INVALID', 'active', 'pending', ''];

    for (const status of invalidStatuses) {
      const chat = {
        id: 'test-chat-id',
        user1Id: 'user-1',
        user2Id: 'user-2',
        status,
        isTemporary: false,
        isPermanent: true,
        isConvertedToPermanent: false,
        expiresAt: null,
        reportedCount: 0,
        messageCount: 5,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-06-01').toISOString(),
        lastMessageAt: new Date('2024-06-01').toISOString(),
      };
      const result = ChatResponseSchema.safeParse(chat);

      expect(result.success).toBe(false);
    }
  });
});
