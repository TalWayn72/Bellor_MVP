import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { createPageUrl } from '@/utils';
import { Bell, Lock, HelpCircle, LogOut, Palette, Shield, ChevronRight, User } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';
import { ListSkeleton } from '@/components/states';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentUser, isLoading } = useCurrentUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(createPageUrl('Welcome'));
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ListSkeleton count={6} />
        </div>
      </div>
    );
  }

  const settingsItems = [
    {
      icon: Bell,
      label: 'Notifications',
      onClick: () => navigate(createPageUrl('NotificationSettings')),
    },
    {
      icon: Lock,
      label: 'Privacy & Security',
      onClick: () => navigate(createPageUrl('PrivacySettings')),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onClick: () => navigate(createPageUrl('HelpSupport')),
    },
  ];

  const adminItems = [
    {
      icon: Shield,
      label: 'Admin Panel',
      onClick: () => navigate(createPageUrl('AdminDashboard')),
      isAdmin: true,
    },
    {
      icon: Palette,
      label: 'App Theme (Admin)',
      onClick: () => navigate(createPageUrl('ThemeSettings')),
      isAdmin: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
          <h1 className="flex-1 text-center text-lg font-semibold">Settings</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar size="xl">
                <AvatarImage
                  src={currentUser.profile_images?.[0] || `https://i.pravatar.cc/150?u=${currentUser.id}`}
                  alt="Profile"
                />
                <AvatarFallback>
                  {currentUser.nickname?.charAt(0) || currentUser.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  {currentUser.nickname || currentUser.full_name}
                </h2>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(createPageUrl('Profile'))}
              className="w-full"
              size="lg"
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Settings Options */}
        <Card>
          <div className="divide-y divide-border">
            {settingsItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="flex-1 text-left text-base font-medium">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>

        {/* Admin Section */}
        {currentUser?.is_admin && (
          <Card className="border-secondary/30">
            <div className="px-6 py-3 border-b border-secondary/20 bg-secondary/5">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide">
                Admin Options
              </p>
            </div>
            <div className="divide-y divide-border">
              {adminItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="flex-1 text-left text-base font-medium text-secondary-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="w-5 h-5 text-secondary/50" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="lg"
          className="w-full border-destructive text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>

        {/* Version */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">Bellør v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
