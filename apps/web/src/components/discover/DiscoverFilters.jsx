import React from 'react';
import { Button } from '@/components/ui/button';

const DEFAULT_FILTERS = {
  minAge: 18,
  maxAge: 100,
  distance: 50,
  gender: 'all',
  location: '',
  interests: [],
  lookingFor: 'all',
};

const INTEREST_OPTIONS = ['Music', 'Travel', 'Art', 'Sports', 'Reading', 'Cooking', 'Gaming', 'Photography'];

const LOOKING_FOR_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'casual', label: 'Casual' },
];

export default function DiscoverFilters({ filters, setFilters, onClose }) {
  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const toggleInterest = (interest) => {
    const newInterests = filters.interests.includes(interest)
      ? filters.interests.filter(i => i !== interest)
      : [...filters.interests, interest];
    setFilters({ ...filters, interests: newInterests });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-card w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-foreground mb-6">Filters</h2>

        <div className="space-y-6">
          {/* Age Range */}
          <div>
            <label htmlFor="filter-min-age" className="block text-sm font-semibold text-foreground mb-2">Age Range</label>
            <div className="flex items-center gap-4">
              <input id="filter-min-age" type="number" aria-label="Minimum age" value={filters.minAge} onChange={(e) => setFilters({ ...filters, minAge: parseInt(e.target.value) })} className="w-20 px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground" />
              <span className="text-foreground">-</span>
              <input id="filter-max-age" type="number" aria-label="Maximum age" value={filters.maxAge} onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })} className="w-20 px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground" />
            </div>
          </div>

          {/* Distance */}
          <div>
            <label htmlFor="filter-distance" className="block text-sm font-semibold text-foreground mb-2">Distance: {filters.distance} km</label>
            <input id="filter-distance" type="range" min="1" max="100" value={filters.distance} onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })} className="w-full" />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Gender</label>
            <div className="grid grid-cols-3 gap-3">
              {['all', 'male', 'female'].map((gender) => (
                <button key={gender} onClick={() => setFilters({ ...filters, gender })} className={`py-3 rounded-xl border-2 transition-all text-foreground ${filters.gender === gender ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Looking For</label>
            <div className="grid grid-cols-3 gap-3">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <button key={option.value} onClick={() => setFilters({ ...filters, lookingFor: option.value })} className={`py-3 rounded-xl border-2 transition-all text-sm text-foreground ${filters.lookingFor === option.value ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="filter-location" className="block text-sm font-semibold text-foreground mb-2">Location</label>
            <input id="filter-location" type="text" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Enter city or area" className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground" />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Interests</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {INTEREST_OPTIONS.map((interest) => (
                <button key={interest} onClick={() => toggleInterest(interest)} className={`px-4 py-2 rounded-full border-2 transition-all text-sm ${filters.interests.includes(interest) ? 'border-primary bg-primary/5 font-medium text-foreground' : 'border-border text-muted-foreground'}`}>
                  {interest}
                </button>
              ))}
            </div>
            {filters.interests.length > 0 && (
              <p className="text-xs text-muted-foreground">Selected: {filters.interests.join(', ')}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleReset} variant="outline" className="flex-1">Reset</Button>
          <Button onClick={onClose} className="flex-1">Apply</Button>
        </div>
      </div>
    </div>
  );
}
