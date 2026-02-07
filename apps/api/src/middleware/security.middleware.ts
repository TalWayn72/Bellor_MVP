/**
 * Security Middleware
 * Global security middleware applied to all requests.
 * Handles input sanitization, injection detection, and request validation.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sanitizeObject, detectInjection, checkPrototypePollution } from '../security/index.js';
import { applySecurityHeaders } from '../security/headers.js';
import { securityLogger } from '../security/logger.js';
import { REQUEST_LIMITS } from '../config/security.config.js';

/**
 * Register all security middleware on a Fastify instance
 */
export async function registerSecurityMiddleware(app: FastifyInstance): Promise<void> {
  // Apply security headers to all responses
  app.addHook('onSend', applySecurityHeaders);

  // Validate and sanitize request body
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only process requests with a body
    if (!request.body || typeof request.body !== 'object') return;

    // Skip file uploads (handled by upload middleware)
    const contentType = request.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) return;

    const body = request.body as Record<string, unknown>;

    // Check for prototype pollution
    if (checkPrototypePollution(body)) {
      securityLogger.injectionBlocked(request, 'prototypePollution', 'body');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid request body',
        },
      });
    }

    // Sanitize string fields in body
    const result = sanitizeObject(body);
    if (result.blocked) {
      securityLogger.injectionBlocked(request, 'injection', result.reason || 'body');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid request body',
        },
      });
    }

    // Replace body with sanitized version
    (request as any).body = result.clean;
  });

  // Validate query parameters
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.query || typeof request.query !== 'object') return;

    const query = request.query as Record<string, unknown>;

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        const injection = detectInjection(value);
        if (injection) {
          securityLogger.injectionBlocked(request, injection, `query.${key}`);
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid query parameter',
            },
          });
        }
      }
    }
  });

  // Request ID generation for tracing
  app.addHook('onRequest', async (request: FastifyRequest) => {
    if (!request.headers['x-request-id']) {
      const crypto = await import('crypto');
      request.headers['x-request-id'] = crypto.randomUUID();
    }
  });

  // Add request ID to response headers
  app.addHook('onSend', async (_request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    const requestId = _request.headers['x-request-id'];
    if (requestId) {
      reply.header('X-Request-ID', requestId);
    }
    return payload;
  });
}
