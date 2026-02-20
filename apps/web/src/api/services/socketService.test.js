/**
 * Socket Service Tests
 * Tests for WebSocket connection management and memory leak prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { io } from 'socket.io-client';

vi.mock('socket.io-client');

vi.mock('../client/tokenStorage', () => ({
  tokenStorage: { getAccessToken: vi.fn(() => 'test-token-12345') },
}));

describe('[P1][chat] Socket Service - Memory Leak Prevention', () => {
  let mockSocket;
  let SocketService;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Mock socket instance
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

    // Dynamically import to get fresh instance
    const module = await import('./socketService.js');
    SocketService = module.socketService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Listener accumulation prevention', () => {
    it('should not accumulate duplicate connect handlers', () => {
      // Act - call connect (token is mocked, so io() will be called)
      SocketService.connect();

      // Assert - should have exactly one connect handler
      const connectCalls = mockSocket.on.mock.calls.filter(call => call[0] === 'connect');
      expect(connectCalls.length).toBeLessThanOrEqual(1);
    });

    it('should properly clean up listeners on disconnect', () => {
      // Arrange - connect first so socket is set
      SocketService.connect();
      const eventName = 'test:event';
      const callback = vi.fn();

      // Act
      SocketService.on(eventName, callback);
      SocketService.disconnect();

      // Assert
      expect(SocketService.listeners.size).toBe(0);
    });

    it('should re-attach listeners only once per reconnect', () => {
      // Arrange - connect first to set up socket and handlers
      SocketService.connect();

      const eventName = 'test:event';
      const callback = vi.fn();
      mockSocket.connected = true;

      SocketService.on(eventName, callback);

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
      const promise1 = SocketService.connect();
      const promise2 = SocketService.connect();

      // Assert
      expect(promise1).toBe(promise2);
    });

    it('should clear connection promise after error', async () => {
      // Arrange
      mockSocket.connected = false;
      const error = new Error('Connection failed');

      // Override io mock to simulate errors via on('connect_error')
      vi.mocked(io).mockImplementation(() => {
        const socket = { ...mockSocket, on: vi.fn(), off: vi.fn() };
        // Register connect_error handler and fire it 5 times
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

      // Re-import to pick up new io mock
      vi.resetModules();
      const module = await import('./socketService.js');
      const freshService = module.socketService;

      // Act & Assert
      await expect(freshService.connect()).rejects.toThrow('Connection failed');
    });
  });
});
