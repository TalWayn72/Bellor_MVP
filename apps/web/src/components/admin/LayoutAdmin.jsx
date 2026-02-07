import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  Users,
  Flag,
  Activity,
  MessageSquare,
  UserPlus,
  Settings,
  Palette,
  Home,
  LogOut
} from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Layout Component for Admin Pages
 * Checks if user has admin role and provides navigation sidebar
 */
export default function LayoutAdmin({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentUser, isLoading } = useCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Admin navigation items
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

  const handleLogout = async () => {
    await logout();
    navigate(createPageUrl('Welcome'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check if user is admin (backend returns isAdmin -> transformed to is_admin by apiClient)
  if (!currentUser || !currentUser.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate(createPageUrl('SharedSpace'))}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gray-900 text-white">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">{currentUser.full_name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(createPageUrl(item.path))}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-right"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={() => navigate(createPageUrl('SharedSpace'))}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-right"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">חזרה לאפליקציה</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900 transition-colors text-right"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 right-0 z-50 p-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-900 text-white rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}>
          <aside className="absolute right-0 top-0 bottom-0 w-64 bg-gray-900 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-gray-400 mt-1">{currentUser.full_name}</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(createPageUrl(item.path));
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-right"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-800 space-y-2">
              <button
                onClick={() => {
                  navigate(createPageUrl('SharedSpace'));
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-right"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">חזרה לאפליקציה</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900 transition-colors text-right"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
    </ErrorBoundary>
  );
}