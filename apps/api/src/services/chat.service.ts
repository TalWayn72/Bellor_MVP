/**
 * Chat Service
 * Chat CRUD: createChat, getChat, getUserChats
 * Message operations delegated to chat/chat-messages.service.ts
 */

import { prisma } from '../lib/prisma.js';
import { ChatStatus, Prisma } from '@prisma/client';
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
} from './chat/chat-messages.service.js';

export const chatService = {
  /**
   * Get user's chats
   */
  async getUserChats(userId: string, options: { limit?: number; offset?: number; isTemporary?: boolean } = {}) {
    const { limit = 20, offset = 0, isTemporary } = options;

    const where: Prisma.ChatWhereInput = {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: { not: ChatStatus.DELETED },
    };

    if (isTemporary !== undefined) {
      where.isTemporary = isTemporary;
    }

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        include: {
          user1: {
            select: { id: true, firstName: true, lastName: true, profileImages: true, isVerified: true, lastActiveAt: true },
          },
          user2: {
            select: { id: true, firstName: true, lastName: true, profileImages: true, isVerified: true, lastActiveAt: true },
          },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.chat.count({ where }),
    ]);

    const formattedChats = chats.map((chat) => {
      const otherUser = chat.user1Id === userId ? chat.user2 : chat.user1;
      const lastMessage = chat.messages[0] || null;
      return {
        id: chat.id,
        otherUser: {
          id: otherUser.id, first_name: otherUser.firstName, last_name: otherUser.lastName,
          profile_images: otherUser.profileImages, is_verified: otherUser.isVerified,
          last_active_at: otherUser.lastActiveAt,
        },
        status: chat.status, is_temporary: chat.isTemporary, is_permanent: chat.isPermanent,
        expires_at: chat.expiresAt,
        last_message: lastMessage ? {
          id: lastMessage.id, content: lastMessage.content, message_type: lastMessage.messageType,
          sender_id: lastMessage.senderId, is_read: lastMessage.isRead, created_at: lastMessage.createdAt,
        } : null,
        created_at: chat.createdAt, updated_at: chat.updatedAt,
      };
    });

    return { chats: formattedChats, total };
  },

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string) {
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: { not: ChatStatus.DELETED },
      },
      include: {
        user1: { select: { id: true, firstName: true, lastName: true, profileImages: true, isVerified: true, lastActiveAt: true } },
        user2: { select: { id: true, firstName: true, lastName: true, profileImages: true, isVerified: true, lastActiveAt: true } },
      },
    });

    if (!chat) return null;

    const otherUser = chat.user1Id === userId ? chat.user2 : chat.user1;
    return {
      id: chat.id,
      otherUser: {
        id: otherUser.id, first_name: otherUser.firstName, last_name: otherUser.lastName,
        profile_images: otherUser.profileImages, is_verified: otherUser.isVerified,
        last_active_at: otherUser.lastActiveAt,
      },
      status: chat.status, is_temporary: chat.isTemporary, is_permanent: chat.isPermanent,
      expires_at: chat.expiresAt, created_at: chat.createdAt, updated_at: chat.updatedAt,
    };
  },

  /**
   * Create or get existing chat
   */
  async createOrGetChat(userId: string, otherUserId: string, isTemporary = true) {
    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
    if (!otherUser) throw new Error('Target user not found');

    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId },
        ],
        status: { not: ChatStatus.DELETED },
      },
    });

    if (existingChat) return this.getChatById(existingChat.id, userId);

    const expiresAt = isTemporary ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
    const chat = await prisma.chat.create({
      data: { user1Id: userId, user2Id: otherUserId, isTemporary, isPermanent: !isTemporary, expiresAt },
    });
    return this.getChatById(chat.id, userId);
  },

  // Delegate message operations
  getMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
};
