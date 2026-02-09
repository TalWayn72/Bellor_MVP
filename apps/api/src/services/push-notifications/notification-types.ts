/**
 * Notification Type Definitions
 * Types and interfaces for the notification event system
 */

export interface NotificationEventResult {
  sent: number;
  failed: number;
}

export type SendToUserFn = (input: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) => Promise<NotificationEventResult>;
