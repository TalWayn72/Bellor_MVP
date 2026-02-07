/**
 * Demo ID Validation Utilities
 * Prevents operations on demo/mock user IDs in the backend
 */

const DEMO_PREFIX = 'demo-';

/**
 * Check if a user ID is a demo/mock ID
 * Demo IDs should not be processed by the backend
 */
export function isDemoUserId(userId: string | null | undefined): boolean {
  if (!userId || typeof userId !== 'string') return false;
  return userId.startsWith(DEMO_PREFIX) || userId === 'mock-user';
}

/**
 * Check if any ID is a demo ID (user, chat, response, etc.)
 */
export function isDemoId(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return id.startsWith(DEMO_PREFIX) || id === 'mock-user';
}

/**
 * Validate that an ID is not a demo ID
 * Throws error if it is a demo ID
 */
export function rejectDemoId(id: string | null | undefined, idType: string = 'ID'): void {
  if (isDemoId(id)) {
    throw new DemoIdError(`Cannot perform operations on demo ${idType}: ${id}`);
  }
}

/**
 * Custom error class for demo ID rejection
 */
export class DemoIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoIdError';
  }
}
