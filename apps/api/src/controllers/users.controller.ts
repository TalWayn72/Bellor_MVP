import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UsersService } from '../services/users.service.js';

// Validation schemas
const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'firstName', 'lastActiveAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  isBlocked: z.coerce.boolean().optional(),
  isPremium: z.coerce.boolean().optional(),
  language: z.enum(['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH']).optional(),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  // interests and profilePicture removed - not in schema
});

const updateLanguageSchema = z.object({
  language: z.enum(['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH']),
});

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export class UsersController {
  /**
   * GET /users
   * List users with pagination and filters
   */
  static async listUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listUsersQuerySchema.parse(request.query);

      const result = await UsersService.listUsers({
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        isBlocked: query.isBlocked,
        isPremium: query.isPremium,
        language: query.language,
      });

      return reply.code(200).send({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching users',
        },
      });
    }
  }

  /**
   * GET /users/:id
   * Get user by ID
   */
  static async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const user = await UsersService.getUserById(id);

      return reply.code(200).send({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching user',
        },
      });
    }
  }

  /**
   * PATCH /users/:id
   * Update user profile
   */
  static async updateUserProfile(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      // Verify user can only update their own profile
      if (request.user?.userId !== id) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own profile',
          },
        });
      }

      const body = updateProfileSchema.parse(request.body);

      const updatedUser = await UsersService.updateUserProfile(id, body);

      return reply.code(200).send({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        });
      }

      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating profile',
        },
      });
    }
  }

  /**
   * PATCH /users/:id/language
   * Update user language preference
   */
  static async updateUserLanguage(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      // Verify user can only update their own language
      if (request.user?.userId !== id) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own language preference',
          },
        });
      }

      const body = updateLanguageSchema.parse(request.body);

      const updatedUser = await UsersService.updateUserLanguage(id, body.language);

      return reply.code(200).send({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid language',
            details: error.errors,
          },
        });
      }

      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating language',
        },
      });
    }
  }

  /**
   * GET /users/search
   * Search users by name or email
   */
  static async searchUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = searchQuerySchema.parse(request.query);

      const result = await UsersService.searchUsers({
        query: query.q,
        limit: query.limit,
        offset: query.offset,
      });

      return reply.code(200).send({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while searching users',
        },
      });
    }
  }

  /**
   * DELETE /users/:id
   * Deactivate user (soft delete)
   */
  static async deactivateUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      // Verify user can only deactivate their own account
      if (request.user?.userId !== id) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only deactivate your own account',
          },
        });
      }

      const result = await UsersService.deactivateUser(id);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deactivating user',
        },
      });
    }
  }

  /**
   * GET /users/:id/stats
   * Get user statistics
   */
  static async getUserStats(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      // Verify user can only view their own stats
      if (request.user?.userId !== id) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own statistics',
          },
        });
      }

      const stats = await UsersService.getUserStats(id);

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching user statistics',
        },
      });
    }
  }
}
