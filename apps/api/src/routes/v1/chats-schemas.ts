/**
 * Chat Zod Validation Schemas
 * Validation for chat CRUD and message endpoints
 */
import { z } from 'zod';

// === Query Schemas ===

export const chatListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  is_temporary: z.enum(['true', 'false']).optional(),
});

export const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// === Params Schemas ===

export const chatIdParamsSchema = z.object({
  chatId: z.string().min(1, 'chatId is required'),
});

export const messageParamsSchema = z.object({
  chatId: z.string().min(1, 'chatId is required'),
  messageId: z.string().min(1, 'messageId is required'),
});

// === Body Schemas ===

export const createChatBodySchema = z.object({
  otherUserId: z.string().min(1).optional(),
  other_user_id: z.string().min(1).optional(),
  isTemporary: z.boolean().optional(),
  is_temporary: z.boolean().optional(),
}).refine(
  (data) => data.otherUserId || data.other_user_id,
  { message: 'otherUserId is required' },
);

const messageTypeEnum = z.string().transform(v => v.toUpperCase()).pipe(
  z.enum(['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'SYSTEM']),
);

export const sendMessageBodySchema = z.object({
  content: z.string().min(1, 'content is required').max(5000),
  messageType: messageTypeEnum.optional(),
  message_type: messageTypeEnum.optional(),
  type: messageTypeEnum.optional(),
});

// === Type Exports ===

export type ChatListQuery = z.infer<typeof chatListQuerySchema>;
export type CreateChatBody = z.infer<typeof createChatBodySchema>;
export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;
