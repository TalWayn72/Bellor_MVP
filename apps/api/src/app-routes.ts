import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { logger } from './lib/logger.js';
import { AppError } from './lib/app-error.js';
import { metrics, promClient } from './lib/metrics.js';

/**
 * Registers the global error handler for the Fastify instance.
 * Handles AppError instances and unexpected errors (reported to Sentry).
 */
export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message, details: error.details, requestId: request.id },
      });
    }

    // Log and report unexpected errors to Sentry
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    logger.error('SYSTEM', 'Unhandled error', errorInstance, { requestId: request.id });

    // Send error to Sentry for production tracking
    Sentry.captureException(errorInstance, {
      contexts: {
        request: {
          method: request.method,
          url: request.url,
          requestId: request.id,
        },
      },
      user: request.user ? { id: request.user.userId } : undefined,
    });

    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId: request.id },
    });
  });

  // Process-level error handlers
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('SYSTEM', 'Unhandled rejection', error);
    Sentry.captureException(error, { tags: { errorType: 'unhandledRejection' } });
  });
  process.on('uncaughtException', (error) => {
    logger.error('SYSTEM', 'Uncaught exception', error);
    Sentry.captureException(error, { tags: { errorType: 'uncaughtException' } });
    process.exit(1);
  });
}

/**
 * Registers health check endpoints:
 *  - GET /health (liveness)
 *  - GET /health/ready (readiness - DB + Redis)
 *  - GET /health/memory (memory stats)
 */
export function registerHealthChecks(app: FastifyInstance): void {
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));

  app.get('/health/ready', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return {
        status: 'ready',
        checks: { database: 'ok', redis: 'ok' }
      };
    } catch (error) {
      return reply.status(503).send({
        status: 'not ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/health/memory', async () => {
    const memUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();
    const toMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeFormatted = `${hours}h ${minutes}m`;

    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    let status: 'healthy' | 'warning' | 'critical';
    if (heapUsedMB >= 500) {
      status = 'critical';
    } else if (heapUsedMB >= 200) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    return {
      heapUsed: toMB(memUsage.heapUsed),
      heapTotal: toMB(memUsage.heapTotal),
      rss: toMB(memUsage.rss),
      external: toMB(memUsage.external),
      uptime: uptimeFormatted,
      status,
    };
  });
}

/**
 * Registers Prometheus metrics endpoint and HTTP duration tracking hook.
 */
export function registerMetrics(app: FastifyInstance): void {
  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', promClient.register.contentType);
    return promClient.register.metrics();
  });

  app.addHook('onResponse', (request, reply, done) => {
    metrics.httpRequestDuration.observe(
      { method: request.method, route: request.routeOptions?.url || request.url, status: reply.statusCode },
      reply.elapsedTime / 1000
    );
    done();
  });
}

/**
 * Registers API v1 routes.
 */
export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(import('./routes/v1/index.js'), { prefix: '/api/v1' });
}
