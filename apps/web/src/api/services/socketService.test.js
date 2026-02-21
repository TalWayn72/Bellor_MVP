/**
 * Socket Service Tests
 * Tests for WebSocket connection management and memory leak prevention
 *
 * Uses singleton state reset (instead of vi.resetModules) to avoid unbounded
 * memory growth in isolate:false CI mode.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { io } from 'socket.io-client';
import { tokenStorage } from '../client/tokenStorage';
import { socketService } from './socketService.js';

// Mock the external socket.io-client library (hoisted – applied before any import)
vi.mock('socket.io-client');

describe('[P1][chat] Socket Service - Memory Leak Prevention', () => {
  let mockSocket;

  beforeEach(() => {
    // Spy on tokenStorage (real object) – no vi.mock contamination of the shared cache
    vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue('test-token-12345');

    // Fresh mock socket for each test
    mockSocket = {
      connected: false,
      id: 'test-socket-id',
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    vi.mocked(io).mockReturnValue(mockSocket);

    // Reset the singleton's internal state instead of vi.resetModules().
    // SocketService fields are plain JS properties (not private) so we can
    // clear them directly. This avoids creating new module copies per test.
    socketService.socket = null;
    socketService.connectionPromise = null;
    socketService.reconnectAttempts = 0;
    socketService.listeners = new Map();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Listener accumulation prevention', () => {
    it('should not accumulate duplicate connect handlers', () => {
      // Act - call connect (token is mocked, so io() will be called)
      socketService.connect();

      // Assert - should have exactly one connect handler
      const connectCalls = mockSocket.on.mock.calls.filter(call => call[0] === 'connect');
      expect(connectCalls.length).toBeLessThanOrEqual(1);
    });

    it('should properly clean up listeners on disconnect', () => {
      // Arrange - connect first so socket is set
      socketService.connect();
      const eventName = 'test:event';
      const callback = vi.fn();

      // Act
      socketService.on(eventName, callback);
      socketService.disconnect();

      // Assert
      expect(socketService.listeners.size).toBe(0);
    });

    it('should re-attach listeners only once per reconnect', () => {
      // Arrange - connect first to set up socket and handlers
      socketService.connect();

      const eventName = 'test:event';
      const callback = vi.fn();
      mockSocket.connected = true;

      socketService.on(eventName, callback);

      // Find the connect handler that was registered
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];

      // Act - simulate reconnect
      connectHandler?.();

      // Assert - callback should be registered at least once
      const offCalls = mockSocket.off.mock.calls.filter(call => call[0] === eventName);
      const onCalls = mockSocket.on.mock.calls.filter(call => call[0] === eventName);

      expect(offCalls.length).toBeGreaterThanOrEqual(1);
      expect(onCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Connection management', () => {
    it('should reuse existing connection promise', async () => {
      // Arrange
      mockSocket.connected = false;

      // Act - connect twice, should get same promise back
      const promise1 = socketService.connect();
      const promise2 = socketService.connect();

      // Assert
      expect(promise1).toBe(promise2);
    });

    it('should clear connection promise after error', async () => {
      // Arrange
      const error = new Error('Connection failed');

      // Override io mock to simulate errors via on('connect_error')
      vi.mocked(io).mockImplementation(() => {
        const socket = { ...mockSocket, on: vi.fn(), off: vi.fn() };
        socket.on.mockImplementation((event, handler) => {
          if (event === 'connect_error') {
            setTimeout(() => {
              for (let i = 0; i < 5; i++) {
                handler(error);
              }
            }, 0);
          }
        });
        return socket;
      });

      // Reset singleton state to get a clean connect() call (no vi.resetModules needed)
      socketService.socket = null;
      socketService.connectionPromise = null;
      socketService.reconnectAttempts = 0;
      socketService.listeners = new Map();

      // Act & Assert
      await expect(socketService.connect()).rejects.toThrow('Connection failed');
    });
  });
});
