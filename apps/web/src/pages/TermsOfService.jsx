import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';

export default function TermsOfService() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using Bellør, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.'
    },
    {
      title: '2. Eligibility',
      content: 'You must be at least 18 years old to use Bellør. By creating an account, you represent that you meet this age requirement and that all information you provide is accurate.'
    },
    {
      title: '3. Account Responsibilities',
      content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.'
    },
    {
      title: '4. User Conduct',
      content: 'You agree not to use Bellør to: harass or harm others, post offensive content, impersonate others, spam users, violate laws, or engage in commercial activities without permission.'
    },
    {
      title: '5. Content Ownership',
      content: 'You retain ownership of content you post, but grant Bellør a license to use, display, and distribute your content within the service. You represent that you have the right to post all content you submit.'
    },
    {
      title: '6. Premium Subscriptions',
      content: 'Premium subscriptions are billed on a recurring basis. You can cancel at any time, and cancellation will take effect at the end of the current billing period. Refunds are provided only as required by law.'
    },
    {
      title: '7. Privacy',
      content: 'Your use of Bellør is subject to our Privacy Policy. We collect and process your personal data as described in that policy.'
    },
    {
      title: '8. Termination',
      content: 'We reserve the right to suspend or terminate your account for violations of these terms, or for any reason at our discretion. You may delete your account at any time.'
    },
    {
      title: '9. Disclaimers',
      content: 'Bellør is provided "as is" without warranties. We do not guarantee uninterrupted service or the accuracy of user profiles. We are not responsible for user conduct or interactions.'
    },
    {
      title: '10. Limitation of Liability',
      content: 'To the fullest extent permitted by law, Bellør shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.'
    },
    {
      title: '11. Changes to Terms',
      content: 'We may update these terms from time to time. Continued use of Bellør after changes constitutes acceptance of the new terms. We will notify you of significant changes.'
    },
    {
      title: '12. Data Protection',
      content: 'We comply with GDPR, CCPA, and other applicable data protection regulations. You have the right to access, export, correct, and delete your personal data at any time. For details, see our Privacy Policy.'
    },
    {
      title: '13. Contact',
      content: 'If you have questions about these Terms of Service, please contact us at legal@bellor.com'
    }
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <h1 className="flex-1 text-center text-lg font-semibold">Terms of Service</h1>
          <BackButton variant="header" position="relative" fallback="/HelpSupport" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary to-match rounded-2xl p-6 text-white text-center">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Terms of Service</h2>
          <p className="text-sm opacity-90">
            Please read these terms carefully before using Bellør
          </p>
        </div>

        {/* Terms Content */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Bellør Terms of Service</h2>
          <p className="text-sm text-muted-foreground mb-6">Last updated: December 31, 2025</p>

          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-bold text-base text-foreground mb-2">{section.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              By using Bellør, you acknowledge that you have read and understood these Terms of Service.
            </p>
          </div>
        </Card>

        {/* Contact Section */}
        <Card className="p-5 text-center">
          <p className="text-sm text-foreground mb-4">Have questions about our terms?</p>
          <Button
            onClick={() => navigate(createPageUrl('EmailSupport'))}
            className="rounded-full"
          >
            Contact Legal Team
          </Button>
        </Card>
      </div>
    </div>
  );
}