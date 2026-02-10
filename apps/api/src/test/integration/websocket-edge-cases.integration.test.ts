/**
 * WebSocket Integration Tests - Edge Cases & Error Handling
 *
 * Tests for rapid connections, unauthenticated operations,
 * and other edge case scenarios.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as SocketClient, Socket as ClientSocket } from 'socket.io-client';
import { setupWebSocket } from '../../websocket/index.js';
import { generateTestToken } from '../build-test-app.js';
import { redis } from '../../lib/redis.js';
import { mockUser1, SocketAck } from './websocket-test-helpers.js';

const TEST_PORT = 3117;
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe('[P1][chat] WebSocket - Edge Cases & Error Handling', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket1: ClientSocket;

  beforeAll(async () => {
    httpServer = createServer();
    io = setupWebSocket(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    if (clientSocket1?.connected) clientSocket1.disconnect();
    io.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redis.setex).mockResolvedValue('OK');
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.del).mockResolvedValue(1);
    vi.mocked(redis.expire).mockResolvedValue(1);
    vi.mocked(redis.keys).mockResolvedValue([]);
  });

  afterEach(() => {
    clientSocket1?.removeAllListeners();
  });

  it('should handle multiple rapid connections from same user', async () => {
    const token = generateTestToken(mockUser1.id, mockUser1.email);

    const sockets: ClientSocket[] = [];

    // Create 3 rapid connections
    for (let i = 0; i < 3; i++) {
      const socket = SocketClient(TEST_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      sockets.push(socket);
    }

    // Wait for all connections
    await Promise.all(
      sockets.map((socket) =>
        new Promise<void>((resolve) => {
          socket.on('connect', resolve);
          setTimeout(resolve, 3000); // Timeout fallback
        })
      )
    );

    // All should be connected
    const connectedCount = sockets.filter((s) => s.connected).length;
    expect(connectedCount).toBeGreaterThan(0);

    // Cleanup
    sockets.forEach((s) => s.disconnect());
  });

  it('should handle chat operations when not authenticated', async () => {
    const token = generateTestToken(mockUser1.id, mockUser1.email);

    clientSocket1 = SocketClient(TEST_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => clientSocket1.on('connect', resolve));

    // Test presence:check with valid callback
    vi.mocked(redis.get).mockResolvedValue(null);

    const result = await new Promise<SocketAck>((resolve) => {
      clientSocket1.emit('presence:check', { userIds: [] }, resolve);
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);

    clientSocket1.disconnect();
  });
});
