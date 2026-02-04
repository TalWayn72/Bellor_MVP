// ==========================================================
// Bellor MVP - k6 Smoke Load Test
// ==========================================================
// This test validates basic API functionality under load
// Usage: k6 run --vus 10 --duration 30s smoke-test.js
// ==========================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const authDuration = new Trend('auth_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp up to 10 users
    { duration: '30s', target: 10 },   // Stay at 10 users
    { duration: '10s', target: 50 },   // Spike to 50 users
    { duration: '20s', target: 50 },   // Stay at 50 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],     // Less than 10% of requests can fail
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test user for authentication
const testUser = {
  email: `loadtest-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  firstName: 'Load',
  lastName: 'Test',
};

let authToken = null;

// Setup: Register a test user
export function setup() {
  const registerRes = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      ...testUser,
      gender: 'OTHER',
      birthDate: '1990-01-01',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (registerRes.status === 201 || registerRes.status === 409) {
    // User created or already exists, try to login
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      return { token: body.accessToken };
    }
  }

  return { token: null };
}

export default function (data) {
  const token = data.token;

  // Test 1: Health Check
  group('Health Check', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/health`);
    healthCheckDuration.add(Date.now() - start);

    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check has ok status': (r) => JSON.parse(r.body).status === 'ok',
    });

    errorRate.add(!success);
  });

  sleep(0.5);

  // Test 2: Ready Check
  group('Ready Check', () => {
    const res = http.get(`${BASE_URL}/health/ready`);

    const success = check(res, {
      'ready check status is 200': (r) => r.status === 200,
      'database is connected': (r) => JSON.parse(r.body).checks?.database === 'ok',
      'redis is connected': (r) => JSON.parse(r.body).checks?.redis === 'ok',
    });

    errorRate.add(!success);
  });

  sleep(0.5);

  // Test 3: Authentication (if token available)
  if (token) {
    group('Authenticated Requests', () => {
      const start = Date.now();

      // Get current user
      const meRes = http.get(`${BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      authDuration.add(Date.now() - start);

      const success = check(meRes, {
        'get user status is 200': (r) => r.status === 200,
        'user has id': (r) => JSON.parse(r.body).user?.id !== undefined,
      });

      errorRate.add(!success);

      sleep(0.5);

      // Get users list
      const usersRes = http.get(`${BASE_URL}/api/v1/users?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      check(usersRes, {
        'get users status is 200': (r) => r.status === 200,
        'users response has array': (r) => Array.isArray(JSON.parse(r.body).users),
      });
    });
  }

  sleep(1);
}

// Teardown: Log summary
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Token available: ${data.token ? 'yes' : 'no'}`);
}

// Handle summary output
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}

// Text summary helper
function textSummary(data, options) {
  const { metrics } = data;
  let output = '\n';
  output += '=== Load Test Results ===\n\n';

  if (metrics.http_req_duration) {
    output += `HTTP Request Duration:\n`;
    output += `  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    output += `  p95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    output += `  max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }

  if (metrics.http_reqs) {
    output += `Total Requests: ${metrics.http_reqs.values.count}\n`;
    output += `Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}\n\n`;
  }

  if (metrics.http_req_failed) {
    output += `Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }

  return output;
}
