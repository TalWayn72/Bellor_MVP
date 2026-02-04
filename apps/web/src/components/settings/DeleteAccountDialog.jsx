import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DeleteAccountDialog({ isOpen, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Delete Account</h2>
          <p className="text-sm text-gray-600">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Type "DELETE" to confirm
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="w-full p-3 border-2 border-gray-200 rounded-xl"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={confirmation !== 'DELETE'}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}