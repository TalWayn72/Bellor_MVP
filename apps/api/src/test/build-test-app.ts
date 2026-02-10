/**
 * Test App Builder
 * Creates a Fastify instance configured for integration testing
 * Uses the same routes and middleware as the production app, but without starting the server
 */

import Fastify, { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

/**
 * Build a Fastify app instance for integration testing
 * Registers all API routes with mocked dependencies (Prisma/Redis from setup.ts)
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Disable logging in tests
  });

  // Register API routes (same as production)
  await app.register(import('../routes/v1/index.js'), { prefix: '/api/v1' });

  // Wait for all plugins to load
  await app.ready();

  return app;
}

/**
 * Generate a valid JWT access token for testing authenticated endpoints
 */
export function generateTestToken(
  userId = 'test-user-id',
  email = 'test@example.com',
  options: { isAdmin?: boolean } = {}
): string {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-min-32-chars-for-testing-12345678';
  return jwt.sign(
    { userId, id: userId, email, isAdmin: options.isAdmin ?? false },
    secret,
    { expiresIn: '15m' }
  );
}

/**
 * Generate authorization header for testing
 */
export function authHeader(
  userId = 'test-user-id',
  email = 'test@example.com',
  options: { isAdmin?: boolean } = {}
): string {
  return `Bearer ${generateTestToken(userId, email, options)}`;
}

/**
 * Generate admin authorization header for testing admin-only endpoints
 */
export function adminAuthHeader(
  userId = 'admin-user-id',
  email = 'admin@example.com'
): string {
  return authHeader(userId, email, { isAdmin: true });
}
