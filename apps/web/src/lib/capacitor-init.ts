/**
 * Capacitor Plugin Initialization
 * Initializes native plugins when running in a Capacitor environment.
 * Safe to call on web - all operations are guarded by isNative().
 */

import { isNative } from '@/utils/platform';

export async function initCapacitor(): Promise<void> {
  if (!isNative()) return;

  try {
    const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
      import('@capacitor/splash-screen'),
      import('@capacitor/status-bar'),
    ]);

    // Hide splash screen (auto-hide is configured, but ensure it happens)
    await SplashScreen.hide();

    // Configure status bar for Bellor branding
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#EC4899' });
  } catch {
    // Plugins may not be available in all environments
  }
}
