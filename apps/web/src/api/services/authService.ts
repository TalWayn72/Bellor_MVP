/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from '../client/apiClient';
import { tokenStorage } from '../client/tokenStorage';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLanguage?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  email: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
  [key: string]: unknown;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

interface RefreshResponse {
  accessToken: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    const responseData = ((response.data as { data?: AuthResponse }).data || response.data) as AuthResponse;
    const { user, accessToken, refreshToken } = responseData;

    tokenStorage.setTokens(accessToken, refreshToken);
    tokenStorage.setUser(user);

    return responseData;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const responseData = ((response.data as { data?: AuthResponse }).data || response.data) as AuthResponse;
    const { user, accessToken, refreshToken } = responseData;

    tokenStorage.setTokens(accessToken, refreshToken);
    tokenStorage.setUser(user);

    return responseData;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenStorage.clearTokens();
    }
  },

  async refreshToken(): Promise<RefreshResponse> {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const responseData = ((response.data as { data?: RefreshResponse }).data || response.data) as RefreshResponse;
    const { accessToken } = responseData;

    tokenStorage.setAccessToken(accessToken);

    return responseData;
  },

  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data as ChangePasswordResponse;
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get('/auth/me');
    const user = ((response.data as { data?: AuthUser }).data || response.data) as AuthUser;

    tokenStorage.setUser(user);

    return user;
  },

  isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  },

  getStoredUser(): AuthUser | null {
    return tokenStorage.getUser() as AuthUser | null;
  },
};
