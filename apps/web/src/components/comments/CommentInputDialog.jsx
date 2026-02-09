import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { chatService } from '@/api';
import { useToast } from '@/components/ui/use-toast';

export default function CommentInputDialog({ isOpen, onClose, response, currentUser }) {
  const [commentText, setCommentText] = React.useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCommentMutation = useMutation({
    mutationFn: async (text) => {
      const chatResult = await chatService.createOrGetChat(response.user_id);
      await chatService.sendMessage(chatResult.chat.id, { content: text, type: 'text' });
    },
    onSuccess: () => {
      setCommentText('');
      onClose();
      toast({ title: 'Comment sent', description: 'Your comment was sent as a message' });
      queryClient.invalidateQueries({ queryKey: ['comments', response.id] });
      queryClient.invalidateQueries({ queryKey: ['hasNewComments'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to send comment', variant: 'destructive' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      createCommentMutation.mutate(commentText);
    }
  };

  if (!response || !currentUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center mb-2 flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            כתוב תגובה
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 text-center">
            התגובה שלך תישלח ישירות לכותב השיתוף
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Textarea
            placeholder="כתוב את התגובה שלך..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-32 resize-none"
            disabled={createCommentMutation.isPending}
          />
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createCommentMutation.isPending}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={!commentText.trim() || createCommentMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {createCommentMutation.isPending ? 'שולח...' : 'שלח תגובה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}