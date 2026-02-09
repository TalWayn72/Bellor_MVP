import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';
import type { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import { setupWebSocket, stopStaleSocketCleanup } from './websocket/index.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { startBackgroundJobs, stopBackgroundJobs } from './jobs/index.js';
import { startMemoryMetricsCollection, stopMemoryMetricsCollection } from './lib/metrics.js';
import { memoryMonitor } from './lib/memory-monitor.js';

/**
 * Registers graceful shutdown handlers (SIGTERM/SIGINT).
 * Stops background jobs, memory monitoring, WebSocket server, and closes DB/Redis connections.
 */
export function registerGracefulShutdown(
  app: FastifyInstance,
  getIo: () => SocketIOServer | null,
): void {
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
      const io = getIo();
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
}

/**
 * Starts the HTTP server, WebSocket server, background jobs, and memory monitoring.
 * Returns the SocketIO server instance.
 */
export async function startServer(app: FastifyInstance): Promise<SocketIOServer> {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST
    });

    // Setup WebSocket server after HTTP server is started
    const io = setupWebSocket(app.server);

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

    return io;
  } catch (error) {
    app.log.error(error);
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}
