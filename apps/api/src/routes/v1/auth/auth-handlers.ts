import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../../../services/auth.service.js';
import { prisma } from '../../../lib/prisma.js';
import { handleFailedLogin, handleSuccessfulLogin } from '../../../security/auth-hardening.js';
import { securityLogger } from '../../../security/logger.js';
import { registerSchema, loginSchema, refreshSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './auth-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.errors } });
}

export async function handleRegister(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = registerSchema.parse(request.body);
    const result = await AuthService.register({ ...body, birthDate: new Date(body.birthDate) });
    return reply.code(201).send({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(reply, error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return reply.code(409).send({ success: false, error: { code: 'USER_EXISTS', message: error.message } });
    }
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred during registration' } });
  }
}

export async function handleLogin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = loginSchema.parse(request.body);
    const result = await AuthService.login({ email: body.email, password: body.password });
    await handleSuccessfulLogin(request, body.email, result.user.id);
    return reply.code(200).send({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(reply, error);
    if (error instanceof Error && (error.message.includes('Invalid email or password') || error.message.includes('Account is deactivated'))) {
      const body = loginSchema.safeParse(request.body);
      if (body.success) {
        const lockInfo = await handleFailedLogin(request, body.data.email);
        if (lockInfo.locked) {
          return reply.code(429).send({ success: false, error: { code: 'ACCOUNT_LOCKED', message: 'Too many failed attempts. Please try again later.' } });
        }
      }
      return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: error.message } });
    }
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred during login' } });
  }
}

export async function handleRefresh(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = refreshSchema.parse(request.body);
    const result = await AuthService.refresh(body.refreshToken);
    return reply.code(200).send({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(reply, error);
    return reply.code(401).send({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' } });
  }
}

export async function handleLogout(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (!request.user) return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    await AuthService.logout(request.user.userId);
    return reply.code(200).send({ success: true, data: { message: 'Logged out successfully' } });
  } catch { return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred during logout' } }); }
}

export async function handleGetMe(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (!request.user) return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, nickname: true, birthDate: true,
        gender: true, preferredLanguage: true, bio: true, profileImages: true, drawingUrl: true,
        sketchMethod: true, location: true, lookingFor: true, ageRangeMin: true, ageRangeMax: true,
        maxDistance: true, phone: true, occupation: true, education: true, interests: true,
        showOnline: true, showDistance: true, showAge: true, privateProfile: true, doNotSell: true,
        notifyNewMatches: true, notifyNewMessages: true, notifyChatRequests: true,
        notifyDailyMissions: true, notifyEmail: true,
        isBlocked: true, isVerified: true, isPremium: true, isAdmin: true,
        createdAt: true, lastActiveAt: true,
      },
    });
    if (!user) return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return reply.code(200).send({ success: true, data: user });
  } catch { return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching user data' } }); }
}

export async function handleChangePassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (!request.user) return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const body = changePasswordSchema.parse(request.body);
    await AuthService.changePassword(request.user.userId, body.currentPassword, body.newPassword);
    securityLogger.passwordChanged(request, request.user.userId);
    return reply.code(200).send({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(reply, error);
    if (error instanceof Error && error.message.includes('incorrect')) {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_PASSWORD', message: error.message } });
    }
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while changing password' } });
  }
}

export async function handleForgotPassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = forgotPasswordSchema.parse(request.body);
    await AuthService.forgotPassword(body.email);
    return reply.code(200).send({ success: true, data: { message: 'If an account with that email exists, a password reset link has been sent.' } });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(reply, error);
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while processing your request' } });
  }
}

export async function handleResetPassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = resetPasswordSchema.parse(request.body);
    await AuthService.resetPassword(body.token, body.newPassword);
    return reply.code(200).send({ success: true, data: { message: 'Password has been reset successfully. Please log in with your new password.' } });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(reply, error);
    if (error instanceof Error && error.message.includes('Invalid or expired')) {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_RESET_TOKEN', message: error.message } });
    }
    return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while resetting password' } });
  }
}
