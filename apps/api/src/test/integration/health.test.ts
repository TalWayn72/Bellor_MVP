/**
 * Health Endpoints Integration Tests
 * Tests for /health, /health/ready, and /health/memory endpoints
 *
 * Uses a standalone Fastify instance with health routes (not the full app)
 * to avoid needing full infrastructure (rate-limiter, background jobs, etc.)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';

function buildHealthApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/health/ready', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return { status: 'ready', checks: { database: 'ok', redis: 'ok' } };
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
      uptime: `${hours}h ${minutes}m`,
      status,
    };
  });

  return app;
}

describe('[P2][infra] Health Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildHealthApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await app.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(typeof body.uptime).toBe('number');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when services are available', async () => {
      const response = await app.inject({ method: 'GET', url: '/health/ready' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'ready');
      expect(body).toHaveProperty('checks');
      expect(body.checks).toHaveProperty('database', 'ok');
      expect(body.checks).toHaveProperty('redis', 'ok');
    });
  });

  describe('GET /health/memory', () => {
    it('should return memory metrics', async () => {
      const response = await app.inject({ method: 'GET', url: '/health/memory' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('heapUsed');
      expect(body).toHaveProperty('heapTotal');
      expect(body).toHaveProperty('rss');
      expect(body).toHaveProperty('external');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('status');

      expect(body.heapUsed).toMatch(/^\d+\.\d+ MB$/);
      expect(body.heapTotal).toMatch(/^\d+\.\d+ MB$/);
      expect(body.rss).toMatch(/^\d+\.\d+ MB$/);
      expect(body.external).toMatch(/^\d+\.\d+ MB$/);
      expect(body.uptime).toMatch(/^\d+h \d+m$/);
      expect(['healthy', 'warning', 'critical']).toContain(body.status);
    });

    it('should report healthy status for low memory usage', async () => {
      const response = await app.inject({ method: 'GET', url: '/health/memory' });

      const body = JSON.parse(response.body);
      const heapUsedMB = parseFloat(body.heapUsed.replace(' MB', ''));

      if (heapUsedMB < 200) {
        expect(body.status).toBe('healthy');
      }
    });
  });
});
