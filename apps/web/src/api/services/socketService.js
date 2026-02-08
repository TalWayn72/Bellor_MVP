/**
 * Socket Service
 * Manages WebSocket connection using Socket.io client
 */

import { io } from 'socket.io-client';
import { tokenStorage } from '../client/tokenStorage';
import { attachChatMethods } from './socket/socketChatMethods';
import { attachPresenceMethods } from './socket/socketPresenceMethods';

// Use dedicated WS_URL or extract base URL from API_URL (removing /api/v1 suffix)
const getSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://');
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
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

  connect() {
    if (this.socket?.connected) return Promise.resolve(this.socket);
    if (this.connectionPromise) return this.connectionPromise;

    const token = tokenStorage.getAccessToken();
    if (!token) return Promise.reject(new Error('No authentication token'));

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
        if (reason === 'io server disconnect') this.socket.connect();
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      this.listeners.clear();
    }
  }

  isConnected() { return this.socket?.connected || false; }
  getSocket() { return this.socket; }

  emit(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, attempting to connect...');
      this.connect().then(() => { this.socket.emit(event, data, callback); });
      return;
    }
    this.socket.emit(event, data, callback);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    if (this.socket) this.socket.on(event, callback);
    return () => { this.off(event, callback); };
  }

  off(event, callback) {
    if (this.listeners.has(event)) this.listeners.get(event).delete(callback);
    if (this.socket) this.socket.off(event, callback);
  }

  once(event, callback) {
    if (this.socket) this.socket.once(event, callback);
  }
}

// Create singleton and attach domain methods
const socketServiceInstance = new SocketService();
attachChatMethods(socketServiceInstance);
attachPresenceMethods(socketServiceInstance);

export const socketService = socketServiceInstance;
