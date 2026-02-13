import { describe, it, expect } from 'vitest';
import { buildStepSaveData, buildFinalUserData } from './onboardingUtils';

describe('[P1][onboarding] onboardingUtils - ISSUE-070 regression', () => {
  const baseFormData = {
    nickname: 'TestUser', date_of_birth: '2000-01-15', location: 'Israel', location_city: 'Tel Aviv',
    location_state: 'Israel', can_currently_relocate: true, can_language_travel: false,
    occupation: 'Developer', education: 'MIT', phone: '+1234567890', bio: 'Hello',
    interests: ['Music'], gender: 'male', looking_for: 'female',
    profile_images: ['img1.jpg'], main_profile_image_url: 'img1.jpg',
    sketch_method: 'draw', drawing_url: 'draw.png',
  };

  describe('buildStepSaveData - step 5 location', () => {
    it('should include city and country when both location_city and location_state are set', () => {
      const result = buildStepSaveData(5, baseFormData);
      expect(result).toBeTruthy();
      expect(result.location).toEqual({ city: 'Tel Aviv', country: 'Israel' });
    });

    it('should include canCurrentlyRelocate and canLanguageTravel toggles', () => {
      const result = buildStepSaveData(5, baseFormData);
      expect(result.canCurrentlyRelocate).toBe(true);
      expect(result.canLanguageTravel).toBe(false);
    });

    it('should handle toggled-off state as false', () => {
      const data = { ...baseFormData, can_currently_relocate: false, can_language_travel: false };
      const result = buildStepSaveData(5, data);
      expect(result.canCurrentlyRelocate).toBe(false);
      expect(result.canLanguageTravel).toBe(false);
    });

    it('should fallback to location string when location_state is missing', () => {
      const data = { ...baseFormData, location_state: '', location_city: '' };
      const result = buildStepSaveData(5, data);
      expect(result.location).toBe('Israel');
    });
  });

  describe('buildFinalUserData - toggle fields', () => {
    it('should include canCurrentlyRelocate in final data', () => {
      const result = buildFinalUserData(baseFormData);
      expect(result.canCurrentlyRelocate).toBe(true);
    });

    it('should include canLanguageTravel in final data', () => {
      const result = buildFinalUserData(baseFormData);
      expect(result.canLanguageTravel).toBe(false);
    });

    it('should include location as object with city and country', () => {
      const result = buildFinalUserData(baseFormData);
      expect(result.location).toEqual({ city: 'Tel Aviv', country: 'Israel' });
    });

    it('should include all expected fields', () => {
      const result = buildFinalUserData(baseFormData);
      expect(result).toHaveProperty('nickname', 'TestUser');
      expect(result).toHaveProperty('birthDate', '2000-01-15');
      expect(result).toHaveProperty('gender', 'male');
      expect(result).toHaveProperty('lookingFor', ['female']);
      expect(result).toHaveProperty('profileImages', ['img1.jpg']);
      expect(result).toHaveProperty('sketchMethod', 'draw');
      expect(result).toHaveProperty('drawingUrl', 'draw.png');
      expect(result).toHaveProperty('lastActiveAt');
    });
  });

  describe('buildStepSaveData - other steps', () => {
    it('step 3 should return nickname', () => {
      const result = buildStepSaveData(3, baseFormData);
      expect(result).toEqual({ nickname: 'TestUser' });
    });

    it('step 4 should return birthDate', () => {
      const result = buildStepSaveData(4, baseFormData);
      expect(result).toEqual({ birthDate: '2000-01-15' });
    });

    it('step 7 should return gender', () => {
      const result = buildStepSaveData(7, baseFormData);
      expect(result).toEqual({ gender: 'male' });
    });

    it('step 7.7 should return lookingFor as array', () => {
      const result = buildStepSaveData(7.7, baseFormData);
      expect(result).toEqual({ lookingFor: ['female'] });
    });

    it('step 8 should return profileImages', () => {
      const result = buildStepSaveData(8, baseFormData);
      expect(result).toEqual({ profileImages: ['img1.jpg'] });
    });
  });
});
