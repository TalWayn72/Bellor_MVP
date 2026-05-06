# New API Client Implementation

**Purpose:** Replace Base44 SDK with custom API client
**Status:** 📋 Design Document (Implementation in Phase 4)
**Created:** February 2026

---

## 🎯 Overview

This document outlines the implementation of a new API client that will replace the Base44 SDK throughout the frontend application.

### Goals
- ✅ Type-safe API calls with TypeScript
- ✅ JWT authentication with refresh token
- ✅ Automatic request/response handling
- ✅ Error handling and retry logic
- ✅ WebSocket support for real-time features
- ✅ React hooks for easy integration

---

## 📁 File Structure

```
apps/web/src/api/
├── client/
│   ├── apiClient.ts           # Main HTTP client
│   ├── websocketClient.ts     # WebSocket client
│   └── types.ts               # Shared types
│
├── services/
│   ├── auth.api.ts            # Authentication
│   ├── users.api.ts           # User management
│   ├── chats.api.ts           # Chat operations
│   ├── messages.api.ts        # Messages
│   ├── stories.api.ts         # Stories
│   ├── missions.api.ts        # Missions
│   ├── achievements.api.ts    # Achievements
│   └── upload.api.ts          # File uploads
│
├── hooks/
│   ├── useAuth.ts             # Authentication hooks
│   ├── useUser.ts             # User hooks
│   ├── useChat.ts             # Chat hooks
│   └── useWebSocket.ts        # WebSocket hooks
│
└── index.ts                   # Public exports
```

---

## 🔧 Core Implementation

### 1. API Client (apiClient.ts)

```typescript
// apps/web/src/api/client/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
}

interface TokenStorage {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearTokens: () => void;
}

class ApiClient {
  private client: AxiosInstance;
  private tokenStorage: TokenStorage;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(config: ApiClientConfig, tokenStorage: TokenStorage) {
    this.tokenStorage = tokenStorage;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.client(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.tokenStorage.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            // Call refresh endpoint
            const response = await axios.post(
              `${this.client.defaults.baseURL}/auth/refresh`,
              { refreshToken }
            );

            const { accessToken } = response.data;
            this.tokenStorage.setAccessToken(accessToken);

            // Retry all failed requests
            this.failedQueue.forEach((prom) => prom.resolve());
            this.failedQueue = [];

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];
            this.tokenStorage.clearTokens();

            // Redirect to login
            window.location.href = '/welcome';

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Token storage implementation
export const tokenStorage: TokenStorage = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setAccessToken: (token: string) => localStorage.setItem('accessToken', token),
  setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Create and export client instance
const apiConfig: ApiClientConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
};

export const apiClient = new ApiClient(apiConfig, tokenStorage);
```

---

### 2. Authentication Service (auth.api.ts)

```typescript
// apps/web/src/api/services/auth.api.ts
import { apiClient, tokenStorage } from '../client/apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string; // ISO date string
  preferredLanguage: 'ENGLISH' | 'HEBREW' | 'SPANISH' | 'GERMAN' | 'FRENCH';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  profileImages: string[];
  createdAt: string;
  // ... other fields
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // Store tokens
    tokenStorage.setAccessToken(response.accessToken);
    tokenStorage.setRefreshToken(response.refreshToken);

    return response;
  },

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    // Store tokens
    tokenStorage.setAccessToken(response.accessToken);
    tokenStorage.setRefreshToken(response.refreshToken);

    return response;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear tokens even if API call fails
      tokenStorage.clearTokens();
    }
  },

  // Get current user
  async getMe(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  // Refresh token (handled automatically by interceptor)
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    return apiClient.post('/auth/refresh', { refreshToken });
  },
};
```

---

### 3. Users Service (users.api.ts)

