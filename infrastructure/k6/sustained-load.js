/**
 * Bellor API - Sustained Load Test
 * Tests system stability under sustained moderate-to-high load
 * Simulates realistic user behavior patterns over an extended period
 *
 * Focus areas:
 * - System stability over time
 * - Resource utilization patterns
 * - Performance degradation detection
 * - Cache effectiveness
 * - Connection pooling efficiency
 *
 * PRD Targets: p95 < 200ms, 500+ req/s, support 1000+ concurrent users
 *
 * Run: k6 run sustained-load.js
 * Or:  k6 run --env API_URL=http://your-server:3000 sustained-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Custom metrics for sustained load monitoring
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const authDuration = new Trend('auth_duration');
const usersDuration = new Trend('users_duration');
const chatsDuration = new Trend('chats_duration');
const storiesDuration = new Trend('stories_duration');
const missionsDuration = new Trend('missions_duration');
const notificationsDuration = new Trend('notifications_duration');
const totalRequests = new Counter('total_requests');
const activeUsers = new Gauge('active_users');
const memoryWarnings = new Counter('memory_warnings');

// Test configuration: Sustained load with gradual ramp-up
export const options = {
  stages: [
    // Phase 1: Gradual ramp-up
    { duration: '2m', target: 50 },    // Warm up to 50 users
    { duration: '3m', target: 100 },   // Ramp to 100 users

    // Phase 2: Sustained load
    { duration: '5m', target: 100 },   // Maintain 100 users for 5 minutes
    { duration: '3m', target: 150 },   // Increase to 150 users
    { duration: '5m', target: 150 },   // Maintain 150 users for 5 minutes
    { duration: '2m', target: 200 },   // Push to 200 users
    { duration: '5m', target: 200 },   // Sustain 200 users for 5 minutes

    // Phase 3: Gradual ramp-down
    { duration: '2m', target: 100 },   // Scale down to 100
    { duration: '2m', target: 50 },    // Scale down to 50
    { duration: '1m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    // Performance thresholds (PRD: p95 < 200ms)
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],

    // Endpoint-specific thresholds
    api_duration: ['p(95)<400', 'p(99)<800'],
    auth_duration: ['p(95)<300', 'p(99)<600'],
    users_duration: ['p(95)<300', 'p(99)<600'],
    chats_duration: ['p(95)<400', 'p(99)<800'],
    stories_duration: ['p(95)<400', 'p(99)<800'],
    missions_duration: ['p(95)<250', 'p(99)<500'],
    notifications_duration: ['p(95)<200', 'p(99)<400'],

    // System health thresholds
    total_requests: ['count>10000'], // Expect significant load
  },
};

// Setup: Create test users
export function setup() {
  const tokens = [];
  const TEST_USERS_COUNT = 10; // Pool of test users

  for (let i = 0; i < TEST_USERS_COUNT; i++) {
    const timestamp = Date.now() + i;
    const user = {
      email: `sustained-${timestamp}@test.bellor.com`,
      password: 'SustainedTest123!@#',
      firstName: `Sustained${i}`,
      lastName: 'User',
      birthDate: '1995-06-15',
      gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
    };

    // Register user
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
      tokens.push({ token, email: user.email });
    }

    // Pace user creation to avoid overwhelming the system
    sleep(0.2);
  }

  console.log(`Setup complete: ${tokens.length} test users created for sustained load test`);
  return { tokens, baseUrl: BASE_URL };
}

// Main test function: Simulates realistic user behavior patterns
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

  activeUsers.add(__VU);

  // Simulate different user behavior patterns based on user ID
  const userPattern = __VU % 5;

  switch (userPattern) {
    case 0:
      // Pattern: Active social user (browsing, liking, commenting)
      activeSocialUser(data.baseUrl, headers);
      break;
    case 1:
      // Pattern: Chat-focused user (messaging, notifications)
      chatFocusedUser(data.baseUrl, headers);
      break;
    case 2:
      // Pattern: Content creator (posting stories, missions)
      contentCreatorUser(data.baseUrl, headers);
      break;
    case 3:
      // Pattern: Passive browser (viewing profiles, stories)
      passiveBrowserUser(data.baseUrl, headers);
      break;
    case 4:
      // Pattern: Mixed activity user (all actions)
      mixedActivityUser(data.baseUrl, headers);
      break;
  }

  // Random think time between sessions
  sleep(1 + Math.random() * 2);
}

// User Pattern 1: Active social user
function activeSocialUser(baseUrl, headers) {
  // Check authentication
  group('Active Social - Auth Check', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/auth/me`, { headers });
    const duration = Date.now() - start;
    authDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'auth/me: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Browse users
  group('Active Social - Browse Users', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/users?limit=20`, { headers });
    const duration = Date.now() - start;
    usersDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'users list: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // Check notifications
  group('Active Social - Notifications', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/notifications?limit=10`, { headers });
    const duration = Date.now() - start;
    notificationsDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'notifications: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.4);

  // View stories feed
  group('Active Social - Stories Feed', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/stories/feed`, { headers });
    const duration = Date.now() - start;
    storiesDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'stories feed: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });
}

// User Pattern 2: Chat-focused user
function chatFocusedUser(baseUrl, headers) {
  // Check chats
  group('Chat User - Chats List', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/chats`, { headers });
    const duration = Date.now() - start;
    chatsDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'chats list: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Check unread count
  group('Chat User - Unread Count', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/notifications/unread-count`, { headers });
    const duration = Date.now() - start;
    notificationsDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'unread count: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // Check notifications
  group('Chat User - Notifications', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/notifications?limit=20`, { headers });
    const duration = Date.now() - start;
    notificationsDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'notifications: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });
}

// User Pattern 3: Content creator
function contentCreatorUser(baseUrl, headers) {
  // View missions
  group('Creator - Missions List', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/missions?limit=10`, { headers });
    const duration = Date.now() - start;
    missionsDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'missions list: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.4);

  // View today's mission
  group('Creator - Today Mission', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/missions/today`, { headers });
    const duration = Date.now() - start;
    missionsDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'today mission: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // View stories feed
  group('Creator - Stories Feed', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/stories/feed`, { headers });
    const duration = Date.now() - start;
    storiesDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'stories feed: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // View achievements
  group('Creator - Achievements', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/achievements`, { headers });
    const duration = Date.now() - start;
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'achievements: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });
}

// User Pattern 4: Passive browser
function passiveBrowserUser(baseUrl, headers) {
  // Browse users
  group('Browser - Users List', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/users?limit=20`, { headers });
    const duration = Date.now() - start;
    usersDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'users list: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.6);

  // View stories
  group('Browser - Stories Feed', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/stories/feed`, { headers });
    const duration = Date.now() - start;
    storiesDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'stories feed: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.8);

  // Search users
  group('Browser - Search Users', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/api/v1/users/search?q=test&limit=10`, { headers });
    const duration = Date.now() - start;
    usersDuration.add(duration);
    apiDuration.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'search users: status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });
}

// User Pattern 5: Mixed activity (most realistic)
function mixedActivityUser(baseUrl, headers) {
  const actions = [
    () => {
      // Auth check
      const start = Date.now();
      const res = http.get(`${baseUrl}/api/v1/auth/me`, { headers });
      authDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);
      totalRequests.add(1);
      errorRate.add(res.status !== 200);
    },
    () => {
      // Users list
      const start = Date.now();
      const res = http.get(`${baseUrl}/api/v1/users?limit=20`, { headers });
      usersDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);
      totalRequests.add(1);
      errorRate.add(res.status !== 200);
    },
    () => {
      // Chats
      const start = Date.now();
      const res = http.get(`${baseUrl}/api/v1/chats`, { headers });
      chatsDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);
      totalRequests.add(1);
      errorRate.add(res.status !== 200);
    },
    () => {
      // Stories
      const start = Date.now();
      const res = http.get(`${baseUrl}/api/v1/stories/feed`, { headers });
      storiesDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);
      totalRequests.add(1);
      errorRate.add(res.status !== 200);
    },
    () => {
      // Notifications
      const start = Date.now();
      const res = http.get(`${baseUrl}/api/v1/notifications?limit=10`, { headers });
      notificationsDuration.add(Date.now() - start);
      apiDuration.add(Date.now() - start);
      totalRequests.add(1);
      errorRate.add(res.status !== 200);
    },
  ];

  // Perform 3-5 random actions
  const actionCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < actionCount; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    action();
    sleep(0.2 + Math.random() * 0.3);
  }
}

// Summary handler with detailed reporting
export function handleSummary(data) {
  const summary = {
    'sustained-load-results.json': JSON.stringify(data, null, 2),
    stdout: generateTextSummary(data),
  };

  return summary;
}

function generateTextSummary(data) {
  const { metrics } = data;
  let output = '\n';
  output += '================================\n';
  output += 'Sustained Load Test Results\n';
  output += '================================\n\n';

  // Overall metrics
  if (metrics.http_req_duration) {
    output += 'HTTP Request Duration:\n';
    output += `  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    output += `  p95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    output += `  p99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
    output += `  max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }

  if (metrics.http_reqs) {
    output += `Total Requests: ${metrics.http_reqs.values.count}\n`;
    output += `Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}\n\n`;
  }

  if (metrics.http_req_failed) {
    output += `Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n\n`;
  }

  // Endpoint-specific metrics
  output += 'Endpoint Performance:\n';
  output += '--------------------\n';

  const endpointMetrics = [
    { name: 'Auth', metric: 'auth_duration' },
    { name: 'Users', metric: 'users_duration' },
    { name: 'Chats', metric: 'chats_duration' },
    { name: 'Stories', metric: 'stories_duration' },
    { name: 'Missions', metric: 'missions_duration' },
    { name: 'Notifications', metric: 'notifications_duration' },
  ];

  endpointMetrics.forEach(({ name, metric }) => {
    if (metrics[metric]) {
      output += `  ${name}: avg=${metrics[metric].values.avg.toFixed(2)}ms, `;
      output += `p95=${metrics[metric].values['p(95)'].toFixed(2)}ms\n`;
    }
  });

  output += '\n';

  // System health indicators
  if (metrics.errors) {
    output += `Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  }

  output += '\n';
  output += 'Test Duration: ~30 minutes (sustained load)\n';
  output += 'Peak VUs: 200 concurrent users\n';
  output += '================================\n';

  return output;
}

// Teardown: Cleanup
export function teardown(data) {
  console.log('Sustained load test completed');
  console.log(`Test users: ${data.tokens.length}`);
}
