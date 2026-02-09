/**
 * Upload Images
 * Profile image upload with sharp optimization
 */

import { S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import {
  UploadResult,
  ImageUploadOptions,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  generateFileKey,
  validateFile,
} from './storage-utils.js';
import { uploadToStorage } from './upload-core.js';

/**
 * Upload profile image with optimization
 */
export async function uploadProfileImage(
  s3Client: S3Client | null,
  buffer: Buffer,
  contentType: string,
  originalName: string,
  userId: string,
  options: ImageUploadOptions = {}
): Promise<UploadResult> {
  const validation = validateFile(
    contentType, buffer.length, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE
  );
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const {
    width = 800,
    height = 800,
    quality = 85,
    format = 'webp',
  } = options;

  const optimizedBuffer = await sharp(buffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .toFormat(format, { quality })
    .toBuffer();

  const key = generateFileKey(
    'profiles', `${originalName}.${format}`, userId
  );

  return uploadToStorage(
    s3Client, key, optimizedBuffer,
    `image/${format}`, 'public, max-age=31536000'
  );
}
