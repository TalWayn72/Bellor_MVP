/**
 * Storage Utilities
 * URL generation, MIME validation, file naming
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { env } from '../../config/env.js';

// Get current directory for local storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');

export const BUCKET = env.R2_BUCKET || 'bellor-media';
export const CDN_URL = env.CDN_URL;

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadResult {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

export interface ImageUploadOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Generate unique file key
 */
export function generateFileKey(folder: string, originalName: string, userId: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.webp';
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  return `${folder}/${userId}/${timestamp}-${randomId}${ext}`;
}

/**
 * Get public URL for a file (cloud storage)
 */
export function getPublicUrl(key: string): string {
  if (CDN_URL) {
    return `${CDN_URL}/${key}`;
  }
  return `${env.R2_ENDPOINT}/${BUCKET}/${key}`;
}

/**
 * Get local URL for a file
 */
export function getLocalUrl(key: string): string {
  return `http://localhost:${env.PORT}/uploads/${key}`;
}

/**
 * Ensure local upload directory exists
 */
export async function ensureLocalDir(key: string): Promise<string> {
  const dir = path.join(LOCAL_UPLOADS_DIR, path.dirname(key));
  await fs.mkdir(dir, { recursive: true });
  return path.join(LOCAL_UPLOADS_DIR, key);
}

/**
 * Save file locally
 */
export async function saveFileLocally(key: string, buffer: Buffer): Promise<string> {
  const filePath = await ensureLocalDir(key);
  await fs.writeFile(filePath, buffer);
  return getLocalUrl(key);
}

/**
 * Validate file type and size
 */
export function validateFile(
  contentType: string,
  size: number,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }
  if (size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }
  return { valid: true };
}
