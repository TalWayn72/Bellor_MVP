import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VlogixAnalysisPanel from './VlogixAnalysisPanel';
import VlogixResponseHistory from './VlogixResponseHistory';
import { buildResponseAnalysis, getResponseCreatedAt } from './vlogixAnalysisUtils';

export default function VlogixUserDetailDialog({ user, onClose }) {
  const [selectedResponse, setSelectedResponse] = React.useState(null);
  const isOpen = !!user;

  React.useEffect(() => {
    setSelectedResponse(null);
  }, [user?.id]);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['admin-vlogix-user-responses', user?.id],
    queryFn: async () => {
      const result = await adminService.listVlogixUserResponses(user.id, { limit: 100 });
      return result.data || result.responses || [];
    },
    enabled: isOpen && !!user?.id,
  });

  if (!user) return null;

  const sortedResponses = [...responses].sort((a, b) => responseTime(b) - responseTime(a));
  const displayName = user.full_name || user.nickname || user.email || 'Unknown User';
  const selectedAnalysis = selectedResponse
    ? buildResponseAnalysis(responses, selectedResponse)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Vlogix AI - {displayName}</DialogTitle>
          <DialogDescription>{user.email || 'User response history and future Vlogix analysis workspace'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] min-h-[60vh] max-h-[72vh]">
          <VlogixResponseHistory
            isLoading={isLoading}
            responses={sortedResponses}
            selectedResponse={selectedResponse}
            onSelectResponse={setSelectedResponse}
          />

          <section className="border border-border rounded-lg p-6 bg-background">
            <h3 className="text-xl font-semibold text-foreground mb-2">Vlogix Analysis</h3>
            <VlogixAnalysisPanel response={selectedResponse} analysis={selectedAnalysis} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function responseTime(response) {
  const time = new Date(getResponseCreatedAt(response) || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}
