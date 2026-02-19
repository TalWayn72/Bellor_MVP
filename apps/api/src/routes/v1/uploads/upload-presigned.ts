import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { storageService } from '../../../services/storage.service.js';
import { prisma } from '../../../lib/prisma.js';

export const presignedUrlQuerySchema = z.object({
  folder: z.enum(['profiles', 'stories', 'audio', 'responses']),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
});

/** GET /uploads/presigned-url - Get a presigned URL for direct browser upload */
export async function handlePresignedUrl(request: FastifyRequest, reply: FastifyReply) {
  if (!storageService.isConfigured()) {
    return reply.code(503).send({
      success: false,
      error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
    });
  }

  try {
    const query = presignedUrlQuerySchema.parse(request.query);
    const result = await storageService.getPresignedUploadUrl(
      query.folder, query.fileName, query.contentType, request.user!.userId
    );
    return { success: true, data: result };
  } catch (error) {
    request.log.error({ error }, 'Presigned URL generation failed');
    return reply.code(400).send({
      success: false,
      error: { code: 'PRESIGN_FAILED', message: error instanceof Error ? error.message : 'Failed to generate presigned URL' },
    });
  }
}

/** DELETE /uploads/profile-image - Remove a profile image */
export async function handleDeleteProfileImage(request: FastifyRequest, reply: FastifyReply) {
  const { url } = z.object({ url: z.string().min(1) }).parse(request.body);

  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: { profileImages: true },
    });

    const profileImages = (user?.profileImages || []).filter(img => img !== url);

    await prisma.user.update({
      where: { id: request.user!.userId },
      data: { profileImages },
    });

    // Try to delete from storage (best-effort)
    try {
      let key: string;
      if (url.startsWith('/uploads/')) {
        key = url.replace('/uploads/', '');
      } else {
        const urlObj = new URL(url);
        key = urlObj.pathname.replace(/^\//, '');
      }
      await storageService.deleteFile(key);
    } catch (e) {
      request.log.warn({ error: e, url }, 'Failed to delete file from storage');
    }

    return { success: true, data: { removed: url } };
  } catch (error) {
    request.log.error({ error }, 'Profile image deletion failed');
    return reply.code(400).send({
      success: false,
      error: { code: 'DELETE_FAILED', message: error instanceof Error ? error.message : 'Deletion failed' },
    });
  }
}
