/**
 * Chat Messages - Query operations
 * Fetch messages with pagination
 */

import { prisma } from '../../lib/prisma.js';
import type { GetMessagesOptions, GetMessagesResult, FormattedMessage } from './chat-messages.types.js';

/**
 * Get messages in a chat
 */
export async function getMessages(
  chatId: string,
  userId: string,
  options: GetMessagesOptions = {}
): Promise<GetMessagesResult | null> {
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

  const formattedMessages: FormattedMessage[] = messages.map((msg) => ({
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
