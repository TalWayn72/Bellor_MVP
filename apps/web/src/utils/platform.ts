/**
 * Platform detection utilities for Capacitor/PWA
 * Provides methods to detect the current platform and capabilities
 */

export type Platform = 'web' | 'android' | 'ios';

/**
 * Checks if running in a native Capacitor environment
 */
export function isNative(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
}

/**
 * Gets the current platform
 */
export function getPlatform(): Platform {
  if (typeof window === 'undefined') {
    return 'web';
  }

  const capacitor = (window as any).Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    const platform = capacitor.getPlatform?.();
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
  }

  return 'web';
}

/**
 * Checks if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Checks if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Checks if the app is installed as PWA
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Checks if the browser supports PWA installation
 */
export function canInstallPWA(): boolean {
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
}

/**
 * Checks if push notifications are supported
 */
export function supportsPushNotifications(): boolean {
  return 'Notification' in window && 'PushManager' in window;
}

/**
 * Gets the user agent for mobile detection
 */
export function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Checks if online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Gets device info for debugging/analytics
 */
export function getDeviceInfo() {
  return {
    platform: getPlatform(),
    isNative: isNative(),
    isPWA: isPWA(),
    isMobile: isMobileUserAgent(),
    isOnline: isOnline(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'en',
  };
}
