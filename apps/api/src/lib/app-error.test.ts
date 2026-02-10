/**
 * Tests for AppError class
 * Validates constructor, inheritance, and static factory methods
 */

import { describe, it, expect } from 'vitest';
import { AppError } from './app-error.js';

describe('[P2][infra] AppError', () => {
  describe('constructor', () => {
    it('should set all properties correctly', () => {
      const error = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Something went wrong');
    });

    it('should set name to AppError', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input');
      expect(error.name).toBe('AppError');
    });

    it('should extend Error', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have a stack trace', () => {
      const error = new AppError(500, 'ERR', 'test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('should store details when provided', () => {
      const details = [{ field: 'email', message: 'invalid format' }];
      const error = new AppError(422, 'VALIDATION_ERROR', 'Validation failed', details);
      expect(error.details).toEqual(details);
      expect(error.details).toHaveLength(1);
    });

    it('should leave details undefined when not provided', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Missing field');
      expect(error.details).toBeUndefined();
    });

    it('should handle empty details array', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'No details', []);
      expect(error.details).toEqual([]);
      expect(error.details).toHaveLength(0);
    });

    it('should handle multiple details entries', () => {
      const details = [
        { field: 'email', message: 'required' },
        { field: 'password', message: 'too short' },
        { field: 'name', message: 'invalid characters' },
      ];
      const error = new AppError(422, 'VALIDATION', 'Multiple errors', details);
      expect(error.details).toHaveLength(3);
    });
  });

  describe('static notFound', () => {
    it('should create error with status 404', () => {
      const error = AppError.notFound('USER_NOT_FOUND', 'User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.message).toBe('User not found');
    });

    it('should return an AppError instance', () => {
      const error = AppError.notFound('NOT_FOUND', 'Resource missing');
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have name set to AppError', () => {
      const error = AppError.notFound('NOT_FOUND', 'Not found');
      expect(error.name).toBe('AppError');
    });

    it('should not have details', () => {
      const error = AppError.notFound('NOT_FOUND', 'Missing');
      expect(error.details).toBeUndefined();
    });
  });

  describe('static badRequest', () => {
    it('should create error with status 400', () => {
      const error = AppError.badRequest('INVALID_INPUT', 'Invalid email format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe('Invalid email format');
    });

    it('should return an AppError instance', () => {
      const error = AppError.badRequest('BAD_REQ', 'Bad input');
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('static conflict', () => {
    it('should create error with status 409', () => {
      const error = AppError.conflict('EMAIL_EXISTS', 'Email already registered');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('EMAIL_EXISTS');
      expect(error.message).toBe('Email already registered');
    });

    it('should return an AppError instance', () => {
      const error = AppError.conflict('CONFLICT', 'Duplicate resource');
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('static forbidden', () => {
    it('should create error with status 403', () => {
      const error = AppError.forbidden('ACCESS_DENIED', 'You do not have permission');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('ACCESS_DENIED');
      expect(error.message).toBe('You do not have permission');
    });

    it('should return an AppError instance', () => {
      const error = AppError.forbidden('FORBIDDEN', 'No access');
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('error throwing and catching', () => {
    it('should be catchable as Error', () => {
      try {
        throw new AppError(500, 'INTERNAL', 'Server error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as AppError).statusCode).toBe(500);
      }
    });

    it('should be catchable as AppError', () => {
      try {
        throw AppError.notFound('NOT_FOUND', 'Missing resource');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).code).toBe('NOT_FOUND');
      }
    });

    it('should preserve message in toString', () => {
      const error = new AppError(400, 'BAD_REQ', 'Something broke');
      expect(error.toString()).toContain('Something broke');
    });
  });
});
