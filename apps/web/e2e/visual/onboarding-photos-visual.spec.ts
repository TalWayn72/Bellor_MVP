/**
 * Visual Regression Tests - Onboarding Photo Upload (Step 8)
 *
 * Verifies that the photo grid renders correctly with:
 * - Uploaded photos displayed in slots
 * - Broken/failed images showing "Tap to retry" state
 * - Empty slots with + icon
 * - Main photo indicator (star badge)
 *
 * Run: npm run test:visual -- --grep "Onboarding Photos"
 * Update baselines: npm run test:visual:update -- --grep "Onboarding Photos"
 */

import {
  test,
  expect,
  mockApiResponse,
  setupAuthenticatedUser,
  waitForLoadingComplete,
} from '../fixtures';

const MOCK_PHOTO_URLS = [
  'https://mock-cdn.test/photo-1.webp',
  'https://mock-cdn.test/photo-2.webp',
  'https://mock-cdn.test/photo-3.webp',
];

/** Serve a 1x1 colored PNG for mocked photo URLs (deterministic visual) */
function coloredPixelPng(r: number, g: number, b: number): Buffer {
  // Minimal valid 1x1 PNG with a single colored pixel
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  ]);
  const ihdr = createChunk('IHDR', Buffer.from([
    0, 0, 0, 1, // width=1
    0, 0, 0, 1, // height=1
    8,           // bit depth
    2,           // color type: RGB
    0, 0, 0,    // compression, filter, interlace
  ]));
  // IDAT: deflate(filter_byte=0, R, G, B)
  const { deflateSync } = require('zlib');
  const raw = Buffer.from([0, r, g, b]);
  const compressed = deflateSync(raw);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, ihdr, idat, iend]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const { crc32 } = require('buffer');
  const crcBuf = Buffer.alloc(4);
  // Manual CRC32 for PNG
  let crc = 0xFFFFFFFF;
  const combined = Buffer.concat([typeB, data]);
  for (const byte of combined) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  crcBuf.writeUInt32BE((crc ^ 0xFFFFFFFF) >>> 0);
  return Buffer.concat([len, typeB, data, crcBuf]);
}

/** Setup step 8 with mocked photos in state */
async function setupPhotoStep(page: import('@playwright/test').Page, photos: string[]) {
  const user = await setupAuthenticatedUser(page, {
    nickname: 'PhotoTester',
    profileImages: photos,
  });

  // Mock auth to return user with photos
  await mockApiResponse(page, '**/api/v1/auth/me', {
    ...user,
    profile_images: photos,
    main_profile_image_url: photos[0] || '',
  });
  await mockApiResponse(page, '**/api/v1/users/me', {
    ...user,
    profile_images: photos,
    main_profile_image_url: photos[0] || '',
  });

  // Mock upload endpoint
  await mockApiResponse(page, '**/api/v1/uploads/profile-image', {
    success: true,
    data: { url: 'https://mock-cdn.test/new-photo.webp', key: 'test', profileImages: photos },
  });

  return user;
}

test.describe('Visual Regression - Onboarding Photos (Step 8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('photo grid with 3 uploaded photos', async ({ page }) => {
    await setupPhotoStep(page, MOCK_PHOTO_URLS);

    // Serve mock images as colored squares (deterministic)
    const colors = [[66, 133, 244], [234, 67, 53], [52, 168, 83]];
    for (let i = 0; i < MOCK_PHOTO_URLS.length; i++) {
      const png = coloredPixelPng(colors[i][0], colors[i][1], colors[i][2]);
      await page.route(MOCK_PHOTO_URLS[i] + '*', (route) => {
        route.fulfill({ status: 200, contentType: 'image/png', body: png });
      });
    }

    await page.goto('/Onboarding?step=8');
    await waitForLoadingComplete(page);

    // Wait for images to render
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('onboarding-photos-3-uploaded.png', {
      maxDiffPixels: 150,
    });
  });

  test('photo grid with broken image shows tap-to-retry', async ({ page }) => {
    const photosWithBroken = [
      MOCK_PHOTO_URLS[0],
      'https://mock-cdn.test/broken-photo.webp',
      MOCK_PHOTO_URLS[2],
    ];
    await setupPhotoStep(page, photosWithBroken);

    // Serve valid images
    const png = coloredPixelPng(66, 133, 244);
    await page.route(MOCK_PHOTO_URLS[0] + '*', (route) => {
      route.fulfill({ status: 200, contentType: 'image/png', body: png });
    });
    const png2 = coloredPixelPng(52, 168, 83);
    await page.route(MOCK_PHOTO_URLS[2] + '*', (route) => {
      route.fulfill({ status: 200, contentType: 'image/png', body: png2 });
    });

    // Broken image returns 404 (all retries will fail)
    await page.route('**/broken-photo*', (route) => {
      route.fulfill({ status: 404, body: 'Not Found' });
    });

    await page.goto('/Onboarding?step=8');
    await waitForLoadingComplete(page);

    // Wait for retries to exhaust (2 retries + final broken state)
    await page.waitForTimeout(3000);

    // Verify "Tap to retry" is visible
    await expect(page.locator('text=Tap to retry')).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveScreenshot('onboarding-photos-broken-image.png', {
      maxDiffPixels: 150,
    });
  });

  test('empty photo grid (no uploads yet)', async ({ page }) => {
    await setupPhotoStep(page, []);

    await page.goto('/Onboarding?step=8');
    await waitForLoadingComplete(page);
    await page.waitForTimeout(500);

    // NEXT button should be disabled
    const nextBtn = page.getByRole('button', { name: /NEXT/i });
    await expect(nextBtn).toBeDisabled();

    await expect(page).toHaveScreenshot('onboarding-photos-empty.png', {
      maxDiffPixels: 150,
    });
  });
});
