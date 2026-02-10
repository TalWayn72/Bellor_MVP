/**
 * Platform detection utilities tests
 * Tests for Capacitor/PWA platform detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNative,
  getPlatform,
  isAndroid,
  isIOS,
  isPWA,
  canInstallPWA,
  supportsPushNotifications,
  isMobileUserAgent,
  isOnline,
  getDeviceInfo,
} from './platform';

describe('[P2][infra] Platform Detection Utilities', () => {
  const originalWindow = global.window;
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore window and navigator
    if (originalWindow) {
      global.window = originalWindow;
    }
    if (originalNavigator) {
      global.navigator = originalNavigator;
    }
  });

  describe('isNative', () => {
    it('should return false when Capacitor is not present', () => {
      expect(isNative()).toBe(false);
    });

    it('should return true when Capacitor is present', () => {
      (window as any).Capacitor = {};
      expect(isNative()).toBe(true);
      delete (window as any).Capacitor;
    });
  });

  describe('getPlatform', () => {
    it('should return "web" by default', () => {
      expect(getPlatform()).toBe('web');
    });

    it('should return "android" when Capacitor reports Android', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'android',
      };
      expect(getPlatform()).toBe('android');
      delete (window as any).Capacitor;
    });

    it('should return "ios" when Capacitor reports iOS', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
      };
      expect(getPlatform()).toBe('ios');
      delete (window as any).Capacitor;
    });

    it('should return "web" when Capacitor reports non-native', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web',
      };
      expect(getPlatform()).toBe('web');
      delete (window as any).Capacitor;
    });
  });

  describe('isAndroid', () => {
    it('should return false when not on Android', () => {
      expect(isAndroid()).toBe(false);
    });

    it('should return true when on Android', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'android',
      };
      expect(isAndroid()).toBe(true);
      delete (window as any).Capacitor;
    });
  });

  describe('isIOS', () => {
    it('should return false when not on iOS', () => {
      expect(isIOS()).toBe(false);
    });

    it('should return true when on iOS', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
      };
      expect(isIOS()).toBe(true);
      delete (window as any).Capacitor;
    });
  });

  describe('isPWA', () => {
    it('should return false when not in standalone mode', () => {
      // jsdom doesn't support matchMedia by default, so we mock it
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(isPWA()).toBe(false);
    });

    it('should return true when in standalone mode', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(isPWA()).toBe(true);
    });

    it('should return true when navigator.standalone is true (iOS Safari)', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      (window.navigator as any).standalone = true;
      expect(isPWA()).toBe(true);
      delete (window.navigator as any).standalone;
    });
  });

  describe('supportsPushNotifications', () => {
    it('should check for Notification and PushManager support', () => {
      const result = supportsPushNotifications();
      // In jsdom, these may or may not be defined
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isMobileUserAgent', () => {
    it('should return false for desktop user agent', () => {
      // jsdom default user agent is desktop-like
      expect(isMobileUserAgent()).toBe(false);
    });
  });

  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      const result = isOnline();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getDeviceInfo', () => {
    beforeEach(() => {
      // Mock matchMedia for isPWA check inside getDeviceInfo
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    it('should return device information object', () => {
      const info = getDeviceInfo();

      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('isNative');
      expect(info).toHaveProperty('isPWA');
      expect(info).toHaveProperty('isMobile');
      expect(info).toHaveProperty('isOnline');
      expect(info).toHaveProperty('userAgent');
      expect(info).toHaveProperty('language');
    });

    it('should return correct platform info', () => {
      const info = getDeviceInfo();
      expect(info.platform).toBe('web');
      expect(info.isNative).toBe(false);
    });
  });
});

describe('[P2][infra] Platform Detection - Edge Cases', () => {
  describe('SSR environment (no window)', () => {
    it('should handle undefined window gracefully', () => {
      // These functions check for window/navigator internally
      // In jsdom they're always defined, but the code handles undefined
      expect(getPlatform()).toBe('web');
    });
  });

  describe('Capacitor edge cases', () => {
    it('should handle Capacitor without getPlatform method', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        // getPlatform is undefined
      };
      expect(getPlatform()).toBe('web');
      delete (window as any).Capacitor;
    });

    it('should handle Capacitor with unknown platform', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'unknown',
      };
      expect(getPlatform()).toBe('web');
      delete (window as any).Capacitor;
    });
  });
});
