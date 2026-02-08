/**
 * Chat Messages Service
 * Message CRUD: send, get, delete, markAsRead
 */

import { prisma } from '../../lib/prisma.js';
import { ChatStatus, MessageType } from '@prisma/client';

/**
 * Get messages in a chat
 */
export async function getMessages(
  chatId: string,
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;

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
      where: { chatId, isDeleted: false },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profileImages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.message.count({ where: { chatId, isDeleted: false } }),
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
}

/**
 * Send a message
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  data: { content: string; messageType?: MessageType }
) {
  const { content, messageType = MessageType.TEXT } = data;

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
        select: { id: true, firstName: true, lastName: true, profileImages: true },
      },
    },
  });

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
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string, userId: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId },
    include: { chat: true },
  });

  if (!message) {
    return null;
  }

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

  return { id: updated.id, is_read: updated.isRead };
}

/**
 * Delete message (soft delete)
 */
export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, senderId: userId },
  });

  if (!message) {
    return null;
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });

  return { success: true };
}

