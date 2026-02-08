/**
 * Storage Upload Methods
 * Upload methods for each file type (profile, story, audio, generic)
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import {
  UploadResult,
  ImageUploadOptions,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_AUDIO_SIZE,
  generateFileKey,
  getPublicUrl,
  saveFileLocally,
  validateFile,
  BUCKET,
} from './storage-utils.js';

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
  const validation = validateFile(contentType, buffer.length, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { width = 800, height = 800, quality = 85, format = 'webp' } = options;

  const optimizedBuffer = await sharp(buffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .toFormat(format, { quality })
    .toBuffer();

  const key = generateFileKey('profiles', `${originalName}.${format}`, userId);

  if (s3Client) {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: `image/${format}`,
      CacheControl: 'public, max-age=31536000',
    }));

    return { url: getPublicUrl(key), key, contentType: `image/${format}`, size: optimizedBuffer.length };
  }

  const url = await saveFileLocally(key, optimizedBuffer);
  return { url, key, contentType: `image/${format}`, size: optimizedBuffer.length };
}

/**
 * Upload story media (image or video)
 */
export async function uploadStoryMedia(
  s3Client: S3Client | null,
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

  if (!isVideo && ALLOWED_IMAGE_TYPES.includes(contentType)) {
    uploadBuffer = await sharp(buffer)
      .resize(1080, 1920, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp', { quality: 85 })
      .toBuffer();
    finalContentType = 'image/webp';
  }

  const key = generateFileKey('stories', originalName, userId);

  if (s3Client) {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: uploadBuffer,
      ContentType: finalContentType, CacheControl: 'public, max-age=86400',
    }));

    if (!isVideo) {
      const thumbnailBuffer = await sharp(buffer)
        .resize(200, 200, { fit: 'cover' }).toFormat('webp', { quality: 70 }).toBuffer();
      const thumbnailKey = key.replace(/\.[^.]+$/, '-thumb.webp');
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET, Key: thumbnailKey, Body: thumbnailBuffer,
        ContentType: 'image/webp', CacheControl: 'public, max-age=86400',
      }));
      thumbnailUrl = getPublicUrl(thumbnailKey);
    }

    return { url: getPublicUrl(key), key, contentType: finalContentType, size: uploadBuffer.length, thumbnailUrl };
  }

  const url = await saveFileLocally(key, uploadBuffer);
  if (!isVideo) {
    const thumbnailBuffer = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' }).toFormat('webp', { quality: 70 }).toBuffer();
    const thumbnailKey = key.replace(/\.[^.]+$/, '-thumb.webp');
    thumbnailUrl = await saveFileLocally(thumbnailKey, thumbnailBuffer);
  }

  return { url, key, contentType: finalContentType, size: uploadBuffer.length, thumbnailUrl };
}

/**
 * Upload audio response
 */
export async function uploadAudio(
  s3Client: S3Client | null,
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

  if (s3Client) {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: buffer,
      ContentType: contentType, CacheControl: 'public, max-age=86400',
    }));
    return { url: getPublicUrl(key), key, contentType, size: buffer.length };
  }

  const url = await saveFileLocally(key, buffer);
  return { url, key, contentType, size: buffer.length };
}

/**
 * Generic file upload to a specific folder
 */
export async function uploadFile(
  s3Client: S3Client | null,
  buffer: Buffer,
  contentType: string,
  originalName: string,
  userId: string,
  folder: string,
  options: ImageUploadOptions = {}
): Promise<UploadResult> {
  const isImage = contentType.startsWith('image/');

  if (isImage) {
    const validation = validateFile(contentType, buffer.length, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  let uploadBuffer = buffer;
  let finalContentType = contentType;

  if (isImage) {
    const { width = 1200, height = 1200, quality = 90, format = 'webp' } = options;
    uploadBuffer = await sharp(buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toFormat(format, { quality })
      .toBuffer();
    finalContentType = `image/${format}`;
  }

  const key = generateFileKey(folder, originalName, userId);

  if (s3Client) {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: uploadBuffer,
      ContentType: finalContentType, CacheControl: 'public, max-age=31536000',
    }));
    return { url: getPublicUrl(key), key, contentType: finalContentType, size: uploadBuffer.length };
  }

  const url = await saveFileLocally(key, uploadBuffer);
  return { url, key, contentType: finalContentType, size: uploadBuffer.length };
}
