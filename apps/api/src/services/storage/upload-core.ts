/**
 * Upload Core
 * S3 integration, local fallback, and shared upload utilities
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  UploadResult,
  BUCKET,
  CDN_URL,
  generateFileKey,
  getPublicUrl,
  saveFileLocally,
  validateFile,
} from './storage-utils.js';
import { logger } from '../../lib/logger.js';

/**
 * Upload a buffer to S3 and/or local storage.
 *
 * Strategy (fixes ISSUE-103 — recurring "Load failed"):
 * - CDN_URL set + S3 configured → upload to R2, return CDN URL
 * - S3 configured but NO CDN_URL → upload to R2 (backup) + save locally, return local URL
 * - No S3 → save locally only, return local URL
 *
 * This ensures the returned URL is ALWAYS loadable by browsers.
 * Raw R2 S3 endpoint URLs require AWS auth and are never returned.
 */
export async function uploadToStorage(
  s3Client: S3Client | null,
  key: string,
  buffer: Buffer,
  contentType: string,
  cacheControl: string
): Promise<UploadResult> {
  if (s3Client) {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
    }));

    // If CDN_URL is configured, R2 files are publicly accessible via CDN
    if (CDN_URL) {
      return {
        url: getPublicUrl(key),
        key,
        contentType,
        size: buffer.length,
      };
    }

    // No CDN — also save locally so the file is servable via Nginx/Fastify
    logger.info('storage', 'R2 upload OK but no CDN_URL — saving locally too', { key });
    const url = await saveFileLocally(key, buffer);
    return { url, key, contentType, size: buffer.length };
  }

  const url = await saveFileLocally(key, buffer);
  return { url, key, contentType, size: buffer.length };
}

// Re-export commonly used utilities for convenience
export {
  generateFileKey,
  getPublicUrl,
  saveFileLocally,
  validateFile,
  BUCKET,
};
export type { UploadResult };
