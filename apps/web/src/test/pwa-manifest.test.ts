/**
 * PWA Manifest Tests
 * Tests to verify the PWA manifest configuration is valid
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest Configuration', () => {
  let manifest: any;

  beforeAll(() => {
    const manifestPath = path.join(__dirname, '../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
  });

  describe('Required Fields', () => {
    it('should have a name', () => {
      expect(manifest.name).toBeDefined();
      expect(typeof manifest.name).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
    });

    it('should have a short_name', () => {
      expect(manifest.short_name).toBeDefined();
      expect(typeof manifest.short_name).toBe('string');
      expect(manifest.short_name).toBe('Bellor');
    });

    it('should have a start_url', () => {
      expect(manifest.start_url).toBeDefined();
      expect(manifest.start_url).toBe('/');
    });

    it('should have display mode', () => {
      expect(manifest.display).toBeDefined();
      expect(['standalone', 'fullscreen', 'minimal-ui', 'browser']).toContain(
        manifest.display
      );
    });

    it('should have theme_color', () => {
      expect(manifest.theme_color).toBeDefined();
      expect(manifest.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should have background_color', () => {
      expect(manifest.background_color).toBeDefined();
      expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('Icons', () => {
    it('should have icons array', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    it('should have at least one icon with src', () => {
      const hasValidIcon = manifest.icons.some(
        (icon: any) => icon.src && typeof icon.src === 'string'
      );
      expect(hasValidIcon).toBe(true);
    });

    it('should have icons with sizes', () => {
      const hasValidSizes = manifest.icons.every(
        (icon: any) => icon.sizes && typeof icon.sizes === 'string'
      );
      expect(hasValidSizes).toBe(true);
    });

    it('should have icons with type', () => {
      const hasValidType = manifest.icons.every(
        (icon: any) => icon.type && typeof icon.type === 'string'
      );
      expect(hasValidType).toBe(true);
    });
  });

  describe('App Information', () => {
    it('should have description', () => {
      expect(manifest.description).toBeDefined();
      expect(typeof manifest.description).toBe('string');
      expect(manifest.description.length).toBeGreaterThan(10);
    });

    it('should have orientation set to portrait-primary', () => {
      expect(manifest.orientation).toBe('portrait-primary');
    });

    it('should have lang defined', () => {
      expect(manifest.lang).toBeDefined();
    });

    it('should have categories', () => {
      expect(manifest.categories).toBeDefined();
      expect(Array.isArray(manifest.categories)).toBe(true);
      expect(manifest.categories).toContain('social');
    });
  });

  describe('Shortcuts', () => {
    it('should have shortcuts array', () => {
      expect(manifest.shortcuts).toBeDefined();
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
    });

    it('should have valid shortcuts with name and url', () => {
      manifest.shortcuts.forEach((shortcut: any) => {
        expect(shortcut.name).toBeDefined();
        expect(shortcut.url).toBeDefined();
        expect(shortcut.url.startsWith('/')).toBe(true);
      });
    });

    it('should have Discover shortcut', () => {
      const discoverShortcut = manifest.shortcuts.find(
        (s: any) => s.name === 'Discover'
      );
      expect(discoverShortcut).toBeDefined();
      expect(discoverShortcut.url).toBe('/discover');
    });

    it('should have Messages shortcut', () => {
      const messagesShortcut = manifest.shortcuts.find(
        (s: any) => s.name === 'Messages'
      );
      expect(messagesShortcut).toBeDefined();
      expect(messagesShortcut.url).toBe('/chats');
    });
  });

  describe('Related Applications', () => {
    it('should have related_applications array', () => {
      expect(manifest.related_applications).toBeDefined();
      expect(Array.isArray(manifest.related_applications)).toBe(true);
    });

    it('should have Google Play Store app defined', () => {
      const playApp = manifest.related_applications.find(
        (app: any) => app.platform === 'play'
      );
      expect(playApp).toBeDefined();
      expect(playApp.id).toBe('com.bellor.app');
    });

    it('should have iOS App Store app defined', () => {
      const iosApp = manifest.related_applications.find(
        (app: any) => app.platform === 'itunes'
      );
      expect(iosApp).toBeDefined();
    });

    it('should not prefer related applications over PWA', () => {
      expect(manifest.prefer_related_applications).toBe(false);
    });
  });

  describe('Share Target', () => {
    it('should have share_target configured', () => {
      expect(manifest.share_target).toBeDefined();
    });

    it('should have share action URL', () => {
      expect(manifest.share_target.action).toBe('/share');
    });

    it('should support image and video files', () => {
      const files = manifest.share_target.params.files;
      expect(files).toBeDefined();
      expect(files[0].accept).toContain('image/*');
      expect(files[0].accept).toContain('video/*');
    });
  });

  describe('Protocol Handlers', () => {
    it('should have protocol_handlers configured', () => {
      expect(manifest.protocol_handlers).toBeDefined();
      expect(Array.isArray(manifest.protocol_handlers)).toBe(true);
    });

    it('should handle web+bellor protocol', () => {
      const belloProtocol = manifest.protocol_handlers.find(
        (p: any) => p.protocol === 'web+bellor'
      );
      expect(belloProtocol).toBeDefined();
      expect(belloProtocol.url).toContain('%s');
    });
  });

  describe('Permissions', () => {
    it('should have permissions_policy defined', () => {
      expect(manifest.permissions_policy).toBeDefined();
    });

    it('should request geolocation permission', () => {
      expect(manifest.permissions_policy.geolocation).toContain('self');
    });

    it('should request camera permission', () => {
      expect(manifest.permissions_policy.camera).toContain('self');
    });

    it('should request microphone permission', () => {
      expect(manifest.permissions_policy.microphone).toContain('self');
    });

    it('should request notifications permission', () => {
      expect(manifest.permissions_policy.notifications).toContain('self');
    });
  });

  describe('ID and Version', () => {
    it('should have unique id', () => {
      expect(manifest.id).toBeDefined();
      expect(manifest.id).toBe('bellor-pwa-v1');
    });
  });
});
