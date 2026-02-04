import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BackButton from '@/components/navigation/BackButton';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function FAQ() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I create my profile?',
      answer: 'After signing up, complete the onboarding process which includes adding photos, answering questions about yourself, and setting your preferences. Make sure to complete all sections for the best matching results.'
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'What makes Bellør different from other dating apps?',
      answer: 'Bellør focuses on authentic connections through daily creative missions, video responses, and meaningful conversations. We prioritize quality matches over quantity, and our unique "Shared Space" lets you see how others express themselves.'
    },
    {
      id: 3,
      category: 'Matching',
      question: 'How does the matching algorithm work?',
      answer: 'Our algorithm considers your profile information, preferences, compatibility quiz answers, and engagement patterns. We also look at shared interests, values, and how you interact with daily missions.'
    },
    {
      id: 4,
      category: 'Matching',
      question: 'What is a Super Like?',
      answer: 'A Super Like is a special way to show someone you\'re really interested. It includes a personalized message and gives you priority visibility on their profile. Premium users get more Super Likes per day.'
    },
    {
      id: 5,
      category: 'Safety',
      question: 'How do I report inappropriate behavior?',
      answer: 'You can report users directly from their profile or messages. Go to Safety Center to submit detailed reports. All reports are reviewed by our team within 24 hours.'
    },
    {
      id: 6,
      category: 'Safety',
      question: 'How do I block someone?',
      answer: 'On any user\'s profile, tap the three dots menu and select "Block User". They won\'t be able to see your profile, message you, or appear in your discovery feed.'
    },
    {
      id: 7,
      category: 'Premium',
      question: 'What do I get with Premium?',
      answer: 'Premium includes unlimited likes, priority visibility, advanced filters, profile boosts, more Super Likes, read receipts, and access to premium-only events.'
    },
    {
      id: 8,
      category: 'Premium',
      question: 'Can I cancel my subscription?',
      answer: 'Yes, you can cancel anytime from Account Settings. You\'ll continue to have Premium benefits until the end of your billing period.'
    },
    {
      id: 9,
      category: 'Features',
      question: 'What are Daily Missions?',
      answer: 'Daily Missions are creative prompts that help you express yourself authentically. Complete them by responding with text, drawing, voice, or video. Your responses appear in the Shared Space feed.'
    },
    {
      id: 10,
      category: 'Features',
      question: 'How do Virtual Events work?',
      answer: 'Virtual Events are group video experiences like speed dating, mixers, and game nights. Register for upcoming events and receive a link before they start. It\'s a fun way to meet multiple people at once.'
    },
    {
      id: 11,
      category: 'Account',
      question: 'How do I delete my account?',
      answer: 'Go to Settings > Account Settings > Delete Account. This action is permanent and will remove all your data, matches, and messages.'
    },
    {
      id: 12,
      category: 'Account',
      question: 'Can I change my email address?',
      answer: 'Yes, go to Settings > Account Settings and update your email. You\'ll need to verify the new email address.'
    }
  ];

  const categories = [...new Set(faqs.map(f => f.category))];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">FAQ</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/HelpSupport" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* FAQs by Category */}
        {categories.map((category) => {
          const categoryFaqs = filteredFaqs.filter(f => f.category === category);
          if (categoryFaqs.length === 0) return null;

          return (
            <Card key={category} className="overflow-hidden">
              <div className="bg-muted px-5 py-3 border-b border-border">
                <h2 className="font-bold text-sm text-foreground">{category}</h2>
              </div>
              <div className="divide-y divide-border">
                {categoryFaqs.map((faq) => (
                  <div key={faq.id}>
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50"
                    >
                      <span className="text-sm font-medium text-foreground text-left flex-1">{faq.question}</span>
                      {expandedId === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                      )}
                    </button>
                    {expandedId === faq.id && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {filteredFaqs.length === 0 && (
          <EmptyState
            icon={HelpCircle}
            title="No questions found"
            description="Try adjusting your search query to find what you're looking for."
          />
        )}

        {/* Contact Support */}
        <Card className="bg-info/10 border-info/20 p-5 text-center">
          <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">Our support team is here for you</p>
          <Button
            onClick={() => navigate(createPageUrl('LiveChat'))}
            className="rounded-full"
          >
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  );
}