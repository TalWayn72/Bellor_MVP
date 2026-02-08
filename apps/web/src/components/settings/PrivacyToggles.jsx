import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PRIVACY_ITEMS = [
  { id: 'showOnline', label: 'Show Online Status', description: "Let others see when you're online" },
  { id: 'showDistance', label: 'Show Distance', description: 'Display your distance from others' },
  { id: 'showAge', label: 'Show Age', description: 'Display your age on your profile' },
  { id: 'privateProfile', label: 'Private Profile', description: 'Only show your profile to people you like' },
];

const SECURITY_OPTIONS = [
  { label: 'Blocked Users', description: 'Manage your blocked users list', path: 'BlockedUsers' },
  { label: 'Safety Center', description: 'Safety tips and resources', path: 'SafetyCenter' },
];

export default function PrivacyToggles({ settings, toggleSetting }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Privacy Options */}
      <Card>
        <div className="divide-y divide-border">
          {PRIVACY_ITEMS.map((item) => (
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

      {/* Security Options */}
      <Card>
        <div className="divide-y divide-border">
          {SECURITY_OPTIONS.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(createPageUrl(item.path))}
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
    </>
  );
}
