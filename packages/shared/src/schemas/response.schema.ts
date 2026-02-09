import { z } from 'zod';
import { PaginationParamsSchema, PaginationResponseSchema } from './common.schema.js';

export const ResponseTypeEnum = z.enum(['TEXT', 'VOICE', 'VIDEO', 'DRAWING']);

export const ResponseDbSchema = z.object({
  id: z.string(),
  userId: z.string(),
  missionId: z.string().optional().nullable(),
  responseType: ResponseTypeEnum,
  content: z.string(),
  textContent: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  duration: z.number().int().optional().nullable(),
  viewCount: z.number().int(),
  likeCount: z.number().int(),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
});

export const ResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  missionId: z.string().optional().nullable(),
  responseType: ResponseTypeEnum,
  content: z.string(),
  textContent: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  duration: z.number().int().optional().nullable(),
  viewCount: z.number().int(),
  likeCount: z.number().int(),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
});

export const CreateResponseRequestSchema = z.object({
  missionId: z.string(),
  responseType: ResponseTypeEnum.optional().default('TEXT'),
  content: z.string().optional(),
  mediaUrl: z.string().optional(),
  textContent: z.string().optional(),
  duration: z.number().int().optional(),
  isPublic: z.boolean().optional().default(true),
});

export const ListResponsesQuerySchema = PaginationParamsSchema.extend({
  userId: z.string().optional(),
});

export const ResponseListResponseSchema = z.object({
  responses: z.array(ResponseSchema),
  data: z.array(ResponseSchema).optional(),
  pagination: PaginationResponseSchema.optional(),
});

export const UserResponsesResponseSchema = z.object({
  responses: z.array(ResponseSchema),
  total: z.number().int(),
});

export const ResponseByIdResponseSchema = z.object({
  data: ResponseSchema,
});

export const CreateResponseResponseSchema = z.object({
  response: ResponseSchema,
});

export const LikeResponseResponseSchema = z.object({
  message: z.string(),
  likeCount: z.number().int().optional(),
});

export const DeleteResponseResponseSchema = z.object({
  message: z.string(),
});

export type ResponseType = z.infer<typeof ResponseTypeEnum>;
export type ResponseDb = z.infer<typeof ResponseDbSchema>;
export type Response = z.infer<typeof ResponseSchema>;
export type CreateResponseRequest = z.infer<typeof CreateResponseRequestSchema>;
export type ListResponsesQuery = z.infer<typeof ListResponsesQuerySchema>;
export type ResponseListResponse = z.infer<typeof ResponseListResponseSchema>;
export type UserResponsesResponse = z.infer<typeof UserResponsesResponseSchema>;
export type ResponseByIdResponse = z.infer<typeof ResponseByIdResponseSchema>;
export type CreateResponseResponse = z.infer<typeof CreateResponseResponseSchema>;
export type LikeResponseResponse = z.infer<typeof LikeResponseResponseSchema>;
export type DeleteResponseResponse = z.infer<typeof DeleteResponseResponseSchema>;