```typescript
// apps/web/src/api/services/users.api.ts
import { apiClient } from '../client/apiClient';
import { User } from './auth.api';

export interface ListUsersParams {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'firstName' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
  isBlocked?: boolean;
  isPremium?: boolean;
  language?: string;
}

export interface ListUsersResponse {
  users: User[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface UserStats {
  userId: string;
  messagesCount: number;
  chatsCount: number;
  isPremium: boolean;
  memberSince: string;
  lastLogin: string;
}

export const usersApi = {
  // List users
  async list(params?: ListUsersParams): Promise<ListUsersResponse> {
    return apiClient.get<ListUsersResponse>('/users', { params });
  },

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  // Update profile
  async updateProfile(id: string, data: UpdateProfileData): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data);
  },

  // Update language
  async updateLanguage(id: string, language: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/language`, { language });
  },

  // Search users
  async search(query: string, limit = 20, offset = 0): Promise<ListUsersResponse> {
    return apiClient.get<ListUsersResponse>('/users/search', {
      params: { q: query, limit, offset },
    });
  },

  // Deactivate user
  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  // Get user stats
  async getStats(id: string): Promise<UserStats> {
    return apiClient.get<UserStats>(`/users/${id}/stats`);
  },
};
```

---

### 4. WebSocket Client (websocketClient.ts)

```typescript
// apps/web/src/api/client/websocketClient.ts
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './apiClient';

export type SocketEventHandler = (data: any) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private connected = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = tokenStorage.getAccessToken();
    if (!token) {
      console.error('No access token for WebSocket connection');
      return;
    }

    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  emit(event: string, data?: any): void {
    if (!this.socket || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  on(event: string, handler: SocketEventHandler): void {
    if (!this.socket) {
      console.error('WebSocket not initialized');
      return;
    }
    this.socket.on(event, handler);
  }

  off(event: string, handler?: SocketEventHandler): void {
    if (!this.socket) {
      return;
    }
    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Presence
  setOnline(): void {
    this.emit('presence:online');
  }

  setOffline(): void {
    this.emit('presence:offline');
  }

  // Chat
  joinChat(chatId: string): void {
    this.emit('chat:join', { chatId });
  }

  leaveChat(chatId: string): void {
    this.emit('chat:leave', { chatId });
  }

  sendMessage(chatId: string, content: string, metadata?: any): void {
    this.emit('chat:message', { chatId, content, metadata });
  }

  setTyping(chatId: string, isTyping: boolean): void {
    this.emit('chat:typing', { chatId, isTyping });
  }

  markMessageRead(messageId: string): void {
    this.emit('chat:message:read', { messageId });
  }

  deleteMessage(messageId: string): void {
    this.emit('chat:message:delete', { messageId });
  }

  getUnreadCount(): void {
    this.emit('chat:unread:count');
  }
}

// Create and export WebSocket client instance
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
export const websocketClient = new WebSocketClient(wsUrl);
```

---

### 5. React Hooks (useAuth.ts)

```typescript
// apps/web/src/api/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, LoginCredentials, RegisterData, User } from '../services/auth.api';
import { websocketClient } from '../client/websocketClient';

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getMe(),
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      websocketClient.connect();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      websocketClient.connect();
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      websocketClient.disconnect();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
```

---

## 🔄 Migration Example

### Before (Base44):
```javascript
import { base44 } from '@/api/base44Client';

// In component
const handleLogin = async (email, password) => {
  try {
    const response = await base44.auth.login(email, password);
    setUser(response.user);
  } catch (error) {
    console.error(error);
  }
};

// Get data
useEffect(() => {
  base44.entities.User.getById(userId).then(setUser);
}, [userId]);
```

### After (New API):
```typescript
import { useAuth } from '@/api/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/services/users.api';

// In component
const { login, isLoggingIn } = useAuth();

const handleLogin = (email: string, password: string) => {
  login({ email, password });
};

// Get data
const { data: user, isLoading } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => usersApi.getUserById(userId),
});
```

---

## ✅ Benefits

1. **Type Safety** - Full TypeScript support
2. **Auto Refresh** - Automatic token refresh on 401
3. **Better DX** - React hooks for easy integration
4. **Error Handling** - Centralized error handling
5. **Testability** - Easy to mock and test
6. **Performance** - TanStack Query caching
7. **Real-time** - WebSocket support built-in
8. **No Vendor Lock-in** - Our own implementation

---

## 🚀 Implementation Timeline

1. **Week 1:** Core client + Auth + Users
2. **Week 2:** Chats + Messages + WebSocket
3. **Week 3:** Stories + Missions + Achievements
4. **Week 4:** Testing + Documentation

---

**Next Steps:** See [BASE44_REMOVAL_CHECKLIST.md](BASE44_REMOVAL_CHECKLIST.md)
