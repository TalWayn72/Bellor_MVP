import { createPageUrl } from '@/utils';

const VIDEO_CALL_INVITE_TIMEOUT_MS = 5000;
const VIDEO_CALL_ERROR = 'Unable to start the video call. Please try again.';

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Video call invite timed out')), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export function buildVideoCallUrl(chatId, userId) {
  return createPageUrl(`VideoDate?chatId=${chatId}&userId=${encodeURIComponent(userId)}`);
}

export async function startVideoCallInvite({ chatId, receiverId, socketService, navigate, toast }) {
  if (!chatId || !receiverId) {
    toast({
      title: 'Video call unavailable',
      description: 'Unable to find the chat participant.',
      variant: 'destructive',
    });
    return;
  }

  try {
    const result = await withTimeout(
      socketService.sendVideoCallInvite(chatId, receiverId),
      VIDEO_CALL_INVITE_TIMEOUT_MS
    );
    if (!result?.success) throw new Error(result?.error || VIDEO_CALL_ERROR);
    navigate(buildVideoCallUrl(chatId, receiverId));
  } catch (error) {
    toast({
      title: 'Video call unavailable',
      description: error?.message === 'Video call invite timed out'
        ? VIDEO_CALL_ERROR
        : error?.message || VIDEO_CALL_ERROR,
      variant: 'destructive',
    });
  }
}
