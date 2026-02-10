/**
 * Token Validation Unit Tests
 *
 * Tests for extractBearerToken, sendAuthError, and requireRole
 * which form the foundation of the authentication/authorization layer.
 *
 * @see token-validation.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockReply } from '../test/setup.js';

// ---------- Mocks ----------

const mockVerifyAccessToken = vi.fn();

vi.mock('../utils/jwt.util.js', () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
}));

vi.mock('../security/logger.js', () => ({
  logSecurityEvent: vi.fn(),
  securityLogger: {
    accessDenied: vi.fn(),
  },
}));

// Import after mocks are set up
import { extractBearerToken, sendAuthError, requireRole } from './token-validation.js';
import { logSecurityEvent } from '../security/logger.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

// ---------- Helpers ----------

function buildRequest(overrides = {}): FastifyRequest {
  return createMockRequest(overrides) as unknown as FastifyRequest;
}

function buildReply(): FastifyReply {
  return createMockReply() as unknown as FastifyReply;
}

// ---------- extractBearerToken ----------

describe('[P0][auth] extractBearerToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract token from "Bearer <token>" format', () => {
    const payload = {
      userId: 'user-1',
      id: 'user-1',
      email: 'test@example.com',
      isAdmin: false,
    };
    mockVerifyAccessToken.mockReturnValue(payload);

    const result = extractBearerToken('Bearer valid-jwt-token');

    expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-jwt-token');
    expect(result).toEqual(payload);
  });

  it('should return null for non-Bearer scheme', () => {
    const result = extractBearerToken('Basic dXNlcjpwYXNz');

    expect(result).toBeNull();
    expect(mockVerifyAccessToken).not.toHaveBeenCalled();
  });

  it('should return null for missing header (undefined)', () => {
    const result = extractBearerToken(undefined);

    expect(result).toBeNull();
    expect(mockVerifyAccessToken).not.toHaveBeenCalled();
  });

  it('should return null for empty token after "Bearer "', () => {
    const result = extractBearerToken('Bearer ');

    expect(result).toBeNull();
    expect(mockVerifyAccessToken).not.toHaveBeenCalled();
  });

  it('should return null when verifyAccessToken throws (expired token)', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid or expired access token');
    });

    const result = extractBearerToken('Bearer expired-token');

    expect(mockVerifyAccessToken).toHaveBeenCalledWith('expired-token');
    expect(result).toBeNull();
  });

  it('should return null when verifyAccessToken throws (malformed token)', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const result = extractBearerToken('Bearer not.a.valid.jwt');

    expect(result).toBeNull();
  });

  it('should return null for empty string header', () => {
    const result = extractBearerToken('');

    expect(result).toBeNull();
    expect(mockVerifyAccessToken).not.toHaveBeenCalled();
  });

  it('should return admin payload when token contains isAdmin flag', () => {
    const adminPayload = {
      userId: 'admin-1',
      id: 'admin-1',
      email: 'admin@example.com',
      isAdmin: true,
    };
    mockVerifyAccessToken.mockReturnValue(adminPayload);

    const result = extractBearerToken('Bearer admin-token');

    expect(result).toEqual(adminPayload);
    expect(result?.isAdmin).toBe(true);
  });
});

// ---------- sendAuthError ----------

describe('[P0][auth] sendAuthError', () => {
  let reply: FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
    reply = buildReply();
  });

  it('should send 401 with correct error format', () => {
    sendAuthError(reply, 'UNAUTHORIZED', 'Authorization required');

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization required',
      },
    });
  });

  it('should send 403 for forbidden errors', () => {
    sendAuthError(reply, 'FORBIDDEN', 'Admin access required', 403);

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  });

  it('should default to 401 status code when not specified', () => {
    sendAuthError(reply, 'INVALID_TOKEN', 'Token expired');

    expect(reply.code).toHaveBeenCalledWith(401);
  });

  it('should log auth.failure security event for 401 errors with request', () => {
    const request = buildRequest({
      url: '/api/v1/protected',
      method: 'GET',
    });

    sendAuthError(reply, 'UNAUTHORIZED', 'Missing token', 401, request);

    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith(
      'auth.failure',
      request,
      {
        code: 'UNAUTHORIZED',
        message: 'Missing token',
        statusCode: 401,
      },
    );
  });

  it('should log access.denied security event for 403 errors with request', () => {
    const request = buildRequest({
      url: '/api/v1/admin/users',
      method: 'GET',
    });

    sendAuthError(reply, 'FORBIDDEN', 'Admin only', 403, request);

    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith(
      'access.denied',
      request,
      {
        code: 'FORBIDDEN',
        message: 'Admin only',
        statusCode: 403,
      },
    );
  });

  it('should not log security event when request is not provided', () => {
    sendAuthError(reply, 'UNAUTHORIZED', 'No token');

    expect(vi.mocked(logSecurityEvent)).not.toHaveBeenCalled();
  });

  it('should support custom status codes (e.g. 500)', () => {
    sendAuthError(reply, 'INTERNAL_ERROR', 'Server error', 500);

    expect(reply.code).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error',
      },
    });
  });

  it('should return reply for chaining', () => {
    const result = sendAuthError(reply, 'UNAUTHORIZED', 'Test');

    // reply.code().send() returns the mock reply (via mockReturnThis)
    expect(result).toBeDefined();
  });
});

// ---------- requireRole ----------

describe('[P0][auth] requireRole', () => {
  let reply: FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
    reply = buildReply();
  });

  it('should return a middleware function', () => {
    const middleware = requireRole('ADMIN');

    expect(typeof middleware).toBe('function');
  });

  it('should reject when request.user is not set (401)', async () => {
    const middleware = requireRole('ADMIN');
    const request = buildRequest({ user: undefined });

    await middleware(request, reply);

    // sendAuthError is called directly in requireRole, not through our mock
    // Since requireRole imports sendAuthError from the same module,
    // we verify the reply was called with 401
    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  });

  it('should allow access when user is authenticated (placeholder role check)', async () => {
    const middleware = requireRole('USER');
    const request = buildRequest({
      user: {
        userId: 'user-1',
        id: 'user-1',
        email: 'user@example.com',
        isAdmin: false,
      },
    });

    // Should not throw or call sendAuthError (placeholder implementation)
    await expect(middleware(request, reply)).resolves.toBeUndefined();
  });

  it('should accept multiple allowed roles', () => {
    const middleware = requireRole('ADMIN', 'MODERATOR', 'USER');

    expect(typeof middleware).toBe('function');
  });

  it('should reject null user (401)', async () => {
    const middleware = requireRole('USER');
    const request = buildRequest({ user: null });

    await middleware(request, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
  });
});
