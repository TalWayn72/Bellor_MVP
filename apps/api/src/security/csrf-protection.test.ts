/**
 * Tests for CSRF Protection
 * Covers: token generation, double-submit cookie pattern, Origin/Referer validation,
 * safe method bypass, JWT bearer token path, error responses.
 *
 * @see security/csrf-protection.ts
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';

// Mock dependencies before importing the module under test
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'production',
    FRONTEND_URL: 'https://bellor.app',
  },
}));

vi.mock('./logger.js', () => ({
  securityLogger: {
    suspiciousActivity: vi.fn(),
  },
}));

import {
  generateCsrfToken,
  setCsrfCookie,
  csrfProtection,
} from './csrf-protection.js';
import { securityLogger } from './logger.js';

const mockSecurityLogger = (securityLogger as Mock);

// ============================================
// Helpers
// ============================================

function createMockReply(): FastifyReply {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setCookie: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
  return reply;
}

function createMockRequest(overrides: Partial<{
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
}>): FastifyRequest {
  return {
    method: overrides.method || 'POST',
    headers: overrides.headers || {},
    body: overrides.body || {},
  } as unknown as FastifyRequest;
}

// ============================================
// generateCsrfToken
// ============================================

describe('[P0][safety] generateCsrfToken', () => {
  it('should return a hex string', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it('should return a 64-character token (32 bytes in hex)', () => {
    const token = generateCsrfToken();
    expect(token.length).toBe(64);
  });

  it('should generate unique tokens on each call', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();
    const token3 = generateCsrfToken();
    expect(token1).not.toBe(token2);
    expect(token2).not.toBe(token3);
    expect(token1).not.toBe(token3);
  });

  it('should generate cryptographically random tokens', () => {
    // Generate many tokens and check for uniqueness
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateCsrfToken());
    }
    expect(tokens.size).toBe(100);
  });
});

// ============================================
// setCsrfCookie
// ============================================

describe('[P0][safety] setCsrfCookie', () => {
  it('should set a cookie named __bellor_csrf on the reply', () => {
    const reply = createMockReply();
    setCsrfCookie(reply);

    expect(reply.setCookie).toHaveBeenCalledWith(
      '__bellor_csrf',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false, // Must be readable by JavaScript
        sameSite: 'strict',
        path: '/',
        maxAge: 3600,
      }),
    );
  });

  it('should return the generated token', () => {
    const reply = createMockReply();
    const token = setCsrfCookie(reply);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should set secure flag in production', () => {
    const reply = createMockReply();
    setCsrfCookie(reply);

    expect(reply.setCookie).toHaveBeenCalledWith(
      '__bellor_csrf',
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
  });

  it('should set httpOnly to false (JS must read the cookie)', () => {
    const reply = createMockReply();
    setCsrfCookie(reply);

    expect(reply.setCookie).toHaveBeenCalledWith(
      '__bellor_csrf',
      expect.any(String),
      expect.objectContaining({ httpOnly: false }),
    );
  });

  it('should set maxAge to 3600 (1 hour)', () => {
    const reply = createMockReply();
    setCsrfCookie(reply);

    expect(reply.setCookie).toHaveBeenCalledWith(
      '__bellor_csrf',
      expect.any(String),
      expect.objectContaining({ maxAge: 3600 }),
    );
  });
});

// ============================================
// csrfProtection middleware
// ============================================

describe('[P0][safety] csrfProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Safe methods ----

  describe('safe methods bypass', () => {
    it('should skip GET requests', async () => {
      const request = createMockRequest({ method: 'GET' });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });

    it('should skip HEAD requests', async () => {
      const request = createMockRequest({ method: 'HEAD' });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
    });

    it('should skip OPTIONS requests', async () => {
      const request = createMockRequest({ method: 'OPTIONS' });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
    });
  });

  // ---- JWT Bearer token path (Origin validation) ----

  describe('JWT Bearer token path', () => {
    it('should allow requests with valid Bearer token and matching Origin', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-jwt-token',
          origin: 'https://bellor.app',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });

    it('should reject Bearer request with wrong Origin', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-jwt-token',
          origin: 'https://evil.com',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'CSRF_VALIDATION_FAILED',
            message: 'Request origin validation failed',
          }),
        }),
      );
    });

    it('should reject Bearer request with no Origin or Referer in production', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should accept Bearer request with valid Referer when no Origin', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-jwt-token',
          referer: 'https://bellor.app/dashboard',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
    });

    it('should reject Bearer request with invalid Referer', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-jwt-token',
          referer: 'https://evil.com/attack',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should log suspicious activity when origin validation fails', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-jwt-token',
          origin: 'https://evil.com',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(mockSecurityLogger.suspiciousActivity).toHaveBeenCalledWith(
        request,
        'CSRF origin validation failed',
      );
    });
  });

  // ---- Cookie-based double-submit pattern ----

  describe('cookie-based double-submit pattern', () => {
    const validToken = 'abc123def456';

    it('should accept when cookie token matches header token', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `__bellor_csrf=${validToken}`,
          'x-csrf-token': validToken,
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
    });

    it('should reject when CSRF cookie is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          'x-csrf-token': validToken,
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'CSRF_VALIDATION_FAILED',
            message: 'CSRF token validation failed',
          }),
        }),
      );
    });

    it('should reject when CSRF header is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `__bellor_csrf=${validToken}`,
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should reject when cookie and header tokens do not match', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `__bellor_csrf=${validToken}`,
          'x-csrf-token': 'wrong-token',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should reject when both cookie and header are missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {},
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should log suspicious activity on token mismatch', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `__bellor_csrf=${validToken}`,
          'x-csrf-token': 'wrong-token',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(mockSecurityLogger.suspiciousActivity).toHaveBeenCalledWith(
        request,
        'CSRF token mismatch',
      );
    });

    it('should handle multiple cookies and extract CSRF cookie correctly', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `session=abc; __bellor_csrf=${validToken}; other=xyz`,
          'x-csrf-token': validToken,
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
    });
  });

  // ---- HTTP methods that need protection ----

  describe('state-changing methods', () => {
    it('should validate CSRF for POST requests', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {},
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      // Should attempt validation and fail (no tokens)
      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should validate CSRF for PUT requests', async () => {
      const request = createMockRequest({
        method: 'PUT',
        headers: {},
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should validate CSRF for DELETE requests', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        headers: {},
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should validate CSRF for PATCH requests', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        headers: {},
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('should handle cookie values containing = signs', async () => {
      const tokenWithEquals = 'token=with=equals';
      const request = createMockRequest({
        method: 'POST',
        headers: {
          cookie: `__bellor_csrf=${tokenWithEquals}`,
          'x-csrf-token': tokenWithEquals,
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
    });

    it('should handle empty cookie header', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          cookie: '',
          'x-csrf-token': 'some-token',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
    });

    it('should allow Origin that starts with FRONTEND_URL', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-jwt-token',
          origin: 'https://bellor.app',
        },
      });
      const reply = createMockReply();

      await csrfProtection(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
    });
  });
});
