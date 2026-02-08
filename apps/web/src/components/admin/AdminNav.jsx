import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, Users, Flag, Activity, MessageSquare,
  UserPlus, Settings, Palette, Home, LogOut
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: 'AdminDashboard' },
  { label: 'User Management', icon: Users, path: 'AdminUserManagement' },
  { label: 'Report Management', icon: Flag, path: 'AdminReportManagement' },
  { label: 'Activity Monitoring', icon: Activity, path: 'AdminActivityMonitoring' },
  { label: 'Chat Monitoring', icon: MessageSquare, path: 'AdminChatMonitoring' },
  { label: 'Pre-Registrations', icon: UserPlus, path: 'AdminPreRegistration' },
  { label: 'System Settings', icon: Settings, path: 'AdminSystemSettings' },
  { label: 'Theme Settings', icon: Palette, path: 'ThemeSettings' },
];

export function AdminNavItems({ onNavigate }) {
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(createPageUrl(path));
    if (onNavigate) onNavigate();
  };

  return (
    <nav className="flex-1 p-4 space-y-2">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNav(item.path)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-right"
        >
          <item.icon className="w-5 h-5" />
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function AdminFooterActions({ onLogout, onNavigate }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(createPageUrl('SharedSpace'));
    if (onNavigate) onNavigate();
  };

  return (
    <div className="p-4 border-t border-gray-800 space-y-2">
      <button
        onClick={handleGoHome}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-right"
      >
        <Home className="w-5 h-5" />
        <span className="text-sm font-medium">Back to App</span>
      </button>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900 transition-colors text-right"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Logout</span>
      </button>
    </div>
  );
}
