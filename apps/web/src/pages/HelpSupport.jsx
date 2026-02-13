import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Mail, MessageCircle, Book, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import BackButton from '@/components/navigation/BackButton';

export default function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Help & Support</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/Settings" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="divide-y divide-border">
          <button
            onClick={() => navigate(createPageUrl('FAQ'))}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50"
          >
            <Book className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <h3 className="font-medium text-base text-foreground">FAQ</h3>
              <p className="text-sm text-muted-foreground">Frequently asked questions</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate(createPageUrl('LiveChat'))}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50"
          >
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <h3 className="font-medium text-base text-foreground">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Chat with our support team</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate(createPageUrl('EmailSupport'))}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50"
          >
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <h3 className="font-medium text-base text-foreground">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@bellor.com</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </Card>

        <Card className="mt-4 p-6">
          <h3 className="font-medium text-base text-foreground mb-2">About Bellør</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Bellør is a dating platform focused on authentic connections and meaningful interactions.
            We believe in creating spaces where people can be their true selves.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Button
              variant="link"
              onClick={() => navigate(createPageUrl('TermsOfService'))}
              className="p-0 h-auto"
            >
              Terms of Service
            </Button>
            <Button
              variant="link"
              onClick={() => navigate(createPageUrl('PrivacyPolicy'))}
              className="p-0 h-auto"
            >
              Privacy Policy
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}