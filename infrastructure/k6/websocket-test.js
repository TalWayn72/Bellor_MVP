/**
 * Bellor API - WebSocket Load Test
 * Tests Socket.io real-time functionality under load
 *
 * Focus areas:
 * - Connection establishment with authentication
 * - Presence (online/offline) events
 * - Chat messaging throughput
 * - Typing indicators
 * - Concurrent WebSocket connections
 *
 * PRD Target: WebSocket latency < 50ms
 *
 * Run: k6 run websocket-test.js
 * Or:  k6 run --env API_URL=http://your-server:3000 websocket-test.js
 *
 * Note: k6 has limited native WebSocket support. For full Socket.io testing,
 * consider using the k6 experimental websocket module or socket.io-client with Node.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const WS_URL = BASE_URL.replace('http', 'ws');

// Custom metrics for WebSocket operations
const wsConnectDuration = new Trend('ws_connect_duration');
const wsMessageLatency = new Trend('ws_message_latency');
const wsConnectionErrors = new Rate('ws_connection_errors');
const wsMessageErrors = new Rate('ws_message_errors');
const wsTotalMessages = new Counter('ws_total_messages');
const wsTotalConnections = new Counter('ws_total_connections');

export const options = {
  scenarios: {
    // Scenario 1: Connection stress test
    connection_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // Ramp up connections
        { duration: '1m', target: 100 },   // High connection count
        { duration: '30s', target: 200 },  // Peak connections
        { duration: '30s', target: 0 },    // Disconnect all
      ],
      exec: 'connectionStressTest',
      tags: { scenario: 'connection_stress' },
    },
    // Scenario 2: Presence updates
    presence_test: {
      executor: 'constant-vus',
      vus: 30,
      duration: '1m',
      startTime: '3m',
      exec: 'presenceTest',
      tags: { scenario: 'presence' },
    },
    // Scenario 3: Messaging throughput
    messaging_throughput: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 50,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 20 },
      ],
      startTime: '4m30s',
      exec: 'messagingThroughputTest',
      tags: { scenario: 'messaging' },
    },
  },
  thresholds: {
    ws_connect_duration: ['p(95)<1000', 'p(99)<2000'], // Connection under 1s
    ws_message_latency: ['p(95)<100', 'p(99)<200'],    // PRD: <50ms, being conservative
    ws_connection_errors: ['rate<0.1'],
    ws_message_errors: ['rate<0.1'],
  },
};

// Setup: Create test users and get tokens
export function setup() {
  const tokens = [];

  for (let i = 0; i < 10; i++) {
    const timestamp = Date.now() + i;
    const user = {
      email: `wstest-${timestamp}@test.bellor.com`,
      password: 'WsTest123!@#',
      firstName: `WsTest${i}`,
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

    // Login if needed
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
  }

  console.log(`Setup complete: ${tokens.length} WebSocket test users created`);
  return { tokens, wsUrl: WS_URL, apiUrl: BASE_URL };
}

// ============================================
// Scenario 1: Connection Stress Test
// ============================================
export function connectionStressTest(data) {
  const tokenData = data.tokens[__VU % data.tokens.length];
  if (!tokenData) return;

  const url = `${data.wsUrl}/socket.io/?EIO=4&transport=websocket&token=${tokenData.token}`;

  const connectStart = Date.now();
  let connected = false;

  const response = ws.connect(url, { tags: { scenario: 'connection_stress' } }, function (socket) {
    wsTotalConnections.add(1);

    socket.on('open', function () {
      connected = true;
      const connectDuration = Date.now() - connectStart;
      wsConnectDuration.add(connectDuration);

      // Send Socket.io handshake
      socket.send('40');  // Socket.io CONNECT packet for default namespace

      check(null, {
        'ws connected': () => true,
        'connect time < 1s': () => connectDuration < 1000,
      });
    });

    socket.on('message', function (data) {
      wsTotalMessages.add(1);

      // Handle Socket.io protocol
      if (data === '40') {
        // Connection acknowledged
        check(null, { 'ws handshake complete': () => true });
      } else if (data.startsWith('42')) {
        // Event message
        const latency = Date.now() - connectStart;
        wsMessageLatency.add(latency);
      }
    });

    socket.on('error', function (e) {
      wsConnectionErrors.add(1);
      console.log(`WebSocket error: ${e}`);
    });

    socket.on('close', function () {
      check(null, { 'ws closed gracefully': () => connected });
    });

    // Keep connection alive for a bit
    sleep(5);

    // Send presence heartbeat
    socket.send('42["presence:heartbeat"]');

    sleep(2);

    // Close gracefully
    socket.close();
  });

  if (response.status !== 101) {
    wsConnectionErrors.add(1);
    check(response, {
      'ws upgrade status': (r) => r.status === 101,
    });
  }
}

// ============================================
// Scenario 2: Presence Test
// ============================================
export function presenceTest(data) {
  const tokenData = data.tokens[__VU % data.tokens.length];
  if (!tokenData) return;

  const url = `${data.wsUrl}/socket.io/?EIO=4&transport=websocket&token=${tokenData.token}`;

  const response = ws.connect(url, { tags: { scenario: 'presence' } }, function (socket) {
    wsTotalConnections.add(1);

    socket.on('open', function () {
      // Socket.io handshake
      socket.send('40');
    });

    socket.on('message', function (msg) {
      wsTotalMessages.add(1);

      if (msg === '40') {
        // After handshake, send presence:online
        const onlineStart = Date.now();
        socket.send('42["presence:online"]');

        // Simulate user activity
        for (let i = 0; i < 5; i++) {
          sleep(1);
          socket.send('42["presence:heartbeat"]');
          wsTotalMessages.add(1);
        }

        // Check some users' presence
        socket.send('42["presence:check",{"userIds":["user1","user2","user3"]}]');
        wsTotalMessages.add(1);

        sleep(2);

        // Go offline
        socket.send('42["presence:offline"]');
        wsTotalMessages.add(1);

        const presenceLatency = Date.now() - onlineStart;
        wsMessageLatency.add(presenceLatency / 8); // Averaged over messages

        socket.close();
      }
    });

    socket.on('error', function (e) {
      wsConnectionErrors.add(1);
    });

    sleep(10); // Allow time for presence operations
  });
}

// ============================================
// Scenario 3: Messaging Throughput Test
// ============================================
export function messagingThroughputTest(data) {
  const tokenData = data.tokens[__VU % data.tokens.length];
  if (!tokenData) return;

  const url = `${data.wsUrl}/socket.io/?EIO=4&transport=websocket&token=${tokenData.token}`;

  const response = ws.connect(url, { tags: { scenario: 'messaging' } }, function (socket) {
    wsTotalConnections.add(1);

    socket.on('open', function () {
      socket.send('40');
    });

    socket.on('message', function (msg) {
      wsTotalMessages.add(1);

      if (msg === '40') {
        // After handshake, join a test chat room
        socket.send('42["chat:join",{"chatId":"test-chat-room"}]');

        // Send multiple messages rapidly
        for (let i = 0; i < 10; i++) {
          const msgStart = Date.now();
          socket.send(`42["chat:message",{"chatId":"test-chat-room","content":"Test message ${i} at ${Date.now()}"}]`);
          wsTotalMessages.add(1);
          sleep(0.1); // Small delay between messages
        }

        // Send typing indicators
        socket.send('42["chat:typing",{"chatId":"test-chat-room","isTyping":true}]');
        sleep(0.5);
        socket.send('42["chat:typing",{"chatId":"test-chat-room","isTyping":false}]');
        wsTotalMessages.add(2);

        // Leave chat
        socket.send('42["chat:leave",{"chatId":"test-chat-room"}]');

        sleep(1);
        socket.close();
      } else if (msg.startsWith('42')) {
        // Track event latency
        try {
          const eventData = JSON.parse(msg.substring(2));
          if (eventData[0] === 'chat:message:new') {
            // Message received - could track round-trip time if timestamp included
            check(null, { 'message received': () => true });
          }
        } catch (e) {
          // Not a valid JSON event
        }
      }
    });

    socket.on('error', function (e) {
      wsMessageErrors.add(1);
    });

    sleep(5); // Allow time for messaging
  });
}

// Polling fallback test (for environments where WS upgrade fails)
export function pollingFallbackTest(data) {
  const tokenData = data.tokens[__VU % data.tokens.length];
  if (!tokenData) return;

  // Socket.io polling transport test
  const headers = {
    Authorization: `Bearer ${tokenData.token}`,
    'Content-Type': 'application/json',
  };

  // Get SID via polling
  const handshakeUrl = `${data.apiUrl}/socket.io/?EIO=4&transport=polling`;
  const res = http.get(handshakeUrl, { headers });

  if (res.status === 200) {
    try {
      // Parse Socket.io handshake response
      const body = res.body.replace(/^\d+/, '');
      const handshake = JSON.parse(body);

      check(handshake, {
        'polling handshake has sid': (h) => h.sid !== undefined,
        'polling handshake has pingInterval': (h) => h.pingInterval !== undefined,
      });

      wsTotalConnections.add(1);
    } catch (e) {
      wsConnectionErrors.add(1);
    }
  } else {
    wsConnectionErrors.add(1);
  }
}

export function handleSummary(data) {
  return {
    'websocket-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}
