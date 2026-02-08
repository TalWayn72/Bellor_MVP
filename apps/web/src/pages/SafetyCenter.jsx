import React, { useState } from 'react';
import { reportService } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';
import { CardsSkeleton } from '@/components/states';
import {
  SafetyHero,
  QuickActions,
  SafetyTips,
  EmergencyContact
} from '@/components/safety/SafetyContent';
import ReportFormModal from '@/components/safety/ReportFormModal';

export default function SafetyCenter() {
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData, setReportData] = useState({
    incident_type: '',
    description: '',
    related_user_id: ''
  });

  const reportMutation = useMutation({
    mutationFn: async (data) => {
      await reportService.createReport({
        reporter_id: currentUser.id,
        report_type: data.incident_type,
        reason: data.description,
        details: data.description,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyReports'] });
      setShowReportForm(false);
      setReportData({ incident_type: '', description: '', related_user_id: '' });
      alert('Report submitted. Our team will review it shortly.');
    },
  });

  const handleSubmitReport = () => {
    if (!reportData.incident_type || !reportData.description) {
      alert('Please fill in all required fields');
      return;
    }
    reportMutation.mutate(reportData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="w-9"></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Safety Center</h1>
              <p className="text-xs text-muted-foreground">Safety and Security Center</p>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4">
          <CardsSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="w-9"></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Safety Center</h1>
            <p className="text-xs text-muted-foreground">Safety and Security Center</p>
          </div>
          <BackButton variant="header" position="relative" fallback="/PrivacySettings" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <SafetyHero />
        <QuickActions onShowReportForm={() => setShowReportForm(true)} />
        <SafetyTips />
        <EmergencyContact />
      </div>

      {showReportForm && (
        <ReportFormModal
          reportData={reportData}
          setReportData={setReportData}
          onSubmit={handleSubmitReport}
          onClose={() => setShowReportForm(false)}
          isPending={reportMutation.isPending}
        />
      )}
    </div>
  );
}
