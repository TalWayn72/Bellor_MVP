/**
 * Security Event Reporter
 * Reports client-side auth/access events to the backend for persistent logging.
 * Prevents silent redirects that hide bugs (e.g., field naming mismatches).
 */

import { tokenStorage } from '@/api/client/tokenStorage';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface SecurityEventPayload {
  eventType: 'auth_redirect' | 'admin_denied' | 'token_cleared' | 'auth_check_failed' | 'render_crash';
  attemptedRoute: string;
  redirectedTo: string;
  reason: string;
  userId?: string;
  userFields?: Record<string, unknown>;
}

/**
 * Reports a security event to the backend.
 * Fire-and-forget: never blocks navigation or throws.
 */
async function reportEvent(payload: SecurityEventPayload): Promise<void> {
  try {
    const token = tokenStorage.getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE_URL}/security/client-event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
    });
  } catch {
    // Fire-and-forget - never block the redirect
  }
}

/**
 * Report an unauthenticated user being redirected from a protected route
 */
export function reportAuthRedirect(attemptedRoute: string, redirectedTo: string): void {
  reportEvent({
    eventType: 'auth_redirect',
    attemptedRoute,
    redirectedTo,
    reason: 'User not authenticated',
  });
}

/**
 * Report an authenticated user being denied admin access.
 * Includes user field keys to help diagnose field naming issues.
 */
export function reportAdminDenied(
  attemptedRoute: string,
  redirectedTo: string,
  user: Record<string, unknown> | null
): void {
  const safeFields: Record<string, unknown> = {};
  if (user) {
    // Report which admin-related fields exist and their types (not values)
    for (const key of ['is_admin', 'isAdmin', 'role', 'is_blocked']) {
      if (key in user) {
        safeFields[key] = typeof user[key] === 'boolean' ? user[key] : typeof user[key];
      }
    }
    safeFields['field_keys'] = Object.keys(user).filter(k =>
      k.includes('admin') || k.includes('Admin')
    );
  }

  reportEvent({
    eventType: 'admin_denied',
    attemptedRoute,
    redirectedTo,
    reason: 'User lacks admin privileges or field mismatch',
    userId: user?.id as string | undefined,
    userFields: safeFields,
  });
}

/**
 * Report token being cleared due to auth failure (401/403 or refresh failure)
 */
export function reportTokenCleared(source: string, reason: string): void {
  reportEvent({
    eventType: 'token_cleared',
    attemptedRoute: source,
    redirectedTo: '/Welcome',
    reason,
  });
}

/**
 * Report auth check failure (getCurrentUser failed)
 */
export function reportAuthCheckFailed(source: string, statusCode?: number): void {
  reportEvent({
    eventType: 'auth_check_failed',
    attemptedRoute: source,
    redirectedTo: 'none',
    reason: `Auth check failed${statusCode ? ` (HTTP ${statusCode})` : ''}`,
  });
}

/**
 * Report a React rendering crash caught by ErrorBoundary
 */
export function reportRenderCrash(route: string, errorMessage: string, componentStack?: string): void {
  reportEvent({
    eventType: 'render_crash',
    attemptedRoute: route,
    redirectedTo: 'error_boundary',
    reason: errorMessage,
    userFields: componentStack ? { componentStack: componentStack.slice(0, 500) } : undefined,
  });
}
