/**
 * Fastify Request/Reply Test Factory
 * Mock Fastify request and reply objects for controller/middleware tests
 */
import { vi } from 'vitest';
import { createMockUser } from './user.factory.js';

/** Create a mock Fastify request object */
export const createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  user: createMockUser(),
  ...overrides,
});

/** Create a mock Fastify reply object */
export const createMockReply = () => ({
  code: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
  header: vi.fn().mockReturnThis(),
  status: vi.fn().mockReturnThis(),
});
