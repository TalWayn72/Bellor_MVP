import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { setupWebSocket } from './websocket/index.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { startBackgroundJobs, stopBackgroundJobs } from './jobs/index.js';

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
  contentSecurityPolicy: env.NODE_ENV === 'production',
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  redis,
});

// File upload handling
await app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 5, // Max 5 files per request
  },
});

// Static file serving for local uploads (development)
await app.register(fastifyStatic, {
  root: path.join(__dirname, '../public/uploads'),
  prefix: '/uploads/',
  decorateReply: false,
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

// Register API routes
await app.register(import('./routes/v1/index.js'), { prefix: '/api/v1' });

// Setup WebSocket server
// Note: WebSocket server will be initialized in the start function after HTTP server is ready
let io: any = null;

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
