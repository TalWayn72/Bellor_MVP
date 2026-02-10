import { describe, it, expect } from 'vitest';
import { calculateAge, formatLocation, transformUser } from './userTransformer.js';

describe('[P2][profile] userTransformer', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly from birth date', () => {
      // Person born 25 years ago
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      expect(calculateAge(birthDate.toISOString())).toBe(25);
    });

    it('should return null for null/undefined birth date', () => {
      expect(calculateAge(null)).toBeNull();
      expect(calculateAge(undefined)).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(calculateAge('invalid-date')).toBeNull();
    });

    it('should handle Date object', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      expect(calculateAge(birthDate)).toBe(30);
    });
  });

  describe('formatLocation', () => {
    it('should format location object with city and country', () => {
      const location = { lat: 32.0853, lng: 34.7818, city: 'Tel Aviv', country: 'Israel' };
      expect(formatLocation(location)).toBe('Tel Aviv, Israel');
    });

    it('should return city only if no country', () => {
      const location = { city: 'Tel Aviv' };
      expect(formatLocation(location)).toBe('Tel Aviv');
    });

    it('should return country only if no city', () => {
      const location = { country: 'Israel' };
      expect(formatLocation(location)).toBe('Israel');
    });

    it('should return string location as-is', () => {
      expect(formatLocation('New York')).toBe('New York');
    });

    it('should return "Unknown" for null/undefined', () => {
      expect(formatLocation(null)).toBe('Unknown');
      expect(formatLocation(undefined)).toBe('Unknown');
    });

    it('should return "Unknown" for empty object', () => {
      expect(formatLocation({})).toBe('Unknown');
    });
  });

  describe('transformUser', () => {
    it('should transform user with first_name to nickname', () => {
      const user = { first_name: 'John', birth_date: '1990-01-01' };
      const result = transformUser(user);
      expect(result.nickname).toBe('John');
    });

    it('should transform user with firstName to nickname', () => {
      const user = { firstName: 'Jane', birthDate: '1995-05-15' };
      const result = transformUser(user);
      expect(result.nickname).toBe('Jane');
    });

    it('should preserve existing nickname', () => {
      const user = { nickname: 'Johnny', first_name: 'John' };
      const result = transformUser(user);
      expect(result.nickname).toBe('Johnny'); // existing nickname takes precedence
    });

    it('should calculate age from birth_date', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 28);
      const user = { first_name: 'Test', birth_date: birthDate.toISOString() };
      const result = transformUser(user);
      expect(result.age).toBe(28);
    });

    it('should format location object to string', () => {
      const user = {
        first_name: 'Test',
        location: { city: 'Tel Aviv', country: 'Israel' }
      };
      const result = transformUser(user);
      expect(result.location_display).toBe('Tel Aviv, Israel');
    });

    it('should return null for null user', () => {
      expect(transformUser(null)).toBeNull();
    });

    it('should return null for undefined user', () => {
      expect(transformUser(undefined)).toBeNull();
    });

    it('should use default values for missing fields', () => {
      const user = { id: '123' };
      const result = transformUser(user);
      expect(result.nickname).toBe('User');
      expect(result.age).toBe(25); // fallback
      expect(result.location_display).toBe('Unknown');
    });

    it('should preserve original user properties', () => {
      const user = {
        id: '123',
        email: 'test@test.com',
        first_name: 'John',
        birth_date: '1990-01-01'
      };
      const result = transformUser(user);
      expect(result.id).toBe('123');
      expect(result.email).toBe('test@test.com');
    });
  });
});
