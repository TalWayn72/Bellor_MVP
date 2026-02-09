import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UsersService } from '../services/users.service.js';
import { securityLogger } from '../security/logger.js';
import { listUsersQuerySchema, updateLanguageSchema, searchQuerySchema } from './users/users-schemas.js';
import { UsersDataController } from './users/users-data.controller.js';
import { UsersProfileController } from './users/users-profile.controller.js';

// Re-export sub-modules for backward compatibility
export { UsersDataController } from './users/users-data.controller.js';
export { UsersProfileController } from './users/users-profile.controller.js';
export * from './users/users-schemas.js';

export class UsersController {
  // Delegate data/GDPR handlers
  static getUserStats = UsersDataController.getUserStats;
  static exportUserData = UsersDataController.exportUserData;
  static deleteUserGDPR = UsersDataController.deleteUserGDPR;

  /** GET /users - List users with pagination and filters */
  static async listUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listUsersQuerySchema.parse(request.query);
      const result = await UsersService.listUsers({
        limit: query.limit, offset: query.offset,
        sortBy: query.sortBy, sortOrder: query.sortOrder,
        isBlocked: query.isBlocked, isPremium: query.isPremium,
        language: query.language,
      });
      return reply.code(200).send({ success: true, data: result.users, pagination: result.pagination });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: error.errors } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching users' } });
    }
  }

  /** GET /users/:id - Get user by ID */
  static async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const user = await UsersService.getUserById(id);
      return reply.code(200).send({ success: true, data: user });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching user' } });
    }
  }

  /** PATCH /users/:id - Update user profile (delegated to UsersProfileController) */
  static updateUserProfile = UsersProfileController.updateUserProfile;

  /** PATCH /users/:id/language - Update user language preference */
  static async updateUserLanguage(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      if (request.user?.userId !== id) {
        securityLogger.accessDenied(request, 'users.updateUserLanguage');
        return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'You can only update your own language preference' } });
      }
      const body = updateLanguageSchema.parse(request.body);
      const updatedUser = await UsersService.updateUserLanguage(id, body.language);
      return reply.code(200).send({ success: true, data: updatedUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid language', details: error.errors } });
      }
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while updating language' } });
    }
  }

  /** GET /users/search - Search users by name or email */
  static async searchUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = searchQuerySchema.parse(request.query);
      const result = await UsersService.searchUsers({ query: query.q, limit: query.limit, offset: query.offset });
      return reply.code(200).send({ success: true, data: result.users, pagination: result.pagination });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: error.errors } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while searching users' } });
    }
  }

  /** DELETE /users/:id - Deactivate user (soft delete) */
  static async deactivateUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      if (request.user?.userId !== id) {
        securityLogger.accessDenied(request, 'users.deactivateUser');
        return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'You can only deactivate your own account' } });
      }
      const result = await UsersService.deactivateUser(id);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while deactivating user' } });
    }
  }
}
