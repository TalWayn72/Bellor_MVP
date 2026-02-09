/**
 * Email Service Tests
 *
 * Tests for sendEmail and sendPasswordResetEmail functions.
 * Mocks Resend client, circuit breaker, env config, and logger.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Hoisted mocks - accessible inside vi.mock factories
// ============================================

const { mockResendSend, mockEmailBreakerExecute, mockLogger } = vi.hoisted(() => ({
  mockResendSend: vi.fn(),
  mockEmailBreakerExecute: vi.fn(),
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

vi.mock('./external-services.js', () => ({
  emailBreaker: {
    execute: mockEmailBreakerExecute,
  },
}));

vi.mock('./logger.js', () => ({
  logger: mockLogger,
}));

vi.mock('../config/env.js', () => ({
  env: {
    RESEND_API_KEY: 'test-resend-key-123',
    EMAIL_FROM: 'Bellor <noreply@bellor.com>',
    FRONTEND_URL: 'http://localhost:5173',
  },
}));

// Override the global setup mock of email.js so we test real functions
vi.unmock('./email.js');

import { sendEmail, sendPasswordResetEmail } from './email.js';
import type { SendEmailOptions } from './email.js';
import { env } from '../config/env.js';

// ============================================
// sendEmail
// ============================================

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: circuit breaker delegates to the callback
    mockEmailBreakerExecute.mockImplementation(
      async (fn: () => Promise<boolean>) => fn()
    );
    // Default: Resend send succeeds
    mockResendSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });
  });

  const defaultOptions: SendEmailOptions = {
    to: 'user@example.com',
    subject: 'Test Subject',
    html: '<p>Hello</p>',
  };

  it('should send email successfully via Resend client', async () => {
    const result = await sendEmail(defaultOptions);

    expect(result).toBe(true);
    expect(mockEmailBreakerExecute).toHaveBeenCalledTimes(1);
  });

  it('should pass correct from/to/subject/html to Resend', async () => {
    await sendEmail({
      to: 'recipient@test.com',
      subject: 'Important Email',
      html: '<h1>Content</h1>',
      text: 'Plain text fallback',
    });

    expect(mockResendSend).toHaveBeenCalledWith({
      from: 'Bellor <noreply@bellor.com>',
      to: 'recipient@test.com',
      subject: 'Important Email',
      html: '<h1>Content</h1>',
      text: 'Plain text fallback',
    });
  });

  it('should handle Resend API errors gracefully by throwing', async () => {
    mockResendSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    });

    await expect(sendEmail(defaultOptions)).rejects.toThrow(
      'Failed to send email: Invalid API key'
    );
  });

  it('should propagate circuit breaker errors', async () => {
    mockEmailBreakerExecute.mockRejectedValue(
      new Error('Circuit breaker email is OPEN')
    );

    await expect(sendEmail(defaultOptions)).rejects.toThrow(
      'Circuit breaker email is OPEN'
    );
  });

  it('should include optional text field when provided', async () => {
    await sendEmail({
      ...defaultOptions,
      text: 'Plain text version',
    });

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Plain text version',
      })
    );
  });

  it('should use EMAIL_FROM from env config', async () => {
    await sendEmail(defaultOptions);

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: env.EMAIL_FROM,
      })
    );
  });
});

describe('sendEmail - when RESEND_API_KEY is not configured', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return false and log warning when API key is missing', async () => {
    vi.doMock('../config/env.js', () => ({
      env: {
        RESEND_API_KEY: undefined,
        EMAIL_FROM: 'Bellor <noreply@bellor.com>',
        FRONTEND_URL: 'http://localhost:5173',
      },
    }));

    const freshMockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    vi.doMock('./logger.js', () => ({
      logger: freshMockLogger,
    }));

    vi.doMock('./external-services.js', () => ({
      emailBreaker: {
        execute: vi.fn(),
      },
    }));

    const { sendEmail: sendEmailNoKey } = await import('./email.js');

    const result = await sendEmailNoKey({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result).toBe(false);
    expect(freshMockLogger.warn).toHaveBeenCalledWith(
      'EMAIL',
      expect.stringContaining('Resend API key not configured')
    );
  });
});

// ============================================
// sendPasswordResetEmail
// ============================================

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailBreakerExecute.mockImplementation(
      async (fn: () => Promise<boolean>) => fn()
    );
    mockResendSend.mockResolvedValue({ data: { id: 'email-456' }, error: null });
  });

  it('should generate correct reset URL with token', async () => {
    await sendPasswordResetEmail('user@example.com', 'reset-token-abc', 'John');

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          'http://localhost:5173/reset-password?token=reset-token-abc'
        ),
      })
    );
  });

  it('should include user first name in email body', async () => {
    await sendPasswordResetEmail('user@example.com', 'token-xyz', 'Sarah');

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Hi Sarah'),
        text: expect.stringContaining('Hi Sarah'),
      })
    );
  });

  it('should use correct subject line', async () => {
    await sendPasswordResetEmail('user@example.com', 'token', 'Test');

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Reset Your Password - Bellor',
      })
    );
  });

  it('should send to the correct email address', async () => {
    await sendPasswordResetEmail('specific-user@domain.com', 'token', 'User');

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'specific-user@domain.com',
      })
    );
  });

  it('should include both HTML and plain text versions', async () => {
    await sendPasswordResetEmail('user@example.com', 'token', 'John');

    const sendCall = mockResendSend.mock.calls[0][0];
    expect(sendCall.html).toBeTruthy();
    expect(sendCall.text).toBeTruthy();
    expect(sendCall.html.length).toBeGreaterThan(100);
  });

  it('should include the reset URL in plain text body', async () => {
    await sendPasswordResetEmail('user@example.com', 'my-reset-token', 'User');

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          'http://localhost:5173/reset-password?token=my-reset-token'
        ),
      })
    );
  });

  it('should include Bellor branding in HTML', async () => {
    await sendPasswordResetEmail('user@example.com', 'token', 'User');

    const sendCall = mockResendSend.mock.calls[0][0];
    expect(sendCall.html).toContain('Bellor');
    expect(sendCall.html).toContain('Reset Your Password');
  });

  it('should include expiry notice in the email', async () => {
    await sendPasswordResetEmail('user@example.com', 'token', 'User');

    const sendCall = mockResendSend.mock.calls[0][0];
    expect(sendCall.html).toContain('1 hour');
    expect(sendCall.text).toContain('1 hour');
  });

  it('should include Bellor Team sign-off in plain text', async () => {
    await sendPasswordResetEmail('user@example.com', 'token', 'User');

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Bellor Team'),
      })
    );
  });

  it('should return true on successful send', async () => {
    const result = await sendPasswordResetEmail(
      'user@example.com',
      'token',
      'User'
    );
    expect(result).toBe(true);
  });

  it('should propagate errors from sendEmail', async () => {
    mockResendSend.mockResolvedValue({
      data: null,
      error: { message: 'Rate limit exceeded' },
    });

    await expect(
      sendPasswordResetEmail('user@example.com', 'token', 'User')
    ).rejects.toThrow('Failed to send email: Rate limit exceeded');
  });
});

// ============================================
// Circuit breaker integration
// ============================================

describe('sendEmail - circuit breaker integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute send through the email circuit breaker', async () => {
    mockEmailBreakerExecute.mockResolvedValue(true);

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(mockEmailBreakerExecute).toHaveBeenCalledTimes(1);
    expect(mockEmailBreakerExecute).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should throw when circuit breaker is open after repeated failures', async () => {
    mockEmailBreakerExecute.mockRejectedValue(
      new Error('Circuit breaker email is OPEN')
    );

    await expect(
      sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })
    ).rejects.toThrow('Circuit breaker email is OPEN');
  });

  it('should propagate the circuit breaker wrapped result', async () => {
    mockEmailBreakerExecute.mockResolvedValue(true);

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result).toBe(true);
  });
});
