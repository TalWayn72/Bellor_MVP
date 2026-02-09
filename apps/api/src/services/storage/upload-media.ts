/**
 * Upload Media - Audio, stories, and generic file uploads
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import {
  UploadResult, ImageUploadOptions,
  ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_AUDIO_TYPES,
  MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, MAX_AUDIO_SIZE,
  generateFileKey, getPublicUrl, saveFileLocally, validateFile, BUCKET,
} from './storage-utils.js';
import { uploadToStorage } from './upload-core.js';

/** Upload story media (image or video) */
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

  if (!isVideo && ALLOWED_IMAGE_TYPES.includes(contentType)) {
    uploadBuffer = await sharp(buffer)
      .resize(1080, 1920, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp', { quality: 85 })
      .toBuffer();
    finalContentType = 'image/webp';
  }

  const key = generateFileKey('stories', originalName, userId);
  const result = await uploadToStorage(
    s3Client, key, uploadBuffer, finalContentType, 'public, max-age=86400'
  );

  let thumbnailUrl: string | undefined;
  if (!isVideo) {
    thumbnailUrl = await createThumbnail(s3Client, buffer, key);
  }

  return { ...result, thumbnailUrl };
}

/** Create a thumbnail for story images */
async function createThumbnail(
  s3Client: S3Client | null,
  buffer: Buffer,
  originalKey: string
): Promise<string> {
  const thumbnailBuffer = await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .toFormat('webp', { quality: 70 })
    .toBuffer();
  const thumbnailKey = originalKey.replace(/\.[^.]+$/, '-thumb.webp');

  if (s3Client) {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET, Key: thumbnailKey, Body: thumbnailBuffer,
      ContentType: 'image/webp', CacheControl: 'public, max-age=86400',
    }));
    return getPublicUrl(thumbnailKey);
  }

  return saveFileLocally(thumbnailKey, thumbnailBuffer);
}

/** Upload audio response */
export async function uploadAudio(
  s3Client: S3Client | null,
  buffer: Buffer,
  contentType: string,
  originalName: string,
  userId: string
): Promise<UploadResult> {
  const validation = validateFile(
    contentType, buffer.length, ALLOWED_AUDIO_TYPES, MAX_AUDIO_SIZE
  );
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const key = generateFileKey('audio', originalName, userId);
  return uploadToStorage(
    s3Client, key, buffer, contentType, 'public, max-age=86400'
  );
}

/** Generic file upload to a specific folder */
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
    const validation = validateFile(
      contentType, buffer.length, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE
    );
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
  return uploadToStorage(
    s3Client, key, uploadBuffer, finalContentType, 'public, max-age=31536000'
  );
}
