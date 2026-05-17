import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

type VideoCallInviteData = {
  chatId: string;
  receiverId: string;
};

export function createVideoCallInviteHandler(io: Server, socket: AuthenticatedSocket) {
  return async (data: VideoCallInviteData, callback?: (response: unknown) => void) => {
    if (!socket.userId) {
      return callback?.({ error: 'Unauthorized' });
    }

    try {
      const { chatId, receiverId } = data;
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { user1Id: socket.userId },
            { user2Id: socket.userId },
          ],
        },
        include: {
          user1: { select: { id: true, firstName: true, lastName: true, profileImages: true } },
          user2: { select: { id: true, firstName: true, lastName: true, profileImages: true } },
        },
      });

      if (!chat) {
        return callback?.({ error: 'Conversation not found or access denied' });
      }

      const verifiedReceiverId = chat.user1Id === socket.userId ? chat.user2Id : chat.user1Id;
      if (receiverId === socket.userId || receiverId !== verifiedReceiverId) {
        return callback?.({ error: 'Receiver must be the other chat participant' });
      }

      const caller = chat.user1Id === socket.userId ? chat.user1 : chat.user2;
      const payload = {
        chatId,
        callerId: socket.userId,
        receiverId,
        caller,
        createdAt: new Date().toISOString(),
      };

      io.to(`user:${receiverId}`).emit('video-call:incoming', payload);
      callback?.({ success: true, data: payload });
    } catch (error) {
      logger.error('CHAT', 'Error sending video call invite', error instanceof Error ? error : undefined);
      callback?.({ error: 'Failed to send video call invite' });
    }
  };
}
