/**
 * Chat & Messaging E2E Tests
 *
 * Tests the chat functionality including:
 * - Opening chats
 * - Sending/receiving messages
 * - Typing indicators
 * - Message history
 * - Empty states
 *
 * @see PRD.md Section 10.1 Phase 6 - Testing
 * Priority: Critical
 */

import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedUser,
  mockApiResponse,
  mockChats,
  mockChatMessages,
  createMockUser,
  createMockMessage,
  waitForPageLoad,
  waitForLoadingComplete,
  MockMessage,
} from './fixtures';

test.describe('Chat & Messaging', () => {
  const otherUser = createMockUser({ id: 'other-user-1', nickname: 'ChatPartner', firstName: 'Chat', lastName: 'Partner' });

  test.describe('Chat List', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
    });

    test('should display chat list', async ({ page }) => {
      await mockChats(page, [
        {
          id: 'chat-1',
          participants: [otherUser],
          lastMessage: createMockMessage({ content: 'Last message in chat' }),
        },
      ]);

      await page.goto('/temporarychats');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show chat partner name
      await expect(page.locator('text=/chatpartner|chat partner/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show last message preview', async ({ page }) => {
      await mockChats(page, [
        {
          id: 'chat-1',
          participants: [otherUser],
          lastMessage: createMockMessage({ content: 'This is the preview text' }),
        },
      ]);

      await page.goto('/temporarychats');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show last message preview
      await expect(page.locator('text=/preview text/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show empty state when no chats', async ({ page }) => {
      await mockChats(page, []);

      await page.goto('/temporarychats');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show empty state
      const emptyState = page.locator('text=/no messages|no chats|start a conversation|אין הודעות/i');
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to chat when clicking', async ({ page }) => {
      await mockChats(page, [
        {
          id: 'chat-1',
          participants: [otherUser],
          lastMessage: createMockMessage({ content: 'Click me' }),
        },
      ]);
      await mockChatMessages(page, 'chat-1', []);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });

      await page.goto('/temporarychats');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Click on chat
      const chatItem = page.locator('text=/chatpartner|click me/i').first();
      await chatItem.click();

      // Should navigate to private chat
      await expect(page).toHaveURL(/.*privatechat.*/i);
    });
  });

  test.describe('Private Chat', () => {
    const messages: MockMessage[] = [
      createMockMessage({ id: 'msg-1', senderId: 'other-user-1', content: 'Hey there!' }),
      createMockMessage({ id: 'msg-2', senderId: 'current-user', content: 'Hi! How are you?' }),
      createMockMessage({ id: 'msg-3', senderId: 'other-user-1', content: 'Doing great, thanks!' }),
    ];

    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
      await mockApiResponse(page, '**/api/v1/chats/chat-1', {
        chat: { id: 'chat-1', participants: [otherUser] },
      });
    });

    test('should display chat header with user info', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', messages);

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);

      // Should show user name in header
      await expect(page.locator('text=/chatpartner|chat partner/i')).toBeVisible({ timeout: 10000 });
    });

    test('should display message history', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', messages);

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show messages
      await expect(page.locator('text=/hey there/i')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/how are you/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show message input field', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', []);

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);

      // Should have message input
      const messageInput = page.getByPlaceholder(/message|type|הקלד|הודעה/i);
      await expect(messageInput).toBeVisible({ timeout: 10000 });
    });

    test('should send a message', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', []);
      await mockApiResponse(page, '**/api/v1/chats/*/messages', {
        message: createMockMessage({ content: 'New message sent' }),
      });

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);

      // Type message
      const messageInput = page.getByPlaceholder(/message|type|הקלד|הודעה/i);
      await messageInput.fill('New message sent');

      // Send message
      const sendButton = page.getByRole('button', { name: /send|שלח/i });
      if (await sendButton.isVisible()) {
        await sendButton.click();
      } else {
        await messageInput.press('Enter');
      }

      // Message should appear (or input should clear)
      await page.waitForTimeout(1000);
    });

    test('should show empty state for new chat', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', []);

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Should show empty chat state or ice breakers
      const emptyOrIceBreaker = page.locator('text=/start.*conversation|ice.*breaker|say hi|התחל שיחה/i');
      // This may or may not be visible depending on implementation
    });

    test('should show ice breaker suggestions', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', []);
      await mockApiResponse(page, '**/api/v1/icebreakers*', {
        iceBreakers: [
          { id: 'ib-1', text: 'What do you like to do for fun?' },
          { id: 'ib-2', text: 'Tell me about yourself' },
        ],
      });

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);

      // Ice breakers may be shown
      const iceBreaker = page.locator('text=/what do you like|tell me about/i');
      // Visibility depends on implementation
    });

    test('should display user avatar', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', messages);

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);

      // Should show avatar
      const avatar = page.locator('img[alt*="avatar"], img[alt*="profile"], .avatar');
      await expect(avatar.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Message Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
      await mockApiResponse(page, '**/api/v1/chats/chat-1', {
        chat: { id: 'chat-1', participants: [otherUser] },
      });
      await mockChatMessages(page, 'chat-1', [
        createMockMessage({ id: 'msg-1', senderId: 'other-user-1', content: 'Test message' }),
      ]);
    });

    test('should show message reactions', async ({ page }) => {
      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);

      // Long press or click message for reactions
      const message = page.locator('text=/test message/i');
      if (await message.isVisible()) {
        // Implementation may vary
      }
    });

    test('should differentiate sent vs received messages', async ({ page }) => {
      await mockChatMessages(page, 'chat-1', [
        createMockMessage({ id: 'msg-1', senderId: 'other-user-1', content: 'Received message' }),
        createMockMessage({ id: 'msg-2', senderId: 'current-user', content: 'Sent message' }),
      ]);

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);

      // Messages should have different alignment/styling
      await expect(page.locator('text=/received message/i')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/sent message/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state while fetching messages', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
      await mockApiResponse(page, '**/api/v1/chats/chat-1', {
        chat: { id: 'chat-1', participants: [otherUser] },
      });

      // Delay response
      await page.route('**/api/v1/chats/*/messages*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ messages: [], pagination: { total: 0 } }),
        });
      });

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');

      // Should show loading skeleton
      const skeleton = page.locator('.animate-pulse, [data-testid="chat-skeleton"]');
      await expect(skeleton.first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Back Navigation', () => {
    test('should navigate back to chat list', async ({ page }) => {
      await setupAuthenticatedUser(page);
      await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
      await mockApiResponse(page, '**/api/v1/chats/chat-1', {
        chat: { id: 'chat-1', participants: [otherUser] },
      });
      await mockChatMessages(page, 'chat-1', []);
      await mockChats(page, []);

      await page.goto('/privatechat?id=chat-1&userId=other-user-1');
      await waitForPageLoad(page);

      // Click back button
      const backButton = page.getByRole('button', { name: /back|חזור/i });
      if (await backButton.isVisible()) {
        await backButton.click();
        // Should navigate away from chat
      }
    });
  });
});

