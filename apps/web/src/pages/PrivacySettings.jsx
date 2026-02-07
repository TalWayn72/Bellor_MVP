import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { userService } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronRight, Shield, Download, Trash2, FileText, AlertTriangle } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function PrivacySettings() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [settings, setSettings] = useState({
    showOnline: true,
    showDistance: true,
    showAge: true,
    privateProfile: false,
    doNotSell: false, // CCPA
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    if (!currentUser) return;
    setIsExporting(true);
    try {
      const result = await userService.exportUserData(currentUser.id);
      // Download as JSON file
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bellor-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Your data has been exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await userService.deleteUserGDPR(currentUser.id);
      alert('Your account and all data have been permanently deleted.');
      // Redirect to login
      window.location.href = '/Login';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

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

  const gdprOptions = [
    {
      id: 'doNotSell',
      label: 'Do Not Sell My Personal Information',
      description: 'Opt out of sharing data with third parties (CCPA)',
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

        {/* GDPR / CCPA Compliance */}
        <Card>
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-base">Data Rights (GDPR/CCPA)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your personal data in compliance with privacy regulations
            </p>
          </div>
          <div className="divide-y divide-border">
            {/* Do Not Sell Toggle */}
            {gdprOptions.map((item) => (
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

            {/* Export Data */}
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-medium">Export My Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your personal data (GDPR Article 20)
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-destructive/10 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-medium text-destructive">Delete My Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all your data (GDPR Article 17)
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </Card>

        {/* Legal Links */}
        <Card>
          <div className="divide-y divide-border">
            <button
              onClick={() => navigate(createPageUrl('PrivacyPolicy'))}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-medium">Privacy Policy</p>
                <p className="text-sm text-muted-foreground">Read our privacy policy</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate(createPageUrl('TermsOfService'))}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
            >
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
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account Permanently
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted in accordance with GDPR Article 17 (Right to Erasure).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mb-4">
              <li>Your profile and personal information</li>
              <li>All messages and conversations</li>
              <li>Your responses and stories</li>
              <li>Likes and matches</li>
              <li>All account data</li>
            </ul>
            <label className="block text-sm font-semibold mb-2">
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full p-3 border-2 border-border bg-background rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}