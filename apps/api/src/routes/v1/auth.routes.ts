import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { prisma } from '../../lib/prisma.js';
import { bruteForceProtection, handleFailedLogin, handleSuccessfulLogin } from '../../security/auth-hardening.js';
import { securityLogger } from '../../security/logger.js';

// Stricter rate limit config for auth endpoints
const authRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute',
    },
  },
};

const loginRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 minute',
    },
  },
};

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  birthDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  preferredLanguage: z.enum(['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export default async function authRoutes(app: FastifyInstance) {
  /**
   * POST /auth/register
   * Register a new user
   */
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Creates a new user account and returns access/refresh tokens',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Convert birthDate string to Date
      const birthDate = new Date(body.birthDate);

      const result = await AuthService.register({
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate,
        gender: body.gender,
        preferredLanguage: body.preferredLanguage,
      });

      return reply.code(201).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'USER_EXISTS',
              message: error.message,
            },
          });
        }
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during registration',
        },
      });
    }
  });

  /**
   * POST /auth/login
   * Login with email and password
   */
  app.post('/login', {
    preHandler: bruteForceProtection,
    schema: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      description: 'Authenticates user and returns access/refresh tokens',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);

      const result = await AuthService.login({
        email: body.email,
        password: body.password,
      });

      // Security: Clear failed attempts on successful login
      await handleSuccessfulLogin(request, body.email, result.user.id);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }

      if (error instanceof Error) {
        if (
          error.message.includes('Invalid email or password') ||
          error.message.includes('Account is deactivated')
        ) {
          // Security: Record failed login attempt
          const body = loginSchema.safeParse(request.body);
          if (body.success) {
            const lockInfo = await handleFailedLogin(request, body.data.email);
            if (lockInfo.locked) {
              return reply.code(429).send({
                success: false,
                error: {
                  code: 'ACCOUNT_LOCKED',
                  message: 'Too many failed attempts. Please try again later.',
                },
              });
            }
          }

          return reply.code(401).send({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: error.message,
            },
          });
        }
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during login',
        },
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  app.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      description: 'Exchange a valid refresh token for new access token',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = refreshSchema.parse(request.body);

      const result = await AuthService.refresh(body.refreshToken);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }

      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout current user
   */
  app.post('/logout', {
    preHandler: authMiddleware,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }

        await AuthService.logout(request.user.userId);

        return reply.code(200).send({
          success: true,
          data: {
            message: 'Logged out successfully',
          },
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred during logout',
          },
        });
      }
    },
  });

  /**
   * GET /auth/me
   * Get current user information
   */
  app.get('/me', {
    preHandler: authMiddleware,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }

        const user = await prisma.user.findUnique({
          where: { id: request.user.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true,
            birthDate: true,
            gender: true,
            preferredLanguage: true,
            bio: true,
            profileImages: true,
            drawingUrl: true,
            sketchMethod: true,
            location: true,
            lookingFor: true,
            ageRangeMin: true,
            ageRangeMax: true,
            maxDistance: true,
            isBlocked: true,
            isVerified: true,
            isPremium: true,
            isAdmin: true,
            createdAt: true,
            lastActiveAt: true,
          },
        });

        if (!user) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        return reply.code(200).send({
          success: true,
          data: user,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while fetching user data',
          },
        });
      }
    },
  });

  /**
   * POST /auth/change-password
   * Change user password
   */
  app.post('/change-password', {
    preHandler: authMiddleware,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }

        const body = changePasswordSchema.parse(request.body);

        await AuthService.changePassword(
          request.user.userId,
          body.currentPassword,
          body.newPassword
        );

        securityLogger.passwordChanged(request, request.user.userId);

        return reply.code(200).send({
          success: true,
          data: {
            message: 'Password changed successfully',
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: error.errors,
            },
          });
        }

        if (error instanceof Error && error.message.includes('incorrect')) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_PASSWORD',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while changing password',
          },
        });
      }
    },
  });

  /**
   * POST /auth/forgot-password
   * Request a password reset email
   */
  app.post('/forgot-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Request password reset email',
      description: 'Sends a password reset link to the provided email address',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body);

      await AuthService.forgotPassword(body.email);

      // Always return success to prevent email enumeration
      return reply.code(200).send({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while processing your request',
        },
      });
    }
  });

  /**
   * POST /auth/reset-password
   * Reset password using token from email
   */
  app.post('/reset-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Reset password with token',
      description: 'Reset password using the token received via email',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = resetPasswordSchema.parse(request.body);

      await AuthService.resetPassword(body.token, body.newPassword);

      return reply.code(200).send({
        success: true,
        data: {
          message: 'Password has been reset successfully. Please log in with your new password.',
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }

      if (error instanceof Error && error.message.includes('Invalid or expired')) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_RESET_TOKEN',
            message: error.message,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while resetting password',
        },
      });
    }
  });
}
