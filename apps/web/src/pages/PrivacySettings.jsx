import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronRight, Shield } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';

export default function PrivacySettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    showOnline: true,
    showDistance: true,
    showAge: true,
    privateProfile: false
  });

  const toggleSetting = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const privacyItems = [
    {
      id: 'showOnline',
      label: 'Show Online Status',
      description: 'Let others see when you\'re online',
    },
    {
      id: 'showDistance',
      label: 'Show Distance',
      description: 'Display your distance from others',
    },
    {
      id: 'showAge',
      label: 'Show Age',
      description: 'Display your age on your profile',
    },
    {
      id: 'privateProfile',
      label: 'Private Profile',
      description: 'Only show your profile to people you like',
    },
  ];

  const securityOptions = [
    {
      label: 'Blocked Users',
      description: 'Manage your blocked users list',
      onClick: () => navigate(createPageUrl('BlockedUsers')),
    },
    {
      label: 'Safety Center',
      description: 'Safety tips and resources',
      onClick: () => navigate(createPageUrl('SafetyCenter')),
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Settings" />
          <h1 className="flex-1 text-center text-lg font-semibold">Privacy & Security</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Privacy Options */}
        <Card>
          <div className="divide-y divide-border">
            {privacyItems.map((item) => (
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

        {/* Security Options */}
        <Card>
          <div className="divide-y divide-border">
            {securityOptions.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}