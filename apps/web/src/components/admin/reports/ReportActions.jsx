import React from 'react';
import { Eye, CheckCircle, XCircle, Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportActions({
  report,
  onUpdateStatus,
  onBlockUser,
  onDeleteContent,
  updateStatusPending,
  blockUserPending,
  deleteContentPending,
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUpdateStatus(report.id, 'reviewed')}
        disabled={updateStatusPending || report.status === 'reviewed'}
      >
        <Eye className="w-4 h-4 mr-1" />
        Mark as Reviewed
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (window.confirm('Are you sure you want to block the reported user?')) {
            onBlockUser(report.reported_user_id);
            onUpdateStatus(report.id, 'action_taken');
          }
        }}
        disabled={blockUserPending}
        className="text-destructive hover:text-destructive/80"
      >
        <Ban className="w-4 h-4 mr-1" />
        Block User
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (window.confirm('Are you sure you want to delete the reported content?')) {
            onDeleteContent(report.reported_content_type, report.reported_content_id);
            onUpdateStatus(report.id, 'action_taken');
          }
        }}
        disabled={deleteContentPending}
        className="text-destructive hover:text-destructive/80"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete Content
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUpdateStatus(report.id, 'action_taken')}
        disabled={updateStatusPending || report.status === 'action_taken'}
        className="text-success hover:text-success/80"
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        Action Taken
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onUpdateStatus(report.id, 'dismissed')}
        disabled={updateStatusPending || report.status === 'dismissed'}
        className="text-muted-foreground hover:text-foreground"
      >
        <XCircle className="w-4 h-4 mr-1" />
        Dismiss
      </Button>
    </div>
  );
}
