import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Video, Mic, Pencil } from 'lucide-react';

export default function DailyTaskSelector({ isOpen, onClose, mission }) {
  const navigate = useNavigate();

  const taskOptions = [
    {
      id: 'write',
      title: 'כתוב',
      icon: FileText,
      color: 'bg-blue-500',
      path: 'WriteTask'
    },
    {
      id: 'video',
      title: 'וידאו',
      icon: Video,
      color: 'bg-red-500',
      path: 'VideoTask'
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

  const handleOptionClick = (option) => {
    onClose();
    navigate(createPageUrl(option.path));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-2">
            איך תרצה לשתף?
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 text-center">
            {mission?.question || "שתף משהו מעניין על עצמך היום"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {taskOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center`}>
                <option.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">{option.title}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}