/**
 * Bellor API - Memory Leak Detection Test
 * Long-running test to detect memory leaks and resource exhaustion
 *
 * Focus areas:
 * - Memory usage patterns over time
 * - Connection pool leaks
 * - Event listener leaks
 * - Resource cleanup verification
 * - Long-lived request handling
 * - Cache memory growth
 *
 * Detection strategy:
 * - Sustained moderate load for extended duration
 * - Monitor response times for degradation
 * - Check error rates over time
 * - Compare early vs late performance metrics
 *
 * Run: k6 run memory-leak-test.js
 * Or:  k6 run --env API_URL=http://your-server:3000 memory-leak-test.js
 *
 * Note: For production leak detection, run this test alongside server
 * memory monitoring (htop, node --inspect, clinic.js, etc.)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Custom metrics for memory leak detection
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');
const earlyRequestDuration = new Trend('early_request_duration'); // First 5 minutes
const lateRequestDuration = new Trend('late_request_duration');   // Last 5 minutes
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');
const timeoutErrors = new Counter('timeout_errors');
const connectionErrors = new Counter('connection_errors');
const currentVUs = new Gauge('current_vus');
const performanceDegradation = new Gauge('performance_degradation');

// Track test phase for metric segmentation
let testPhaseStart = Date.now();

export const options = {
  // Extended duration with moderate constant load
  stages: [
    { duration: '1m', target: 50 },     // Warm up
    { duration: '15m', target: 50 },    // Sustained load phase 1
    { duration: '15m', target: 50 },    // Sustained load phase 2 (total 30m sustained)
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    // Performance should not degrade over time
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],

    // Early vs late comparison (should not differ significantly)
    early_request_duration: ['p(95)<600'],
    late_request_duration: ['p(95)<800'], // Allow 33% degradation max

    // Connection and timeout thresholds
    timeout_errors: ['count<50'],
    connection_errors: ['count<20'],
  },
  // Disable built-in timeouts to detect hanging requests
  noConnectionReuse: false, // Reuse connections to test pooling
  userAgent: 'k6-memory-leak-test/1.0',
};

// Setup: Create test users
export function setup() {
  const tokens = [];
  const TEST_USERS_COUNT = 5;

  for (let i = 0; i < TEST_USERS_COUNT; i++) {
    const timestamp = Date.now() + i;
    const user = {
      email: `memleak-${timestamp}@test.bellor.com`,
      password: 'MemLeakTest123!@#',
      firstName: `MemLeak${i}`,
      lastName: 'User',
      birthDate: '1995-06-15',
      gender: 'MALE',
    };

    let res = http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
    });

    let token = null;
    try {
      const body = JSON.parse(res.body);
      token = body.data?.accessToken || body.accessToken;
    } catch (e) { /* ignore */ }

    if (!token) {
      res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
        email: user.email,
        password: user.password,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

      try {
        const body = JSON.parse(res.body);
        token = body.data?.accessToken || body.accessToken;
      } catch (e) { /* ignore */ }
    }

    if (token) {
      tokens.push({ token, email: user.email });
    }

    sleep(0.2);
  }

  console.log(`Memory leak test setup: ${tokens.length} users created`);
  return {
    tokens,
    baseUrl: BASE_URL,
    testStartTime: Date.now(),
  };
}

