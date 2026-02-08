/**
 * Shared test helpers for Chat Service tests
 *
 * Contains mock data factories and typed prisma mock
 * used across all chat service test files.
 */

import { vi } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { ChatStatus, MessageType } from '@prisma/client';

// Type the mocked prisma
export const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  chat: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  message: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

// Test data factories
export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  firstName: 'Test',
  lastName: 'User',
  profileImages: ['https://example.com/image.jpg'],
  isVerified: true,
  lastActiveAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockChat = (overrides: Record<string, unknown> = {}) => ({
  id: 'chat-1',
  user1Id: 'user-1',
  user2Id: 'user-2',
  status: ChatStatus.ACTIVE,
  isTemporary: true,
  isPermanent: false,
  isConvertedToPermanent: false,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastMessageAt: null,
  user1: createMockUser({ id: 'user-1' }),
  user2: createMockUser({ id: 'user-2', firstName: 'Other' }),
  messages: [],
  ...overrides,
});

export const createMockMessage = (overrides: Record<string, unknown> = {}) => ({
  id: 'message-1',
  chatId: 'chat-1',
  senderId: 'user-1',
  messageType: MessageType.TEXT,
  content: 'Hello!',
  textContent: 'Hello!',
  isRead: false,
  isDeleted: false,
  createdAt: new Date('2024-01-01'),
  readAt: null,
  sender: createMockUser({ id: 'user-1' }),
  ...overrides,
});

export { MessageType };
