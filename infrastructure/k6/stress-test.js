/**
 * Bellor API - Stress Test
 * Gradually ramps up to 200 VUs to find performance limits
 * PRD Target: p95 < 200ms, 500+ req/s, 1000+ concurrent users
 *
 * Run: k6 run stress-test.js
 * Or:  k6 run --env API_URL=http://your-server:3000 stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const authDuration = new Trend('auth_duration');
const usersDuration = new Trend('users_duration');
const missionsDuration = new Trend('missions_duration');
const chatsDuration = new Trend('chats_duration');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Warm up
    { duration: '1m', target: 50 },    // Moderate load
    { duration: '1m', target: 100 },   // High load
    { duration: '2m', target: 150 },   // Stress level
    { duration: '1m', target: 200 },   // Peak stress
    { duration: '1m', target: 200 },   // Sustain peak
    { duration: '30s', target: 100 },  // Scale down
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
    api_duration: ['p(95)<300'],
    auth_duration: ['p(95)<500'],
    users_duration: ['p(95)<300'],
    missions_duration: ['p(95)<200'],
  },
};

export function setup() {
  const timestamp = Date.now();
  const testUser = {
    email: `stress-${timestamp}@test.bellor.com`,
    password: 'StressTest123!@#',
    firstName: 'Stress',
    lastName: 'Tester',
    birthDate: '1995-06-15',
    gender: 'MALE',
  };

  // Register
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

  // Login if registration returned existing or no token
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

  // Health check (lightweight, always run)
  group('Health Check', () => {
    const res = http.get(`${data.baseUrl}/health`);
    const success = check(res, {
      'health: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
    totalRequests.add(1);
  });

  sleep(0.2);

  if (data.token) {
    // Auth endpoints
    group('Auth - Get Current User', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/auth/me`, { headers });
      authDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'auth/me: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.3);

    // Users endpoints
    group('Users - List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/users?limit=10`, { headers });
      usersDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'users list: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.2);

    // Users - search
    group('Users - Search', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/users/search?q=test`, { headers });
      usersDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'users search: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.2);

    // Missions endpoints
    group('Missions - Today', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/missions/today`, { headers });
      missionsDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'missions today: status 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.2);

    // Missions - list
    group('Missions - List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/missions?limit=10&offset=0`, { headers });
      missionsDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'missions list: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.2);

    // Chats endpoints
    group('Chats - List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/chats`, { headers });
      chatsDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'chats list: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.2);

    // Notifications
    group('Notifications - Unread Count', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/notifications/unread-count`, { headers });
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'unread count: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.2);

    // Achievements
    group('Achievements - List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/achievements`, { headers });
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'achievements: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });

    sleep(0.2);

    // Stories feed
    group('Stories - Feed', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/stories/feed`, { headers });
      apiDuration.add(Date.now() - start);

      const success = check(res, {
        'stories feed: status 200': (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);
    });
  }

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'stress-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}
