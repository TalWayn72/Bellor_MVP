/**
 * E2E Chat Factory
 * Mock chat/message data for Playwright E2E tests
 */

export interface MockMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

export function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  return {
    id: `msg-${Date.now()}`,
    chatId: 'chat-1',
    senderId: 'user-1',
    content: 'Test message',
    createdAt: new Date().toISOString(),
    isRead: false,
    ...overrides,
  };
}
