/**
 * Format date to yyyy-MM-dd for HTML date input
 * Handles both ISO dates and already formatted dates
 * @param {string | Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateForInput(date) {
  if (!date) return '';

  // If it's already in yyyy-MM-dd format, return as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Convert to Date object if string
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if valid date
  if (isNaN(dateObj.getTime())) {
    if (import.meta.env.DEV) console.debug('[DATE_FORMAT] Invalid date:', date);
    return '';
  }

  // Format as yyyy-MM-dd
  return dateObj.toISOString().split('T')[0];
}

/**
 * Validate date string format and value
 * @param {string} dateStr - Date string to validate
 * @returns {{ isValid: boolean, error?: string, date?: Date }}
 */
export function validateDateOfBirth(dateStr) {
  if (!dateStr) {
    return { isValid: false, error: 'Date of birth is required' };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    if (import.meta.env.DEV) console.debug('[DATE_VALIDATION] Invalid format:', dateStr, 'Expected: yyyy-MM-dd');
    return { isValid: false, error: 'Date must be in yyyy-MM-dd format' };
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    if (import.meta.env.DEV) console.debug('[DATE_VALIDATION] Invalid date:', dateStr);
    return { isValid: false, error: 'Invalid date' };
  }

  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1900) {
    if (import.meta.env.DEV) console.debug('[DATE_VALIDATION] Year too old:', year);
    return { isValid: false, error: 'Please enter a valid birth year' };
  }
  if (year > currentYear - 18) {
    if (import.meta.env.DEV) console.debug('[DATE_VALIDATION] User must be 18+:', year);
    return { isValid: false, error: 'You must be at least 18 years old' };
  }

  if (import.meta.env.DEV) console.debug('[DATE_VALIDATION] Valid date:', dateStr);
  return { isValid: true, date: parsed };
}

export const TOTAL_STEPS = 12;

/** Build partial save data for a given onboarding step */
export function buildStepSaveData(step, formData) {
  if (step === 3 && formData.nickname) return { nickname: formData.nickname };
  if (step === 4 && formData.date_of_birth) return { birthDate: formData.date_of_birth };
  if (step === 5 && (formData.location_city || formData.location)) {
    return { location: formData.location_city && formData.location_state ? { city: formData.location_city, country: formData.location_state } : formData.location };
  }
  if (step === 6) {
    const d = {};
    if (formData.occupation) d.occupation = formData.occupation;
    if (formData.education) d.education = formData.education;
    if (formData.phone) d.phone = formData.phone;
    if (formData.bio) d.bio = formData.bio;
    if (formData.interests?.length > 0) d.interests = formData.interests;
    return Object.keys(d).length > 0 ? d : null;
  }
  if (step === 7 && formData.gender) return { gender: formData.gender };
  if (step === 7.7 && formData.looking_for) {
    const arr = Array.isArray(formData.looking_for) ? formData.looking_for : [formData.looking_for];
    return { lookingFor: arr };
  }
  if (step === 8 && formData.profile_images?.length > 0) return { profileImages: formData.profile_images };
  return null;
}

/** Build full user data for the final onboarding save */
export function buildFinalUserData(formData) {
  const lookingForArray = formData.looking_for ? (Array.isArray(formData.looking_for) ? formData.looking_for : [formData.looking_for]) : [];
  return {
    nickname: formData.nickname, birthDate: formData.date_of_birth, gender: formData.gender, lookingFor: lookingForArray,
    location: formData.location_city && formData.location_state ? { city: formData.location_city, country: formData.location_state } : formData.location,
    profileImages: formData.profile_images || [], sketchMethod: formData.sketch_method, drawingUrl: formData.drawing_url,
    bio: formData.bio, occupation: formData.occupation || null, education: formData.education || null,
    phone: formData.phone || null, interests: formData.interests || [], lastActiveAt: new Date().toISOString(),
  };
}
