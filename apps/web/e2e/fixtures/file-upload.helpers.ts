/**
 * File upload helpers for full-stack E2E tests
 * Provides utilities for testing file upload scenarios
 */
import { Page } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_ASSETS_DIR = resolve(__dirname, '../test-assets');

/** Get absolute path to a test asset file */
export function getTestFilePath(filename: string): string {
  return resolve(TEST_ASSETS_DIR, filename);
}

/** Available test files */
export const TEST_FILES = {
  validImage: 'valid-image.jpg',
  sampleAvatar: 'sample-avatar.png',
  oversizedImage: 'oversized-image.jpg',
  invalidImage: 'invalid-image.txt',
  validAudio: 'valid-audio.mp3',
} as const;

/** Upload a test file to a file input element */
export async function uploadTestFile(
  page: Page,
  selector: string,
  filename: keyof typeof TEST_FILES | string,
): Promise<void> {
  const resolvedName = TEST_FILES[filename as keyof typeof TEST_FILES] || filename;
  const filePath = getTestFilePath(resolvedName);

  const fileInput = page.locator(selector);
  await fileInput.setInputFiles(filePath);
}

/** Upload a file using the file chooser dialog (for non-input triggers) */
export async function uploadViaFileChooser(
  page: Page,
  triggerSelector: string,
  filename: keyof typeof TEST_FILES | string,
): Promise<void> {
  const resolvedName = TEST_FILES[filename as keyof typeof TEST_FILES] || filename;
  const filePath = getTestFilePath(resolvedName);

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator(triggerSelector).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
}

/** Simulate drag and drop file upload */
export async function uploadViaDragDrop(
  page: Page,
  dropZoneSelector: string,
  filename: keyof typeof TEST_FILES | string,
): Promise<void> {
  const resolvedName = TEST_FILES[filename as keyof typeof TEST_FILES] || filename;
  const filePath = getTestFilePath(resolvedName);

  // Read file buffer
  const fs = await import('fs');
  const buffer = fs.readFileSync(filePath);
  const mimeType = resolvedName.endsWith('.png')
    ? 'image/png'
    : resolvedName.endsWith('.jpg')
      ? 'image/jpeg'
      : resolvedName.endsWith('.mp3')
        ? 'audio/mpeg'
        : 'application/octet-stream';

  // Create DataTransfer with file
  const dataTransfer = await page.evaluateHandle(
    ({ data, name, type }) => {
      const dt = new DataTransfer();
      const bytes = new Uint8Array(data);
      const file = new File([bytes], name, { type });
      dt.items.add(file);
      return dt;
    },
    { data: Array.from(buffer), name: resolvedName, type: mimeType },
  );

  // Dispatch drop event
  const dropZone = page.locator(dropZoneSelector);
  await dropZone.dispatchEvent('dragenter', { dataTransfer });
  await dropZone.dispatchEvent('dragover', { dataTransfer });
  await dropZone.dispatchEvent('drop', { dataTransfer });
}
