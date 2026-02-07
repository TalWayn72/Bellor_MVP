/**
 * Bellor API - Database Performance Test
 * Tests database-intensive operations under load
 *
 * Focus areas:
 * - Complex queries with joins (users with followers, chats with messages)
 * - Write operations (create/update entities)
 * - Concurrent read/write scenarios
 * - Pagination and large result sets
 * - Aggregation queries
 *
 * PRD Targets: p95 < 200ms, 500+ req/s, support 10K+ concurrent users
 *
 * Run: k6 run db-performance-test.js
 * Or:  k6 run --env API_URL=http://your-server:3000 db-performance-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Custom metrics for database operations
const errorRate = new Rate('errors');
const dbReadDuration = new Trend('db_read_duration');
const dbWriteDuration = new Trend('db_write_duration');
const dbComplexQueryDuration = new Trend('db_complex_query_duration');
const dbPaginationDuration = new Trend('db_pagination_duration');
const dbSearchDuration = new Trend('db_search_duration');
const cacheHitRate = new Gauge('cache_hit_rate');
const totalDbRequests = new Counter('total_db_requests');

// Test scenarios - focusing on database operations
export const options = {
  scenarios: {
    // Scenario 1: Read-heavy workload (typical user browsing)
    read_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 30 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      exec: 'readHeavyWorkload',
      tags: { scenario: 'read_heavy' },
    },
    // Scenario 2: Write-heavy workload (active users creating content)
    write_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '30s', target: 0 },
      ],
      startTime: '2m', // Start after read-heavy scenario
      exec: 'writeHeavyWorkload',
      tags: { scenario: 'write_heavy' },
    },
    // Scenario 3: Mixed read/write (realistic usage)
    mixed_workload: {
      executor: 'constant-vus',
      vus: 40,
      duration: '2m',
      startTime: '4m', // Start after write-heavy scenario
      exec: 'mixedWorkload',
      tags: { scenario: 'mixed' },
    },
    // Scenario 4: Complex queries stress test
    complex_queries: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 50,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 40 },
        { duration: '30s', target: 10 },
      ],
      startTime: '6m',
      exec: 'complexQueriesWorkload',
      tags: { scenario: 'complex_queries' },
    },
  },
  thresholds: {
    // Overall thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],

    // Database-specific thresholds (PRD: p95 < 200ms)
    db_read_duration: ['p(95)<200', 'p(99)<400'],
    db_write_duration: ['p(95)<300', 'p(99)<500'],
    db_complex_query_duration: ['p(95)<400', 'p(99)<800'],
    db_pagination_duration: ['p(95)<250', 'p(99)<500'],
    db_search_duration: ['p(95)<300', 'p(99)<600'],
  },
};

// Test users for different scenarios
let testUserTokens = [];
const TEST_USERS_COUNT = 5;

export function setup() {
  const tokens = [];

  for (let i = 0; i < TEST_USERS_COUNT; i++) {
    const timestamp = Date.now() + i;
    const user = {
      email: `dbtest-${timestamp}@test.bellor.com`,
      password: 'DbTest123!@#',
      firstName: `DbTest${i}`,
      lastName: 'User',
      birthDate: '1995-06-15',
      gender: 'MALE',
    };

    // Register
    let res = http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
    });

    let token = null;
    try {
      const body = JSON.parse(res.body);
      token = body.data?.accessToken || body.accessToken;
    } catch (e) { /* ignore */ }

    // Login if registration didn't return token
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
      tokens.push({ token, userId: user.email });
    }
  }

  console.log(`Setup complete: ${tokens.length} test users created`);
  return { tokens, baseUrl: BASE_URL };
}

