import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

// Maps frontend setting keys to backend field names
const SETTING_TO_FIELD = {
  newMatches: 'notifyNewMatches',
  newMessages: 'notifyNewMessages',
  chatRequests: 'notifyChatRequests',
  dailyMissions: 'notifyDailyMissions',
  emailNotifications: 'notifyEmail',
};

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useCurrentUser();
  const [settings, setSettings] = useState({
    newMatches: true,
    newMessages: true,
    chatRequests: true,
    dailyMissions: true,
    emailNotifications: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load saved settings from user profile
  useEffect(() => {
    if (currentUser) {
      setSettings({
        newMatches: currentUser.notifyNewMatches ?? true,
        newMessages: currentUser.notifyNewMessages ?? true,
        chatRequests: currentUser.notifyChatRequests ?? true,
        dailyMissions: currentUser.notifyDailyMissions ?? true,
        emailNotifications: currentUser.notifyEmail ?? false,
      });
    }
  }, [currentUser]);

  const toggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    // Auto-save on toggle
    if (!currentUser) return;
    const fieldName = SETTING_TO_FIELD[key];
    setIsSaving(true);
    try {
      await userService.updateUser(currentUser.id, { [fieldName]: newSettings[key] });
      updateUser({ [fieldName]: newSettings[key] });
    } catch (error) {
      console.error('Error saving notification setting:', error);
      setSettings(settings);
    } finally { setIsSaving(false); }
  };

  const notificationItems = [
    { id: 'newMatches', label: 'New Matches', description: 'Get notified when someone likes you back' },
    { id: 'newMessages', label: 'New Messages', description: 'Get notified about new messages' },
    { id: 'chatRequests', label: 'Chat Requests', description: 'Get notified about new chat requests' },
    { id: 'dailyMissions', label: 'Daily Missions', description: 'Get notified about new daily missions' },
    { id: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Settings" />
          <h1 className="flex-1 text-center text-lg font-semibold">Notification Settings</h1>
          <div className="w-9">
            {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <div className="divide-y divide-border">
            {notificationItems.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor={item.id} className="text-base font-medium cursor-pointer">{item.label}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
                <Switch id={item.id} checked={settings[item.id]} onCheckedChange={() => toggleSetting(item.id)} size="md" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
