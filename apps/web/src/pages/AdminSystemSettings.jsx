import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { ListSkeleton, EmptyState } from '@/components/states';
import SystemSettingsForm from '@/components/admin/SystemSettingsForm';

const defaultSettings = [
  { id: '1', key: 'max_messages_per_day', value: '100', description: 'Maximum number of messages per day', data_type: 'number', category: 'limits' },
  { id: '2', key: 'max_chats_per_day', value: '10', description: 'Maximum number of new chats per day', data_type: 'number', category: 'limits' },
  { id: '3', key: 'chat_expiry_hours', value: '24', description: 'Hours before temporary chat expires', data_type: 'number', category: 'limits' },
  { id: '4', key: 'min_age', value: '18', description: 'Minimum age for registration', data_type: 'number', category: 'limits' },
  { id: '5', key: 'max_profile_images', value: '6', description: 'Maximum number of profile images', data_type: 'number', category: 'limits' },
  { id: '6', key: 'verification_required', value: 'false', description: 'Whether user verification is required', data_type: 'boolean', category: 'system' },
  { id: '7', key: 'maintenance_mode', value: 'false', description: 'Maintenance mode', data_type: 'boolean', category: 'system' },
];

const categoryNames = { system: 'System Settings', limits: 'Limits', design: 'Design', features: 'Features' };

export default function AdminSystemSettings() {
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState({});
  const [localSettings, setLocalSettings] = useState(defaultSettings);

  const { data: settings = defaultSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => localSettings,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ settingId, value }) => {
      console.log('Setting updated:', { settingId, value });
      return { settingId, value };
    },
    onSuccess: ({ settingId, value }) => {
      setLocalSettings(prev => prev.map(s => s.id === settingId ? { ...s, value } : s));
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setEditedSettings({});
    },
  });

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'system';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">System Settings</h1>
          <p className="text-muted-foreground">Manage and configure system limits</p>
        </div>

        {isLoading ? <ListSkeleton count={5} /> :
         Object.keys(groupedSettings).length === 0 ? (
          <EmptyState variant="settings" title="No settings available" description="System settings have not been configured yet." />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSettings).map(([category, categorySettings]) => (
              <Card key={category} className="overflow-hidden">
                <CardHeader className="bg-muted border-b border-border">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>{categoryNames[category] || category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <SystemSettingsForm
                    settings={categorySettings}
                    editedSettings={editedSettings}
                    onChange={(id, val) => setEditedSettings(prev => ({ ...prev, [id]: val }))}
                    onSave={(setting) => updateSettingMutation.mutate({ settingId: setting.id, value: editedSettings[setting.id] || setting.value })}
                    isPending={updateSettingMutation.isPending}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}
