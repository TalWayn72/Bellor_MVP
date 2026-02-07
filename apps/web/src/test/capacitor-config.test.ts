/**
 * Capacitor Configuration Tests
 * Tests to verify the Capacitor config is properly set up
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Capacitor Configuration', () => {
  let configContent: string;
  let config: any;

  beforeAll(async () => {
    const configPath = path.join(__dirname, '../../capacitor.config.ts');
    configContent = fs.readFileSync(configPath, 'utf-8');

    // Parse the config from the file content
    // Since it's a TS file, we'll check the content directly
  });

  describe('Basic Configuration', () => {
    it('should have config file', () => {
      expect(configContent).toBeDefined();
      expect(configContent.length).toBeGreaterThan(0);
    });

    it('should have appId defined', () => {
      expect(configContent).toContain("appId: 'com.bellor.app'");
    });

    it('should have appName defined', () => {
      expect(configContent).toContain("appName: 'Bellor'");
    });

    it('should have webDir set to dist', () => {
      expect(configContent).toContain("webDir: 'dist'");
    });
  });

  describe('Server Configuration', () => {
    it('should use https scheme for Android', () => {
      expect(configContent).toContain("androidScheme: 'https'");
    });
  });

  describe('Plugin Configurations', () => {
    it('should have PushNotifications configured', () => {
      expect(configContent).toContain('PushNotifications');
      expect(configContent).toContain('presentationOptions');
    });

    it('should have SplashScreen configured', () => {
      expect(configContent).toContain('SplashScreen');
      expect(configContent).toContain('launchShowDuration');
      expect(configContent).toContain('backgroundColor');
    });

    it('should use Bellor brand color for splash screen', () => {
      expect(configContent).toContain('#EC4899');
    });

    it('should have StatusBar configured', () => {
      expect(configContent).toContain('StatusBar');
    });

    it('should have Keyboard configured', () => {
      expect(configContent).toContain('Keyboard');
      expect(configContent).toContain('resize');
    });
  });

  describe('Android Configuration', () => {
    it('should have Android-specific settings', () => {
      expect(configContent).toContain('android:');
    });

    it('should not allow mixed content', () => {
      expect(configContent).toContain('allowMixedContent: false');
    });
  });

  describe('iOS Configuration', () => {
    it('should have iOS-specific settings', () => {
      expect(configContent).toContain('ios:');
    });

    it('should have scrolling enabled', () => {
      expect(configContent).toContain('scrollEnabled: true');
    });
  });
});

describe('Capacitor Project Structure', () => {
  const webRoot = path.join(__dirname, '../..');

  describe('Android Project', () => {
    it('should have Android directory', () => {
      const androidPath = path.join(webRoot, 'android');
      expect(fs.existsSync(androidPath)).toBe(true);
    });

    it('should have Android app directory', () => {
      const appPath = path.join(webRoot, 'android', 'app');
      expect(fs.existsSync(appPath)).toBe(true);
    });

    it('should have Android build.gradle', () => {
      const gradlePath = path.join(webRoot, 'android', 'app', 'build.gradle');
      expect(fs.existsSync(gradlePath)).toBe(true);
    });

    it('should have Android manifest', () => {
      const manifestPath = path.join(
        webRoot,
        'android',
        'app',
        'src',
        'main',
        'AndroidManifest.xml'
      );
      expect(fs.existsSync(manifestPath)).toBe(true);
    });
  });

  describe('iOS Project', () => {
    it('should have iOS directory', () => {
      const iosPath = path.join(webRoot, 'ios');
      expect(fs.existsSync(iosPath)).toBe(true);
    });

    it('should have iOS App directory', () => {
      const appPath = path.join(webRoot, 'ios', 'App');
      expect(fs.existsSync(appPath)).toBe(true);
    });
  });

  describe('Web Assets', () => {
    it('should have public directory', () => {
      const publicPath = path.join(webRoot, 'public');
      expect(fs.existsSync(publicPath)).toBe(true);
    });

    it('should have manifest.json in public', () => {
      const manifestPath = path.join(webRoot, 'public', 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
    });
  });
});

describe('Package.json Capacitor Scripts', () => {
  let packageJson: any;

  beforeAll(() => {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    packageJson = JSON.parse(packageContent);
  });

  describe('Capacitor Scripts', () => {
    it('should have cap:sync script', () => {
      expect(packageJson.scripts['cap:sync']).toBeDefined();
      expect(packageJson.scripts['cap:sync']).toContain('cap sync');
    });

    it('should have cap:open:android script', () => {
      expect(packageJson.scripts['cap:open:android']).toBeDefined();
      expect(packageJson.scripts['cap:open:android']).toContain('cap open android');
    });

    it('should have cap:open:ios script', () => {
      expect(packageJson.scripts['cap:open:ios']).toBeDefined();
      expect(packageJson.scripts['cap:open:ios']).toContain('cap open ios');
    });

    it('should have cap:build script', () => {
      expect(packageJson.scripts['cap:build']).toBeDefined();
      expect(packageJson.scripts['cap:build']).toContain('build');
      expect(packageJson.scripts['cap:build']).toContain('cap sync');
    });

    it('should have cap:run:android script', () => {
      expect(packageJson.scripts['cap:run:android']).toBeDefined();
      expect(packageJson.scripts['cap:run:android']).toContain('cap run android');
    });

    it('should have cap:run:ios script', () => {
      expect(packageJson.scripts['cap:run:ios']).toBeDefined();
      expect(packageJson.scripts['cap:run:ios']).toContain('cap run ios');
    });
  });

  describe('Capacitor Dependencies', () => {
    it('should have @capacitor/core as devDependency', () => {
      expect(packageJson.devDependencies['@capacitor/core']).toBeDefined();
    });

    it('should have @capacitor/cli as devDependency', () => {
      expect(packageJson.devDependencies['@capacitor/cli']).toBeDefined();
    });

    it('should have @capacitor/android as dependency', () => {
      expect(packageJson.dependencies['@capacitor/android']).toBeDefined();
    });

    it('should have @capacitor/ios as dependency', () => {
      expect(packageJson.dependencies['@capacitor/ios']).toBeDefined();
    });
  });
});
