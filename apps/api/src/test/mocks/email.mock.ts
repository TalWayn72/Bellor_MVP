/**
 * Email Service Mock
 * Prevents actual emails from being sent during tests
 */
import { vi } from 'vitest';

vi.mock('../../lib/email.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}));
