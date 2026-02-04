import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function AdminSystemSettings() {
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState({});

  // Default settings (demo mode - AppSetting service can be added in future)
  const defaultSettings = [
    { id: '1', key: 'max_messages_per_day', value: '100', description: 'Maximum number of messages per day', data_type: 'number', category: 'limits' },
    { id: '2', key: 'max_chats_per_day', value: '10', description: 'Maximum number of new chats per day', data_type: 'number', category: 'limits' },
    { id: '3', key: 'chat_expiry_hours', value: '24', description: 'Hours before temporary chat expires', data_type: 'number', category: 'limits' },
    { id: '4', key: 'min_age', value: '18', description: 'Minimum age for registration', data_type: 'number', category: 'limits' },
    { id: '5', key: 'max_profile_images', value: '6', description: 'Maximum number of profile images', data_type: 'number', category: 'limits' },
    { id: '6', key: 'verification_required', value: 'false', description: 'Whether user verification is required', data_type: 'boolean', category: 'system' },
    { id: '7', key: 'maintenance_mode', value: 'false', description: 'Maintenance mode', data_type: 'boolean', category: 'system' },
  ];

  const [localSettings, setLocalSettings] = useState(defaultSettings);

  // Fetch all settings
  const { data: settings = defaultSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      // Return local settings (demo mode)
      return localSettings;
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ settingId, value }) => {
      // Log setting update (AppSetting service can be added in future)
      console.log('Setting updated:', { settingId, value });
      return { settingId, value };
    },
    onSuccess: ({ settingId, value }) => {
      setLocalSettings(prev => prev.map(s => s.id === settingId ? { ...s, value } : s));
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setEditedSettings({});
    },
  });

  const handleSave = (setting) => {
    const newValue = editedSettings[setting.id] || setting.value;
    updateSettingMutation.mutate({ settingId: setting.id, value: newValue });
  };

  const handleChange = (settingId, value) => {
    setEditedSettings(prev => ({ ...prev, [settingId]: value }));
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'system';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

  const categoryNames = {
    system: 'System Settings',
    limits: 'Limits',
    design: 'Design',
    features: 'Features',
  };

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">System Settings</h1>
          <p className="text-muted-foreground">Manage and configure system limits</p>
        </div>

        {isLoading ? (
          <ListSkeleton count={5} />
        ) : Object.keys(groupedSettings).length === 0 ? (
          <EmptyState
            variant="settings"
            title="No settings available"
            description="System settings have not been configured yet."
          />
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

                <CardContent className="p-6 space-y-6">
                  {categorySettings.map((setting) => (
                    <div key={setting.id} className="flex items-start gap-4 pb-6 border-b border-border last:border-b-0 last:pb-0">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {setting.key}
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">{setting.description}</p>

                        {setting.data_type === 'boolean' ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleChange(setting.id, 'true')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                (editedSettings[setting.id] || setting.value) === 'true'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              Enabled
                            </button>
                            <button
                              onClick={() => handleChange(setting.id, 'false')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                (editedSettings[setting.id] || setting.value) === 'false'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              Disabled
                            </button>
                          </div>
                        ) : setting.data_type === 'color' ? (
                          <div className="flex items-center gap-3">
                            <Input
                              type="color"
                              value={editedSettings[setting.id] || setting.value}
                              onChange={(e) => handleChange(setting.id, e.target.value)}
                              className="w-20 h-10"
                            />
                            <Input
                              type="text"
                              value={editedSettings[setting.id] || setting.value}
                              onChange={(e) => handleChange(setting.id, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        ) : (
                          <Input
                            type={setting.data_type === 'number' ? 'number' : 'text'}
                            value={editedSettings[setting.id] !== undefined ? editedSettings[setting.id] : setting.value}
                            onChange={(e) => handleChange(setting.id, e.target.value)}
                            className="w-full"
                          />
                        )}
                      </div>

                      <Button
                        onClick={() => handleSave(setting)}
                        disabled={updateSettingMutation.isPending || editedSettings[setting.id] === undefined}
                        size="sm"
                        className="mt-8"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}