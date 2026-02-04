import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardsSkeleton } from '@/components/states';

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
      // Log feedback submission (Feedback service can be added in future)
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

  const feedbackTypes = [
    { value: 'bug', label: 'Report Bug', icon: '🐛', color: 'bg-red-100 text-red-800' },
    { value: 'feature', label: 'Feature Request', icon: '💡', color: 'bg-blue-100 text-blue-800' },
    { value: 'improvement', label: 'Improvement', icon: '✨', color: 'bg-purple-100 text-purple-800' },
    { value: 'other', label: 'Other', icon: '💬', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSubmit = () => {
    if (!description.trim()) {
      alert('Please write your feedback');
      return;
    }

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
            <h1 className="text-lg font-semibold text-foreground">Feedback</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-primary to-love text-white overflow-hidden">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">We Value Your Input</h2>
            <p className="text-sm opacity-90">
              Help us improve Bellør by sharing your thoughts and ideas
            </p>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-foreground">What would you like to share?</label>
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFeedbackType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      feedbackType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium text-foreground">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-foreground">
                How would you rate your experience? (Optional)
              </label>
              <div className="flex justify-center">
                <Rating
                  value={rating}
                  onChange={setRating}
                  size="lg"
                  variant="star"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Title (Optional)</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quick summary..."
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Details</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about your experience, suggestion, or issue..."
                className="h-32 resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-left mt-1">
                {description.length}/500
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!description.trim() || submitFeedbackMutation.isPending}
              className="w-full h-12"
            >
              <Send className="w-5 h-5 ml-2" />
              {submitFeedbackMutation.isPending ? 'Sending...' : 'Send Feedback'}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-info/10 border-info/20">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-2 text-info">💙 Thank You!</h3>
            <p className="text-xs text-info/80">
              Your feedback helps us create a better experience for everyone in the Bellør community.
              We review all submissions and use them to guide our development roadmap.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}