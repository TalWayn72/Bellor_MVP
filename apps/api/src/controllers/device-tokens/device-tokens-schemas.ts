/**
 * Device Tokens Schemas
 * Type definitions for device token endpoints
 */

import { Platform } from '@prisma/client';

export interface RegisterDeviceBody {
  token: string;
  platform: Platform;
  deviceId?: string;
  deviceName?: string;
}

export interface UnregisterDeviceBody {
  token: string;
}

export interface SendTestNotificationBody {
  title: string;
  body: string;
}
