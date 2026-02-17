import React from 'react';
import { likeService, userService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star } from 'lucide-react';

export default function StarSendersModal({ isOpen, onClose, response, currentUser }) {

  // Fetch all star senders for this response
  const { data: starLikes = [], isLoading } = useQuery({
    queryKey: ['starSenders', response?.id],
    queryFn: async () => {
      if (!response?.id) return [];
      try {
        const result = await likeService.getResponseLikes(response.id, { likeType: 'POSITIVE' });
        return result.likes || [];
      } catch (error) {
        console.error('Error fetching star senders:', error);
        return [];
      }
    },
    enabled: isOpen && !!response?.id && currentUser?.id === response?.user_id,
  });

  // Fetch user details for each star sender
  const { data: senders = [] } = useQuery({
    queryKey: ['starSendersDetails', starLikes],
    queryFn: async () => {
      if (!starLikes || starLikes.length === 0) return [];

      const userPromises = starLikes.map(async (like) => {
        try {
          const result = await userService.getUserById(like.user_id);
          return result?.user || result;
        } catch {
          return null;
        }
      });

      const users = await Promise.all(userPromises);
      return users.filter(u => u !== null);
    },
    enabled: starLikes?.length > 0,
  });

  if (!response || currentUser?.id !== response.user_id) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center mb-2 flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            מי שלח לך כוכב
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 text-center">
            משתמשים שנתנו פידבק חיובי לפוסט שלך
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : !senders || senders.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">עדיין אף אחד לא שלח כוכב</p>
            </div>
          ) : (
            senders.map((sender) => (
              <div
                key={sender.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <img
                  src={sender.profile_images?.[0] || `https://i.pravatar.cc/150?u=${sender.id}`}
                  alt={sender.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                  loading="lazy"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{sender.full_name || sender.nickname}</p>
                  {sender.age && (
                    <p className="text-xs text-gray-500">{sender.age} שנים</p>
                  )}
                </div>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}