/**
 * Chat Admin Service
 * Admin-level message operations (no sender ownership check)
 */

import { prisma } from '../../lib/prisma.js';

/**
 * Admin delete message (soft delete, no sender check)
 * Sets isDeleted flag and replaces content with removal notice
 */
export async function adminDeleteMessage(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return null;
  }

  if (message.isDeleted) {
    return { alreadyDeleted: true };
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: '[Message removed by admin]',
      textContent: '[Message removed by admin]',
    },
  });

  return { success: true, messageId };
}
