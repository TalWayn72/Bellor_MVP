import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SystemSettingsForm({ settings, editedSettings, onChange, onSave, isPending }) {
  return (
    <div className="space-y-6">
      {settings.map((setting) => (
        <div key={setting.id} className="flex items-start gap-4 pb-6 border-b border-border last:border-b-0 last:pb-0">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">{setting.key}</label>
            <p className="text-sm text-muted-foreground mb-3">{setting.description}</p>

            {setting.data_type === 'boolean' ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChange(setting.id, 'true')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    (editedSettings[setting.id] || setting.value) === 'true'
                      ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Enabled
                </button>
                <button
                  onClick={() => onChange(setting.id, 'false')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    (editedSettings[setting.id] || setting.value) === 'false'
                      ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Disabled
                </button>
              </div>
            ) : setting.data_type === 'color' ? (
              <div className="flex items-center gap-3">
                <Input type="color" value={editedSettings[setting.id] || setting.value}
                  onChange={(e) => onChange(setting.id, e.target.value)} className="w-20 h-10" />
                <Input type="text" value={editedSettings[setting.id] || setting.value}
                  onChange={(e) => onChange(setting.id, e.target.value)} className="flex-1" />
              </div>
            ) : (
              <Input
                type={setting.data_type === 'number' ? 'number' : 'text'}
                value={editedSettings[setting.id] !== undefined ? editedSettings[setting.id] : setting.value}
                onChange={(e) => onChange(setting.id, e.target.value)}
                className="w-full"
              />
            )}
          </div>

          <Button onClick={() => onSave(setting)} disabled={isPending || editedSettings[setting.id] === undefined} size="sm" className="mt-8">
            <Save className="w-4 h-4 mr-1" />Save
          </Button>
        </div>
      ))}
    </div>
  );
}
