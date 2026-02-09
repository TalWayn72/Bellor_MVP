import 'dotenv/config';

// Initialize Sentry FIRST, before any other imports
// This ensures all errors are captured, even during module loading
import { initSentry } from './config/sentry.config.js';
initSentry();

import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { setupWebSocket, stopStaleSocketCleanup } from './websocket/index.js';
import type { Server as SocketIOServer } from 'socket.io';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { startBackgroundJobs, stopBackgroundJobs } from './jobs/index.js';
import { registerSecurityMiddleware } from './middleware/security.middleware.js';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { logger } from './lib/logger.js';
import { AppError } from './lib/app-error.js';
import { metrics, promClient, startMemoryMetricsCollection, stopMemoryMetricsCollection } from './lib/metrics.js';
import { memoryMonitor } from './lib/memory-monitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined
  }
});

// Middleware
await app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
});

await app.register(rateLimit, {
  max: env.NODE_ENV === 'development' ? 1000 : 100,
  timeWindow: '1 minute',
  redis,
});

// File upload handling (reduced default limit, per-endpoint overrides)
await app.register(multipart, {
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB default (per-endpoint can override)
    files: 1, // 1 file per request by default
    fieldSize: 1 * 1024 * 1024, // 1MB for non-file fields
  },
});

// Static file serving for local uploads (development)
await app.register(fastifyStatic, {
  root: path.join(__dirname, '../public/uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});

// API Documentation (Swagger/OpenAPI)
await app.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Bellor API',
      description: 'Dating app API - Missions, Matching, Chat, Stories',
      version: '1.0.0',
    },
    servers: [
      { url: `http://localhost:${env.PORT}`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Chats', description: 'Chat and messaging' },
      { name: 'Missions', description: 'Daily missions and challenges' },
      { name: 'Responses', description: 'Mission responses' },
      { name: 'Likes', description: 'User likes and matching' },
      { name: 'Follows', description: 'Follow system' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Stories', description: 'User stories' },
      { name: 'Achievements', description: 'Achievements and badges' },
      { name: 'Health', description: 'Service health checks' },
    ],
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});

// Register security middleware (input sanitization, headers, request validation)
await registerSecurityMiddleware(app);

// Register logging middleware (detailed request/response logging)
await loggingMiddleware(app);
logger.info('APP', 'Bellor API starting', { nodeEnv: env.NODE_ENV, port: env.PORT });

// Global error handler
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

// Health checks
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));

app.get('/health/ready', async (_req, reply) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
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

  // Format bytes to MB
  const toMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  // Format uptime
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeFormatted = `${hours}h ${minutes}m`;

  // Determine status based on heap usage thresholds
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

// Prometheus metrics endpoint (prom-client)
// Tracks: default Node.js metrics + custom business metrics (HTTP duration, chat, matches, etc.)
app.get('/metrics', async (_req, reply) => {
  reply.header('Content-Type', promClient.register.contentType);
  return promClient.register.metrics();
});

// Track HTTP request duration via prom-client histogram
app.addHook('onResponse', (request, reply, done) => {
  metrics.httpRequestDuration.observe(
    { method: request.method, route: request.routeOptions?.url || request.url, status: reply.statusCode },
    reply.elapsedTime / 1000
  );
  done();
});

// Register API routes
await app.register(import('./routes/v1/index.js'), { prefix: '/api/v1' });

// Setup WebSocket server
// Note: WebSocket server will be initialized in the start function after HTTP server is ready
let io: SocketIOServer | null = null;

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down gracefully...`);

  try {
    // Stop background jobs
    stopBackgroundJobs();
    app.log.info('Background jobs stopped');

    // Stop memory monitoring
    memoryMonitor.stop();
    stopMemoryMetricsCollection();
    app.log.info('Memory monitoring stopped');

    // Stop WebSocket cleanup interval
    stopStaleSocketCleanup();

    // Close WebSocket server
    if (io) {
      io.close();
      app.log.info('WebSocket server closed');
    }

    await app.close();
    await prisma.$disconnect();
    await redis.quit();

    app.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    app.log.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST
    });

    // Setup WebSocket server after HTTP server is started
    io = setupWebSocket(app.server);

    // Start background jobs (cleanup, notifications, etc.)
    startBackgroundJobs();

    // Start memory monitoring
    startMemoryMetricsCollection();
    memoryMonitor.start();

    app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`WebSocket server initialized`);
    app.log.info(`Background jobs started`);
    app.log.info(`Memory monitoring started`);
    app.log.info(`Environment: ${env.NODE_ENV}`);
    app.log.info(`Sentry: ${env.SENTRY_DSN ? 'enabled' : 'disabled'}`);
  } catch (error) {
    app.log.error(error);
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
};

start();

export { app, io };
