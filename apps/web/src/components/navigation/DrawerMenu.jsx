import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X } from 'lucide-react';
import { menuItems } from './DrawerMenuItems';

export default function DrawerMenu({ isOpen, onClose, currentUser }) {
  const navigate = useNavigate();

  const user = currentUser || {
    id: 'guest', nickname: 'Guest', full_name: 'Guest User',
    age: 25, location: 'Unknown', profile_images: []
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl" dir="rtl">
        <div className="relative h-80 bg-gray-200 overflow-hidden">
          <img
            src={user.profile_images?.[0] || `https://i.pravatar.cc/400?u=${user.id}`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />

          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>

          {user.is_verified && (
            <div className="absolute top-4 right-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-lg">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-white text-2xl font-bold mb-1">
              {user.nickname || user.full_name} {'\u2022'} {user.age}
            </h2>
            <p className="text-white/90 text-sm">{user.location}</p>
          </div>
        </div>

        <div className="py-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => { navigate(createPageUrl(item.path)); onClose(); }}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-gray-600">{item.icon}</div>
              <span className="text-base text-gray-900">{item.label}</span>
              <svg className="w-5 h-5 text-gray-500 mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Bellor</h1>
        </div>
      </div>
    </>
  );
}
