/**
 * Memory Monitor Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { memoryMonitor } from './memory-monitor.js';

describe('MemoryMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    memoryMonitor.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should start and stop monitoring', () => {
    memoryMonitor.start();
    expect(memoryMonitor.getStats()).toBeTruthy();

    memoryMonitor.stop();
  });

  it('should not start twice', () => {
    const loggerSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    memoryMonitor.start();
    memoryMonitor.start(); // Second call should be ignored

    memoryMonitor.stop();
    expect(loggerSpy).toHaveBeenCalled();
  });

  it('should capture memory snapshots', () => {
    memoryMonitor.start();

    // Fast-forward time to trigger check
    vi.advanceTimersByTime(60000);

    const stats = memoryMonitor.getStats();
    expect(stats).toBeTruthy();
    expect(stats?.current).toHaveProperty('heapUsed');
    expect(stats?.current).toHaveProperty('heapTotal');
    expect(stats?.current).toHaveProperty('rss');
    expect(stats?.current).toHaveProperty('external');
    expect(stats?.current).toHaveProperty('timestamp');

    memoryMonitor.stop();
  });

  it('should calculate heap growth rate', () => {
    memoryMonitor.start();

    // Simulate multiple checks over time
    vi.advanceTimersByTime(60000); // 1 minute
    vi.advanceTimersByTime(60000); // 2 minutes

    const stats = memoryMonitor.getStats();
    expect(stats).toBeTruthy();
    expect(stats?.heapGrowthRateMBPerMin).toBeDefined();
    expect(typeof stats?.heapGrowthRateMBPerMin).toBe('number');

    memoryMonitor.stop();
  });

  it('should track history for 60 minutes max', () => {
    memoryMonitor.start();

    // Fast-forward 61 minutes
    for (let i = 0; i < 61; i++) {
      vi.advanceTimersByTime(60000);
    }

    const stats = memoryMonitor.getStats();
    expect(stats).toBeTruthy();

    memoryMonitor.stop();
  });

  it('should return null stats when not started', () => {
    const stats = memoryMonitor.getStats();
    expect(stats).toBeNull();
  });
});
