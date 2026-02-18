/**
 * App Lifecycle Hook
 * Handles native app lifecycle events (pause, resume, back button)
 * and deep link URL opening via Capacitor App plugin.
 * No-op on web.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNative } from '@/utils/platform';

interface AppLifecycleOptions {
  onPause?: () => void;
  onResume?: () => void;
}

export function useAppLifecycle(options: AppLifecycleOptions = {}) {
  const navigate = useNavigate();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!isNative()) return;

    let cleanupFns: Array<() => Promise<void>> = [];

    (async () => {
      try {
        const { App } = await import('@capacitor/app');

        // Handle app state changes (foreground/background)
        const stateHandle = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            optionsRef.current.onResume?.();
          } else {
            optionsRef.current.onPause?.();
          }
        });
        cleanupFns.push(() => stateHandle.remove());

        // Handle Android back button
        const backHandle = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
        cleanupFns.push(() => backHandle.remove());

        // Handle deep links (bellor://chat/123 or https://bellor.app/Profile)
        const urlHandle = await App.addListener('appUrlOpen', ({ url }) => {
          const parsed = new URL(url);
          const path = parsed.pathname || parsed.hostname;
          if (path) {
            navigate(path.startsWith('/') ? path : `/${path}`);
          }
        });
        cleanupFns.push(() => urlHandle.remove());
      } catch {
        // App plugin not available
      }
    })();

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [navigate]);
}