// ============================================
// Scenario 1: Read-Heavy Workload
// ============================================
export function readHeavyWorkload(data) {
  const tokenData = data.tokens[__VU % data.tokens.length] || data.tokens[0];
  if (!tokenData) return;

  const headers = {
    Authorization: `Bearer ${tokenData.token}`,
    'Content-Type': 'application/json',
  };

  // Simple read - User profile
  group('DB Read - User Profile', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/auth/me`, { headers });
    const duration = Date.now() - start;
    dbReadDuration.add(duration);
    totalDbRequests.add(1);

    const success = check(res, {
      'profile: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.2);

  // List with pagination - Users
  group('DB Pagination - Users List', () => {
    const page = Math.floor(Math.random() * 5);
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/users?limit=20&offset=${page * 20}`, { headers });
    const duration = Date.now() - start;
    dbPaginationDuration.add(duration);
    totalDbRequests.add(1);

    const success = check(res, {
      'users list: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.2);

  // Missions list (potentially cached)
  group('DB Read - Missions', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/missions?limit=10`, { headers });
    const duration = Date.now() - start;
    dbReadDuration.add(duration);
    totalDbRequests.add(1);

    const success = check(res, {
      'missions: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.2);

  // Achievements (potentially cached)
  group('DB Read - Achievements', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/achievements`, { headers });
    const duration = Date.now() - start;
    dbReadDuration.add(duration);
    totalDbRequests.add(1);

    const success = check(res, {
      'achievements: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);
}

// ============================================
// Scenario 2: Write-Heavy Workload
// ============================================
export function writeHeavyWorkload(data) {
  const tokenData = data.tokens[__VU % data.tokens.length] || data.tokens[0];
  if (!tokenData) return;

  const headers = {
    Authorization: `Bearer ${tokenData.token}`,
    'Content-Type': 'application/json',
  };

  // Update profile (write operation)
  group('DB Write - Update Profile', () => {
    const start = Date.now();
    const res = http.patch(`${data.baseUrl}/api/v1/users/me`, JSON.stringify({
      bio: `Test bio updated at ${Date.now()}`,
    }), { headers });
    const duration = Date.now() - start;
    dbWriteDuration.add(duration);
    totalDbRequests.add(1);

    const success = check(res, {
      'update profile: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Mark notifications as read (batch update)
  group('DB Write - Mark Notifications Read', () => {
    const start = Date.now();
    const res = http.post(`${data.baseUrl}/api/v1/notifications/mark-all-read`, null, { headers });
    const duration = Date.now() - start;
    dbWriteDuration.add(duration);
    totalDbRequests.add(1);

    const success = check(res, {
      'mark read: status 200 or 204': (r) => r.status === 200 || r.status === 204,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Update last active (frequent write)
  group('DB Write - Update Activity', () => {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/v1/auth/me`, { headers });
    const duration = Date.now() - start;
    dbWriteDuration.add(duration);
    totalDbRequests.add(1);

    // The /me endpoint updates lastActiveAt
    const success = check(res, {
      'activity update: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.5);
}

// ============================================
// Scenario 3: Mixed Workload (Realistic)
// ============================================
export function mixedWorkload(data) {
  const tokenData = data.tokens[__VU % data.tokens.length] || data.tokens[0];
  if (!tokenData) return;

  const headers = {
    Authorization: `Bearer ${tokenData.token}`,
    'Content-Type': 'application/json',
  };

  // 70% reads, 30% writes (typical usage pattern)
  const random = Math.random();

  if (random < 0.25) {
    // Read: User list
    group('Mixed - Users List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/users?limit=20`, { headers });
      dbReadDuration.add(Date.now() - start);
      totalDbRequests.add(1);
      errorRate.add(res.status !== 200);
    });
  } else if (random < 0.45) {
    // Read: Chats
    group('Mixed - Chats List', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/chats`, { headers });
      dbReadDuration.add(Date.now() - start);
      totalDbRequests.add(1);
      errorRate.add(res.status !== 200);
    });
  } else if (random < 0.60) {
    // Read: Notifications
    group('Mixed - Notifications', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/notifications?limit=20`, { headers });
      dbReadDuration.add(Date.now() - start);
      totalDbRequests.add(1);
      errorRate.add(res.status !== 200);
    });
  } else if (random < 0.75) {
    // Read: Stories feed
    group('Mixed - Stories Feed', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/stories/feed`, { headers });
      dbReadDuration.add(Date.now() - start);
      totalDbRequests.add(1);
      errorRate.add(res.status !== 200);
    });
  } else if (random < 0.85) {
    // Read: Followers/following (complex join)
    group('Mixed - Followers', () => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}/api/v1/follows/followers`, { headers });
      dbComplexQueryDuration.add(Date.now() - start);
      totalDbRequests.add(1);
      errorRate.add(res.status !== 200);
    });
  } else if (random < 0.92) {
    // Write: Update profile
    group('Mixed - Update Profile', () => {
      const start = Date.now();
      const res = http.patch(`${data.baseUrl}/api/v1/users/me`, JSON.stringify({
        bio: `Active at ${Date.now()}`,
      }), { headers });
      dbWriteDuration.add(Date.now() - start);
      totalDbRequests.add(1);
      errorRate.add(res.status !== 200);
    });
  } else {
    // Write: Mark notifications read
    group('Mixed - Mark Notifications', () => {
      const start = Date.now();
      const res = http.post(`${data.baseUrl}/api/v1/notifications/mark-all-read`, null, { headers });
      dbWriteDuration.add(Date.now() - start);
      totalDbRequests.add(1);
      errorRate.add(!(res.status === 200 || res.status === 204));
    });
  }

  sleep(0.2 + Math.random() * 0.3);
}

// ============================================
// Scenario 4: Complex Queries Workload
// ============================================
export function complexQueriesWorkload(data) {
  const tokenData = data.tokens[__VU % data.tokens.length] || data.tokens[0];
  if (!tokenData) return;

  const headers = {
    Authorization: `Bearer ${tokenData.token}`,
    'Content-Type': 'application/json',
  };

  const queryType = Math.floor(Math.random() * 6);

  switch (queryType) {
    case 0:
      // Search users (text search + filtering)
      group('Complex - User Search', () => {
        const start = Date.now();
        const res = http.get(`${data.baseUrl}/api/v1/users/search?q=test&limit=20`, { headers });
        const duration = Date.now() - start;
        dbSearchDuration.add(duration);
        dbComplexQueryDuration.add(duration);
        totalDbRequests.add(1);
        errorRate.add(res.status !== 200);
      });
      break;

    case 1:
      // Followers with user details (join query)
      group('Complex - Followers With Details', () => {
        const start = Date.now();
        const res = http.get(`${data.baseUrl}/api/v1/follows/followers`, { headers });
        dbComplexQueryDuration.add(Date.now() - start);
        totalDbRequests.add(1);
        errorRate.add(res.status !== 200);
      });
      break;

    case 2:
      // Following with user details (join query)
      group('Complex - Following With Details', () => {
        const start = Date.now();
        const res = http.get(`${data.baseUrl}/api/v1/follows/following`, { headers });
        dbComplexQueryDuration.add(Date.now() - start);
        totalDbRequests.add(1);
        errorRate.add(res.status !== 200);
      });
      break;

    case 3:
      // Chats with last message (join + ordering)
      group('Complex - Chats With Messages', () => {
        const start = Date.now();
        const res = http.get(`${data.baseUrl}/api/v1/chats`, { headers });
        dbComplexQueryDuration.add(Date.now() - start);
        totalDbRequests.add(1);
        errorRate.add(res.status !== 200);
      });
      break;

    case 4:
      // Notifications with pagination (indexed query)
      group('Complex - Notifications Paginated', () => {
        const page = Math.floor(Math.random() * 3);
        const start = Date.now();
        const res = http.get(`${data.baseUrl}/api/v1/notifications?limit=50&offset=${page * 50}`, { headers });
        const duration = Date.now() - start;
        dbPaginationDuration.add(duration);
        dbComplexQueryDuration.add(duration);
        totalDbRequests.add(1);
        errorRate.add(res.status !== 200);
      });
      break;

    case 5:
      // User achievements (join + aggregation potential)
      group('Complex - User Achievements', () => {
        const start = Date.now();
        const res = http.get(`${data.baseUrl}/api/v1/achievements/me`, { headers });
        dbComplexQueryDuration.add(Date.now() - start);
        totalDbRequests.add(1);
        // 200 or 404 is ok (user might not have achievements)
        errorRate.add(!(res.status === 200 || res.status === 404));
      });
      break;
  }

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    'db-performance-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}
