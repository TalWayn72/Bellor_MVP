import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { responseService, likeService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Video, Mic, Pencil, Check } from 'lucide-react';

export default function HeartResponseSelector({ isOpen, onClose, targetUser, currentUser, responseId }) {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);

  // Fetch current user's existing responses (up to 2 most recent)
  const { data: existingResponses = [] } = useQuery({
    queryKey: ['userResponses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await responseService.getUserResponses(currentUser.id, { limit: 2 });
        return result.responses || [];
      } catch (error) {
        console.error('Error fetching user responses:', error);
        return [];
      }
    },
    enabled: !!currentUser && isOpen,
  });

  const createOptions = [
    {
      id: 'video',
      title: 'וידאו',
      icon: Video,
      color: 'bg-red-500',
      path: 'VideoTask'
    },
    {
      id: 'text',
      title: 'טקסט',
      icon: FileText,
      color: 'bg-blue-500',
      path: 'WriteTask'
    },
    {
      id: 'audio',
      title: 'אודיו',
      icon: Mic,
      color: 'bg-green-500',
      path: 'AudioTask'
    },
    {
      id: 'drawing',
      title: 'ציור',
      icon: Pencil,
      color: 'bg-purple-500',
      path: 'Onboarding?step=13'
    }
  ];

  const handleExistingResponse = async (response) => {
    setSending(true);
    try {
      await likeService.likeUser(targetUser.id, 'ROMANTIC', response.id);
      onClose(true); // Pass true to indicate sent
    } catch (error) {
      console.error('Error sending romantic interest:', error);
      setSending(false);
    }
  };

  const handleCreateNew = (option) => {
    onClose(false);
    navigate(createPageUrl(option.path));
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-2">
            איך תרצה להגיב?
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 text-center">
            הראה ל-{targetUser?.nickname || 'המשתמש'} שאת/ה מעוניין/ת
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Existing Responses */}
          {existingResponses?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">תגובות קיימות שלך</h3>
              <div className="space-y-2">
                {existingResponses.map((response) => (
                  <button
                    key={response.id}
                    onClick={() => handleExistingResponse(response)}
                    disabled={sending}
                    className="w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-right disabled:opacity-50"
                  >
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {response.text_content || `${response.response_type} response`}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">צור תגובה חדשה</h3>
            <div className="grid grid-cols-2 gap-3">
              {createOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleCreateNew(option)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center`}>
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">{option.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}