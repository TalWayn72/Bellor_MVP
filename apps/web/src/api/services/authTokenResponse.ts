interface AuthUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

interface AuthResponsePayload extends Partial<AuthResponse> {
  user?: AuthUser;
  access_token?: string;
  refresh_token?: string;
}

interface RefreshResponsePayload extends Partial<RefreshResponse> {
  access_token?: string;
}

export function unwrapResponseData<T>(responseData: unknown): T {
  return (((responseData as { data?: unknown }).data) || responseData) as T;
}

export function normalizeAuthResponse(responseData: unknown): AuthResponse {
  const payload = unwrapResponseData<AuthResponsePayload>(responseData);
  const accessToken = payload.accessToken ?? payload.access_token;
  const refreshToken = payload.refreshToken ?? payload.refresh_token;

  if (!payload.user || !accessToken || !refreshToken) {
    throw new Error('Auth response missing required fields');
  }

  return {
    user: payload.user,
    accessToken,
    refreshToken,
  };
}

export function normalizeRefreshResponse(responseData: unknown): RefreshResponse {
  const payload = unwrapResponseData<RefreshResponsePayload>(responseData);
  const accessToken = payload.accessToken ?? payload.access_token;

  if (!accessToken) {
    throw new Error('Refresh response missing access token');
  }

  return { accessToken };
}
