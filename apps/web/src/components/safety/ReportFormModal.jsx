import React from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const incidentTypes = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'scam', label: 'Scam' },
  { value: 'other', label: 'Other' }
];

export default function ReportFormModal({ reportData, setReportData, onSubmit, onClose, isPending }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={onClose}>
      <div className="bg-card w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-destructive/20 rounded-xl flex items-center justify-center">
            <Flag className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Report an Issue</h2>
            <p className="text-xs text-muted-foreground">Report an issue to our team</p>
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Issue Type</label>
            <select
              value={reportData.incident_type}
              onChange={(e) => setReportData({ ...reportData, incident_type: e.target.value })}
              className="w-full p-3.5 border-2 border-border rounded-xl bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Select type...</option>
              {incidentTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
            <textarea
              value={reportData.description}
              onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
              placeholder="Please describe what happened in detail..."
              className="w-full p-3.5 border-2 border-border rounded-xl h-32 resize-none bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 h-12 font-semibold">
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isPending} variant="destructive" className="flex-1 h-12 font-semibold">
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </div>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
