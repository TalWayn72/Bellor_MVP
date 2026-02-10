/**
 * Chat & Message Test Factory
 * Mock chat/message data creation for backend tests
 */

export interface MockChat {
  id: string;
  user1Id: string;
  user2Id: string;
  chatType: 'TEMPORARY' | 'PERMANENT';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';
  isRead: boolean;
  createdAt: Date;
}

export const createMockChat = (overrides: Partial<MockChat> = {}): MockChat => ({
  id: 'test-chat-id',
  user1Id: 'user-1',
  user2Id: 'user-2',
  chatType: 'TEMPORARY',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockMessage = (overrides: Partial<MockMessage> = {}): MockMessage => ({
  id: 'test-message-id',
  chatId: 'test-chat-id',
  senderId: 'user-1',
  content: 'Hello, this is a test message',
  messageType: 'TEXT',
  isRead: false,
  createdAt: new Date(),
  ...overrides,
});
