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
import { useToast } from '@/components/ui/use-toast';

function getLocationString(location) {
  if (!location) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') return location.city || '';
  return '';
}

function getAge(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getLookingFor(lookingFor) {
  if (!lookingFor) return '';
  if (Array.isArray(lookingFor)) {
    if (lookingFor.length === 0) return '';
    if (lookingFor.length >= 2) return 'both';
    return lookingFor[0]?.toLowerCase() || '';
  }
  return lookingFor;
}

export default function EditProfile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, isLoading: userLoading, updateUser } = useCurrentUser();
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
        nickname: currentUser.nickname || currentUser.firstName || '',
        bio: currentUser.bio || '',
        age: getAge(currentUser.birthDate),
        gender: (currentUser.gender || '').toLowerCase(),
        looking_for: getLookingFor(currentUser.lookingFor || currentUser.looking_for),
        location: getLocationString(currentUser.location),
        phone: currentUser.phone || '',
        occupation: currentUser.occupation || '',
        education: currentUser.education || '',
        interests: currentUser.interests || [],
        profile_images: currentUser.profileImages || currentUser.profile_images || [],
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const ageNum = parseInt(formData.age, 10);
      const updateData = {
        nickname: formData.nickname,
        bio: formData.bio,
        gender: formData.gender,
        lookingFor: formData.looking_for
          ? (formData.looking_for === 'both' ? ['MALE', 'FEMALE'] : [formData.looking_for.toUpperCase()])
          : [],
        location: formData.location,
        profileImages: formData.profile_images || [],
        phone: formData.phone || null,
        occupation: formData.occupation || null,
        education: formData.education || null,
        interests: formData.interests || [],
        ...(ageNum >= 18 && ageNum <= 120 ? { age: ageNum } : {}),
      };
      const result = await userService.updateUser(currentUser.id, updateData);
      updateUser(result.data || updateData);
      navigate(createPageUrl('Profile'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Error updating profile', variant: 'destructive' });
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
