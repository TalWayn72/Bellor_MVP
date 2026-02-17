/**
 * Admin Controller - User Management Handlers
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { userActionSchema } from './admin-schemas.js';

export async function listUsers(
  request: FastifyRequest<{
    Querystring: {
      limit?: string; offset?: string; search?: string;
      isBlocked?: string; isPremium?: string; isAdmin?: string;
      sortBy?: string; sortOrder?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { limit = '20', offset = '0', search, isBlocked, isPremium, isAdmin, sortBy = 'createdAt', sortOrder = 'desc' } = request.query;
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isBlocked !== undefined) where.isBlocked = isBlocked === 'true';
    if (isPremium !== undefined) where.isPremium = isPremium === 'true';
    if (isAdmin !== undefined) where.isAdmin = isAdmin === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip: parseInt(offset), take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          profileImages: true, gender: true, isVerified: true, isBlocked: true,
          isPremium: true, isAdmin: true, responseCount: true, chatCount: true,
          missionCompletedCount: true, createdAt: true, lastActiveAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        users,
        pagination: { total, limit: parseInt(limit), offset: parseInt(offset), hasMore: parseInt(offset) + users.length < total },
      },
    });
  } catch {
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list users' } });
  }
}

export async function userAction(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const data = userActionSchema.parse(request.body);
    const adminId = request.user?.id;

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    const updateData: Prisma.UserUpdateInput = {};
    switch (data.action) {
      case 'block': updateData.isBlocked = true; break;
      case 'unblock': updateData.isBlocked = false; break;
      case 'make_admin': updateData.isAdmin = true; break;
      case 'remove_admin': updateData.isAdmin = false; break;
      case 'make_premium':
        updateData.isPremium = true;
        updateData.premiumExpiresAt = new Date(Date.now() + 30 * 86400000);
        break;
      case 'remove_premium':
        updateData.isPremium = false;
        updateData.premiumExpiresAt = null;
        break;
    }

    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, isBlocked: true, isPremium: true, isAdmin: true },
    });

    return reply.send({ success: true, data: { user: updatedUser, action: data.action, performedBy: adminId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to perform user action' } });
  }
}
