/**
 * Likes Controller - barrel export
 */
export { LikesController } from '../likes.controller.js';
export { LikesResponseController } from './likes-response.controller.js';
export {
  likeUserBodySchema,
  likeResponseBodySchema,
  listLikesQuerySchema,
  targetUserParamsSchema,
  responseIdParamsSchema,
} from './likes-schemas.js';
export type {
  LikeUserBody,
  LikeResponseBody,
  ListLikesQuery,
  TargetUserParams,
  ResponseIdParams,
} from './likes-schemas.js';
