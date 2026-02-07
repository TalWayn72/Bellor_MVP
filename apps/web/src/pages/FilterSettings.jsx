import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';

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
      // Map from Prisma field names (snake_case after apiClient transform)
      const minAge = currentUser.age_range_min || currentUser.ageRangeMin || 18;
      const maxAge = currentUser.age_range_max || currentUser.ageRangeMax || 35;
      setAgeRange([minAge, maxAge]);
      setMaxDistance(currentUser.max_distance || currentUser.maxDistance || 50);
      // lookingFor is array - convert to single preference for UI
      const lookingFor = currentUser.looking_for || currentUser.lookingFor || [];
      if (lookingFor.length === 0 || lookingFor.length >= 3) {
        setPreferredGender('all');
      } else {
        setPreferredGender(lookingFor[0]?.toLowerCase() || 'all');
      }
      setReligiousPreference('all'); // Not in Prisma schema
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      // Map to Prisma field names
      const updateData = {
        ageRangeMin: ageRange[0],
        ageRangeMax: ageRange[1],
        maxDistance: maxDistance,
        // lookingFor must be array of Gender enum values
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

  if (isLoading) {
    return <ListSkeleton count={5} />;
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/Settings" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Discover Filters</h1>
          </div>
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Explanation */}
        <Card className="bg-gradient-to-br from-info/10 to-primary/10 border-info/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">Bellor's Unique Approach</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At Bellor, there's no swiping. We believe in real connections through your shares and stories.
              The filters here help us match you with the content you'll see in your feed, but the real
              connection starts from your shares and stories.
            </p>
          </CardContent>
        </Card>

        {/* Age Range */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{ageRange[0]}</span>
              <span>{ageRange[1]}</span>
            </div>
            <Slider
              value={ageRange}
              onValueChange={setAgeRange}
              min={18}
              max={80}
              step={1}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Max Distance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maximum Distance (km)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-2xl font-bold text-foreground">
              {maxDistance} km
            </div>
            <Slider
              value={[maxDistance]}
              onValueChange={(val) => setMaxDistance(val[0])}
              min={1}
              max={200}
              step={1}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Preferred Gender */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferred Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'all', label: 'All' },
                { value: 'male', label: 'Men' },
                { value: 'female', label: 'Women' }
              ].map((gender) => (
                <button
                  key={gender.value}
                  onClick={() => setPreferredGender(gender.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                    preferredGender === gender.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {gender.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Religious Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Religious Preference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'all', label: 'All' },
                { value: 'religious', label: 'Religious' },
                { value: 'traditional', label: 'Traditional' },
                { value: 'secular', label: 'Secular' }
              ].map((pref) => (
                <button
                  key={pref.value}
                  onClick={() => setReligiousPreference(pref.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                    religiousPreference === pref.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {pref.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
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
