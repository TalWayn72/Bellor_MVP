/**
 * Chat Messages - Mutation operations
 * Send, delete, and mark messages as read
 */

import { prisma } from '../../lib/prisma.js';
import { ChatStatus, MessageType } from '@prisma/client';
import type { SendMessageData, FormattedMessage } from './chat-messages.types.js';

/**
 * Send a message
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  data: SendMessageData
): Promise<FormattedMessage | null> {
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
