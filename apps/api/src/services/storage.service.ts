import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { env } from '../config/env.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Get current directory for local storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// R2/S3 Client Configuration
const s3Client = env.R2_ENDPOINT ? new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  },
}) : null;

const BUCKET = env.R2_BUCKET || 'bellor-media';
const CDN_URL = env.CDN_URL;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadResult {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

interface ImageUploadOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Generate unique file key
 */
function generateFileKey(folder: string, originalName: string, userId: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.webp';
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  return `${folder}/${userId}/${timestamp}-${randomId}${ext}`;
}

/**
 * Get public URL for a file (cloud storage)
 */
function getPublicUrl(key: string): string {
  if (CDN_URL) {
    return `${CDN_URL}/${key}`;
  }
  // Fallback to S3-style URL
  return `${env.R2_ENDPOINT}/${BUCKET}/${key}`;
}

/**
 * Get local URL for a file
 */
function getLocalUrl(key: string): string {
  return `http://localhost:${env.PORT}/uploads/${key}`;
}

/**
 * Ensure local upload directory exists
 */
async function ensureLocalDir(key: string): Promise<string> {
  const dir = path.join(LOCAL_UPLOADS_DIR, path.dirname(key));
  await fs.mkdir(dir, { recursive: true });
  return path.join(LOCAL_UPLOADS_DIR, key);
}

/**
 * Save file locally
 */
async function saveFileLocally(key: string, buffer: Buffer): Promise<string> {
  const filePath = await ensureLocalDir(key);
  await fs.writeFile(filePath, buffer);
  return getLocalUrl(key);
}

/**
 * Validate file type and size
 */
function validateFile(
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

export const storageService = {
  /**
   * Check if cloud storage is configured
   * Returns true even when not configured (falls back to local storage)
   */
  isConfigured(): boolean {
    // Always return true - we support local fallback
    return true;
  },

  /**
   * Check if using cloud storage
   */
  isCloudConfigured(): boolean {
    return s3Client !== null && !!env.R2_ENDPOINT;
  },

  /**
   * Upload profile image with optimization
   */
  async uploadProfileImage(
    buffer: Buffer,
    contentType: string,
    originalName: string,
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    // Validate
    const validation = validateFile(contentType, buffer.length, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Optimize image with sharp
    const { width = 800, height = 800, quality = 85, format = 'webp' } = options;

    const optimizedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat(format, { quality })
      .toBuffer();

    const key = generateFileKey('profiles', `${originalName}.${format}`, userId);

    // Use cloud storage if configured, otherwise save locally
    if (s3Client) {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: optimizedBuffer,
        ContentType: `image/${format}`,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      }));

      return {
        url: getPublicUrl(key),
        key,
        contentType: `image/${format}`,
        size: optimizedBuffer.length,
      };
    }

    // Local storage fallback
    const url = await saveFileLocally(key, optimizedBuffer);
    return {
      url,
      key,
      contentType: `image/${format}`,
      size: optimizedBuffer.length,
    };
  },

  /**
   * Upload story media (image or video)
   */
  async uploadStoryMedia(
    buffer: Buffer,
    contentType: string,
    originalName: string,
    userId: string
  ): Promise<UploadResult & { thumbnailUrl?: string }> {
    const isVideo = contentType.startsWith('video/');
    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    const validation = validateFile(contentType, buffer.length, allowedTypes, maxSize);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let uploadBuffer = buffer;
    let finalContentType = contentType;
    let thumbnailUrl: string | undefined;

    // Optimize images
    if (!isVideo && ALLOWED_IMAGE_TYPES.includes(contentType)) {
      uploadBuffer = await sharp(buffer)
        .resize(1080, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat('webp', { quality: 85 })
        .toBuffer();
      finalContentType = 'image/webp';
    }

    const key = generateFileKey('stories', originalName, userId);

    // Use cloud storage if configured
    if (s3Client) {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: uploadBuffer,
        ContentType: finalContentType,
        CacheControl: 'public, max-age=86400', // 1 day cache
      }));

      // Generate thumbnail for images
      if (!isVideo) {
        const thumbnailBuffer = await sharp(buffer)
          .resize(200, 200, { fit: 'cover' })
          .toFormat('webp', { quality: 70 })
          .toBuffer();

        const thumbnailKey = key.replace(/\.[^.]+$/, '-thumb.webp');

        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=86400',
        }));

        thumbnailUrl = getPublicUrl(thumbnailKey);
      }

      return {
        url: getPublicUrl(key),
        key,
        contentType: finalContentType,
        size: uploadBuffer.length,
        thumbnailUrl,
      };
    }

    // Local storage fallback
    const url = await saveFileLocally(key, uploadBuffer);

    // Generate thumbnail locally
    if (!isVideo) {
      const thumbnailBuffer = await sharp(buffer)
        .resize(200, 200, { fit: 'cover' })
        .toFormat('webp', { quality: 70 })
        .toBuffer();

      const thumbnailKey = key.replace(/\.[^.]+$/, '-thumb.webp');
      thumbnailUrl = await saveFileLocally(thumbnailKey, thumbnailBuffer);
    }

    return {
      url,
      key,
      contentType: finalContentType,
      size: uploadBuffer.length,
      thumbnailUrl,
    };
  },

  /**
   * Upload audio response
   */
  async uploadAudio(
    buffer: Buffer,
    contentType: string,
    originalName: string,
    userId: string
  ): Promise<UploadResult> {
    const validation = validateFile(contentType, buffer.length, ALLOWED_AUDIO_TYPES, MAX_AUDIO_SIZE);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const key = generateFileKey('audio', originalName, userId);

    // Use cloud storage if configured
    if (s3Client) {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=86400',
      }));

      return {
        url: getPublicUrl(key),
        key,
        contentType,
        size: buffer.length,
      };
    }

    // Local storage fallback
    const url = await saveFileLocally(key, buffer);
    return {
      url,
      key,
      contentType,
      size: buffer.length,
    };
  },

  /**
   * Generic file upload to a specific folder
   * Used for drawings and other custom uploads
   */
  async uploadFile(
    buffer: Buffer,
    contentType: string,
    originalName: string,
    userId: string,
    folder: string,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    const isImage = contentType.startsWith('image/');

    // Validate image files
    if (isImage) {
      const validation = validateFile(contentType, buffer.length, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    let uploadBuffer = buffer;
    let finalContentType = contentType;

    // Optimize images (like drawings)
    if (isImage) {
      const { width = 1200, height = 1200, quality = 90, format = 'webp' } = options;

      uploadBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat(format, { quality })
        .toBuffer();

      finalContentType = `image/${format}`;
    }

    const key = generateFileKey(folder, originalName, userId);

    // Use cloud storage if configured
    if (s3Client) {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: uploadBuffer,
        ContentType: finalContentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      }));

      return {
        url: getPublicUrl(key),
        key,
        contentType: finalContentType,
        size: uploadBuffer.length,
      };
    }

    // Local storage fallback
    const url = await saveFileLocally(key, uploadBuffer);
    return {
      url,
      key,
      contentType: finalContentType,
      size: uploadBuffer.length,
    };
  },

  /**
   * Generate presigned URL for direct browser upload
   */
  async getPresignedUploadUrl(
    folder: string,
    fileName: string,
    contentType: string,
    userId: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    if (!s3Client) {
      throw new Error('Presigned URLs require cloud storage configuration');
    }

    const key = generateFileKey(folder, fileName, userId);

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn }
    );

    return {
      uploadUrl,
      publicUrl: getPublicUrl(key),
      key,
    };
  },

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    if (s3Client) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }));
    } else {
      // Local storage - try to delete file
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
