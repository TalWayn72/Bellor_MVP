import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Lock, HelpCircle, Shield, Palette, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

const settingsItems = [
  { icon: Bell, label: 'Notifications', path: 'NotificationSettings' },
  { icon: Lock, label: 'Privacy & Security', path: 'PrivacySettings' },
  { icon: HelpCircle, label: 'Help & Support', path: 'HelpSupport' },
];

const adminItems = [
  { icon: Shield, label: 'Admin Panel', path: 'AdminDashboard' },
  { icon: Palette, label: 'App Theme (Admin)', path: 'ThemeSettings' },
];

export function SettingsList() {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="divide-y divide-border">
        {settingsItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(createPageUrl(item.path))}
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
  );
}

export function AdminSettingsList() {
  const navigate = useNavigate();

  return (
    <Card className="border-secondary/30">
      <div className="px-6 py-3 border-b border-secondary/20 bg-secondary/5">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Admin Options</p>
      </div>
      <div className="divide-y divide-border">
        {adminItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(createPageUrl(item.path))}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-secondary" />
            </div>
            <span className="flex-1 text-left text-base font-medium text-secondary-foreground">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-secondary/50" />
          </button>
        ))}
      </div>
    </Card>
  );
}
