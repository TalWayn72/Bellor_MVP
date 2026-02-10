/**
 * Tests for Security Middleware
 * Validates request sanitization, injection blocking, prototype pollution detection,
 * security headers, and request ID generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { registerSecurityMiddleware } from './security.middleware.js';

// Mock security modules
vi.mock('../security/index.js', () => ({
  sanitizeObject: vi.fn(),
  detectInjection: vi.fn(),
  checkPrototypePollution: vi.fn(),
}));

vi.mock('../security/headers.js', () => ({
  applySecurityHeaders: vi.fn(
    async (_request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      return payload;
    }
  ),
}));

vi.mock('../security/logger.js', () => ({
  securityLogger: {
    injectionBlocked: vi.fn(),
  },
}));

vi.mock('../config/security.config.js', () => ({
  REQUEST_LIMITS: {
    defaultBodySize: 1 * 1024 * 1024,
    uploadBodySize: 15 * 1024 * 1024,
    maxJsonDepth: 10,
    maxArrayLength: 100,
    maxFieldCount: 50,
    maxHeaderSize: 8192,
  },
}));

import { sanitizeObject, detectInjection, checkPrototypePollution } from '../security/index.js';
import { applySecurityHeaders } from '../security/headers.js';
import { securityLogger } from '../security/logger.js';

const mockSanitizeObject = vi.mocked(sanitizeObject);
const mockDetectInjection = vi.mocked(detectInjection);
const mockCheckPrototypePollution = vi.mocked(checkPrototypePollution);
const mockApplySecurityHeaders = vi.mocked(applySecurityHeaders);
const mockInjectionBlocked = vi.mocked(securityLogger.injectionBlocked);

// ============================================
// Helper: Create a Fastify test instance with security middleware
// ============================================

async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await registerSecurityMiddleware(app);

  // Test route for body processing
  app.post('/test', async (request) => {
    return { success: true, body: request.body };
  });

  // Test route for query processing
  app.get('/test', async (request) => {
    return { success: true, query: request.query };
  });

  // Test route that returns request ID from headers
  app.get('/request-id', async (request) => {
    return { requestId: request.headers['x-request-id'] };
  });

  await app.ready();
  return app;
}

// ============================================
// Tests
// ============================================

describe('[P0][safety] registerSecurityMiddleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default mock behaviors: allow everything through
    mockCheckPrototypePollution.mockReturnValue(false);
    mockSanitizeObject.mockImplementation((obj: Record<string, unknown>) => ({
      clean: obj,
      blocked: false,
    }));
    mockDetectInjection.mockReturnValue(null);

    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  // ---- Request ID ----

  describe('request ID generation', () => {
    it('should add request ID to requests without one', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/request-id',
      });

      const body = JSON.parse(response.body) as { requestId: string };
      expect(body.requestId).toBeDefined();
      expect(typeof body.requestId).toBe('string');
      expect(body.requestId.length).toBeGreaterThan(0);
    });

    it('should preserve existing request ID', async () => {
      const existingId = 'my-custom-request-id-12345';

      const response = await app.inject({
        method: 'GET',
        url: '/request-id',
        headers: { 'x-request-id': existingId },
      });

      const body = JSON.parse(response.body) as { requestId: string };
      expect(body.requestId).toBe(existingId);
    });

    it('should add request ID to response headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/request-id',
      });

      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('should echo existing request ID back in response headers', async () => {
      const existingId = 'trace-id-abc';

      const response = await app.inject({
        method: 'GET',
        url: '/request-id',
        headers: { 'x-request-id': existingId },
      });

      expect(response.headers['x-request-id']).toBe(existingId);
    });
  });

  // ---- Body Sanitization ----

  describe('request body sanitization', () => {
    it('should sanitize request body containing script tags', async () => {
      const maliciousBody = { name: "<script>alert('xss')</script>" };
      const cleanBody = { name: 'alert(xss)' };

      mockSanitizeObject.mockReturnValue({ clean: cleanBody, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: maliciousBody,
      });

      expect(response.statusCode).toBe(200);
      expect(mockSanitizeObject).toHaveBeenCalledWith(maliciousBody);
      const parsed = JSON.parse(response.body) as { body: Record<string, unknown> };
      expect(parsed.body).toEqual(cleanBody);
    });

    it('should block body with detected injection and return 400', async () => {
      const maliciousBody = { input: "'; DROP TABLE users; --" };

      mockSanitizeObject.mockReturnValue({
        clean: {},
        blocked: true,
        reason: 'sql injection detected',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: maliciousBody,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as { success: boolean; error: { code: string; message: string } };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.message).toBe('Invalid request body');
    });

    it('should log injection events when body is blocked', async () => {
      mockSanitizeObject.mockReturnValue({
        clean: {},
        blocked: true,
        reason: 'xss pattern detected',
      });

      await app.inject({
        method: 'POST',
        url: '/test',
        payload: { field: '<script>evil()</script>' },
      });

      expect(mockInjectionBlocked).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST' }),
        'injection',
        'xss pattern detected'
      );
    });

    it('should replace body with sanitized version on success', async () => {
      const original = { message: '  hello world  ' };
      const sanitized = { message: 'hello world' };

      mockSanitizeObject.mockReturnValue({ clean: sanitized, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: original,
      });

      expect(response.statusCode).toBe(200);
      const parsed = JSON.parse(response.body) as { body: Record<string, unknown> };
      expect(parsed.body).toEqual(sanitized);
    });

    it('should handle requests without body gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(200);
      // sanitizeObject should not be called for GET requests with no body
      expect(mockSanitizeObject).not.toHaveBeenCalled();
    });

    it('should sanitize body with javascript: URLs', async () => {
      const maliciousBody = { link: 'javascript:void(0)' };
      const cleanBody = { link: '' };

      mockSanitizeObject.mockReturnValue({ clean: cleanBody, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: maliciousBody,
      });

      expect(response.statusCode).toBe(200);
      expect(mockSanitizeObject).toHaveBeenCalledWith(maliciousBody);
    });

    it('should sanitize nested objects recursively', async () => {
      const nestedBody = {
        user: { profile: { bio: '<img onerror="evil()">' } },
      };
      const cleanNested = {
        user: { profile: { bio: '' } },
      };

      mockSanitizeObject.mockReturnValue({ clean: cleanNested, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: nestedBody,
      });

      expect(response.statusCode).toBe(200);
      expect(mockSanitizeObject).toHaveBeenCalledWith(nestedBody);
    });

    it('should sanitize arrays in body', async () => {
      const arrayBody = {
        tags: ['<b>safe</b>', '<script>bad</script>', 'normal'],
      };
      const cleanArray = {
        tags: ['safe', '', 'normal'],
      };

      mockSanitizeObject.mockReturnValue({ clean: cleanArray, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: arrayBody,
      });

      expect(response.statusCode).toBe(200);
      expect(mockSanitizeObject).toHaveBeenCalledWith(arrayBody);
      const parsed = JSON.parse(response.body) as { body: Record<string, unknown> };
      expect(parsed.body).toEqual(cleanArray);
    });
  });

  // ---- Prototype Pollution ----

  describe('prototype pollution detection', () => {
    it('should detect and block __proto__ in body', async () => {
      const pollutedBody = { '__proto__': { isAdmin: true } };

      mockCheckPrototypePollution.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: pollutedBody,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as { success: boolean; error: { code: string; message: string } };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.message).toBe('Invalid request body');
    });

    it('should detect and block constructor.prototype pollution', async () => {
      // Fastify's secure JSON parser rejects bodies with `constructor` key at parse level.
      // Verify the request is blocked with a 400 status (Fastify parser-level protection).
      const response = await app.inject({
        method: 'POST',
        url: '/test',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ constructor: { prototype: { isAdmin: true } } }),
      });

      // Fastify returns 400 before our hooks run due to secure-json-parse
      expect(response.statusCode).toBe(400);
    });

    it('should block prototype pollution when body passes parser but contains dangerous keys', async () => {
      // Simulates a case where a dangerous key gets past the JSON parser
      // (e.g., via a non-standard parser or future Fastify change)
      mockCheckPrototypePollution.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { nested: { deep: 'value' } },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as { success: boolean; error: { code: string } };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_INPUT');
    });

    it('should log prototype pollution attempts', async () => {
      mockCheckPrototypePollution.mockReturnValue(true);

      await app.inject({
        method: 'POST',
        url: '/test',
        payload: { '__proto__': { admin: true } },
      });

      expect(mockInjectionBlocked).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST' }),
        'prototypePollution',
        'body'
      );
    });

    it('should allow clean objects through when no pollution detected', async () => {
      const cleanBody = { name: 'John', age: 30 };

      mockCheckPrototypePollution.mockReturnValue(false);
      mockSanitizeObject.mockReturnValue({ clean: cleanBody, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: cleanBody,
      });

      expect(response.statusCode).toBe(200);
      expect(mockCheckPrototypePollution).toHaveBeenCalledWith(cleanBody);
    });
  });

  // ---- Multipart Form Data ----

  describe('multipart form data handling', () => {
    it('should not sanitize multipart form data', async () => {
      // Simulate multipart request by setting content-type header
      // Fastify inject does not support actual multipart uploads,
      // but the hook checks the content-type header
      await app.inject({
        method: 'POST',
        url: '/test',
        headers: { 'content-type': 'multipart/form-data; boundary=----FormBoundary' },
        payload: '------FormBoundary\r\nContent-Disposition: form-data; name="file"\r\n\r\ndata\r\n------FormBoundary--',
      });

      // sanitizeObject should not be called because content-type is multipart
      expect(mockSanitizeObject).not.toHaveBeenCalled();
      expect(mockCheckPrototypePollution).not.toHaveBeenCalled();
    });
  });

  // ---- Query Parameter Sanitization ----

  describe('query parameter sanitization', () => {
    it('should sanitize query parameters', async () => {
      mockDetectInjection.mockReturnValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/test?search=hello',
      });

      expect(response.statusCode).toBe(200);
      expect(mockDetectInjection).toHaveBeenCalledWith('hello');
    });

    it('should block query parameters with injection patterns', async () => {
      mockDetectInjection.mockReturnValue('sql');

      const response = await app.inject({
        method: 'GET',
        url: '/test?search=DROP%20TABLE%20users',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as { success: boolean; error: { code: string; message: string } };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.message).toBe('Invalid query parameter');
    });

    it('should log blocked query injection attempts', async () => {
      mockDetectInjection.mockReturnValue('xss');

      await app.inject({
        method: 'GET',
        url: '/test?name=%3Cscript%3Ealert(1)%3C/script%3E',
      });

      expect(mockInjectionBlocked).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' }),
        'xss',
        'query.name'
      );
    });

    it('should check each query parameter individually', async () => {
      mockDetectInjection.mockReturnValue(null);

      await app.inject({
        method: 'GET',
        url: '/test?a=one&b=two&c=three',
      });

      expect(mockDetectInjection).toHaveBeenCalledTimes(3);
      expect(mockDetectInjection).toHaveBeenCalledWith('one');
      expect(mockDetectInjection).toHaveBeenCalledWith('two');
      expect(mockDetectInjection).toHaveBeenCalledWith('three');
    });

    it('should block on first malicious query parameter found', async () => {
      // First param clean, second param malicious
      mockDetectInjection
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('command');

      const response = await app.inject({
        method: 'GET',
        url: '/test?safe=hello&evil=rm%20-rf',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle requests without query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(200);
      // detectInjection should not be called when there are no query params
      // (empty query object has no entries)
    });
  });

  // ---- Security Headers ----

  describe('security headers', () => {
    it('should add security headers to responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      // applySecurityHeaders hook should have been called
      expect(mockApplySecurityHeaders).toHaveBeenCalled();
      // Headers set by our mock
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should apply security headers on POST responses', async () => {
      mockSanitizeObject.mockReturnValue({ clean: { data: 'ok' }, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { data: 'ok' },
      });

      expect(mockApplySecurityHeaders).toHaveBeenCalled();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should apply security headers even when body is blocked', async () => {
      mockCheckPrototypePollution.mockReturnValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { '__proto__': {} },
      });

      // Headers hook still fires on the 400 response
      expect(response.statusCode).toBe(400);
      // applySecurityHeaders is registered as onSend, so it runs on any response
      expect(mockApplySecurityHeaders).toHaveBeenCalled();
    });
  });

  // ---- Large Payloads ----

  describe('large payload handling', () => {
    it('should handle very large payloads without crashing', async () => {
      const largeBody: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeBody[`field_${i}`] = 'a'.repeat(1000);
      }

      mockSanitizeObject.mockReturnValue({ clean: largeBody, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: largeBody,
      });

      expect(response.statusCode).toBe(200);
      expect(mockSanitizeObject).toHaveBeenCalled();
    });

    it('should handle deeply nested objects without crashing', async () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              value: 'deep data',
            },
          },
        },
      };

      mockSanitizeObject.mockReturnValue({ clean: deepObject, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: deepObject,
      });

      expect(response.statusCode).toBe(200);
      expect(mockSanitizeObject).toHaveBeenCalled();
    });
  });

  // ---- Edge Cases ----

  describe('edge cases', () => {
    it('should handle empty body object', async () => {
      mockSanitizeObject.mockReturnValue({ clean: {}, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: {},
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle body with null values', async () => {
      const bodyWithNull = { name: null, age: 25 };

      mockSanitizeObject.mockReturnValue({
        clean: bodyWithNull as unknown as Record<string, unknown>,
        blocked: false,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: bodyWithNull,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle body with boolean and number values', async () => {
      const mixedBody = { active: true, count: 42, name: 'safe' };

      mockSanitizeObject.mockReturnValue({ clean: mixedBody, blocked: false });

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: mixedBody,
      });

      expect(response.statusCode).toBe(200);
      expect(mockSanitizeObject).toHaveBeenCalledWith(mixedBody);
    });

    it('should call checkPrototypePollution before sanitizeObject', async () => {
      const callOrder: string[] = [];

      mockCheckPrototypePollution.mockImplementation(() => {
        callOrder.push('checkPrototypePollution');
        return false;
      });

      mockSanitizeObject.mockImplementation((obj: Record<string, unknown>) => {
        callOrder.push('sanitizeObject');
        return { clean: obj, blocked: false };
      });

      await app.inject({
        method: 'POST',
        url: '/test',
        payload: { name: 'test' },
      });

      expect(callOrder).toEqual(['checkPrototypePollution', 'sanitizeObject']);
    });

    it('should not call sanitizeObject when prototype pollution is detected', async () => {
      mockCheckPrototypePollution.mockReturnValue(true);

      await app.inject({
        method: 'POST',
        url: '/test',
        payload: { '__proto__': {} },
      });

      expect(mockSanitizeObject).not.toHaveBeenCalled();
    });

    it('should handle concurrent requests independently', async () => {
      mockSanitizeObject.mockImplementation((obj: Record<string, unknown>) => ({
        clean: obj,
        blocked: false,
      }));

      const [response1, response2] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/test',
          payload: { name: 'user1' },
        }),
        app.inject({
          method: 'POST',
          url: '/test',
          payload: { name: 'user2' },
        }),
      ]);

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
    });
  });
});

// ============================================
// Realistic sanitization behavior tests
// (mocks configured to behave like real sanitizers)
// ============================================

describe('[P0][safety] registerSecurityMiddleware (realistic sanitization)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Configure mocks to mimic real sanitization behavior
    mockCheckPrototypePollution.mockImplementation((obj: unknown) => {
      if (obj === null || typeof obj !== 'object') return false;
      const dangerous = ['__proto__', 'constructor', 'prototype'];
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        if (dangerous.includes(key)) return true;
      }
      return false;
    });

    mockSanitizeObject.mockImplementation((obj: Record<string, unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Strip HTML tags like the real sanitizer does
          const stripped = value.replace(/<[^>]*>/g, '').trim();
          clean[key] = stripped;
        } else if (Array.isArray(value)) {
          clean[key] = value.map((item) =>
            typeof item === 'string' ? item.replace(/<[^>]*>/g, '').trim() : item
          );
        } else {
          clean[key] = value;
        }
      }
      return { clean, blocked: false };
    });

    mockDetectInjection.mockImplementation((input: string) => {
      if (/<script[\s>]/i.test(input)) return 'xss';
      if (/javascript\s*:/i.test(input)) return 'xss';
      if (/(\b(SELECT|DROP|DELETE|INSERT)\b.*\b(FROM|TABLE|INTO)\b)/i.test(input)) return 'sql';
      return null;
    });

    mockApplySecurityHeaders.mockImplementation(
      async (_req: FastifyRequest, reply: FastifyReply, payload: unknown) => {
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');
        return payload;
      }
    );

    mockInjectionBlocked.mockImplementation(() => undefined);

    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should strip HTML tags from body fields and return clean data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { name: '<b>bold</b> text' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as { body: { name: string } };
    expect(body.body.name).not.toContain('<b>');
    expect(body.body.name).toContain('bold');
    expect(body.body.name).toContain('text');
  });

  it('should handle __proto__ in body (Fastify strips it at parser level)', async () => {
    // Fastify's secure-json-parse silently strips __proto__ from parsed JSON.
    // The body arrives as {} to our hooks, so prototype pollution check sees a clean object.
    // This tests defense-in-depth: Fastify handles it at parser level.
    const response = await app.inject({
      method: 'POST',
      url: '/test',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ '__proto__': { isAdmin: true } }),
    });

    // Fastify strips __proto__, body becomes {}, request passes through normally
    expect(response.statusCode).toBe(200);
  });

  it('should block body with prototype-like keys via checkPrototypePollution', async () => {
    // Simulates when checkPrototypePollution detects a dangerous pattern
    // that gets past the JSON parser (e.g., nested prototype key)
    mockCheckPrototypePollution.mockReturnValue(true);

    const response = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { data: 'something suspicious' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('should block constructor key with realistic check', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ constructor: { prototype: { isAdmin: true } } }),
    });

    expect(response.statusCode).toBe(400);
  });

  it('should block query params matching XSS patterns', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/test?q=%3Cscript%3Ealert(1)%3C/script%3E',
    });

    expect(response.statusCode).toBe(400);
    expect(mockInjectionBlocked).toHaveBeenCalled();
  });

  it('should block query params matching javascript: protocol', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/test?url=javascript:void(0)',
    });

    expect(response.statusCode).toBe(400);
  });

  it('should allow clean query parameters through', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/test?name=John&city=TelAviv',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should sanitize array elements in body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { tags: ['<em>hello</em>', 'world'] },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as { body: { tags: string[] } };
    expect(body.body.tags[0]).not.toContain('<em>');
    expect(body.body.tags[0]).toContain('hello');
    expect(body.body.tags[1]).toBe('world');
  });

  it('should preserve non-string values in body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { count: 42, active: true, name: 'safe' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as { body: { count: number; active: boolean; name: string } };
    expect(body.body.count).toBe(42);
    expect(body.body.active).toBe(true);
    expect(body.body.name).toBe('safe');
  });
});
