/**
 * Achievements Controller - barrel export
 */
export { AchievementsController } from '../achievements.controller.js';
export {
  listAchievementsQuerySchema,
  achievementIdParamsSchema,
  achievementUserParamsSchema,
} from './achievements-schemas.js';
export type {
  ListAchievementsQuery,
  AchievementIdParams,
  AchievementUserParams,
} from './achievements-schemas.js';
