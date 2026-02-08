/**
 * WebSocket Integration Tests - Connection & Disconnection
 *
 * Tests for Socket.io connection authentication and disconnection cleanup.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as SocketClient, Socket as ClientSocket } from 'socket.io-client';
import { setupWebSocket } from '../../websocket/index.js';
import { generateTestToken } from '../build-test-app.js';
import { redis } from '../../lib/redis.js';
import { mockUser1, mockUser2 } from './websocket-test-helpers.js';

// Test configuration
const TEST_PORT = 3097;
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe('WebSocket - Connection & Authentication', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket1: ClientSocket;

  beforeAll(async () => {
    httpServer = createServer();
    io = setupWebSocket(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, () => {
        console.log(`Test WebSocket server running on port ${TEST_PORT}`);
        resolve();
      });
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

  it('should connect with valid JWT token', async () => {
    const token = generateTestToken(mockUser1.id, mockUser1.email);

    clientSocket1 = SocketClient(TEST_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).toBe(true);
        resolve();
      });
      clientSocket1.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    clientSocket1.disconnect();
  });

  it('should reject connection without token', async () => {
    const socket = SocketClient(TEST_URL, {
      auth: {},
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      socket.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication token is required');
        resolve();
      });
      socket.on('connect', () => {
        socket.disconnect();
        resolve();
      });
      setTimeout(() => resolve(), 3000);
    });

    socket.disconnect();
  });

  it('should reject connection with invalid token', async () => {
    const socket = SocketClient(TEST_URL, {
      auth: { token: 'invalid-token-12345' },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      socket.on('connect_error', (err) => {
        expect(err.message).toContain('Invalid or expired token');
        resolve();
      });
      socket.on('connect', () => {
        socket.disconnect();
        resolve();
      });
      setTimeout(() => resolve(), 3000);
    });

    socket.disconnect();
  });

  it('should join user-specific room on connection', async () => {
    const token = generateTestToken(mockUser1.id, mockUser1.email);

    clientSocket1 = SocketClient(TEST_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      clientSocket1.on('connect', () => {
        // Redis should be called to store socket and online status
        expect(redis.setex).toHaveBeenCalled();
        resolve();
      });
      clientSocket1.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    clientSocket1.disconnect();
  });
});

describe('WebSocket - Disconnection', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;

  beforeAll(async () => {
    httpServer = createServer();
    io = setupWebSocket(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT + 10, () => resolve());
    });
  });

  afterAll(async () => {
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();
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

  it('should broadcast user:offline when client disconnects', async () => {
    const token1 = generateTestToken(mockUser1.id, mockUser1.email);
    const token2 = generateTestToken(mockUser2.id, mockUser2.email);
    const url = `http://localhost:${TEST_PORT + 10}`;

    clientSocket1 = SocketClient(url, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    clientSocket2 = SocketClient(url, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
      new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
    ]);

    // Setup listener for offline event on client2
    const offlinePromise = new Promise<any>((resolve) => {
      clientSocket2.on('user:offline', resolve);
    });

    // Disconnect client1
    clientSocket1.disconnect();

    const result = await Promise.race([
      offlinePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
    ]);

    expect(result.userId).toBe(mockUser1.id);
    expect(redis.del).toHaveBeenCalled();

    clientSocket2.disconnect();
  });

  it('should clean up Redis on disconnect', async () => {
    const token = generateTestToken(mockUser1.id, mockUser1.email);
    const url = `http://localhost:${TEST_PORT + 10}`;

    clientSocket1 = SocketClient(url, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => clientSocket1.on('connect', resolve));

    // Disconnect
    clientSocket1.disconnect();

    // Wait a bit for cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify Redis cleanup was called
    expect(redis.del).toHaveBeenCalledWith(`socket:${mockUser1.id}`);
    expect(redis.del).toHaveBeenCalledWith(`online:${mockUser1.id}`);
  });
});

