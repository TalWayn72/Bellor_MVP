import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bellor.app',
  appName: 'Bellor',
  webDir: 'dist',
  server: {
    // Use HTTPS scheme for Android to ensure secure communication
    androidScheme: 'https',
    // Allow cleartext for development (remove in production)
    // cleartext: true,
  },
  android: {
    // Build preferences
    buildOptions: {
      keystorePath: undefined, // Set during release build
      keystoreAlias: undefined,
    },
    // Splash screen will show while app loads
    allowMixedContent: false,
  },
  ios: {
    // iOS specific configuration
    contentInset: 'automatic',
    // Enable scrolling
    scrollEnabled: true,
  },
  plugins: {
    // Push Notifications configuration
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Splash Screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#EC4899', // Pink - Bellor brand color
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Status Bar configuration
    StatusBar: {
      style: 'LIGHT', // Light text for pink background
      backgroundColor: '#EC4899',
    },
    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
