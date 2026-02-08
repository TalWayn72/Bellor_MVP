import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/rating';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const feedbackTypes = [
  { value: 'bug', label: 'Report Bug', icon: '🐛', color: 'bg-red-100 text-red-800' },
  { value: 'feature', label: 'Feature Request', icon: '💡', color: 'bg-blue-100 text-blue-800' },
  { value: 'improvement', label: 'Improvement', icon: '✨', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: 'Other', icon: '💬', color: 'bg-gray-100 text-gray-800' }
];

export default function FeedbackForm({
  feedbackType,
  setFeedbackType,
  rating,
  setRating,
  title,
  setTitle,
  description,
  setDescription,
  onSubmit,
  isPending,
}) {
  return (
    <div className="space-y-4">
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
          <Rating value={rating} onChange={setRating} size="lg" variant="star" />
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
        onClick={onSubmit}
        disabled={!description.trim() || isPending}
        className="w-full h-12"
      >
        <Send className="w-5 h-5 ml-2" />
        {isPending ? 'Sending...' : 'Send Feedback'}
      </Button>
    </div>
  );
}
