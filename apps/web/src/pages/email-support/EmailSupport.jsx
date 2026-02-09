import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';
import { useToast } from '@/components/ui/use-toast';
import EmailHeroCard from './EmailHeroCard';
import EmailSupportForm from './EmailSupportForm';
import HelpTipsCard from './HelpTipsCard';

export default function EmailSupport() {
  const { toast } = useToast();
  const { currentUser, isLoading } = useCurrentUser();
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: ''
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      const emailData = {
        to: 'support@bellor.com',
        subject: `[${data.category}] ${data.subject}`,
        body: `From: ${currentUser?.full_name} (${currentUser?.email})\n\nCategory: ${data.category}\n\n${data.message}`
      };
      return emailData;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: "Your message has been sent! We'll respond within 24 hours." });
      setFormData({ subject: '', category: '', message: '' });
    },
  });

  const handleSubmit = () => {
    if (!formData.subject || !formData.category || !formData.message) {
      toast({ title: 'Validation', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Email Support</h1>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4">
          <CardsSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Email Support</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/HelpSupport" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <EmailHeroCard />
        <EmailSupportForm formData={formData} onFormChange={setFormData} onSubmit={handleSubmit} isPending={sendEmailMutation.isPending} userEmail={currentUser?.email} />
        <HelpTipsCard />
      </div>
    </div>
  );
}
