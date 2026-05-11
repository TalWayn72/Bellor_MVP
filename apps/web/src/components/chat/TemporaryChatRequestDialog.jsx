import React from 'react';
import { Button } from '@/components/ui/button';
import { formatLocation } from '@/utils';

export default function TemporaryChatRequestDialog({ user, isOpen, onClose, onSend }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* User Info */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={user?.profile_images?.[0] || `https://i.pravatar.cc/150?u=${user?.id}`}
            alt={user?.nickname}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">{user?.nickname || 'משתמש'} • {user?.age || '24'}</h3>
              {user?.is_verified && (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">{formatLocation(user?.location) || 'מיקום לא צוין'}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h4 className="font-semibold text-base mb-2">בקשת צ'אט זמני</h4>
          <p className="text-sm text-gray-700 leading-relaxed mb-1">
            זהו צ'אט זמני. אם השיחה לא תהפוך לקבועה, היא תימחק לאחר 24 שעות.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            לשלוח בקשת צ'אט זמני אל <span className="font-semibold">{user?.nickname || 'המשתמש'}</span>?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </Button>
          <Button
            onClick={() => {
              onSend();
              onClose();
            }}
            className="flex-1 h-12 text-sm bg-gray-900 hover:bg-gray-800 text-white"
          >
            שליחה
          </Button>
        </div>
      </div>
    </div>
  );
}
