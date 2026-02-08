import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { Button } from '@/components/ui/button';
import { ProfileSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import EditProfileImages from '@/components/profile/EditProfileImages';
import EditProfileForm from '@/components/profile/EditProfileForm';

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const [formData, setFormData] = useState({
    nickname: '', bio: '', age: '', gender: '', looking_for: '',
    location: '', phone: '', occupation: '', education: '',
    interests: [], profile_images: [],
  });
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        nickname: currentUser.nickname || '', bio: currentUser.bio || '',
        age: currentUser.age || '', gender: currentUser.gender || '',
        looking_for: currentUser.looking_for || '', location: currentUser.location || '',
        phone: currentUser.phone || '', occupation: currentUser.occupation || '',
        education: currentUser.education || '', interests: currentUser.interests || [],
        profile_images: currentUser.profile_images || [],
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const updateData = {
        nickname: formData.nickname, bio: formData.bio, gender: formData.gender,
        lookingFor: formData.looking_for ? (Array.isArray(formData.looking_for) ? formData.looking_for : [formData.looking_for]) : [],
        location: formData.location, profileImages: formData.profile_images || [],
        lastActiveAt: new Date().toISOString(),
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

  if (userLoading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button onClick={handleSave} disabled={isSaving} variant="ghost" className="text-sm text-primary p-0">
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
        <EditProfileImages
          images={formData.profile_images}
          onChange={(images) => setFormData({ ...formData, profile_images: images })}
        />
        <EditProfileForm
          formData={formData}
          setFormData={setFormData}
          newInterest={newInterest}
          setNewInterest={setNewInterest}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full h-14 rounded-full font-medium">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
