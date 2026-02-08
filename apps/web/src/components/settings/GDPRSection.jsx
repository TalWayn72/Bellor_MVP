import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, FileText, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const GDPR_TOGGLE_OPTIONS = [
  { id: 'doNotSell', label: 'Do Not Sell My Personal Information', description: 'Opt out of sharing data with third parties (CCPA)' },
];

export default function GDPRSection({
  settings,
  toggleSetting,
  isExporting,
  onExportData,
  onDeleteAccount,
}) {
  const navigate = useNavigate();

  return (
    <>
      {/* GDPR / CCPA Compliance */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-base">Data Rights (GDPR/CCPA)</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal data in compliance with privacy regulations</p>
        </div>
        <div className="divide-y divide-border">
          {GDPR_TOGGLE_OPTIONS.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor={item.id} className="text-base font-medium cursor-pointer">{item.label}</Label>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
              <Switch id={item.id} checked={settings[item.id]} onCheckedChange={() => toggleSetting(item.id)} size="md" />
            </div>
          ))}

          {/* Export Data */}
          <button onClick={onExportData} disabled={isExporting} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors disabled:opacity-50">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-medium">Export My Data</p>
              <p className="text-sm text-muted-foreground">Download all your personal data (GDPR Article 20)</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Delete Account */}
          <button onClick={onDeleteAccount} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-destructive/10 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-medium text-destructive">Delete My Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete all your data (GDPR Article 17)</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </Card>

      {/* Legal Links */}
      <Card>
        <div className="divide-y divide-border">
          <button onClick={() => navigate(createPageUrl('PrivacyPolicy'))} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-medium">Privacy Policy</p>
              <p className="text-sm text-muted-foreground">Read our privacy policy</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => navigate(createPageUrl('TermsOfService'))} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-medium">Terms of Service</p>
              <p className="text-sm text-muted-foreground">Read our terms of service</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </Card>
    </>
  );
}
