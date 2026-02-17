/** Memory Monitor - Real-time memory tracking with alerts and trend detection */
import { logger } from './logger.js';
import { metrics } from './metrics.js';

interface MemorySnapshot { timestamp: number; heapUsed: number; heapTotal: number; rss: number; external: number; }
interface MemoryStats { current: MemorySnapshot; heapGrowthRateMBPerMin: number; avgHeapUsedLast60Min: number; peakHeapUsedLast60Min: number; }

class MemoryMonitor {
  private static instance: MemoryMonitor;
  private monitorInterval: NodeJS.Timeout | null = null;
  private history: MemorySnapshot[] = [];
  private readonly maxHistorySize = 60;
  private readonly checkIntervalMs = 60000;
  private readonly rssWarningMB = 280;
  private readonly rssGcTriggerMB = 250;
  private gcRuns = 0;
  private constructor() {}
  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  start(): void {
    if (this.monitorInterval) { logger.warn('MEMORY_MONITOR', 'Monitor already running, skipping start'); return; }
    logger.info('MEMORY_MONITOR', 'Starting memory monitor');
    this.checkMemory();
    this.monitorInterval = setInterval(() => this.checkMemory(), this.checkIntervalMs);
  }
  stop(): void {
    if (this.monitorInterval) { clearInterval(this.monitorInterval); this.monitorInterval = null; logger.info('MEMORY_MONITOR', 'Memory monitor stopped'); }
  }

  private captureSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
    };
  }

  private addToHistory(snapshot: MemorySnapshot): void {
    this.history.push(snapshot);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private calculateStats(current: MemorySnapshot): MemoryStats {
    let heapGrowthRateMBPerMin = 0;
    if (this.history.length >= 2) {
      const oldest = this.history[0];
      const minutesPassed = (current.timestamp - oldest.timestamp) / 60000;
      heapGrowthRateMBPerMin = ((current.heapUsed - oldest.heapUsed) / 1024 / 1024) / minutesPassed;
    }
    const heapValues = this.history.map(s => s.heapUsed);
    const avgHeapUsedLast60Min = heapValues.length > 0 ? heapValues.reduce((a, b) => a + b, 0) / heapValues.length : current.heapUsed;
    const peakHeapUsedLast60Min = heapValues.length > 0 ? Math.max(...heapValues) : current.heapUsed;
    return { current, heapGrowthRateMBPerMin, avgHeapUsedLast60Min, peakHeapUsedLast60Min };
  }

  private checkMemory(): void {
    const snapshot = this.captureSnapshot();
    this.addToHistory(snapshot);
    const stats = this.calculateStats(snapshot);
    const heapUsedMB = snapshot.heapUsed / 1024 / 1024;
    const heapTotalMB = snapshot.heapTotal / 1024 / 1024;
    const heapUsagePercent = (snapshot.heapUsed / snapshot.heapTotal) * 100;

    const rssMB = snapshot.rss / 1024 / 1024;

    const memData = { rssMB: rssMB.toFixed(1), heapUsedMB: heapUsedMB.toFixed(1), heapTotalMB: heapTotalMB.toFixed(1), heapUsagePercent: heapUsagePercent.toFixed(1), growthRateMBPerMin: stats.heapGrowthRateMBPerMin.toFixed(2) };

    // RSS absolute threshold checks (critical for 1GB VMs with 300M PM2 limit)
    if (rssMB > this.rssWarningMB) { logger.error('MEMORY_MONITOR', 'CRITICAL: RSS above 280MB', undefined, memData); this.forceGC(); }
    else if (rssMB > this.rssGcTriggerMB) { logger.warn('MEMORY_MONITOR', 'WARNING: RSS above 250MB, triggering GC', memData); this.forceGC(); }

    // Heap percentage threshold checks
    if (heapUsagePercent > 90) { logger.error('MEMORY_MONITOR', 'CRITICAL: Heap usage above 90%', undefined, memData); this.forceGC(); }
    else if (heapUsagePercent > 80) { logger.warn('MEMORY_MONITOR', 'WARNING: Heap usage above 80%', memData); }

    // Log periodic status (every 10 minutes)
    if (this.history.length % 10 === 0) { logger.info('MEMORY_MONITOR', 'Memory status check', { ...memData, gcRuns: this.gcRuns }); }
  }

  private forceGC(): void {
    if (!global.gc) return;
    try {
      const start = process.hrtime.bigint();
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      const duration = Number(process.hrtime.bigint() - start) / 1e9;
      const freedMB = ((before - after) / 1024 / 1024).toFixed(1);
      this.gcRuns++;
      metrics.gcDuration.observe({ kind: 'forced' }, duration);
      logger.info('MEMORY_MONITOR', 'Forced garbage collection', { freedMB, gcRuns: this.gcRuns });
    } catch (error) {
      logger.error('MEMORY_MONITOR', 'Failed to force GC', error instanceof Error ? error : undefined);
    }
  }

  getStats(): MemoryStats | null {
    if (!this.monitorInterval) return null; // Not started
    const current = this.captureSnapshot();
    if (this.history.length === 0) return null;
    return this.calculateStats(current);
  }
}

export const memoryMonitor = MemoryMonitor.getInstance();
