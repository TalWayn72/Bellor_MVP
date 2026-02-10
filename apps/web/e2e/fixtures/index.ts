/**
 * E2E Fixtures barrel export
 * All fixtures, helpers, and factories in one place
 */

// Test data
export { testUser, newTestUser, STORAGE_STATE_PATH } from './test-data.js';

// Auth fixtures (mocked + full-stack)
export {
  test, TestFixtures, setupAuthenticatedUser,
  fullstackTest, FULLSTACK_AUTH,
  loginWithRealCredentials, registerNewUser,
  getAuthTokens, isAuthenticated,
} from './auth.helpers.js';

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

// Forms (basic + full-stack interaction helpers)
export {
  fillLoginForm, submitForm, fillForm, clickButton,
  moveSlider, toggleSwitch, selectDropdownOption, selectDate,
  SPECIAL_INPUTS, fillWithSpecialInput,
  getAllClickableElements, getAllFormInputs,
} from './form.helpers.js';

// UI
export {
  waitForToast, expectToast, expectEmptyState, waitForDialog,
  closeDialog, scrollToElement, checkAccessibility, isMobileView,
  takeDebugScreenshot,
} from './ui.helpers.js';

// Database helpers (full-stack)
export {
  SEEDED_USERS, getSeededUserCredentials,
  seedTestDatabase, isApiHealthy,
  createTestUserViaAPI, loginViaAPI, cleanupTestUsers,
  generateTestEmail,
} from './db.helpers.js';

// File upload helpers
export {
  getTestFilePath, TEST_FILES,
  uploadTestFile, uploadViaFileChooser, uploadViaDragDrop,
} from './file-upload.helpers.js';

// WebSocket helpers
export {
  waitForWebSocketConnection, sendChatMessage,
  waitForMessage, waitForTypingIndicator,
  openChat, setupTwoUserChat,
} from './websocket.helpers.js';

// Factories
export {
  MockUser, MockMessage, MockResponse, MockNotification, MockLike,
  createMockUser, createMockMessage, createMockResponse,
  createMockNotification, createMockLike,
} from './factories/index.js';

// Re-export expect from Playwright
export { expect } from '@playwright/test';
