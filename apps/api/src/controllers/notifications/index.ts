/**
 * Notifications Controller - barrel export
 */
export { NotificationsController } from '../notifications.controller.js';
export {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from './notifications-schemas.js';
export type {
  ListNotificationsQuery,
  NotificationIdParams,
} from './notifications-schemas.js';
