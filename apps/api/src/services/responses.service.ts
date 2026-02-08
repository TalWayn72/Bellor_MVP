import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import {
  CreateResponseInput,
  ListResponsesParams,
  RESPONSE_INCLUDE,
} from './responses/response-utils.js';

export class ResponsesService {
  /**
   * Create a new response
   */
  static async createResponse(data: CreateResponseInput) {
    const response = await prisma.response.create({
      data: {
        userId: data.userId,
        missionId: data.missionId,
        responseType: data.responseType,
        content: data.content,
        textContent: data.textContent,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        isPublic: data.isPublic ?? true,
      },
      include: RESPONSE_INCLUDE,
    });

    // Update user's response count
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        responseCount: { increment: 1 },
        missionCompletedCount: data.missionId ? { increment: 1 } : undefined,
      },
    });

    return response;
  }

  /**
   * Get response by ID
   */
  static async getResponseById(id: string) {
    const response = await prisma.response.findUnique({
      where: { id },
      include: RESPONSE_INCLUDE,
    });

    if (!response) {
      throw new Error('Response not found');
    }

    return response;
  }

  /**
   * List responses with pagination
   */
  static async listResponses(params: ListResponsesParams) {
    const { limit, offset, userId, missionId, responseType, isPublic } = params;

    const where: Prisma.ResponseWhereInput = {};
    if (userId) where.userId = userId;
    if (missionId) where.missionId = missionId;
    if (responseType) where.responseType = responseType;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: RESPONSE_INCLUDE,
      }),
      prisma.response.count({ where }),
    ]);

    return {
      responses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + responses.length < total,
      },
    };
  }

  /**
   * Get responses for a mission (feed)
   */
  static async getMissionResponses(missionId: string, params: { limit: number; offset: number }) {
    return this.listResponses({ ...params, missionId, isPublic: true });
  }

  /**
   * Get user's responses
   */
  static async getUserResponses(userId: string, params: { limit: number; offset: number }) {
    return this.listResponses({ ...params, userId });
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(id: string) {
    return prisma.response.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Increment like count
   */
  static async incrementLikeCount(id: string) {
    return prisma.response.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });
  }

  /**
   * Delete a response
   */
  static async deleteResponse(id: string, userId: string) {
    const response = await prisma.response.findUnique({ where: { id } });

    if (!response) {
      throw new Error('Response not found');
    }
    if (response.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.response.delete({ where: { id } });

    // Decrement user's response count
    await prisma.user.update({
      where: { id: userId },
      data: { responseCount: { decrement: 1 } },
    });
  }
}
