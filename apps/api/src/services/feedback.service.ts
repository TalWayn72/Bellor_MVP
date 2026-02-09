/**
 * Feedback Service
 * CRUD operations for user feedback submissions
 */

import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

interface CreateFeedbackInput {
  userId: string;
  type: string;
  title: string;
  description: string;
  rating?: number;
}

interface ListFeedbackParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export const FeedbackService = {
  async createFeedback(input: CreateFeedbackInput) {
    const { userId, type, title, description, rating } = input;

    return prisma.feedback.create({
      data: { userId, type, title, description, rating },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, nickname: true } },
      },
    });
  },

  async listFeedback(params: ListFeedbackParams) {
    const { status, limit = 20, offset = 0 } = params;

    const where: Prisma.FeedbackWhereInput = {};
    if (status) where.status = status;

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return {
      feedbacks,
      pagination: { total, limit, offset, hasMore: offset + feedbacks.length < total },
    };
  },
};
