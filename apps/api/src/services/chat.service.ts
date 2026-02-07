/**
 * Chat Service
 * Handles chat and messaging operations
 */

import { prisma } from '../lib/prisma.js';
import { ChatStatus, MessageType } from '@prisma/client';

export const chatService = {
  /**
   * Get user's chats
   */
  async getUserChats(userId: string, options: { limit?: number; offset?: number; isTemporary?: boolean } = {}) {
    const { limit = 20, offset = 0, isTemporary } = options;

    const where: any = {
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
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImages: true,
              isVerified: true,
              lastActiveAt: true,
            },
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImages: true,
              isVerified: true,
              lastActiveAt: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.chat.count({ where }),
    ]);

    // Format chats with other user info
    const formattedChats = chats.map((chat) => {
      const otherUser = chat.user1Id === userId ? chat.user2 : chat.user1;
      const lastMessage = chat.messages[0] || null;
      return {
        id: chat.id,
        otherUser: {
          id: otherUser.id,
          first_name: otherUser.firstName,
          last_name: otherUser.lastName,
          profile_images: otherUser.profileImages,
          is_verified: otherUser.isVerified,
          last_active_at: otherUser.lastActiveAt,
        },
        status: chat.status,
        is_temporary: chat.isTemporary,
        is_permanent: chat.isPermanent,
        expires_at: chat.expiresAt,
        last_message: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              message_type: lastMessage.messageType,
              sender_id: lastMessage.senderId,
              is_read: lastMessage.isRead,
              created_at: lastMessage.createdAt,
            }
          : null,
        created_at: chat.createdAt,
        updated_at: chat.updatedAt,
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
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImages: true,
            isVerified: true,
            lastActiveAt: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImages: true,
            isVerified: true,
            lastActiveAt: true,
          },
        },
      },
    });

    if (!chat) {
      return null;
    }

    const otherUser = chat.user1Id === userId ? chat.user2 : chat.user1;

    return {
      id: chat.id,
      otherUser: {
        id: otherUser.id,
        first_name: otherUser.firstName,
        last_name: otherUser.lastName,
        profile_images: otherUser.profileImages,
        is_verified: otherUser.isVerified,
        last_active_at: otherUser.lastActiveAt,
      },
      status: chat.status,
      is_temporary: chat.isTemporary,
      is_permanent: chat.isPermanent,
      expires_at: chat.expiresAt,
      created_at: chat.createdAt,
      updated_at: chat.updatedAt,
    };
  },

  /**
   * Create or get existing chat
   */
  async createOrGetChat(userId: string, otherUserId: string, isTemporary = true) {
    // Verify the other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });

    if (!otherUser) {
      throw new Error('Target user not found');
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId },
        ],
        status: { not: ChatStatus.DELETED },
      },
    });

    if (existingChat) {
      return this.getChatById(existingChat.id, userId);
    }

    // Create new chat
    const expiresAt = isTemporary
      ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      : null;

    const chat = await prisma.chat.create({
      data: {
        user1Id: userId,
        user2Id: otherUserId,
        isTemporary,
        isPermanent: !isTemporary,
        expiresAt,
      },
    });

    return this.getChatById(chat.id, userId);
  },

  /**
   * Get messages in a chat
   */
  async getMessages(chatId: string, userId: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = options;

    // Verify user has access to chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!chat) {
      return null;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          chatId,
          isDeleted: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.message.count({
        where: {
          chatId,
          isDeleted: false,
        },
      }),
    ]);

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      chat_id: msg.chatId,
      sender_id: msg.senderId,
      sender: {
        id: msg.sender.id,
        first_name: msg.sender.firstName,
        last_name: msg.sender.lastName,
        profile_images: msg.sender.profileImages,
      },
      message_type: msg.messageType,
      content: msg.content,
      text_content: msg.textContent,
      is_read: msg.isRead,
      created_at: msg.createdAt,
    }));

    return { messages: formattedMessages.reverse(), total };
  },

  /**
   * Send a message
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    data: { content: string; messageType?: MessageType }
  ) {
    const { content, messageType = MessageType.TEXT } = data;

    // Verify sender has access to chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ user1Id: senderId }, { user2Id: senderId }],
        status: ChatStatus.ACTIVE,
      },
    });

    if (!chat) {
      return null;
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        messageType,
        content,
        textContent: messageType === MessageType.TEXT ? content : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImages: true,
          },
        },
      },
    });

    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      chat_id: message.chatId,
      sender_id: message.senderId,
      sender: {
        id: message.sender.id,
        first_name: message.sender.firstName,
        last_name: message.sender.lastName,
        profile_images: message.sender.profileImages,
      },
      message_type: message.messageType,
      content: message.content,
      text_content: message.textContent,
      is_read: message.isRead,
      created_at: message.createdAt,
    };
  },

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string) {
    const message = await prisma.message.findFirst({
      where: { id: messageId },
      include: { chat: true },
    });

    if (!message) {
      return null;
    }

    // Verify user is recipient (not sender)
    const chat = message.chat;
    const isRecipient =
      (chat.user1Id === userId && message.senderId === chat.user2Id) ||
      (chat.user2Id === userId && message.senderId === chat.user1Id);

    if (!isRecipient) {
      return null;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return {
      id: updated.id,
      is_read: updated.isRead,
    };
  },

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!message) {
      return null;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    return { success: true };
  },
};
