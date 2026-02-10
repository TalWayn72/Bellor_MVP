/**
 * E2E Fixtures barrel export
 * All fixtures, helpers, and factories in one place
 */

// Test data
export { testUser, newTestUser, STORAGE_STATE_PATH } from './test-data.js';

// Auth fixtures
export { test, TestFixtures, setupAuthenticatedUser } from './auth.helpers.js';

// API mocking
export {
  mockApiResponse, mockApiError, mockFeedResponses, mockChatMessages,
  mockChats, mockNotifications, mockLikes, mockDailyMission,
  mockUserProfile, mockFileUpload,
} from './api-mock.helpers.js';

// Navigation
export {
  waitForPageLoad, waitForNavigation, navigateTo, waitForLoadingComplete,
  clearLocalStorage, getLocalStorageItem, setLocalStorageItem,
} from './navigation.helpers.js';

// Forms
export { fillLoginForm, submitForm, fillForm, clickButton } from './form.helpers.js';

// UI
export {
  waitForToast, expectToast, expectEmptyState, waitForDialog,
  closeDialog, scrollToElement, checkAccessibility, isMobileView,
  takeDebugScreenshot,
} from './ui.helpers.js';

// Factories
export {
  MockUser, MockMessage, MockResponse, MockNotification, MockLike,
  createMockUser, createMockMessage, createMockResponse,
  createMockNotification, createMockLike,
} from './factories/index.js';

// Re-export expect from Playwright
export { expect } from '@playwright/test';
