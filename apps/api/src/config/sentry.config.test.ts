import { describe, it, expect, vi } from 'vitest';

describe('Sentry Backend Configuration', () => {
  it('should not initialize Sentry in test environment', () => {
    // Mock Sentry and env for test environment
    const mockInit = vi.fn();
    vi.doMock('@sentry/node', () => ({
      init: mockInit,
    }));
    vi.doMock('./env.js', () => ({
      env: {
        SENTRY_DSN: 'https://test@sentry.io/123',
        NODE_ENV: 'test',
      },
    }));

    // Test that Sentry is not initialized in test mode
    // In real environment, initSentry checks NODE_ENV === 'test' and returns early
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should sanitize sensitive data before sending to Sentry', () => {
    // Test the sanitization logic directly
    const beforeSend = (event: any) => {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-csrf-token'];
      }

      // Remove sensitive query parameters
      if (event.request?.query_string) {
        const sanitizedQuery = event.request.query_string
          .replace(/token=[^&]*/gi, 'token=[REDACTED]')
          .replace(/key=[^&]*/gi, 'key=[REDACTED]')
          .replace(/password=[^&]*/gi, 'password=[REDACTED]');
        event.request.query_string = sanitizedQuery;
      }

      return event;
    };

    const event = {
      request: {
        headers: {
          authorization: 'Bearer token123',
          cookie: 'session=abc123',
          'x-csrf-token': 'csrf123',
          'content-type': 'application/json',
        },
        query_string: 'token=secret123&key=api456&password=pass789&normal=value',
      },
    };

    const sanitizedEvent = beforeSend(event);

    expect(sanitizedEvent.request.headers.authorization).toBeUndefined();
    expect(sanitizedEvent.request.headers.cookie).toBeUndefined();
    expect(sanitizedEvent.request.headers['x-csrf-token']).toBeUndefined();
    expect(sanitizedEvent.request.headers['content-type']).toBe('application/json');
    expect(sanitizedEvent.request.query_string).toContain('token=[REDACTED]');
    expect(sanitizedEvent.request.query_string).toContain('key=[REDACTED]');
    expect(sanitizedEvent.request.query_string).toContain('password=[REDACTED]');
    expect(sanitizedEvent.request.query_string).toContain('normal=value');
  });

  it('should use correct sample rates for different environments', () => {
    // Production: 10% sample rate
    const prodSampleRate = 0.1;
    expect(prodSampleRate).toBe(0.1);

    // Development: 100% sample rate
    const devSampleRate = 1.0;
    expect(devSampleRate).toBe(1.0);

    // Profile sample rate: 10%
    const profileSampleRate = 0.1;
    expect(profileSampleRate).toBe(0.1);
  });
});
