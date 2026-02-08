/**
 * Shared test helpers for WebSocket Integration Tests
 *
 * Contains mock data and server setup/teardown used across
 * all websocket integration test files.
 */

// Mock data
export const mockUser1 = {
  id: 'ws-test-user-1',
  email: 'wstest1@example.com',
  firstName: 'WebSocket',
  lastName: 'User1',
  isBlocked: false,
  profileImages: [],
  preferredLanguage: 'ENGLISH',
};

export const mockUser2 = {
  id: 'ws-test-user-2',
  email: 'wstest2@example.com',
  firstName: 'WebSocket',
  lastName: 'User2',
  isBlocked: false,
  profileImages: [],
  preferredLanguage: 'ENGLISH',
};

export const mockChat = {
  id: 'ws-test-chat-1',
  user1Id: 'ws-test-user-1',
  user2Id: 'ws-test-user-2',
  chatType: 'TEMPORARY',
  status: 'ACTIVE',
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  user1: { id: 'ws-test-user-1' },
  user2: { id: 'ws-test-user-2' },
};

export const mockMessage = {
  id: 'ws-test-message-1',
  chatId: 'ws-test-chat-1',
  senderId: 'ws-test-user-1',
  content: 'Hello from WebSocket test',
  messageType: 'TEXT',
  isRead: false,
  createdAt: new Date(),
  sender: {
    id: 'ws-test-user-1',
    firstName: 'WebSocket',
    lastName: 'User1',
    profileImages: [],
  },
  chat: mockChat,
};
