import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';
import FilterSliders from '@/components/settings/FilterSliders';

export default function FilterSettings() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [ageRange, setAgeRange] = useState([18, 35]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [preferredGender, setPreferredGender] = useState('all');
  const [religiousPreference, setReligiousPreference] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const minAge = currentUser.age_range_min || currentUser.ageRangeMin || 18;
      const maxAge = currentUser.age_range_max || currentUser.ageRangeMax || 35;
      setAgeRange([minAge, maxAge]);
      setMaxDistance(currentUser.max_distance || currentUser.maxDistance || 50);
      const lookingFor = currentUser.looking_for || currentUser.lookingFor || [];
      if (lookingFor.length === 0 || lookingFor.length >= 3) {
        setPreferredGender('all');
      } else {
        setPreferredGender(lookingFor[0]?.toLowerCase() || 'all');
      }
      setReligiousPreference('all');
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const updateData = {
        ageRangeMin: ageRange[0],
        ageRangeMax: ageRange[1],
        maxDistance: maxDistance,
        lookingFor: preferredGender === 'all'
          ? ['MALE', 'FEMALE', 'OTHER']
          : [preferredGender.toUpperCase()]
      };
      await userService.updateUser(currentUser.id, updateData);
      alert('Preferences saved successfully!');
      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <ListSkeleton count={5} />;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Settings" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Discover Filters</h1>
          </div>
          <div className="min-w-[24px]"><div className="w-6"></div></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <FilterSliders
          ageRange={ageRange}
          setAgeRange={setAgeRange}
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          preferredGender={preferredGender}
          setPreferredGender={setPreferredGender}
          religiousPreference={religiousPreference}
          setReligiousPreference={setReligiousPreference}
        />

        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full h-14 rounded-xl font-medium"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
