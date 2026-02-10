/**
 * WebSocket Integration Tests - Presence Handlers
 *
 * Tests for online/offline status, heartbeat,
 * presence checking, and activity broadcasting.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as SocketClient, Socket as ClientSocket } from 'socket.io-client';
import { setupWebSocket } from '../../websocket/index.js';
import { generateTestToken } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import type { User } from '@prisma/client';
import { mockUser1, mockUser2, SocketAck } from './websocket-test-helpers.js';

// Test configuration
const TEST_PORT = 3098;
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe('[P1][chat] WebSocket - Presence Handlers', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;

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
    if (clientSocket2?.connected) clientSocket2.disconnect();
    io.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(redis.setex).mockResolvedValue('OK');
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.del).mockResolvedValue(1);
    vi.mocked(redis.expire).mockResolvedValue(1);
    vi.mocked(redis.keys).mockResolvedValue([]);

    const token1 = generateTestToken(mockUser1.id, mockUser1.email);
    const token2 = generateTestToken(mockUser2.id, mockUser2.email);

    clientSocket1 = SocketClient(TEST_URL, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    clientSocket2 = SocketClient(TEST_URL, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    // Wait for both connections
    await Promise.all([
      new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
      new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
    ]);
  });

  afterEach(() => {
    clientSocket1?.removeAllListeners();
    clientSocket2?.removeAllListeners();
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();
  });

  it('should broadcast user:online when presence:online is emitted', async () => {
    const onlinePromise = new Promise<SocketAck>((resolve) => {
      clientSocket2.on('user:online', resolve);
    });

    clientSocket1.emit('presence:online');

    const result = await Promise.race([
      onlinePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
    ]);

    expect(result).toMatchObject({
      userId: mockUser1.id,
    });
    expect(result.timestamp).toBeDefined();
  });

  it('should broadcast user:offline when presence:offline is emitted', async () => {
    const offlinePromise = new Promise<SocketAck>((resolve) => {
      clientSocket2.on('user:offline', resolve);
    });

    clientSocket1.emit('presence:offline');

    const result = await Promise.race([
      offlinePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
    ]);

    expect(result).toMatchObject({
      userId: mockUser1.id,
    });
    expect(result.timestamp).toBeDefined();
  });

  it('should check online status of users with presence:check', async () => {
    vi.mocked(redis.get).mockImplementation(async (key: string) => {
      if (key === `online:${mockUser2.id}`) {
        return new Date().toISOString();
      }
      return null;
    });

    const result = await new Promise<SocketAck>((resolve) => {
      clientSocket1.emit('presence:check', { userIds: [mockUser2.id, 'nonexistent-user'] }, resolve);
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      userId: mockUser2.id,
      isOnline: true,
    });
    expect(result.data[1]).toMatchObject({
      userId: 'nonexistent-user',
      isOnline: false,
    });
  });

  it('should get all online users with presence:get-online', async () => {
    vi.mocked(redis.keys).mockResolvedValue([`online:${mockUser1.id}`, `online:${mockUser2.id}`]);
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser1 as unknown as User, mockUser2 as unknown as User]);

    const result = await new Promise<SocketAck>((resolve) => {
      clientSocket1.emit('presence:get-online', resolve);
    });

    expect(result.success).toBe(true);
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('should respond to heartbeat with ack', async () => {
    const ackPromise = new Promise<SocketAck>((resolve) => {
      clientSocket1.on('presence:heartbeat:ack', resolve);
    });

    clientSocket1.emit('presence:heartbeat');

    const result = await Promise.race([
      ackPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
    ]);

    expect(result.timestamp).toBeDefined();
    expect(redis.expire).toHaveBeenCalled();
  });

  it('should broadcast activity updates with presence:activity', async () => {
    const activityPromise = new Promise<SocketAck>((resolve) => {
      clientSocket2.on('user:activity', resolve);
    });

    clientSocket1.emit('presence:activity', {
      activity: 'viewing_profile',
      metadata: { profileId: mockUser2.id },
    });

    const result = await Promise.race([
      activityPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
    ]);

    expect(result).toMatchObject({
      userId: mockUser1.id,
      activity: 'viewing_profile',
    });
  });
});
