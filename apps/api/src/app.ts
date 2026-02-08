import 'dotenv/config';
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
import { setupWebSocket } from './websocket/index.js';
import type { Server as SocketIOServer } from 'socket.io';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { startBackgroundJobs, stopBackgroundJobs } from './jobs/index.js';
import { registerSecurityMiddleware } from './middleware/security.middleware.js';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { logger } from './lib/logger.js';

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

// Prometheus metrics endpoint (text/plain exposition format)
// Tracks: process uptime, memory usage, request count, active connections
let requestCount = 0;
app.addHook('onRequest', async () => { requestCount++; });

app.get('/metrics', async (_req, reply) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const cpuUsage = process.cpuUsage();

  const lines = [
    '# HELP process_uptime_seconds Total uptime of the Node.js process in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptime.toFixed(2)}`,
    '',
    '# HELP process_resident_memory_bytes Resident memory size in bytes (RSS)',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '',
    '# HELP process_heap_bytes_total Total heap memory in bytes',
    '# TYPE process_heap_bytes_total gauge',
    `process_heap_bytes_total ${mem.heapTotal}`,
    '',
    '# HELP process_heap_bytes_used Used heap memory in bytes',
    '# TYPE process_heap_bytes_used gauge',
    `process_heap_bytes_used ${mem.heapUsed}`,
    '',
    '# HELP process_external_memory_bytes External memory usage in bytes (C++ objects bound to JS)',
    '# TYPE process_external_memory_bytes gauge',
    `process_external_memory_bytes ${mem.external}`,
    '',
    '# HELP http_requests_total Total number of HTTP requests received',
    '# TYPE http_requests_total counter',
    `http_requests_total ${requestCount}`,
    '',
    '# HELP process_cpu_user_microseconds Total user CPU time in microseconds',
    '# TYPE process_cpu_user_microseconds counter',
    `process_cpu_user_microseconds ${cpuUsage.user}`,
    '',
    '# HELP process_cpu_system_microseconds Total system CPU time in microseconds',
    '# TYPE process_cpu_system_microseconds counter',
    `process_cpu_system_microseconds ${cpuUsage.system}`,
    '',
    '# HELP nodejs_active_connections Number of active server connections',
    '# TYPE nodejs_active_connections gauge',
    `nodejs_active_connections ${app.server?.connections ?? 0}`,
    '',
  ];

  return reply
    .type('text/plain; version=0.0.4; charset=utf-8')
    .send(lines.join('\n'));
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

    app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`WebSocket server initialized`);
    app.log.info(`Background jobs started`);
    app.log.info(`Environment: ${env.NODE_ENV}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();

export { app, io };
