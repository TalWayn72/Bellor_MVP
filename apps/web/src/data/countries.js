/** Shared countries + cities list for location selection */
export const countries = [
  { name: 'United States', code: 'US', flag: '\ud83c\uddfa\ud83c\uddf8', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston'] },
  { name: 'Israel', code: 'IL', flag: '\ud83c\uddee\ud83c\uddf1', cities: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beer Sheva'] },
  { name: 'United Kingdom', code: 'GB', flag: '\ud83c\uddec\ud83c\udde7', cities: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
  { name: 'Canada', code: 'CA', flag: '\ud83c\udde8\ud83c\udde6', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary'] },
  { name: 'Australia', code: 'AU', flag: '\ud83c\udde6\ud83c\uddfa', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] },
];

/** Find a country object by name (case-insensitive) */
export function findCountry(name) {
  if (!name) return null;
  return countries.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
}

/** Find a country that contains the given city */
export function findCountryByCity(cityName) {
  if (!cityName) return null;
  return countries.find(c => c.cities.some(city => city.toLowerCase() === cityName.toLowerCase())) || null;
}
