import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Information We Collect',
      content: 'We collect information you provide directly (profile details, photos, messages), information from your device (location, device type), and usage data (how you interact with the app).'
    },
    {
      title: '2. How We Use Your Information',
      content: 'We use your information to provide and improve our services, facilitate matches, personalize your experience, communicate with you, ensure safety and security, and comply with legal obligations.'
    },
    {
      title: '3. Information Sharing',
      content: 'We share your information with other users as part of the matching process, with service providers who help operate Bellør, and when required by law. We never sell your personal data.'
    },
    {
      title: '4. Your Profile Visibility',
      content: 'Your profile is visible to other users based on your preferences and matching criteria. You can control visibility settings and block specific users at any time.'
    },
    {
      title: '5. Data Security',
      content: 'We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no system is 100% secure.'
    },
    {
      title: '6. Location Data',
      content: 'We use your location to show you nearby matches and relevant events. Location data is stored securely and you can disable location services in your device settings.'
    },
    {
      title: '7. Cookies and Tracking',
      content: 'We use cookies and similar technologies to improve your experience, analyze usage patterns, and remember your preferences. You can manage cookie settings in your browser.'
    },
    {
      title: '8. Third-Party Services',
      content: 'Bellør may integrate with third-party services (payment processors, analytics tools). These services have their own privacy policies that govern their use of your data.'
    },
    {
      title: '9. Your Rights',
      content: 'You have the right to access, correct, or delete your personal data. You can export your data or request account deletion at any time through Account Settings.'
    },
    {
      title: '10. Data Retention',
      content: 'We retain your data for as long as your account is active and for a reasonable period afterward for legal and operational purposes. Deleted accounts are purged within 30 days.'
    },
    {
      title: '11. Children\'s Privacy',
      content: 'Bellør is not intended for users under 18. We do not knowingly collect information from minors. If we discover such data, we delete it immediately.'
    },
    {
      title: '12. International Users',
      content: 'If you access Bellør from outside your country of residence, your data may be transferred to and processed in other countries. We comply with applicable data protection laws.'
    },
    {
      title: '13. Changes to This Policy',
      content: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or app notification. Continued use constitutes acceptance of updates.'
    },
    {
      title: '14. Contact Us',
      content: 'For privacy-related questions or concerns, contact our Data Protection Officer at privacy@bellor.com'
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
          <h1 className="flex-1 text-center text-lg font-semibold">Privacy Policy</h1>
          <BackButton variant="header" position="relative" fallback="/HelpSupport" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary to-match rounded-2xl p-6 text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Privacy Matters</h2>
          <p className="text-sm opacity-90">
            We are committed to protecting your personal information
          </p>
        </div>

        {/* Policy Content */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Privacy Policy</h2>
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
              By using Bellør, you consent to the collection and use of information as described in this Privacy Policy.
            </p>
          </div>
        </Card>

        {/* Contact Section */}
        <Card className="p-5 text-center">
          <p className="text-sm text-foreground mb-4">Questions about your privacy?</p>
          <Button
            onClick={() => navigate(createPageUrl('EmailSupport'))}
            className="rounded-full"
          >
            Contact Privacy Team
          </Button>
        </Card>
      </div>
    </div>
  );
}