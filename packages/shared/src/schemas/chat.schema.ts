import { z } from 'zod';
import { PaginationParamsSchema, PaginationResponseSchema } from './common.schema.js';

export const ChatStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'BLOCKED', 'DELETED']);
export const MessageTypeEnum = z.enum(['TEXT', 'VOICE', 'IMAGE', 'VIDEO', 'DRAWING']);

export const ChatDbSchema = z.object({
  id: z.string(),
  user1Id: z.string(),
  user2Id: z.string(),
  status: ChatStatusEnum,
  isTemporary: z.boolean(),
  isPermanent: z.boolean(),
  isConvertedToPermanent: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
  reportedCount: z.number().int(),
  messageCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastMessageAt: z.string().datetime().optional().nullable(),
});

export const ChatOtherUserSchema = z.object({
  id: z.string(),
  nickname: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  profileImages: z.array(z.string()).optional(),
  isVerified: z.boolean().optional(),
});

export const ChatResponseSchema = z.object({
  id: z.string(),
  user1Id: z.string(),
  user2Id: z.string(),
  status: ChatStatusEnum,
  isTemporary: z.boolean(),
  isPermanent: z.boolean(),
  isConvertedToPermanent: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
  reportedCount: z.number().int(),
  messageCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastMessageAt: z.string().datetime().optional().nullable(),
  otherUser: ChatOtherUserSchema.optional(),
});

export const MessageDbSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  messageType: MessageTypeEnum,
  content: z.string().optional().nullable(),
  textContent: z.string().optional().nullable(),
  isRead: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().optional().nullable(),
});

export const MessageResponseSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  messageType: MessageTypeEnum,
  content: z.string().optional().nullable(),
  textContent: z.string().optional().nullable(),
  isRead: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().optional().nullable(),
});

export const CreateChatRequestSchema = z.object({
  otherUserId: z.string(),
});

export const SendMessageRequestSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  type: MessageTypeEnum.optional().default('TEXT'),
  messageType: MessageTypeEnum.optional(),
});

export const GetChatsQuerySchema = PaginationParamsSchema;

export const GetMessagesQuerySchema = PaginationParamsSchema;

export const ChatListResponseSchema = z.object({
  chats: z.array(ChatResponseSchema),
  total: z.number().int(),
  pagination: PaginationResponseSchema.optional(),
});

export const ChatByIdResponseSchema = z.object({
  chat: ChatResponseSchema,
});

export const MessageListResponseSchema = z.object({
  messages: z.array(MessageResponseSchema),
  total: z.number().int(),
});

export const SendMessageResponseSchema = z.object({
  message: MessageResponseSchema,
});

export const MarkAsReadResponseSchema = z.object({
  message: MessageResponseSchema,
});

export type ChatStatus = z.infer<typeof ChatStatusEnum>;
export type MessageType = z.infer<typeof MessageTypeEnum>;
export type ChatDb = z.infer<typeof ChatDbSchema>;
export type ChatOtherUser = z.infer<typeof ChatOtherUserSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type MessageDb = z.infer<typeof MessageDbSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type CreateChatRequest = z.infer<typeof CreateChatRequestSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type GetChatsQuery = z.infer<typeof GetChatsQuerySchema>;
export type GetMessagesQuery = z.infer<typeof GetMessagesQuerySchema>;
export type ChatListResponse = z.infer<typeof ChatListResponseSchema>;
export type ChatByIdResponse = z.infer<typeof ChatByIdResponseSchema>;
export type MessageListResponse = z.infer<typeof MessageListResponseSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
export type MarkAsReadResponse = z.infer<typeof MarkAsReadResponseSchema>;
