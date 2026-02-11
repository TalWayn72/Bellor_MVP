import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';

export default function StepAboutYou({ formData, setFormData, handleNext }) {
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="relative h-64 bg-muted overflow-hidden flex-shrink-0">
          <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800" alt="Background" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            <ProgressBar currentStep={4} totalSteps={TOTAL_STEPS} />
            <p className="text-sm text-gray-500 mb-4">About You</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-2">Occupation</label>
                <Input placeholder="What do you do?" value={formData.occupation} onChange={(e) => { const value = e.target.value.replace(/[0-9]/g, ''); setFormData({ ...formData, occupation: value }); }} className="w-full h-12 text-base" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">Education</label>
                <Input placeholder="Where did you study?" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} className="w-full h-12 text-base" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">Phone Number</label>
                <Input type="tel" placeholder="+1 234 567 8900" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full h-12 text-base" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">Bio</label>
                <Textarea placeholder="Tell us about yourself..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full h-24 text-base" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">Interests (comma separated)</label>
                <Input placeholder="Music, Art, Travel..." value={formData.interests.join(', ')} onChange={(e) => { const interests = e.target.value.split(',').map(i => i.trim()).filter(i => i); setFormData({ ...formData, interests }); }} className="w-full h-12 text-base" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3 flex-shrink-0">
          <Button
            onClick={() => {
              const skipUntil = new Date();
              skipUntil.setHours(skipUntil.getHours() + 72);
              setFormData({ ...formData, occupation_education_skip_until: skipUntil.toISOString() });
              handleNext();
            }}
            variant="outline"
            className="px-8 h-12 text-sm border-2 border-border"
          >
            SKIP
          </Button>
          <Button onClick={handleNext} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
            NEXT
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
