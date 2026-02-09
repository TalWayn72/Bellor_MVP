import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';
import { initSentry } from './sentry';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}));

describe('Sentry Frontend Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset import.meta.env for each test
    import.meta.env.VITE_SENTRY_DSN = '';
    import.meta.env.DEV = false;
    import.meta.env.MODE = 'production';
  });

  it('should not initialize Sentry in development mode', () => {
    import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
    import.meta.env.DEV = true;

    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('should not initialize Sentry without DSN', () => {
    import.meta.env.VITE_SENTRY_DSN = '';
    import.meta.env.DEV = false;

    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('should initialize Sentry in production with DSN', () => {
    import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
    import.meta.env.DEV = false;
    import.meta.env.MODE = 'production';

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      })
    );
  });

  it('should configure session replay with privacy settings', () => {
    import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
    import.meta.env.DEV = false;

    initSentry();

    expect(Sentry.replayIntegration).toHaveBeenCalledWith({
      maskAllText: true,
      blockAllMedia: true,
    });
  });

  it('should filter localhost errors in beforeSend', () => {
    import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
    import.meta.env.DEV = false;

    initSentry();

    const initCall = (Sentry.init as any).mock.calls[0][0];
    const beforeSend = initCall.beforeSend;

    const localhostEvent = {
      request: { url: 'http://localhost:5173/some-page' },
    };

    expect(beforeSend(localhostEvent)).toBeNull();
  });

  it('should allow non-localhost errors in beforeSend', () => {
    import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
    import.meta.env.DEV = false;

    initSentry();

    const initCall = (Sentry.init as any).mock.calls[0][0];
    const beforeSend = initCall.beforeSend;

    const prodEvent = {
      request: { url: 'https://bellor.app/some-page' },
    };

    expect(beforeSend(prodEvent)).toEqual(prodEvent);
  });

  it('should sanitize sensitive cookies in beforeSend', () => {
    import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
    import.meta.env.DEV = false;

    initSentry();

    const initCall = (Sentry.init as any).mock.calls[0][0];
    const beforeSend = initCall.beforeSend;

    const event = {
      request: {
        url: 'https://bellor.app/profile',
        cookies: {
          authToken: 'secret123',
          refreshToken: 'refresh456',
          'connect.sid': 'session789',
          theme: 'dark',
        },
      },
    };

    const sanitizedEvent = beforeSend(event);

    expect(sanitizedEvent.request.cookies.authToken).toBeUndefined();
    expect(sanitizedEvent.request.cookies.refreshToken).toBeUndefined();
    expect(sanitizedEvent.request.cookies['connect.sid']).toBeUndefined();
    expect(sanitizedEvent.request.cookies.theme).toBe('dark');
  });
});
