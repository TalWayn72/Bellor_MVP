import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, uploadService } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { Plus, X } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    age: '',
    gender: '',
    looking_for: '',
    location: '',
    phone: '',
    occupation: '',
    education: '',
    interests: [],
    profile_images: []
  });
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        nickname: currentUser.nickname || '',
        bio: currentUser.bio || '',
        age: currentUser.age || '',
        gender: currentUser.gender || '',
        looking_for: currentUser.looking_for || '',
        location: currentUser.location || '',
        phone: currentUser.phone || '',
        occupation: currentUser.occupation || '',
        education: currentUser.education || '',
        interests: currentUser.interests || [],
        profile_images: currentUser.profile_images || []
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      // Map frontend fields to Prisma field names
      const updateData = {
        nickname: formData.nickname, // nickname is a dedicated field
        bio: formData.bio,
        gender: formData.gender,
        // lookingFor must be array
        lookingFor: formData.looking_for
          ? (Array.isArray(formData.looking_for) ? formData.looking_for : [formData.looking_for])
          : [],
        location: formData.location,
        profileImages: formData.profile_images || [],
        lastActiveAt: new Date().toISOString()
      };
      await userService.updateUser(currentUser.id, updateData);

      navigate(createPageUrl('Profile'));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await uploadService.uploadProfileImage(file);
      setFormData({
        ...formData,
        profile_images: [...formData.profile_images, result.url]
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      profile_images: formData.profile_images.filter((_, i) => i !== index)
    });
  };

  if (userLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="ghost"
              className="text-sm text-primary p-0"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/Profile" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Profile Images */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Profile Images</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {formData.profile_images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                <img
                  src={image}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {formData.profile_images.length < 6 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Plus className="w-8 h-8 text-muted-foreground" />
              </label>
            )}
          </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Name</label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="w-full h-24"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Age</label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Looking For</label>
              <select
                value={formData.looking_for}
                onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
              >
                <option value="">Select...</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+972-XX-XXXXXXX"
                className="w-full"
              />
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Work & Education */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Work & Education</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Occupation</label>
              <Input
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="What do you do?"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Education</label>
              <Input
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="Where did you study?"
                className="w-full"
              />
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Interests</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="flex gap-2 mb-3">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
              placeholder="Add an interest..."
              className="flex-1"
            />
            <Button onClick={handleAddInterest}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-muted text-foreground text-sm rounded-full flex items-center gap-2"
              >
                {interest}
                <button onClick={() => handleRemoveInterest(interest)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="w-full h-14 rounded-full font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}