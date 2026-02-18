/**
 * Network Status Hook
 * Tracks online/offline state using Capacitor Network plugin (native)
 * or browser navigator.onLine (web). Returns current connection status.
 */

import { useState, useEffect } from 'react';
import { isNative } from '@/utils/platform';

interface NetworkState {
  isOnline: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    if (isNative()) {
      let cleanup: (() => Promise<void>) | null = null;

      (async () => {
        try {
          const { Network } = await import('@capacitor/network');
          const status = await Network.getStatus();
          setState({ isOnline: status.connected, connectionType: status.connectionType });

          const handle = await Network.addListener('networkStatusChange', (s) => {
            setState({ isOnline: s.connected, connectionType: s.connectionType });
          });
          cleanup = () => handle.remove();
        } catch {
          // Fallback to browser API
        }
      })();

      return () => { cleanup?.(); };
    }

    // Web fallback
    const goOnline = () => setState((s) => ({ ...s, isOnline: true }));
    const goOffline = () => setState((s) => ({ ...s, isOnline: false }));
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return state;
}
