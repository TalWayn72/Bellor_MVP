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
    console.warn('[DATE_FORMAT] Invalid date:', date);
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
    console.error('[DATE_VALIDATION] Invalid format:', dateStr, 'Expected: yyyy-MM-dd');
    return { isValid: false, error: 'Date must be in yyyy-MM-dd format' };
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    console.error('[DATE_VALIDATION] Invalid date:', dateStr);
    return { isValid: false, error: 'Invalid date' };
  }

  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1900) {
    console.error('[DATE_VALIDATION] Year too old:', year);
    return { isValid: false, error: 'Please enter a valid birth year' };
  }
  if (year > currentYear - 18) {
    console.error('[DATE_VALIDATION] User must be 18+:', year);
    return { isValid: false, error: 'You must be at least 18 years old' };
  }

  console.log('[DATE_VALIDATION] Valid date:', dateStr, '\u2192', parsed.toISOString());
  return { isValid: true, date: parsed };
}

export const TOTAL_STEPS = 12;
