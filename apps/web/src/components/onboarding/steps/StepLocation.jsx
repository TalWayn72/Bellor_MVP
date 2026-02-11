import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';

const countries = [
  { name: 'United States', code: 'US', flag: '\ud83c\uddfa\ud83c\uddf8', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston'] },
  { name: 'Israel', code: 'IL', flag: '\ud83c\uddee\ud83c\uddf1', cities: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beer Sheva'] },
  { name: 'United Kingdom', code: 'GB', flag: '\ud83c\uddec\ud83c\udde7', cities: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
  { name: 'Canada', code: 'CA', flag: '\ud83c\udde8\ud83c\udde6', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary'] },
  { name: 'Australia', code: 'AU', flag: '\ud83c\udde6\ud83c\uddfa', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] }
];

export default function StepLocation({ formData, setFormData, handleNext }) {
  const selectedCountry = countries.find(c => c.name === formData.location) || countries[0];

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="relative h-48 bg-muted overflow-hidden flex-shrink-0">
          <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800" alt="Background" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 px-6 py-4">
          <div className="w-full max-w-md mx-auto">
            <ProgressBar currentStep={3} totalSteps={TOTAL_STEPS} />
            <p className="text-sm text-gray-500 mb-3">Location for you matching</p>

            <div className="space-y-2">
              <div className="flex gap-3">
                <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value, location_state: e.target.value, location_city: '' })} className="flex-1 h-12 text-base bg-white text-gray-900 border-2 border-gray-300 rounded-lg px-3">
                  {countries.map(country => (
                    <option key={country.code} value={country.name}>{country.name}</option>
                  ))}
                </select>
                <div className="w-12 h-12 rounded-lg border-2 border-gray-300 bg-white flex items-center justify-center text-2xl">
                  {selectedCountry.flag}
                </div>
              </div>

              <select value={formData.location_city} onChange={(e) => setFormData({ ...formData, location_city: e.target.value })} className="w-full h-12 text-base bg-white text-gray-900 border-2 border-gray-300 rounded-lg px-3">
                <option value="">Select City</option>
                {selectedCountry.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-900">Can currently relocate?</span>
                <button onClick={() => setFormData({ ...formData, can_currently_relocate: !formData.can_currently_relocate })} className={`w-12 h-6 rounded-full transition-colors ${formData.can_currently_relocate ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.can_currently_relocate ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-900">Can language-travel?</span>
                <button onClick={() => setFormData({ ...formData, can_language_travel: !formData.can_language_travel })} className={`w-12 h-6 rounded-full transition-colors ${formData.can_language_travel ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.can_language_travel ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex-shrink-0">
          <Button onClick={handleNext} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
            NEXT
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
