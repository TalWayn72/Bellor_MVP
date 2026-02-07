import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UsersService } from '../services/users.service.js';
import { logger } from '../lib/logger.js';

// Custom date validation with detailed logging
const dateStringSchema = z.string()
  .refine((val) => {
    // Check format: yyyy-MM-dd
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(val)) {
      logger.warn('ZOD_VALIDATION', 'Date format invalid', { value: val, expectedFormat: 'yyyy-MM-dd' });
      return false;
    }
    return true;
  }, { message: 'Date must be in yyyy-MM-dd format' })
  .refine((val) => {
    // Check if valid date
    const parsed = new Date(val);
    if (isNaN(parsed.getTime())) {
      logger.warn('ZOD_VALIDATION', 'Date is invalid', { value: val });
      return false;
    }
    return true;
  }, { message: 'Invalid date' })
  .refine((val) => {
    // Check reasonable range (1900 to today - 18 years for adult users)
    const parsed = new Date(val);
    const year = parsed.getFullYear();
    const currentYear = new Date().getFullYear();
    const isValid = year >= 1900 && year <= currentYear - 18;
    if (!isValid) {
      logger.warn('ZOD_VALIDATION', 'Date year out of range', { value: val, year, validRange: `1900-${currentYear - 18}` });
    }
    return isValid;
  }, { message: 'Birth date must indicate age 18 or older' })
  .optional();

// Validation schemas
const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(20),
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
  nickname: z.string().min(1).max(50).optional(), // alias for firstName
  bio: z.string().max(500).optional().nullable(),
  birthDate: dateStringSchema, // validated date string yyyy-MM-dd
  date_of_birth: dateStringSchema, // snake_case alias from frontend
  gender: z.string().optional(), // relaxed - mapped in service layer
  profileImages: z.array(z.string()).optional(), // relaxed - allow any string (localhost URLs, etc.)
  profile_images: z.array(z.string()).optional(), // snake_case alias
  drawingUrl: z.string().optional().nullable(), // relaxed - allow any URL
  drawing_url: z.string().optional().nullable(), // snake_case alias
  sketchMethod: z.string().optional(), // relaxed
  sketch_method: z.string().optional(), // snake_case alias
  location: z.union([z.string(), z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })]).optional().nullable(),
  lookingFor: z.union([z.array(z.string()), z.string()]).optional(), // can be array or string
  looking_for: z.union([z.array(z.string()), z.string()]).optional(), // snake_case alias
  ageRangeMin: z.number().int().min(18).max(100).optional(),
  ageRangeMax: z.number().int().min(18).max(100).optional(),
  maxDistance: z.number().int().min(1).max(500).optional(),
  // Fields that don't exist in DB but frontend sends - passthrough to avoid errors
  age: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  interests: z.array(z.string()).optional(),
  last_active_date: z.string().optional(),
  main_profile_image_url: z.string().optional().nullable(),
  verification_photos: z.array(z.string()).optional(),
  onboarding_completed: z.boolean().optional(),
  gender_other: z.string().optional(),
  location_city: z.string().optional(),
  location_state: z.string().optional(),
  can_currently_relocate: z.boolean().optional(),
  can_language_travel: z.boolean().optional(),
  response_count: z.number().optional(),
  chat_count: z.number().optional(),
  mission_completed_count: z.number().optional(),
}).passthrough();

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
    const { id } = request.params;
    const requestBody = request.body as Record<string, any>;

    logger.info('USER_UPDATE', `Starting profile update for user ${id}`, {
      userId: id,
      requestUserId: request.user?.userId,
      fieldsProvided: Object.keys(requestBody || {}),
      dateFields: {
        birthDate: requestBody?.birthDate,
        date_of_birth: requestBody?.date_of_birth,
      },
    });

    try {
      // Verify user can only update their own profile
      if (request.user?.userId !== id) {
        logger.warn('USER_UPDATE', 'Forbidden: user trying to update another profile', {
          userId: id,
          requestUserId: request.user?.userId,
        });
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own profile',
          },
        });
      }

      // Validate input with Zod
      logger.debug('USER_UPDATE', 'Validating input with Zod schema', { body: requestBody });
      const body = updateProfileSchema.parse(request.body);
      logger.debug('USER_UPDATE', 'Zod validation passed', { validatedBody: body });

      // Call service to update
      const updatedUser = await UsersService.updateUserProfile(id, body);

      logger.info('USER_UPDATE', `Profile updated successfully for user ${id}`, {
        userId: id,
        updatedFields: Object.keys(body),
      });

      return reply.code(200).send({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('USER_UPDATE', 'Zod validation failed', {
          userId: id,
          errors: error.errors,
          receivedBody: requestBody,
        });
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
        logger.warn('USER_UPDATE', 'User not found', { userId: id });
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      // Log the actual error for 500s
      logger.error('USER_UPDATE', `Failed to update profile for user ${id}`, error as Error, {
        userId: id,
        requestBody: requestBody,
      });

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

  /**
   * GET /users/:id/export
   * GDPR Data Export - Export all user data
   */
  static async exportUserData(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      // Verify user can only export their own data
      if (request.user?.userId !== id) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only export your own data',
          },
        });
      }

      const exportData = await UsersService.exportUserData(id);

      // Set headers for JSON download
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="bellor-data-export-${id}.json"`);

      return reply.code(200).send({
        success: true,
        exportedAt: new Date().toISOString(),
        data: exportData,
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
          message: 'An error occurred while exporting data',
        },
      });
    }
  }

  /**
   * DELETE /users/:id/gdpr
   * GDPR Right to Erasure - Permanently delete all user data
   */
  static async deleteUserGDPR(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      // Verify user can only delete their own data
      if (request.user?.userId !== id) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own data',
          },
        });
      }

      await UsersService.deleteUserGDPR(id);

      return reply.code(200).send({
        success: true,
        message: 'All your data has been permanently deleted in accordance with GDPR Article 17',
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
          message: 'An error occurred while deleting data',
        },
      });
    }
  }
}
