/**
 * User Data Transformer
 * Transforms API response data to frontend-expected format
 */

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date string or Date object
 * @returns {number|null} - Age in years or null if invalid
 */
export function calculateAge(birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format location object to display string
 * @param {string|object|null} location - Location data (string or {lat, lng, city, country})
 * @returns {string} - Formatted location string
 */
export function formatLocation(location) {
  if (!location) return 'Unknown';

  // Already a string
  if (typeof location === 'string') return location;

  // Object format from database
  if (typeof location === 'object') {
    const city = location.city;
    const country = location.country;

    if (city && country) {
      return `${city}, ${country}`;
    }
    if (city) return city;
    if (country) return country;
  }

  return 'Unknown';
}

/**
 * Transform user data from API format to frontend format
 * Adds computed fields: nickname, age, location_display
 * @param {object} user - Raw user data from API
 * @returns {object|null} - Transformed user data
 */
export function transformUser(user) {
  if (!user) return null;

  // Get nickname: prefer dedicated nickname field, fallback to first_name/firstName
  const nickname = user.nickname || user.first_name || user.firstName || 'User';

  // Calculate age from birth_date or birthDate
  const age = calculateAge(user.birth_date || user.birthDate || user.birth_date);

  // Format location for display
  const locationDisplay = formatLocation(user.location);

  return {
    ...user,
    // Computed/aliased fields
    nickname,
    age: age || user.age || 25, // Default to 25 if no birth date
    location_display: locationDisplay,
    // Keep original location for geo purposes
    location_raw: user.location,
    // Normalize profile images
    profile_images: user.profile_images || user.profileImages || [],
    // Normalize verification status
    is_verified: user.is_verified ?? user.isVerified ?? false,
    // Normalize admin status (backend sends isAdmin, some components expect is_admin)
    is_admin: user.is_admin ?? user.isAdmin ?? false,
    isAdmin: user.isAdmin ?? user.is_admin ?? false,
  };
}

export default transformUser;
