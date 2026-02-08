import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { CardsSkeleton } from '@/components/states';
import FeedbackForm from '@/components/feedback/FeedbackForm';

export default function Feedback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [feedbackType, setFeedbackType] = useState('improvement');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data) => {
      const feedbackData = {
        user_id: currentUser.id,
        ...data,
        status: 'pending',
        created_date: new Date().toISOString()
      };
      console.log('Feedback submitted:', feedbackData);
      return feedbackData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setFeedbackType('improvement');
      setRating(0);
      setTitle('');
      setDescription('');
      alert('Thank you for your feedback! 🙏');
    },
  });

  const handleSubmit = () => {
    if (!description.trim()) { alert('Please write your feedback'); return; }
    submitFeedbackMutation.mutate({
      type: feedbackType,
      title: title.trim() || 'Untitled',
      description: description.trim(),
      rating: rating || undefined
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Feedback</h1>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4"><CardsSkeleton count={3} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Feedback</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="bg-gradient-to-br from-primary to-love text-white overflow-hidden">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">We Value Your Input</h2>
            <p className="text-sm opacity-90">Help us improve Bellor by sharing your thoughts and ideas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <FeedbackForm
              feedbackType={feedbackType}
              setFeedbackType={setFeedbackType}
              rating={rating}
              setRating={setRating}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              onSubmit={handleSubmit}
              isPending={submitFeedbackMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card className="bg-info/10 border-info/20">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-2 text-info">💙 Thank You!</h3>
            <p className="text-xs text-info/80">
              Your feedback helps us create a better experience for everyone in the Bellor community.
              We review all submissions and use them to guide our development roadmap.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
