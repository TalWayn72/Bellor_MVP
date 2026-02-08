import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FilterSliders({
  ageRange,
  setAgeRange,
  maxDistance,
  setMaxDistance,
  preferredGender,
  setPreferredGender,
  religiousPreference,
  setReligiousPreference,
}) {
  return (
    <>
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
          <Slider value={ageRange} onValueChange={setAgeRange} min={18} max={80} step={1} className="w-full" />
        </CardContent>
      </Card>

      {/* Max Distance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maximum Distance (km)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-2xl font-bold text-foreground">{maxDistance} km</div>
          <Slider value={[maxDistance]} onValueChange={(val) => setMaxDistance(val[0])} min={1} max={200} step={1} className="w-full" />
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
    </>
  );
}
