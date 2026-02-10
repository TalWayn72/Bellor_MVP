import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import { LogOut } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';
import { ListSkeleton } from '@/components/states';
import { SettingsList, AdminSettingsList } from '@/components/settings/SettingsMenuItems';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentUser, isLoading } = useCurrentUser();

  const handleLogout = async () => {
    try { await logout(); }
    catch (error) { console.error('Error logging out:', error); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6"><ListSkeleton count={6} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
          <h1 className="flex-1 text-center text-lg font-semibold">Settings</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar size="xl">
                <AvatarImage src={currentUser.profile_images?.[0] || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt="Profile" />
                <AvatarFallback>{currentUser.nickname?.charAt(0) || currentUser.full_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{currentUser.nickname || currentUser.full_name}</h2>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
            <Button onClick={() => navigate(createPageUrl('Profile'))} className="w-full" size="lg">Edit Profile</Button>
          </CardContent>
        </Card>

        <SettingsList />

        {currentUser?.is_admin && <AdminSettingsList />}

        <Button onClick={handleLogout} variant="outline" size="lg" className="w-full border-destructive text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5 mr-2" />Logout
        </Button>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">Bellor v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
