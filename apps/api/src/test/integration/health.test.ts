/**
 * Health Endpoints Integration Tests
 * Tests for /health, /health/ready, and /health/memory endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../app.js';

describe('Health Endpoints', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

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
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

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
      const response = await app.inject({
        method: 'GET',
        url: '/health/memory',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Check all required fields exist
      expect(body).toHaveProperty('heapUsed');
      expect(body).toHaveProperty('heapTotal');
      expect(body).toHaveProperty('rss');
      expect(body).toHaveProperty('external');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('status');

      // Validate format: "XX.X MB"
      expect(body.heapUsed).toMatch(/^\d+\.\d+ MB$/);
      expect(body.heapTotal).toMatch(/^\d+\.\d+ MB$/);
      expect(body.rss).toMatch(/^\d+\.\d+ MB$/);
      expect(body.external).toMatch(/^\d+\.\d+ MB$/);

      // Validate uptime format: "Xh Xm"
      expect(body.uptime).toMatch(/^\d+h \d+m$/);

      // Validate status
      expect(['healthy', 'warning', 'critical']).toContain(body.status);
    });

    it('should report healthy status for low memory usage', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/memory',
      });

      const body = JSON.parse(response.body);
      const heapUsedMB = parseFloat(body.heapUsed.replace(' MB', ''));

      // In test environment, memory should be low
      if (heapUsedMB < 200) {
        expect(body.status).toBe('healthy');
      }
    });
  });
});
