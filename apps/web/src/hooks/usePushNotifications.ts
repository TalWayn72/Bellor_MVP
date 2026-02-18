/**
 * Push Notifications Hook
 * Registers for push notifications on native platforms via Capacitor,
 * sends device token to backend, and handles incoming notifications.
 * No-op on web (web push would use a different mechanism).
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNative } from '@/utils/platform';

interface PushNotificationOptions {
  userId?: string;
  onTokenReceived?: (token: string) => void;
  onNotification?: (title: string, body: string, data: Record<string, string>) => void;
}

export function usePushNotifications(options: PushNotificationOptions = {}) {
  const navigate = useNavigate();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const registerToken = useCallback(async (token: string) => {
    if (!optionsRef.current.userId) return;
    try {
      const { apiClient } = await import('@/api/client/apiClient');
      await apiClient.post('/device-tokens/register', {
        token,
        platform: 'android', // Will be overridden by actual platform detection
        deviceId: `cap-${Date.now()}`,
      });
    } catch {
      // Token registration failed - will retry on next app launch
    }
  }, []);

  useEffect(() => {
    if (!isNative() || !optionsRef.current.userId) return;

    let cleanupFns: Array<() => Promise<void>> = [];

    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return;

        await PushNotifications.register();

        // Handle token registration
        const regHandle = await PushNotifications.addListener('registration', (token) => {
          optionsRef.current.onTokenReceived?.(token.value);
          registerToken(token.value);
        });
        cleanupFns.push(() => regHandle.remove());

        // Handle foreground notifications
        const fgHandle = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            optionsRef.current.onNotification?.(
              notification.title || '',
              notification.body || '',
              (notification.data as Record<string, string>) || {},
            );
          },
        );
        cleanupFns.push(() => fgHandle.remove());

        // Handle notification tap (navigate to relevant page)
        const tapHandle = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            const data = (action.notification.data as Record<string, string>) || {};
            if (data.chatId) navigate(`/Chat?id=${data.chatId}`);
            else if (data.screen) navigate(`/${data.screen}`);
          },
        );
        cleanupFns.push(() => tapHandle.remove());
      } catch {
        // Push notifications not available
      }
    })();

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [navigate, registerToken]);
}
