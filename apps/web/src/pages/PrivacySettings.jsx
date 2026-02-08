import React, { useState } from 'react';
import { userService } from '@/api';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import PrivacyToggles from '@/components/settings/PrivacyToggles';
import GDPRSection from '@/components/settings/GDPRSection';

export default function PrivacySettings() {
  const { currentUser } = useCurrentUser();
  const [settings, setSettings] = useState({
    showOnline: true, showDistance: true, showAge: true,
    privateProfile: false, doNotSell: false,
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
    } finally { setIsExporting(false); }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await userService.deleteUserGDPR(currentUser.id);
      alert('Your account and all data have been permanently deleted.');
      window.location.href = '/Login';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally { setIsDeleting(false); setShowDeleteDialog(false); }
  };

  const toggleSetting = (key) => setSettings({ ...settings, [key]: !settings[key] });

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Settings" />
          <h1 className="flex-1 text-center text-lg font-semibold">Privacy & Security</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <PrivacyToggles settings={settings} toggleSetting={toggleSetting} />
        <GDPRSection
          settings={settings}
          toggleSetting={toggleSetting}
          isExporting={isExporting}
          onExportData={handleExportData}
          onDeleteAccount={() => setShowDeleteDialog(true)}
        />
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />Delete Account Permanently</DialogTitle>
            <DialogDescription>This action cannot be undone. All your data will be permanently deleted in accordance with GDPR Article 17 (Right to Erasure).</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">This will permanently delete:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mb-4">
              <li>Your profile and personal information</li>
              <li>All messages and conversations</li>
              <li>Your responses and stories</li>
              <li>Likes and matches</li>
              <li>All account data</li>
            </ul>
            <label className="block text-sm font-semibold mb-2">Type "DELETE" to confirm</label>
            <input type="text" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="DELETE" className="w-full p-3 border-2 border-border bg-background rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmation(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmation !== 'DELETE' || isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Account'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
