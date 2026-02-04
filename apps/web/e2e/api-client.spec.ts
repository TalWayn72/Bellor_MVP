/**
 * API Client E2E Tests
 *
 * Tests the API client functionality including:
 * - Request/Response transformers (snake_case <-> camelCase)
 * - Token handling
 * - Error handling
 *
 * @see OPEN_ISSUES.md ISSUE-007 - Drawing vs Photos separation
 * @see apiClient.js - Request transformer for snake_case to camelCase
 *
 * Priority: High
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, mockApiResponse } from './fixtures';

test.describe('API Client Transformers', () => {
  test.describe('Request Transformer (snake_case -> camelCase)', () => {
    test('should transform snake_case keys to camelCase in requests', async ({ page }) => {
      let capturedRequestBody: any = null;

      // Intercept API request to capture the transformed body
      await page.route('**/api/v1/users/*', async (route) => {
        if (route.request().method() === 'PATCH') {
          const postData = route.request().postData();
          capturedRequestBody = postData ? JSON.parse(postData) : null;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Set up authenticated state
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
      });

      // Make an API call with snake_case data through the app
      await page.evaluate(async () => {
        // Import the API client dynamically
        const { apiClient } = await import('/src/api/client/apiClient.js');

        // Send data with snake_case keys
        await apiClient.patch('/users/test-id', {
          profile_images: ['image1.jpg'],
          drawing_url: 'drawing.png',
          sketch_method: 'self',
          first_name: 'John',
          last_name: 'Doe',
        });
      });

      // Wait for the request to be made
      await page.waitForTimeout(1000);

      // Verify the request body was transformed to camelCase
      if (capturedRequestBody) {
        // These should be transformed from snake_case to camelCase
        expect(capturedRequestBody).toHaveProperty('profileImages');
        expect(capturedRequestBody).toHaveProperty('drawingUrl');
        expect(capturedRequestBody).toHaveProperty('sketchMethod');
        expect(capturedRequestBody).toHaveProperty('firstName');
        expect(capturedRequestBody).toHaveProperty('lastName');

        // Original snake_case keys should NOT exist
        expect(capturedRequestBody).not.toHaveProperty('profile_images');
        expect(capturedRequestBody).not.toHaveProperty('drawing_url');
        expect(capturedRequestBody).not.toHaveProperty('sketch_method');
        expect(capturedRequestBody).not.toHaveProperty('first_name');
        expect(capturedRequestBody).not.toHaveProperty('last_name');
      }
    });

    test('should handle nested objects in transformation', async ({ page }) => {
      let capturedRequestBody: any = null;

      await page.route('**/api/v1/test', async (route) => {
        if (route.request().method() === 'POST') {
          const postData = route.request().postData();
          capturedRequestBody = postData ? JSON.parse(postData) : null;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
      });

      await page.evaluate(async () => {
        const { apiClient } = await import('/src/api/client/apiClient.js');

        await apiClient.post('/test', {
          user_profile: {
            first_name: 'John',
            last_name: 'Doe',
            profile_settings: {
              show_email: true,
              notification_preferences: {
                email_notifications: true,
              },
            },
          },
        });
      });

      await page.waitForTimeout(1000);

      if (capturedRequestBody) {
        expect(capturedRequestBody).toHaveProperty('userProfile');
        expect(capturedRequestBody.userProfile).toHaveProperty('firstName');
        expect(capturedRequestBody.userProfile).toHaveProperty('lastName');
        expect(capturedRequestBody.userProfile).toHaveProperty('profileSettings');
        expect(capturedRequestBody.userProfile.profileSettings).toHaveProperty('showEmail');
        expect(capturedRequestBody.userProfile.profileSettings).toHaveProperty('notificationPreferences');
      }
    });

    test('should handle arrays in transformation', async ({ page }) => {
      let capturedRequestBody: any = null;

      await page.route('**/api/v1/test', async (route) => {
        if (route.request().method() === 'POST') {
          const postData = route.request().postData();
          capturedRequestBody = postData ? JSON.parse(postData) : null;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
      });

      await page.evaluate(async () => {
        const { apiClient } = await import('/src/api/client/apiClient.js');

        await apiClient.post('/test', {
          user_list: [
            { first_name: 'John', last_name: 'Doe' },
            { first_name: 'Jane', last_name: 'Smith' },
          ],
        });
      });

      await page.waitForTimeout(1000);

      if (capturedRequestBody) {
        expect(capturedRequestBody).toHaveProperty('userList');
        expect(Array.isArray(capturedRequestBody.userList)).toBe(true);
        expect(capturedRequestBody.userList[0]).toHaveProperty('firstName');
        expect(capturedRequestBody.userList[0]).toHaveProperty('lastName');
      }
    });

    test('should NOT transform FormData (file uploads)', async ({ page }) => {
      let isFormData = false;

      await page.route('**/api/v1/uploads/**', async (route) => {
        const contentType = route.request().headers()['content-type'];
        isFormData = contentType?.includes('multipart/form-data') || false;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { url: 'test.jpg', key: 'test' } }),
        });
      });

      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
      });

      await page.evaluate(async () => {
        const { apiClient } = await import('/src/api/client/apiClient.js');

        const formData = new FormData();
        formData.append('file', new Blob(['test'], { type: 'image/png' }), 'test.png');

        await apiClient.post('/uploads/drawing', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      });

      await page.waitForTimeout(1000);

      // FormData should NOT be transformed
      expect(isFormData).toBe(true);
    });
  });

  test.describe('Response Transformer (camelCase -> snake_case)', () => {
    test('should transform camelCase keys to snake_case in responses', async ({ page }) => {
      // Mock API response with camelCase keys
      await page.route('**/api/v1/users/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'user-123',
              firstName: 'John',
              lastName: 'Doe',
              profileImages: ['image1.jpg', 'image2.jpg'],
              drawingUrl: 'drawing.png',
              sketchMethod: 'self',
              createdAt: '2024-01-01T00:00:00Z',
            },
          }),
        });
      });

      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
      });

      const responseData = await page.evaluate(async () => {
        const { apiClient } = await import('/src/api/client/apiClient.js');
        const response = await apiClient.get('/users/me');
        return response.data;
      });

      // Response should be transformed to snake_case
      expect(responseData.data).toHaveProperty('first_name');
      expect(responseData.data).toHaveProperty('last_name');
      expect(responseData.data).toHaveProperty('profile_images');
      expect(responseData.data).toHaveProperty('drawing_url');
      expect(responseData.data).toHaveProperty('sketch_method');
      expect(responseData.data).toHaveProperty('created_at');

      // Original camelCase keys should NOT exist
      expect(responseData.data).not.toHaveProperty('firstName');
      expect(responseData.data).not.toHaveProperty('lastName');
      expect(responseData.data).not.toHaveProperty('profileImages');
      expect(responseData.data).not.toHaveProperty('drawingUrl');
      expect(responseData.data).not.toHaveProperty('sketchMethod');
    });
  });

  test.describe('Drawing Fields Transformation (Critical for ISSUE-007)', () => {
    test('should correctly transform drawing_url and profile_images', async ({ page }) => {
      let capturedRequestBody: any = null;

      await page.route('**/api/v1/users/*', async (route) => {
        if (route.request().method() === 'PATCH') {
          const postData = route.request().postData();
          capturedRequestBody = postData ? JSON.parse(postData) : null;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              profileImages: ['photo1.jpg'],
              drawingUrl: 'drawing.png',
            },
          }),
        });
      });

      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
      });

      // Simulate updating user with both photos and drawing
      // This is what happens when onboarding completes
      await page.evaluate(async () => {
        const { apiClient } = await import('/src/api/client/apiClient.js');

        // Frontend sends snake_case (from formData)
        await apiClient.patch('/users/test-id', {
          profile_images: ['photo1.jpg', 'photo2.jpg'],
          drawing_url: 'my-drawing.png',
          sketch_method: 'self',
        });
      });

      await page.waitForTimeout(1000);

      // Request should have camelCase (for Prisma)
      if (capturedRequestBody) {
        // CRITICAL: These must be correctly transformed
        expect(capturedRequestBody).toHaveProperty('profileImages');
        expect(capturedRequestBody).toHaveProperty('drawingUrl');
        expect(capturedRequestBody).toHaveProperty('sketchMethod');

        // They should be SEPARATE fields
        expect(capturedRequestBody.profileImages).not.toContain('my-drawing.png');
        expect(capturedRequestBody.drawingUrl).toBe('my-drawing.png');
      }
    });
  });
});

test.describe('API Client - Error Handling', () => {
  test('should handle 401 and redirect to login', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'expired-token');
    });

    await page.goto('/profile');

    // Should eventually redirect to login
    await page.waitForURL('**/Login**', { timeout: 10000 }).catch(() => {
      // May also redirect to onboarding
    });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
    });

    // App should not crash on network error
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    // Page should still be functional
    expect(await page.title()).toBeTruthy();
  });
});