// Main test: Execute endpoints that might leak memory
export default function (data) {
  const tokenData = data.tokens[__VU % data.tokens.length];
  if (!tokenData) {
    sleep(1);
    return;
  }

  const headers = {
    Authorization: `Bearer ${tokenData.token}`,
    'Content-Type': 'application/json',
  };

  currentVUs.add(__VU);

  // Determine if we're in early or late phase (for degradation detection)
  const testElapsed = Date.now() - data.testStartTime;
  const isEarlyPhase = testElapsed < 5 * 60 * 1000; // First 5 minutes
  const isLatePhase = testElapsed > 27 * 60 * 1000;  // Last 5 minutes (after 27m of 32m total)

  // Test 1: Repeated authentication (JWT verification, session management)
  group('Memory - Auth Verification', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/auth/me`, { headers });
    const duration = Date.now() - start;

    requestDuration.add(duration);
    if (isEarlyPhase) earlyRequestDuration.add(duration);
    if (isLatePhase) lateRequestDuration.add(duration);

    totalRequests.add(1);

    const success = check(res, {
      'auth/me: status 200': (r) => r.status === 200,
      'auth/me: has user data': (r) => {
        try {
          return JSON.parse(r.body).user !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      failedRequests.add(1);
      errorRate.add(1);
      if (res.status === 0) {
        connectionErrors.add(1);
      }
    }
  });

  sleep(0.2);

  // Test 2: Users list with pagination (DB query, result set handling)
  group('Memory - Users Pagination', () => {
    const page = Math.floor(__ITER % 10); // Cycle through pages
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/users?limit=50&offset=${page * 50}`, { headers });
    const duration = Date.now() - start;

    requestDuration.add(duration);
    if (isEarlyPhase) earlyRequestDuration.add(duration);
    if (isLatePhase) lateRequestDuration.add(duration);

    totalRequests.add(1);

    const success = check(res, {
      'users list: status 200': (r) => r.status === 200,
      'users list: has array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body).users);
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  sleep(0.2);

  // Test 3: Chats list (potentially large data sets, nested objects)
  group('Memory - Chats List', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/chats`, { headers });
    const duration = Date.now() - start;

    requestDuration.add(duration);
    if (isEarlyPhase) earlyRequestDuration.add(duration);
    if (isLatePhase) lateRequestDuration.add(duration);

    totalRequests.add(1);

    const success = check(res, {
      'chats: status 200': (r) => r.status === 200,
    });

    if (!success) {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  sleep(0.3);

  // Test 4: Notifications list (frequent polling, cache invalidation)
  group('Memory - Notifications', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/notifications?limit=50`, { headers });
    const duration = Date.now() - start;

    requestDuration.add(duration);
    if (isEarlyPhase) earlyRequestDuration.add(duration);
    if (isLatePhase) lateRequestDuration.add(duration);

    totalRequests.add(1);

    const success = check(res, {
      'notifications: status 200': (r) => r.status === 200,
    });

    if (!success) {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  sleep(0.2);

  // Test 5: Stories feed (media handling, cache)
  group('Memory - Stories Feed', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/stories/feed`, { headers });
    const duration = Date.now() - start;

    requestDuration.add(duration);
    if (isEarlyPhase) earlyRequestDuration.add(duration);
    if (isLatePhase) lateRequestDuration.add(duration);

    totalRequests.add(1);

    const success = check(res, {
      'stories: status 200': (r) => r.status === 200,
    });

    if (!success) {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  sleep(0.2);

  // Test 6: Search (text indexing, query processing)
  group('Memory - User Search', () => {
    const searchTerms = ['test', 'user', 'mem', 'leak', 'check'];
    const term = searchTerms[__ITER % searchTerms.length];
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/users/search?q=${term}&limit=20`, { headers });
    const duration = Date.now() - start;

    requestDuration.add(duration);
    if (isEarlyPhase) earlyRequestDuration.add(duration);
    if (isLatePhase) lateRequestDuration.add(duration);

    totalRequests.add(1);

    const success = check(res, {
      'search: status 200': (r) => r.status === 200,
    });

    if (!success) {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  sleep(0.3);

  // Test 7: Write operation (creates new records, tests cleanup)
  if (__ITER % 10 === 0) {
    // Every 10th iteration, perform a write
    group('Memory - Update Profile', () => {
      const start = Date.now();
      const res = http.patch(`${data.baseUrl}/api/v1/users/me`, JSON.stringify({
        bio: `Memory test iteration ${__ITER} at ${Date.now()}`,
      }), { headers });
      const duration = Date.now() - start;

      requestDuration.add(duration);
      if (isEarlyPhase) earlyRequestDuration.add(duration);
      if (isLatePhase) lateRequestDuration.add(duration);

      totalRequests.add(1);

      const success = check(res, {
        'update: status 200': (r) => r.status === 200,
      });

      if (!success) {
        failedRequests.add(1);
        errorRate.add(1);
      }
    });

    sleep(0.2);
  }

  // Test 8: Complex join query (tests ORM memory management)
  group('Memory - Followers Query', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/follows/followers`, { headers });
    const duration = Date.now() - start;

    requestDuration.add(duration);
    if (isEarlyPhase) earlyRequestDuration.add(duration);
    if (isLatePhase) lateRequestDuration.add(duration);

    totalRequests.add(1);

    const success = check(res, {
      'followers: status 200': (r) => r.status === 200,
    });

    if (!success) {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  // Think time between iterations
  sleep(0.5 + Math.random() * 0.5);
}

// Summary with memory leak indicators
export function handleSummary(data) {
  const { metrics } = data;

  // Calculate performance degradation
  let degradation = 0;
  if (metrics.early_request_duration && metrics.late_request_duration) {
    const earlyP95 = metrics.early_request_duration.values['p(95)'];
    const lateP95 = metrics.late_request_duration.values['p(95)'];
    degradation = ((lateP95 - earlyP95) / earlyP95) * 100;
  }

  const summary = {
    'memory-leak-results.json': JSON.stringify(data, null, 2),
    stdout: generateMemoryLeakSummary(data, degradation),
  };

  return summary;
}

function generateMemoryLeakSummary(data, degradation) {
  const { metrics } = data;
  let output = '\n';
  output += '========================================\n';
  output += 'Memory Leak Detection Test Results\n';
  output += '========================================\n\n';

  // Overall test info
  output += 'Test Configuration:\n';
  output += '  Duration: ~32 minutes\n';
  output += '  Sustained Load: 50 VUs\n';
  output += '  Strategy: Constant load, monitor degradation\n\n';

  // Request metrics
  if (metrics.http_reqs) {
    output += `Total Requests: ${metrics.http_reqs.values.count}\n`;
    output += `Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}\n\n`;
  }

  // Performance comparison (early vs late)
  output += 'Performance Over Time:\n';
  output += '----------------------\n';

  if (metrics.early_request_duration && metrics.late_request_duration) {
    const earlyAvg = metrics.early_request_duration.values.avg;
    const earlyP95 = metrics.early_request_duration.values['p(95)'];
    const lateAvg = metrics.late_request_duration.values.avg;
    const lateP95 = metrics.late_request_duration.values['p(95)'];

    output += 'Early Phase (first 5 min):\n';
    output += `  avg: ${earlyAvg.toFixed(2)}ms\n`;
    output += `  p95: ${earlyP95.toFixed(2)}ms\n\n`;

    output += 'Late Phase (last 5 min):\n';
    output += `  avg: ${lateAvg.toFixed(2)}ms\n`;
    output += `  p95: ${lateP95.toFixed(2)}ms\n\n`;

    output += `Performance Degradation: ${degradation.toFixed(2)}%\n\n`;

    // Memory leak indicator
    if (degradation > 30) {
      output += '⚠️  WARNING: Significant performance degradation detected!\n';
      output += '   This may indicate a memory leak or resource exhaustion.\n';
      output += '   Recommended actions:\n';
      output += '   - Check server memory usage during test\n';
      output += '   - Review connection pool configuration\n';
      output += '   - Inspect for event listener leaks\n';
      output += '   - Verify resource cleanup in request handlers\n\n';
    } else if (degradation > 15) {
      output += '⚠️  CAUTION: Moderate performance degradation detected.\n';
      output += '   Monitor closely in production.\n\n';
    } else {
      output += '✅ Performance stable over time.\n';
      output += '   No significant memory leak indicators detected.\n\n';
    }
  }

  // Error analysis
  output += 'Error Analysis:\n';
  output += '---------------\n';

  if (metrics.http_req_failed) {
    output += `Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }

  if (metrics.timeout_errors) {
    output += `Timeout Errors: ${metrics.timeout_errors.values.count}\n`;
  }

  if (metrics.connection_errors) {
    output += `Connection Errors: ${metrics.connection_errors.values.count}\n`;
  }

  output += '\n';

  // Overall metrics
  if (metrics.http_req_duration) {
    output += 'Overall HTTP Performance:\n';
    output += '------------------------\n';
    output += `  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    output += `  p95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    output += `  p99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
    output += `  max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }

  output += '========================================\n';
  output += 'Recommendations:\n';
  output += '----------------\n';
  output += '1. Compare these results with server memory monitoring\n';
  output += '2. Run with Node.js --inspect for heap snapshots\n';
  output += '3. Use clinic.js doctor for memory flame graphs\n';
  output += '4. Monitor database connection pool usage\n';
  output += '5. Check Redis memory usage and eviction policies\n';
  output += '========================================\n';

  return output;
}

export function teardown(data) {
  console.log('Memory leak detection test completed');
  console.log(`Total test duration: ~32 minutes`);
  console.log(`Test users: ${data.tokens.length}`);
}
