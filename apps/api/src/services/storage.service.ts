/**
 * Storage Service
 * S3/R2 initialization, isConfigured, deleteFile, getPresignedUrl
 * Upload methods delegated to storage/storage-upload.ts
 */

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env.js';
import {
  UploadResult,
  ImageUploadOptions,
  LOCAL_UPLOADS_DIR,
  BUCKET,
  generateFileKey,
  getPublicUrl,
} from './storage/storage-utils.js';
import {
  uploadProfileImage,
  uploadStoryMedia,
  uploadAudio,
  uploadFile,
} from './storage/storage-upload.js';

// Re-export types for backward compatibility
export type { UploadResult, ImageUploadOptions };

// R2/S3 Client Configuration
const s3Client = env.R2_ENDPOINT ? new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  },
}) : null;

export const storageService = {
  /**
   * Check if cloud storage is configured
   * Returns true even when not configured (falls back to local storage)
   */
  isConfigured(): boolean {
    return true;
  },

  /**
   * Check if using cloud storage
   */
  isCloudConfigured(): boolean {
    return s3Client !== null && !!env.R2_ENDPOINT;
  },

  async uploadProfileImage(
    buffer: Buffer, contentType: string, originalName: string,
    userId: string, options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    return uploadProfileImage(s3Client, buffer, contentType, originalName, userId, options);
  },

  async uploadStoryMedia(
    buffer: Buffer, contentType: string, originalName: string, userId: string
  ): Promise<UploadResult & { thumbnailUrl?: string }> {
    return uploadStoryMedia(s3Client, buffer, contentType, originalName, userId);
  },

  async uploadAudio(
    buffer: Buffer, contentType: string, originalName: string, userId: string
  ): Promise<UploadResult> {
    return uploadAudio(s3Client, buffer, contentType, originalName, userId);
  },

  async uploadFile(
    buffer: Buffer, contentType: string, originalName: string,
    userId: string, folder: string, options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    return uploadFile(s3Client, buffer, contentType, originalName, userId, folder, options);
  },

  /**
   * Generate presigned URL for direct browser upload
   */
  async getPresignedUploadUrl(
    folder: string, fileName: string, contentType: string,
    userId: string, expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    if (!s3Client) {
      throw new Error('Presigned URLs require cloud storage configuration');
    }

    const key = generateFileKey(folder, fileName, userId);

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
      { expiresIn }
    );

    return { uploadUrl, publicUrl: getPublicUrl(key), key };
  },

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    if (s3Client) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } else {
      try {
        const filePath = path.join(LOCAL_UPLOADS_DIR, key);
        await fs.unlink(filePath);
      } catch (e) {
        // File might not exist, ignore error
      }
    }
  },

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.deleteFile(key)));
  },
};
