/**
 * Logging Middleware
 * Logs all HTTP requests and responses with full details
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger, sanitizeForLog, LogLevel } from '../lib/logger.js';
import { randomUUID } from 'crypto';

// Extend FastifyRequest to include requestId and startTime
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    startTime: number;
  }
}

export async function loggingMiddleware(app: FastifyInstance) {
  // Add request ID and start time to every request
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.requestId = randomUUID();
    request.startTime = Date.now();

    // Log incoming request
    logger.info('HTTP_REQUEST', `→ ${request.method} ${request.url}`, {
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      query: request.query,
      params: request.params,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
        'authorization': request.headers.authorization ? '[PRESENT]' : '[MISSING]',
      },
      userId: (request as any).user?.userId || 'anonymous',
    });
  });

  // Log request body after parsing
  app.addHook('preHandler', async (request: FastifyRequest) => {
    if (request.body && Object.keys(request.body as object).length > 0) {
      logger.debug('HTTP_REQUEST_BODY', `Request body for ${request.requestId}`, {
        requestId: request.requestId,
        body: sanitizeForLog(request.body),
      });
    }
  });

  // Log response
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Date.now() - request.startTime;
    const level = reply.statusCode >= 500 ? 'ERROR' : reply.statusCode >= 400 ? 'WARN' : 'INFO';

    logger.log({
      timestamp: new Date().toISOString(),
      level: level as LogLevel,
      category: 'HTTP_RESPONSE',
      message: `← ${request.method} ${request.url} ${reply.statusCode} (${duration}ms)`,
      request: {
        id: request.requestId,
        method: request.method,
        url: request.url,
        params: request.params as Record<string, string>,
        query: request.query as Record<string, string>,
        body: sanitizeForLog(request.body),
        userId: (request as any).user?.userId,
      },
      response: {
        statusCode: reply.statusCode,
        duration,
      },
    });
  });

  // Log errors with full details
  app.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const duration = Date.now() - request.startTime;

    logger.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category: 'HTTP_ERROR',
      message: `🔴 ERROR: ${request.method} ${request.url} - ${error.message}`,
      request: {
        id: request.requestId,
        method: request.method,
        url: request.url,
        params: request.params as Record<string, string>,
        query: request.query as Record<string, string>,
        body: sanitizeForLog(request.body),
        userId: (request as any).user?.userId,
      },
      response: {
        statusCode: reply.statusCode || 500,
        duration,
      },
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        requestId: request.requestId,
        errorType: error.constructor.name,
      },
    });
  });

  logger.info('MIDDLEWARE', 'Logging middleware initialized');
}

export default loggingMiddleware;
