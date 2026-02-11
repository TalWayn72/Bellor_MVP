import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CommentsList from './CommentsList';

export default function CommentsDialog({ isOpen, onClose, response, currentUser }) {
  const queryClient = useQueryClient();

  // Mark comments as read when dialog opens
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!response?.id || !currentUser?.id) return;
      // Log read receipt (CommentReadReceipt service can be added in future)
      // CommentReadReceipt tracking - backend service can be added later
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hasNewComments'] });
    }
  });

  const { mutate: markAsRead } = markAsReadMutation;

  React.useEffect(() => {
    if (isOpen && response?.id && currentUser?.id === response?.user_id) {
      markAsRead();
    }
  }, [isOpen, response?.id, response?.user_id, currentUser?.id, markAsRead]);

  // Only show to post owner
  if (!isOpen || !response || !currentUser || currentUser.id !== response.user_id) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div 
        className="bg-white w-full rounded-t-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center p-4 border-b">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="w-5" />
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              תגובות לפוסט שלי
            </h3>
            <button onClick={onClose} className="p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center">
            רק אתה יכול לראות תגובות אלו
          </p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          <CommentsList responseId={response?.id} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}