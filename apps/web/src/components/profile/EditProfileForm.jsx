import React from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditProfileForm({ formData, setFormData, newInterest, setNewInterest }) {
  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, newInterest.trim()] });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) });
  };

  return (
    <>
      {/* Basic Info */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Name</label>
              <Input value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Bio</label>
              <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself..." className="w-full h-24" />
            </div>
            {formData.age && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Age</label>
                <p className="h-10 px-3 flex items-center rounded-md bg-muted/50 text-foreground text-sm">{formData.age}</p>
              </div>
            )}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Looking For</label>
              <select value={formData.looking_for} onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })} className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground">
                <option value="">Select...</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Location</label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Phone</label>
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+972-XX-XXXXXXX" className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work & Education */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-sm">Work & Education</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Occupation</label>
              <Input value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} placeholder="What do you do?" className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Education</label>
              <Input value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} placeholder="Where did you study?" className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-sm">Interests</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()} placeholder="Add an interest..." className="flex-1" />
            <Button onClick={handleAddInterest}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-muted text-foreground text-sm rounded-full flex items-center gap-2">
                {interest}
                <button onClick={() => handleRemoveInterest(interest)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
