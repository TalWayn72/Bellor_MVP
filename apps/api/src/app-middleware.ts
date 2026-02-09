import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { redis } from './lib/redis.js';
import { registerSecurityMiddleware } from './middleware/security.middleware.js';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { logger } from './lib/logger.js';

/**
 * Registers all middleware plugins on the Fastify instance:
 * CORS, Helmet, Rate Limiting, Multipart, Static files, Swagger, Security, Logging
 */
export async function registerMiddleware(app: FastifyInstance, dirname: string): Promise<void> {
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
    root: path.join(dirname, '../public/uploads'),
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
}
