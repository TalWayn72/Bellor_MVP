import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CATEGORIES = [
  'Account Issue',
  'Payment & Billing',
  'Technical Problem',
  'Safety & Privacy',
  'Feature Request',
  'Other'
];

export default function EmailSupportForm({ formData, onFormChange, onSubmit, isPending, userEmail }) {
  return (
    <Card className="p-5 space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">Category</label>
        <select
          value={formData.category}
          onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
          className="w-full p-3 border border-border rounded-xl outline-none focus:border-primary bg-background text-foreground"
        >
          <option value="">Select category...</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">Subject</label>
        <Input
          type="text"
          value={formData.subject}
          onChange={(e) => onFormChange({ ...formData, subject: e.target.value })}
          placeholder="Brief description of your issue"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">Message</label>
        <Textarea
          value={formData.message}
          onChange={(e) => onFormChange({ ...formData, message: e.target.value })}
          placeholder="Please provide as much detail as possible..."
          className="h-40 resize-none"
        />
      </div>

      <div className="bg-muted rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Your email:</strong> {userEmail}
        </p>
      </div>

      <Button
        onClick={onSubmit}
        disabled={!formData.subject || !formData.category || !formData.message || isPending}
        className="w-full h-12"
      >
        <Send className="w-5 h-5 mr-2" />
        {isPending ? 'Sending...' : 'Send Message'}
      </Button>
    </Card>
  );
}
