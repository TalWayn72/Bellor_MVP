import React from 'react';
import { Flag, ExternalLink, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReportActions from './ReportActions';

export default function ReportCard({
  report,
  isExpanded,
  content,
  onToggleExpand,
  onFetchContent,
  onUpdateStatus,
  onBlockUser,
  onDeleteContent,
  updateStatusPending,
  blockUserPending,
  deleteContentPending,
}) {
  const handleToggle = () => {
    if (isExpanded) {
      onToggleExpand(null);
    } else {
      onToggleExpand(report.id);
      onFetchContent(report);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Flag className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Report on {report.reported_content_type}</h3>
              <p className="text-sm text-muted-foreground">{new Date(report.created_date).toLocaleString('en-US')}</p>
            </div>
          </div>
          <Badge variant={
            report.status === 'pending' ? 'warning' :
            report.status === 'reviewed' ? 'info' :
            report.status === 'action_taken' ? 'success' : 'secondary'
          }>
            {report.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Reporter:</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{report.reporter_id.substring(0, 12)}...</p>
              <button onClick={() => window.open(`#/AdminUserManagement?userId=${report.reporter_id}`, '_blank')} className="text-info hover:text-info/80">
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Reported User:</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{report.reported_user_id.substring(0, 12)}...</p>
              <button onClick={() => window.open(`#/AdminUserManagement?userId=${report.reported_user_id}`, '_blank')} className="text-info hover:text-info/80">
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Reason:</p>
            <p className="text-sm font-medium text-foreground">{report.reason}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Priority:</p>
            <p className="text-sm font-medium text-foreground">{report.priority || 1}</p>
          </div>
        </div>

        {report.description && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </div>
        )}

        <Button size="sm" variant="outline" onClick={handleToggle} className="mb-4">
          <ExternalLink className="w-4 h-4 ml-1" />
          {isExpanded ? 'Hide Content' : 'Show Reported Content'}
        </Button>

        {/* Reported Content Display */}
        {isExpanded && content && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="text-sm font-semibold text-destructive mb-2">Reported Content:</h4>
            {content.response_type === 'text' || content.text_content ? (
              <p className="text-sm text-foreground">{content.text_content || content.content}</p>
            ) : content.response_type === 'voice' || content.message_type === 'voice' ? (
              <audio src={content.content} controls className="w-full mt-2" />
            ) : content.response_type === 'video' ? (
              <video src={content.content} controls className="w-full mt-2 max-h-64" />
            ) : content.response_type === 'drawing' || content.message_type === 'drawing' ? (
              <img src={content.content} alt="Drawing" className="w-full mt-2 max-h-64 object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">Cannot display this content</p>
            )}
          </div>
        )}

        <ReportActions
          report={report}
          onUpdateStatus={onUpdateStatus}
          onBlockUser={onBlockUser}
          onDeleteContent={onDeleteContent}
          updateStatusPending={updateStatusPending}
          blockUserPending={blockUserPending}
          deleteContentPending={deleteContentPending}
        />
      </CardContent>
    </Card>
  );
}
