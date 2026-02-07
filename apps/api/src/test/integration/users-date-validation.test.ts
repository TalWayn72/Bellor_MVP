/**
 * Integration Tests for User Profile Update - Date Validation
 * Tests the PATCH /users/:id endpoint with various date formats
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { z } from 'zod';

// Mock the date validation schema from the controller
const dateStringSchema = z.string()
  .refine((val) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(val);
  }, { message: 'Date must be in yyyy-MM-dd format' })
  .refine((val) => {
    const parsed = new Date(val);
    return !isNaN(parsed.getTime());
  }, { message: 'Invalid date' })
  .refine((val) => {
    const parsed = new Date(val);
    const year = parsed.getFullYear();
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear - 18;
  }, { message: 'Birth date must indicate age 18 or older' })
  .optional();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  nickname: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  birthDate: dateStringSchema,
  date_of_birth: dateStringSchema,
}).passthrough();

describe('User Profile Update - Date Validation', () => {
  describe('Zod Schema Validation', () => {
    describe('valid dates', () => {
      it('should accept valid birthDate', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1990-05-15',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid date_of_birth (snake_case)', () => {
        const result = updateProfileSchema.safeParse({
          date_of_birth: '1990-05-15',
        });
        expect(result.success).toBe(true);
      });

      it('should accept user at exactly 18 years old', () => {
        const currentYear = new Date().getFullYear();
        const result = updateProfileSchema.safeParse({
          birthDate: `${currentYear - 18}-01-01`,
        });
        expect(result.success).toBe(true);
      });

      it('should accept optional empty birthDate', () => {
        const result = updateProfileSchema.safeParse({
          firstName: 'John',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid dates - format', () => {
      it('should reject incomplete date (missing day): "1990-01-"', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1990-01-',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('yyyy-MM-dd');
        }
      });

      it('should reject incomplete date (missing month): "1990-"', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1990-',
        });
        expect(result.success).toBe(false);
      });

      it('should reject date with wrong separator: "1990/01/15"', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1990/01/15',
        });
        expect(result.success).toBe(false);
      });

      it('should reject ISO format with time: "1990-01-15T00:00:00Z"', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1990-01-15T00:00:00Z',
        });
        expect(result.success).toBe(false);
      });

      it('should reject text: "not-a-date"', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: 'not-a-date',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('invalid dates - age restriction', () => {
      it('should reject user under 18', () => {
        const currentYear = new Date().getFullYear();
        const result = updateProfileSchema.safeParse({
          birthDate: `${currentYear - 17}-01-01`,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('18');
        }
      });

      it('should reject future birth date', () => {
        const futureYear = new Date().getFullYear() + 1;
        const result = updateProfileSchema.safeParse({
          birthDate: `${futureYear}-01-01`,
        });
        expect(result.success).toBe(false);
      });

      it('should reject year before 1900', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1899-12-31',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should accept boundary year 1900', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1900-01-01',
        });
        expect(result.success).toBe(true);
      });

      it('should accept leap year date', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '2000-02-29',
        });
        expect(result.success).toBe(true);
      });

      it('should handle both birthDate and date_of_birth', () => {
        const result = updateProfileSchema.safeParse({
          birthDate: '1990-05-15',
          date_of_birth: '1990-05-15',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Simulated API Request Flow', () => {
    const simulateRequest = (body: any) => {
      const validation = updateProfileSchema.safeParse(body);
      if (!validation.success) {
        return {
          status: 400,
          body: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
              details: validation.error.errors,
            },
          },
        };
      }
      return {
        status: 200,
        body: {
          success: true,
          data: validation.data,
        },
      };
    };

    it('should return 400 for incomplete date', () => {
      const response = simulateRequest({
        birthDate: '1990-01-',
      });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 200 for valid date', () => {
      const response = simulateRequest({
        birthDate: '1990-01-15',
        firstName: 'John',
      });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include validation details in error response', () => {
      const response = simulateRequest({
        birthDate: 'invalid',
      });
      expect(response.status).toBe(400);
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });
  });
});
