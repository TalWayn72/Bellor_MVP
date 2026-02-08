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
};

export { client as promClient };
