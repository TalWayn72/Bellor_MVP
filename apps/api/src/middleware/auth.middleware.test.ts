/**
 * Auth Middleware Unit Tests
 *
 * Critical security tests for the authentication middleware layer.
 * Tests authMiddleware, optionalAuthMiddleware, and adminMiddleware
 * which protect ALL API endpoints.
 *
 * @see auth.middleware.ts
 * @see token-validation.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockReply } from '../test/setup.js';

// ---------- Mocks ----------

const mockExtractBearerToken = vi.fn();
const mockSendAuthError = vi.fn();

vi.mock('./token-validation.js', () => ({
  extractBearerToken: (...args: unknown[]) => mockExtractBearerToken(...args),
  sendAuthError: (...args: unknown[]) => mockSendAuthError(...args),
  requireRole: vi.fn(),
}));

vi.mock('../security/logger.js', () => ({
  securityLogger: {
    accessDenied: vi.fn(),
    loginSuccess: vi.fn(),
    loginFailure: vi.fn(),
  },
  logSecurityEvent: vi.fn(),
}));

// Import after mocks are set up
import {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
} from './auth.middleware.js';
import { securityLogger } from '../security/logger.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

// ---------- Helpers ----------

function buildRequest(overrides = {}): FastifyRequest {
  return createMockRequest(overrides) as unknown as FastifyRequest;
}

function buildReply(): FastifyReply {
  return createMockReply() as unknown as FastifyReply;
}

// ---------- authMiddleware ----------

describe('[P0][auth] authMiddleware', () => {
  let reply: FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
    reply = buildReply();
  });

  it('should reject request with no Authorization header (401)', async () => {
    const request = buildRequest({ headers: {} });

    await authMiddleware(request, reply);

    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'UNAUTHORIZED',
      'Authorization header is required',
      401,
      request,
    );
  });

  it('should reject request with non-Bearer scheme (401)', async () => {
    const request = buildRequest({
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });

    await authMiddleware(request, reply);

    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'INVALID_TOKEN_FORMAT',
      'Authorization header must use Bearer scheme',
      401,
      request,
    );
  });

  it('should reject request with empty token after Bearer (401)', async () => {
    const request = buildRequest({
      headers: { authorization: 'Bearer ' },
    });

    await authMiddleware(request, reply);

    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'MISSING_TOKEN',
      'Token is required',
      401,
      request,
    );
  });

  it('should reject request when extractBearerToken returns null (expired/invalid token)', async () => {
    mockExtractBearerToken.mockReturnValue(null);

    const request = buildRequest({
      headers: { authorization: 'Bearer expired-or-invalid-token' },
    });

    await authMiddleware(request, reply);

    expect(mockExtractBearerToken).toHaveBeenCalledWith('Bearer expired-or-invalid-token');
    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'INVALID_TOKEN',
      'Invalid or expired access token',
      401,
      request,
    );
  });

  it('should set request.user for valid token', async () => {
    const payload = {
      userId: 'user-123',
      id: 'user-123',
      email: 'valid@example.com',
      isAdmin: false,
    };
    mockExtractBearerToken.mockReturnValue(payload);

    const request = buildRequest({
      headers: { authorization: 'Bearer valid-jwt-token' },
    });

    await authMiddleware(request, reply);

    expect(request.user).toEqual(payload);
    expect(mockSendAuthError).not.toHaveBeenCalled();
  });

  it('should set request.user with admin flag when token contains isAdmin', async () => {
    const adminPayload = {
      userId: 'admin-1',
      id: 'admin-1',
      email: 'admin@example.com',
      isAdmin: true,
    };
    mockExtractBearerToken.mockReturnValue(adminPayload);

    const request = buildRequest({
      headers: { authorization: 'Bearer admin-jwt-token' },
    });

    await authMiddleware(request, reply);

    expect(request.user).toEqual(adminPayload);
    expect(request.user?.isAdmin).toBe(true);
    expect(mockSendAuthError).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors gracefully (500)', async () => {
    mockExtractBearerToken.mockImplementation(() => {
      throw new Error('Unexpected crash');
    });

    const request = buildRequest({
      headers: { authorization: 'Bearer some-token' },
    });

    await authMiddleware(request, reply);

    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'INTERNAL_SERVER_ERROR',
      'An error occurred during authentication',
      500,
      request,
    );
  });

  it('should not set request.user when token is invalid', async () => {
    mockExtractBearerToken.mockReturnValue(null);

    const request = buildRequest({
      headers: { authorization: 'Bearer bad-token' },
      user: undefined,
    });

    await authMiddleware(request, reply);

    expect(request.user).toBeUndefined();
  });
});

// ---------- optionalAuthMiddleware ----------

describe('[P0][auth] optionalAuthMiddleware', () => {
  let reply: FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
    reply = buildReply();
  });

  it('should set request.user when valid token is provided', async () => {
    const payload = {
      userId: 'user-456',
      id: 'user-456',
      email: 'optional@example.com',
      isAdmin: false,
    };
    mockExtractBearerToken.mockReturnValue(payload);

    const request = buildRequest({
      headers: { authorization: 'Bearer valid-token' },
      user: undefined,
    });

    await optionalAuthMiddleware(request, reply);

    expect(request.user).toEqual(payload);
  });

  it('should NOT throw when no token is provided (continues silently)', async () => {
    mockExtractBearerToken.mockReturnValue(null);

    const request = buildRequest({
      headers: {},
      user: undefined,
    });

    await expect(
      optionalAuthMiddleware(request, reply),
    ).resolves.toBeUndefined();

    expect(request.user).toBeUndefined();
    expect(mockSendAuthError).not.toHaveBeenCalled();
  });

  it('should NOT throw when invalid token is provided (continues silently)', async () => {
    mockExtractBearerToken.mockReturnValue(null);

    const request = buildRequest({
      headers: { authorization: 'Bearer invalid-token' },
      user: undefined,
    });

    await expect(
      optionalAuthMiddleware(request, reply),
    ).resolves.toBeUndefined();

    expect(request.user).toBeUndefined();
    expect(mockSendAuthError).not.toHaveBeenCalled();
  });

  it('should not set request.user when extractBearerToken returns null', async () => {
    mockExtractBearerToken.mockReturnValue(null);

    const request = buildRequest({
      headers: { authorization: 'Bearer expired-token' },
      user: undefined,
    });

    await optionalAuthMiddleware(request, reply);

    expect(request.user).toBeUndefined();
  });

  it('should silently catch exceptions thrown by extractBearerToken', async () => {
    mockExtractBearerToken.mockImplementation(() => {
      throw new Error('Token verification crashed');
    });

    const request = buildRequest({
      headers: { authorization: 'Bearer crash-token' },
      user: undefined,
    });

    await expect(
      optionalAuthMiddleware(request, reply),
    ).resolves.toBeUndefined();

    expect(request.user).toBeUndefined();
    expect(mockSendAuthError).not.toHaveBeenCalled();
  });
});

// ---------- adminMiddleware ----------

describe('[P0][auth] adminMiddleware', () => {
  let reply: FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
    reply = buildReply();
  });

  it('should allow access when request.user.isAdmin is true', async () => {
    const request = buildRequest({
      user: {
        userId: 'admin-1',
        id: 'admin-1',
        email: 'admin@example.com',
        isAdmin: true,
      },
      url: '/api/v1/admin/users',
    });

    await adminMiddleware(request, reply);

    expect(mockSendAuthError).not.toHaveBeenCalled();
  });

  it('should reject when request.user.isAdmin is false (403)', async () => {
    const request = buildRequest({
      user: {
        userId: 'user-1',
        id: 'user-1',
        email: 'user@example.com',
        isAdmin: false,
      },
      url: '/api/v1/admin/users',
    });

    await adminMiddleware(request, reply);

    expect(vi.mocked(securityLogger.accessDenied)).toHaveBeenCalledWith(
      request,
      'admin route: /api/v1/admin/users',
    );
    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'FORBIDDEN',
      'Admin access required',
      403,
      request,
    );
  });

  it('should reject when request.user is not set (401)', async () => {
    const request = buildRequest({ user: undefined });

    await adminMiddleware(request, reply);

    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'UNAUTHORIZED',
      'Authentication required',
      401,
      request,
    );
  });

  it('should reject when request.user is null (401)', async () => {
    const request = buildRequest({ user: null });

    await adminMiddleware(request, reply);

    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'UNAUTHORIZED',
      'Authentication required',
      401,
      request,
    );
  });

  it('should reject when isAdmin is undefined (treats as non-admin)', async () => {
    const request = buildRequest({
      user: {
        userId: 'user-old-token',
        id: 'user-old-token',
        email: 'old@example.com',
        // isAdmin is missing (pre-C7 token)
      },
      url: '/api/v1/admin/dashboard',
    });

    await adminMiddleware(request, reply);

    expect(vi.mocked(securityLogger.accessDenied)).toHaveBeenCalledWith(
      request,
      'admin route: /api/v1/admin/dashboard',
    );
    expect(mockSendAuthError).toHaveBeenCalledWith(
      reply,
      'FORBIDDEN',
      'Admin access required',
      403,
      request,
    );
  });

  it('should not log accessDenied when user is not authenticated', async () => {
    const request = buildRequest({ user: undefined });

    await adminMiddleware(request, reply);

    expect(vi.mocked(securityLogger.accessDenied)).not.toHaveBeenCalled();
  });
});
