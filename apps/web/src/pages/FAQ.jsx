import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BackButton from '@/components/navigation/BackButton';
import { EmptyState } from '@/components/states';
import { faqs } from '@/components/support/faqData';

export default function FAQ() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const categories = [...new Set(faqs.map(f => f.category))];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpanded = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">FAQ</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/HelpSupport" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
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
                    <button onClick={() => toggleExpanded(faq.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50">
                      <span className="text-sm font-medium text-foreground text-left flex-1">{faq.question}</span>
                      {expandedId === faq.id
                        ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                        : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />}
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
          <EmptyState icon={HelpCircle} title="No questions found"
            description="Try adjusting your search query to find what you're looking for." />
        )}

        <Card className="bg-info/10 border-info/20 p-5 text-center">
          <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">Our support team is here for you</p>
          <Button onClick={() => navigate(createPageUrl('LiveChat'))} className="rounded-full">
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  );
}
