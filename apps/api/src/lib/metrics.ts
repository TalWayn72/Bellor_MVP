import client from 'prom-client';

// Enable default metrics
client.collectDefaultMetrics({ prefix: 'bellor_' });

// Custom business metrics
export const metrics = {
  httpRequestDuration: new client.Histogram({
    name: 'bellor_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  }),
  chatMessagesSent: new client.Counter({
    name: 'bellor_chat_messages_total',
    help: 'Total chat messages sent',
    labelNames: ['type'],
  }),
  matchesCreated: new client.Counter({
    name: 'bellor_matches_total',
    help: 'Total matches created',
    labelNames: ['type'],
  }),
  userRegistrations: new client.Counter({
    name: 'bellor_user_registrations_total',
    help: 'Total user registrations',
  }),
  activeWebsockets: new client.Gauge({
    name: 'bellor_websocket_connections_active',
    help: 'Number of active WebSocket connections',
  }),
  paymentAttempts: new client.Counter({
    name: 'bellor_payment_attempts_total',
    help: 'Total payment attempts',
    labelNames: ['status'],
  }),
  // Memory metrics
  memoryHeapUsed: new client.Gauge({
    name: 'bellor_memory_heap_used_bytes',
    help: 'Memory heap used in bytes',
  }),
  memoryHeapTotal: new client.Gauge({
    name: 'bellor_memory_heap_total_bytes',
    help: 'Memory heap total in bytes',
  }),
  memoryRss: new client.Gauge({
    name: 'bellor_memory_rss_bytes',
    help: 'Resident Set Size (total memory allocated) in bytes',
  }),
  memoryExternal: new client.Gauge({
    name: 'bellor_memory_external_bytes',
    help: 'Memory used by C++ objects bound to JavaScript in bytes',
  }),
  memoryArrayBuffers: new client.Gauge({
    name: 'bellor_memory_array_buffers_bytes',
    help: 'Memory allocated for ArrayBuffers and SharedArrayBuffers in bytes',
  }),
  gcDuration: new client.Histogram({
    name: 'bellor_gc_duration_seconds',
    help: 'Garbage collection duration in seconds',
    labelNames: ['kind'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2],
  }),
};

export { client as promClient };

// Update memory metrics every 15 seconds
let memoryMetricsInterval: NodeJS.Timeout | null = null;

function updateMemoryMetrics(): void {
  const memUsage = process.memoryUsage();
  metrics.memoryHeapUsed.set(memUsage.heapUsed);
  metrics.memoryHeapTotal.set(memUsage.heapTotal);
  metrics.memoryRss.set(memUsage.rss);
  metrics.memoryExternal.set(memUsage.external);
  metrics.memoryArrayBuffers.set(memUsage.arrayBuffers);
}

export function startMemoryMetricsCollection(): void {
  if (memoryMetricsInterval) return;
  updateMemoryMetrics(); // Initial update
  memoryMetricsInterval = setInterval(updateMemoryMetrics, 15000);
}

export function stopMemoryMetricsCollection(): void {
  if (memoryMetricsInterval) {
    clearInterval(memoryMetricsInterval);
    memoryMetricsInterval = null;
  }
}
