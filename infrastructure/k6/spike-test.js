/**
 * Bellor API - Spike Test
 * Simulates sudden traffic spikes to test system resilience
 * Tests how the system handles burst load and recovers afterward
 *
 * Run: k6 run spike-test.js
 * Or:  k6 run --env API_URL=http://your-server:3000 spike-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const spikeRecovery = new Trend('spike_recovery_duration');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '20s', target: 10 },   // Normal baseline
    { duration: '10s', target: 10 },   // Sustain normal
    { duration: '5s', target: 300 },   // SPIKE! Sudden burst
    { duration: '30s', target: 300 },  // Sustain spike
    { duration: '5s', target: 10 },    // Rapid drop
    { duration: '30s', target: 10 },   // Recovery period
    { duration: '5s', target: 500 },   // SPIKE! Even bigger
    { duration: '20s', target: 500 },  // Sustain second spike
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],     // Relaxed during spikes
    http_req_failed: ['rate<0.15'],        // Allow some errors during spike
    errors: ['rate<0.15'],
    spike_recovery_duration: ['p(95)<500'], // Recovery should be fast
  },
};

export function setup() {
  const timestamp = Date.now();
  const testUser = {
    email: `spike-${timestamp}@test.bellor.com`,
    password: 'SpikeTest123!@#',
    firstName: 'Spike',
    lastName: 'Tester',
    birthDate: '1995-06-15',
    gender: 'MALE',
  };

  let res = http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = null;
  if (res.status === 201 || res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      token = body.data?.accessToken || body.accessToken;
    } catch (e) { /* ignore */ }
  }

  if (!token) {
    res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    try {
      const body = JSON.parse(res.body);
      token = body.data?.accessToken || body.accessToken;
    } catch (e) { /* ignore */ }
  }

  return { token, baseUrl: BASE_URL };
}

export default function (data) {
  const headers = data.token
    ? { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  // Mix of light and heavy endpoints to simulate realistic traffic

  // Health (lightweight)
  group('Health', () => {
    const res = http.get(`${data.baseUrl}/health`);
    const success = check(res, { 'health ok': (r) => r.status === 200 });
    errorRate.add(!success);
    totalRequests.add(1);
  });

  sleep(0.1);

  if (!data.token) {
    sleep(0.5);
    return;
  }

  // Randomly pick an endpoint group to simulate varied traffic
  const scenario = Math.random();

  if (scenario < 0.25) {
    // Auth check (25%)
    group('Auth Check', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/auth/me`, { headers });
      apiDuration.add(Date.now() - start);
      spikeRecovery.add(Date.now() - start);

      const success = check(res, { 'auth/me ok': (r) => r.status === 200 });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  } else if (scenario < 0.45) {
    // Users list (20%)
    group('Users List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/users?limit=10`, { headers });
      apiDuration.add(Date.now() - start);
      spikeRecovery.add(Date.now() - start);

      const success = check(res, { 'users ok': (r) => r.status === 200 });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  } else if (scenario < 0.60) {
    // Missions today (15%)
    group('Missions Today', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/missions/today`, { headers });
      apiDuration.add(Date.now() - start);
      spikeRecovery.add(Date.now() - start);

      const success = check(res, {
        'missions ok': (r) => r.status === 200 || r.status === 404,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  } else if (scenario < 0.75) {
    // Chats (15%)
    group('Chats List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/chats`, { headers });
      apiDuration.add(Date.now() - start);
      spikeRecovery.add(Date.now() - start);

      const success = check(res, { 'chats ok': (r) => r.status === 200 });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  } else if (scenario < 0.85) {
    // Notifications (10%)
    group('Notifications', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/notifications/unread-count`, { headers });
      apiDuration.add(Date.now() - start);
      spikeRecovery.add(Date.now() - start);

      const success = check(res, { 'notif ok': (r) => r.status === 200 });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  } else if (scenario < 0.95) {
    // Stories feed (10%)
    group('Stories Feed', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/stories/feed`, { headers });
      apiDuration.add(Date.now() - start);
      spikeRecovery.add(Date.now() - start);

      const success = check(res, { 'stories ok': (r) => r.status === 200 });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  } else {
    // Achievements (5%)
    group('Achievements', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/achievements`, { headers });
      apiDuration.add(Date.now() - start);
      spikeRecovery.add(Date.now() - start);

      const success = check(res, { 'achievements ok': (r) => r.status === 200 });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  }

  sleep(0.1 + Math.random() * 0.3);
}

export function handleSummary(data) {
  return {
    'spike-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}
