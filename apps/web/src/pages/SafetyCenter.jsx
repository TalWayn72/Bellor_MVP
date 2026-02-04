import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield, AlertTriangle, Flag, Lock, Eye, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';
import { CardsSkeleton } from '@/components/states';

export default function SafetyCenter() {
  const navigate = useNavigate();
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

  const safetyTips = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Trust Your Instincts',
      description: 'If something feels off, take a step back. Your safety comes first.'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Keep Conversations on Platform',
      description: 'Stay on Bellør until you feel comfortable moving to other platforms.'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Video Chat First',
      description: 'Use our video date feature before meeting in person.'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Protect Personal Info',
      description: 'Don\'t share sensitive information like your address or financial details.'
    }
  ];

  const incidentTypes = [
    { value: 'harassment', label: 'Harassment' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'fake_profile', label: 'Fake Profile' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'scam', label: 'Scam' },
    { value: 'other', label: 'Other' }
  ];

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
        {/* Hero */}
        <div className="bg-gradient-to-br from-info via-primary to-match rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Safety Matters</h2>
            <p className="text-sm opacity-90 max-w-md mx-auto">
              We are committed to creating a safe and respectful community for everyone
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-xs">⚡</span>
            </div>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowReportForm(true)}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 hover:from-destructive/20 hover:to-destructive/10 rounded-xl transition-all border border-destructive/20 hover:border-destructive/30 hover:shadow-md active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Flag className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 text-right">
                <div className="font-bold text-sm text-foreground">Report an Issue</div>
                <div className="text-xs text-muted-foreground">Report an issue to support team</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            </button>

            <button
              onClick={() => navigate(createPageUrl('BlockedUsers'))}
              className="w-full flex items-center gap-4 p-4 bg-muted hover:bg-muted/80 rounded-xl transition-all border border-border hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 text-right">
                <div className="font-bold text-sm text-foreground">Blocked Users</div>
                <div className="text-xs text-muted-foreground">Manage your blocked users list</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            </button>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-info/10 rounded-lg flex items-center justify-center">
              <span className="text-xs">💡</span>
            </div>
            Safety Tips
          </h3>
          <div className="space-y-3">
            {safetyTips.map((tip, idx) => (
              <div key={idx} className="flex gap-4 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-info/20 to-info/10 text-info flex items-center justify-center border border-info/20">
                  {tip.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground mb-0.5">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-gradient-to-br from-destructive/5 to-warning/5 rounded-2xl p-5 shadow-sm border border-destructive/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-destructive/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground mb-1">Need Immediate Help?</h3>
              <p className="text-xs text-muted-foreground">
                If you are in immediate danger, please contact local emergency services
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-3.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              Emergency: 911
            </button>
            <button className="flex-1 py-3.5 bg-info hover:bg-info/90 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Support Chat
            </button>
          </div>
        </div>
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowReportForm(false)}>
          <div className="bg-card w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4"></div>

            {/* Header */}
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
                <Button
                  onClick={() => setShowReportForm(false)}
                  variant="outline"
                  className="flex-1 h-12 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReport}
                  disabled={reportMutation.isPending}
                  variant="destructive"
                  className="flex-1 h-12 font-semibold"
                >
                  {reportMutation.isPending ? (
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
      )}
    </div>
  );
}