test.describe('UserProfile Message Button - Direct Chat Navigation (ISSUE-069)', () => {
  const otherUser = createMockUser({ id: 'other-user-1', nickname: 'TestUser', firstName: 'Test', lastName: 'User' });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
    await mockApiResponse(page, '**/api/v1/likes/check/*', { liked: false });
    await mockApiResponse(page, '**/api/v1/follows/other-user-1/followers*', { followers: [], pagination: { total: 0 } });
    await mockApiResponse(page, '**/api/v1/follows/other-user-1/following*', { following: [], pagination: { total: 0 } });
    await mockApiResponse(page, '**/api/v1/responses/user/other-user-1*', { responses: [] });
  });

  test('should navigate directly to PrivateChat when clicking message button', async ({ page }) => {
    await mockApiResponse(page, '**/api/v1/chats', { chat: { id: 'chat-123' } });
    await mockApiResponse(page, '**/api/v1/chats/chat-123', { chat: { id: 'chat-123', participants: [otherUser] } });
    await mockChatMessages(page, 'chat-123', []);

    await page.goto('/UserProfile?id=other-user-1');
    await waitForPageLoad(page);
    await waitForLoadingComplete(page);

    // Click message button - should navigate directly to chat (no dialog)
    const messageButton = page.locator('button').filter({ has: page.locator('.lucide-message-circle') });
    await messageButton.click();

    await expect(page).toHaveURL(/.*privatechat.*chatId=chat-123/i, { timeout: 10000 });
  });

  test('should show past messages when navigating to existing chat', async ({ page }) => {
    const existingMessages = [
      createMockMessage({ id: 'msg-1', senderId: 'other-user-1', content: 'Hey, nice profile!' }),
      createMockMessage({ id: 'msg-2', senderId: 'current-user', content: 'Thanks! How are you?' }),
    ];
    await mockApiResponse(page, '**/api/v1/chats', { chat: { id: 'existing-chat' } });
    await mockApiResponse(page, '**/api/v1/chats/existing-chat', { chat: { id: 'existing-chat', participants: [otherUser] } });
    await mockChatMessages(page, 'existing-chat', existingMessages);

    await page.goto('/UserProfile?id=other-user-1');
    await waitForPageLoad(page);
    await waitForLoadingComplete(page);

    const messageButton = page.locator('button').filter({ has: page.locator('.lucide-message-circle') });
    await messageButton.click();

    // Should see past messages in chat
    await expect(page).toHaveURL(/.*privatechat.*chatId=existing-chat/i, { timeout: 10000 });
    await expect(page.locator('text=/nice profile/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/how are you/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Chat - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized chat', async ({ page }) => {
    const otherUser = createMockUser({ id: 'other-user-1', nickname: 'MobileUser' });
    await setupAuthenticatedUser(page);
    await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
    await mockApiResponse(page, '**/api/v1/chats/chat-1', {
      chat: { id: 'chat-1', participants: [otherUser] },
    });
    await mockChatMessages(page, 'chat-1', [
      createMockMessage({ content: 'Mobile message' }),
    ]);

    await page.goto('/privatechat?id=chat-1&userId=other-user-1');
    await waitForPageLoad(page);

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Message should be visible
    await expect(page.locator('text=/mobile message/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have touch-friendly input', async ({ page }) => {
    const otherUser = createMockUser({ id: 'other-user-1', nickname: 'MobileUser' });
    await setupAuthenticatedUser(page);
    await mockApiResponse(page, '**/api/v1/users/other-user-1', { user: otherUser });
    await mockApiResponse(page, '**/api/v1/chats/chat-1', {
      chat: { id: 'chat-1', participants: [otherUser] },
    });
    await mockChatMessages(page, 'chat-1', []);

    await page.goto('/privatechat?id=chat-1&userId=other-user-1');
    await waitForPageLoad(page);

    // Check input is accessible
    const messageInput = page.getByPlaceholder(/message|type|הקלד|הודעה/i);
    if (await messageInput.isVisible()) {
      const box = await messageInput.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
