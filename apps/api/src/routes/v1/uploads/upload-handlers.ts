import { FastifyRequest, FastifyReply } from 'fastify';
import { storageService } from '../../../services/storage.service.js';
import { prisma } from '../../../lib/prisma.js';
import { validateUploadedFile } from '../../../middleware/upload.middleware.js';
import { securityLogger } from '../../../security/logger.js';

/** Helper: check storage and get file buffer with validation */
async function prepareUpload(request: FastifyRequest, reply: FastifyReply, type: 'image' | 'audio' | 'video') {
  if (!storageService.isConfigured()) {
    reply.code(503).send({ success: false, error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' } });
    return null;
  }
  const data = await request.file();
  if (!data) {
    reply.code(400).send({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    return null;
  }
  const buffer = await data.toBuffer();
  const validation = validateUploadedFile(buffer, data.filename, data.mimetype, type, request);
  if (!validation.valid) {
    reply.code(400).send({ success: false, error: { code: 'INVALID_FILE', message: validation.error || 'File validation failed' } });
    return null;
  }
  return { data, buffer, validation };
}

export async function handleProfileImageUpload(request: FastifyRequest, reply: FastifyReply) {
  try {
    const prepared = await prepareUpload(request, reply, 'image');
    if (!prepared) return;
    const { data, buffer, validation } = prepared;
    const result = await storageService.uploadProfileImage(buffer, data.mimetype, validation.sanitizedFilename, request.user!.userId);
    securityLogger.uploadSuccess(request, 'image', buffer.length);
    const user = await prisma.user.findUnique({ where: { id: request.user!.userId }, select: { profileImages: true } });
    const profileImages = user?.profileImages || [];
    profileImages.push(result.url);
    await prisma.user.update({ where: { id: request.user!.userId }, data: { profileImages } });
    return { success: true, data: { url: result.url, key: result.key, profileImages } };
  } catch (error) {
    request.log.error({ error }, 'Profile image upload failed');
    return reply.code(400).send({ success: false, error: { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed' } });
  }
}

export async function handleStoryMediaUpload(request: FastifyRequest, reply: FastifyReply) {
  try {
    const prepared = await prepareUpload(request, reply, 'image');
    if (!prepared) return;
    const { data, buffer, validation } = prepared;
    const result = await storageService.uploadStoryMedia(buffer, data.mimetype, validation.sanitizedFilename, request.user!.userId);
    securityLogger.uploadSuccess(request, 'image', buffer.length);
    return { success: true, data: { url: result.url, key: result.key, thumbnailUrl: result.thumbnailUrl, contentType: result.contentType, size: result.size } };
  } catch (error) {
    request.log.error({ error }, 'Story media upload failed');
    return reply.code(400).send({ success: false, error: { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed' } });
  }
}

export async function handleAudioUpload(request: FastifyRequest, reply: FastifyReply) {
  try {
    const prepared = await prepareUpload(request, reply, 'audio');
    if (!prepared) return;
    const { data, buffer, validation } = prepared;
    const result = await storageService.uploadAudio(buffer, data.mimetype, validation.sanitizedFilename, request.user!.userId);
    securityLogger.uploadSuccess(request, 'audio', buffer.length);
    return { success: true, data: { url: result.url, key: result.key, contentType: result.contentType, size: result.size } };
  } catch (error) {
    request.log.error({ error }, 'Audio upload failed');
    return reply.code(400).send({ success: false, error: { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed' } });
  }
}

export async function handleDrawingUpload(request: FastifyRequest, reply: FastifyReply) {
  try {
    const prepared = await prepareUpload(request, reply, 'image');
    if (!prepared) return;
    const { data, buffer, validation } = prepared;
    const result = await storageService.uploadFile(buffer, data.mimetype, validation.sanitizedFilename, request.user!.userId, 'drawings');
    securityLogger.uploadSuccess(request, 'image', buffer.length);
    await prisma.user.update({ where: { id: request.user!.userId }, data: { drawingUrl: result.url } });
    return { success: true, data: { url: result.url, key: result.key } };
  } catch (error) {
    request.log.error({ error }, 'Drawing upload failed');
    return reply.code(400).send({ success: false, error: { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed' } });
  }
}

export async function handleVideoUpload(request: FastifyRequest, reply: FastifyReply) {
  try {
    const prepared = await prepareUpload(request, reply, 'video');
    if (!prepared) return;
    const { data, buffer, validation } = prepared;
    const result = await storageService.uploadFile(buffer, data.mimetype, validation.sanitizedFilename, request.user!.userId, 'videos');
    securityLogger.uploadSuccess(request, 'video', buffer.length);
    return { success: true, data: { url: result.url, key: result.key, contentType: data.mimetype, size: buffer.length } };
  } catch (error) {
    request.log.error({ error }, 'Video upload failed');
    return reply.code(400).send({ success: false, error: { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed' } });
  }
}

export async function handleResponseMediaUpload(request: FastifyRequest, reply: FastifyReply) {
  try {
    const prepared = await prepareUpload(request, reply, 'image');
    if (!prepared) return;
    const { data, buffer, validation } = prepared;
    const result = await storageService.uploadFile(buffer, data.mimetype, validation.sanitizedFilename, request.user!.userId, 'responses');
    securityLogger.uploadSuccess(request, 'image', buffer.length);
    return { success: true, data: { url: result.url, key: result.key, contentType: data.mimetype, size: buffer.length } };
  } catch (error) {
    request.log.error({ error }, 'Response media upload failed');
    return reply.code(400).send({ success: false, error: { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed' } });
  }
}
