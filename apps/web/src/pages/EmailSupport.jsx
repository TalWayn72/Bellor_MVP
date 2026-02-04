import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Send } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';

export default function EmailSupport() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: ''
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      // Log email send (email service can be added in future)
      const emailData = {
        to: 'support@bellor.com',
        subject: `[${data.category}] ${data.subject}`,
        body: `From: ${currentUser?.full_name} (${currentUser?.email})\n\nCategory: ${data.category}\n\n${data.message}`
      };
      console.log('Support email sent:', emailData);
      return emailData;
    },
    onSuccess: () => {
      alert('Your message has been sent! We\'ll respond within 24 hours.');
      setFormData({ subject: '', category: '', message: '' });
    },
  });

  const categories = [
    'Account Issue',
    'Payment & Billing',
    'Technical Problem',
    'Safety & Privacy',
    'Feature Request',
    'Other'
  ];

  const handleSubmit = () => {
    if (!formData.subject || !formData.category || !formData.message) {
      alert('Please fill in all fields');
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
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Email Support</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/HelpSupport" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-6 text-center">
          <Mail className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2 text-foreground">Get Help via Email</h2>
          <p className="text-sm text-muted-foreground">
            We typically respond within 24 hours
          </p>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border border-border rounded-xl outline-none focus:border-primary bg-background text-foreground"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Subject</label>
            <Input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Message</label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please provide as much detail as possible..."
              className="h-40 resize-none"
            />
          </div>

          <div className="bg-muted rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Your email:</strong> {currentUser?.email}
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!formData.subject || !formData.category || !formData.message || sendEmailMutation.isPending}
            className="w-full h-12"
          >
            <Send className="w-5 h-5 mr-2" />
            {sendEmailMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </Card>

        <Card className="bg-info/10 border-info/20 p-4">
          <h3 className="font-semibold text-sm mb-2 text-foreground">💡 Tips for faster help:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Include screenshots if relevant</li>
            <li>• Describe what you expected vs what happened</li>
            <li>• Mention any error messages you saw</li>
            <li>• Tell us what device and browser you're using</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}