/**
 * Socket Service
 * Manages WebSocket connection using Socket.io client
 */

import { io } from 'socket.io-client';
import { tokenStorage } from '../client/tokenStorage';

// Use dedicated WS_URL or extract base URL from API_URL (removing /api/v1 suffix)
const getSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    // Convert ws:// to http:// for socket.io
    return import.meta.env.VITE_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://');
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  // Remove /api/v1 suffix if present
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<Socket>}
   */
  connect() {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const token = tokenStorage.getAccessToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token'));
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        this.reconnectAttempts = 0;
        this.connectionPromise = null;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.connectionPromise = null;
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);

        if (reason === 'io server disconnect') {
          // Server disconnected, need to reconnect manually
          this.socket.connect();
        }
      });

      // Re-attach stored listeners on reconnect
      this.socket.on('connect', () => {
        this.listeners.forEach((callbacks, event) => {
          callbacks.forEach(callback => {
            this.socket.off(event, callback);
            this.socket.on(event, callback);
          });
        });
      });
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   * @returns {Socket | null}
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Emit event to server
   * @param {string} event
   * @param {any} data
   * @param {function} callback
   */
  emit(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, attempting to connect...');
      this.connect().then(() => {
        this.socket.emit(event, data, callback);
      });
      return;
    }
    this.socket.emit(event, data, callback);
  }

  /**
   * Subscribe to event
   * @param {string} event
   * @param {function} callback
   * @returns {function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from event
   * @param {string} event
   * @param {function} callback
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Subscribe to event once
   * @param {string} event
   * @param {function} callback
   */
  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }

  // ============ Chat Methods ============

  /**
   * Join a chat room
   * @param {string} chatId
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  joinChat(chatId) {
    return new Promise((resolve) => {
      this.emit('chat:join', { chatId }, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Leave a chat room
   * @param {string} chatId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  leaveChat(chatId) {
    return new Promise((resolve) => {
      this.emit('chat:leave', { chatId }, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Send a message via WebSocket
   * @param {string} chatId
   * @param {string} content
   * @param {object} metadata
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  sendMessage(chatId, content, metadata = {}) {
    return new Promise((resolve) => {
      this.emit('chat:message', { chatId, content, metadata }, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Send typing indicator
   * @param {string} chatId
   * @param {boolean} isTyping
   */
  sendTyping(chatId, isTyping) {
    this.emit('chat:typing', { chatId, isTyping }, () => {});
  }

  /**
   * Mark message as read
   * @param {string} messageId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  markMessageRead(messageId) {
    return new Promise((resolve) => {
      this.emit('chat:message:read', { messageId }, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Delete a message
   * @param {string} messageId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  deleteMessage(messageId) {
    return new Promise((resolve) => {
      this.emit('chat:message:delete', { messageId }, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Get unread message count
   * @returns {Promise<{success: boolean, data?: {unreadCount: number}, error?: string}>}
   */
  getUnreadCount() {
    return new Promise((resolve) => {
      this.emit('chat:unread:count', null, (response) => {
        resolve(response);
      });
    });
  }

  // ============ Presence Methods ============

  /**
   * Check if users are online
   * @param {string[]} userIds
   * @returns {Promise<{success: boolean, data?: {onlineUsers: object}, error?: string}>}
   */
  checkUsersOnline(userIds) {
    return new Promise((resolve) => {
      this.emit('presence:check', { userIds }, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Get all online users
   * @returns {Promise<{success: boolean, data?: {onlineUsers: string[]}, error?: string}>}
   */
  getOnlineUsers() {
    return new Promise((resolve) => {
      this.emit('presence:get-online', null, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Send heartbeat to maintain presence
   */
  sendHeartbeat() {
    this.emit('presence:heartbeat', { timestamp: new Date().toISOString() }, () => {});
  }

  /**
   * Update activity status
   * @param {string} activity - 'active', 'away', 'busy'
   */
  updateActivity(activity) {
    this.emit('presence:activity', { activity }, () => {});
  }
}

// Export singleton instance
export const socketService = new SocketService();
