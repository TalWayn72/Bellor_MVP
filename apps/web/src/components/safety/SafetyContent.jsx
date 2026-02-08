import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Flag, Lock, Eye, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

const safetyTips = [
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Trust Your Instincts',
    description: 'If something feels off, take a step back. Your safety comes first.'
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Keep Conversations on Platform',
    description: 'Stay on Bellor until you feel comfortable moving to other platforms.'
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: 'Video Chat First',
    description: 'Use our video date feature before meeting in person.'
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Protect Personal Info',
    description: "Don't share sensitive information like your address or financial details."
  }
];

export function SafetyHero() {
  return (
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
  );
}

export function QuickActions({ onShowReportForm }) {
  const navigate = useNavigate();
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-xs">{'\u26A1'}</span>
        </div>
        Quick Actions
      </h3>
      <div className="space-y-3">
        <button
          onClick={onShowReportForm}
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
  );
}

export function SafetyTips() {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-info/10 rounded-lg flex items-center justify-center">
          <span className="text-xs">{'\uD83D\uDCA1'}</span>
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
  );
}

export function EmergencyContact() {
  return (
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
  );
}
