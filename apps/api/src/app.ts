import 'dotenv/config';

// Initialize Sentry FIRST, before any other imports
// This ensures all errors are captured, even during module loading
import { initSentry } from './config/sentry.config.js';
initSentry();

import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import type { Server as SocketIOServer } from 'socket.io';

import { registerMiddleware } from './app-middleware.js';
import { registerErrorHandlers, registerHealthChecks, registerMetrics, registerApiRoutes } from './app-routes.js';
import { registerGracefulShutdown, startServer } from './app-lifecycle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const app = Fastify({
  pluginTimeout: 60000,
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined
  }
});

// Middleware (CORS, Helmet, Rate Limiting, Swagger, etc.)
await registerMiddleware(app, __dirname);

// Error handling (global error handler + process-level handlers)
registerErrorHandlers(app);

// Health checks (/health, /health/ready, /health/memory)
registerHealthChecks(app);

// Prometheus metrics endpoint + HTTP duration tracking
registerMetrics(app);

// API v1 routes
await registerApiRoutes(app);

// WebSocket server (initialized after HTTP server starts)
let io: SocketIOServer | null = null;

// Graceful shutdown handlers (SIGTERM/SIGINT)
registerGracefulShutdown(app, () => io);

// Start server
const start = async () => {
  io = await startServer(app);
};

start();

export { app, io };
