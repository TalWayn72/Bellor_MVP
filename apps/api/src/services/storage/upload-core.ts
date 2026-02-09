/**
 * Upload Core
 * S3 integration, local fallback, and shared upload utilities
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  UploadResult,
  BUCKET,
  generateFileKey,
  getPublicUrl,
  saveFileLocally,
  validateFile,
} from './storage-utils.js';

/**
 * Upload a buffer to S3 or local storage
 * Shared helper used by all upload functions
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

    return {
      url: getPublicUrl(key),
      key,
      contentType,
      size: buffer.length,
    };
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
