import { describe, expect, it } from 'vitest';
import {
  normalizeAuthResponse,
  normalizeRefreshResponse,
} from './authTokenResponse';

const user = {
  id: 'user-1',
  email: 'test@bellor.app',
};

describe('auth token response helpers', () => {
  it('normalizes camelCase auth tokens', () => {
    const result = normalizeAuthResponse({
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(result).toEqual({
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('normalizes nested snake_case auth tokens', () => {
    const result = normalizeAuthResponse({
      data: {
        user,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      },
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result).not.toHaveProperty('access_token');
    expect(result).not.toHaveProperty('refresh_token');
  });

  it('normalizes snake_case refresh tokens', () => {
    const result = normalizeRefreshResponse({
      data: { access_token: 'new-access-token' },
    });

    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  it('throws before returning missing auth tokens', () => {
    expect(() => normalizeAuthResponse({
      data: { user, refresh_token: 'refresh-token' },
    })).toThrow('Auth response missing required fields');
  });

  it('throws before returning missing refresh access token', () => {
    expect(() => normalizeRefreshResponse({ data: {} }))
      .toThrow('Refresh response missing access token');
  });
});
