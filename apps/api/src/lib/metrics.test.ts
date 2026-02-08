/**
 * Metrics Tests
 * Tests for Prometheus metrics setup and exports
 */

import { describe, it, expect, vi } from 'vitest';

const { collectDefaultMetricsSpy } = vi.hoisted(() => ({
  collectDefaultMetricsSpy: vi.fn(),
}));

vi.mock('prom-client', () => {
  const mockHistogram = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    labels: vi.fn().mockReturnThis(),
  }));
  const mockCounter = vi.fn().mockImplementation(() => ({
    inc: vi.fn(),
    labels: vi.fn().mockReturnThis(),
  }));
  const mockGauge = vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    inc: vi.fn(),
    dec: vi.fn(),
  }));
  return {
    default: {
      collectDefaultMetrics: collectDefaultMetricsSpy,
      Histogram: mockHistogram,
      Counter: mockCounter,
      Gauge: mockGauge,
    },
  };
});

import { metrics, promClient } from './metrics.js';

describe('Metrics', () => {
  // ==================== default metrics (must run first) ====================
  // collectDefaultMetrics is called at module-load time in metrics.ts.
  // The global test setup's afterEach clears mock call history, so this
  // assertion must execute before any afterEach has a chance to clear it.
  describe('default metrics collection', () => {
    it('should call collectDefaultMetrics with bellor_ prefix', () => {
      expect(collectDefaultMetricsSpy).toHaveBeenCalledWith({
        prefix: 'bellor_',
      });
    });
  });

  // ==================== metrics object ====================
  describe('metrics object', () => {
    it('should have httpRequestDuration metric', () => {
      expect(metrics).toHaveProperty('httpRequestDuration');
    });

    it('should have chatMessagesSent metric', () => {
      expect(metrics).toHaveProperty('chatMessagesSent');
    });

    it('should have matchesCreated metric', () => {
      expect(metrics).toHaveProperty('matchesCreated');
    });

    it('should have userRegistrations metric', () => {
      expect(metrics).toHaveProperty('userRegistrations');
    });

    it('should have activeWebsockets metric', () => {
      expect(metrics).toHaveProperty('activeWebsockets');
    });

    it('should have paymentAttempts metric', () => {
      expect(metrics).toHaveProperty('paymentAttempts');
    });

    it('should contain all expected keys', () => {
      const expectedKeys = [
        'httpRequestDuration',
        'chatMessagesSent',
        'matchesCreated',
        'userRegistrations',
        'activeWebsockets',
        'paymentAttempts',
      ];
      expect(Object.keys(metrics)).toEqual(expect.arrayContaining(expectedKeys));
      expect(Object.keys(metrics)).toHaveLength(expectedKeys.length);
    });
  });

  // ==================== promClient export ====================
  describe('promClient export', () => {
    it('should export promClient', () => {
      expect(promClient).toBeDefined();
    });

    it('should have collectDefaultMetrics function', () => {
      expect(promClient.collectDefaultMetrics).toBeDefined();
      expect(typeof promClient.collectDefaultMetrics).toBe('function');
    });
  });
});
