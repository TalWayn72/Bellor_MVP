/**
 * Visual Regression Tests - Chat Pages
 * Pages: PrivateChat, LiveChat, TemporaryChats
 */
import {
  test, expect, setupAuthenticatedUser,
  navigateTo, mockChatMessages,
} from '../fixtures';
import { DESKTOP_VIEWPORT, maskDynamicContent } from './visual-helpers';
import { mockChatData } from './visual-mocks';

test.describe('Visual - Chat Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await setupAuthenticatedUser(page);
  });

  test('LiveChat page (chat list)', async ({ page }) => {
    await mockChatData(page);
    await navigateTo(page, '/LiveChat');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('livechat-page.png', { maxDiffPixels: 150 });
  });

  test('PrivateChat page', async ({ page }) => {
    await mockChatData(page);
    await mockChatMessages(page, 'chat-1', [
      { id: 'msg-1', senderId: 'other-user', content: 'Hello!', createdAt: new Date().toISOString() },
      { id: 'msg-2', senderId: 'test-user', content: 'Hi there!', createdAt: new Date().toISOString() },
    ]);
    await navigateTo(page, '/PrivateChat');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('private-chat-page.png', { maxDiffPixels: 150 });
  });

  test('TemporaryChats page', async ({ page }) => {
    await navigateTo(page, '/TemporaryChats');
    await maskDynamicContent(page);
    await expect(page).toHaveScreenshot('temporary-chats-page.png', { maxDiffPixels: 150 });
  });
});
