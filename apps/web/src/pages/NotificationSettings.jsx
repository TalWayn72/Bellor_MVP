import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import BackButton from '@/components/navigation/BackButton';

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    newMatches: true,
    newMessages: true,
    chatRequests: true,
    dailyMissions: true,
    emailNotifications: false
  });

  const toggleSetting = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const notificationItems = [
    {
      id: 'newMatches',
      label: 'New Matches',
      description: 'Get notified when someone likes you back',
    },
    {
      id: 'newMessages',
      label: 'New Messages',
      description: 'Get notified about new messages',
    },
    {
      id: 'chatRequests',
      label: 'Chat Requests',
      description: 'Get notified about new chat requests',
    },
    {
      id: 'dailyMissions',
      label: 'Daily Missions',
      description: 'Get notified about new daily missions',
    },
    {
      id: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive notifications via email',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Settings" />
          <h1 className="flex-1 text-center text-lg font-semibold">Notification Settings</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Notification Options */}
        <Card>
          <div className="divide-y divide-border">
            {notificationItems.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <Label htmlFor={item.id} className="text-base font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
                <Switch
                  id={item.id}
                  checked={settings[item.id]}
                  onCheckedChange={() => toggleSetting(item.id)}
                  size="md"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}