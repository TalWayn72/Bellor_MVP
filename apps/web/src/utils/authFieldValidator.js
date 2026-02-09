/**
 * Auth Field Validator - Dev-time diagnostic for field naming mismatches
 * Detects camelCase vs snake_case inconsistencies in auth user objects
 * Only runs in development mode
 */

const EXPECTED_SNAKE_CASE_FIELDS = [
  'is_admin',
  'is_blocked',
  'is_verified',
  'is_premium',
  'first_name',
  'last_name',
  'birth_date',
  'created_at',
  'last_active_at',
  'profile_images',
  'drawing_url',
  'sketch_method',
  'looking_for',
  'age_range_min',
  'age_range_max',
  'max_distance',
  'show_online',
  'show_distance',
  'show_age',
  'private_profile',
  'do_not_sell',
  'preferred_language',
  'notify_new_matches',
  'notify_new_messages',
  'notify_chat_requests',
  'notify_daily_missions',
  'notify_email',
];

const CAMEL_CASE_EQUIVALENTS = {
  isAdmin: 'is_admin',
  isBlocked: 'is_blocked',
  isVerified: 'is_verified',
  isPremium: 'is_premium',
  firstName: 'first_name',
  lastName: 'last_name',
  birthDate: 'birth_date',
  createdAt: 'created_at',
  lastActiveAt: 'last_active_at',
  profileImages: 'profile_images',
  drawingUrl: 'drawing_url',
  sketchMethod: 'sketch_method',
  lookingFor: 'looking_for',
  ageRangeMin: 'age_range_min',
  ageRangeMax: 'age_range_max',
  maxDistance: 'max_distance',
  showOnline: 'show_online',
  showDistance: 'show_distance',
  showAge: 'show_age',
  privateProfile: 'private_profile',
  doNotSell: 'do_not_sell',
  preferredLanguage: 'preferred_language',
  notifyNewMatches: 'notify_new_matches',
  notifyNewMessages: 'notify_new_messages',
  notifyChatRequests: 'notify_chat_requests',
  notifyDailyMissions: 'notify_daily_missions',
  notifyEmail: 'notify_email',
};

/**
 * Validates a user object has snake_case fields (post API transformer).
 * Warns in dev console if camelCase fields are found without snake_case equivalents.
 * @param {object} user - User object from auth context
 * @param {string} source - Where this check was called from
 * @returns {string[]} - List of warnings (empty if valid)
 */
export function validateAuthUserFields(user, source = 'unknown') {
  if (!import.meta.env.DEV || !user) return [];

  const warnings = [];

  for (const [camelKey, snakeKey] of Object.entries(CAMEL_CASE_EQUIVALENTS)) {
    if (camelKey in user && !(snakeKey in user)) {
      warnings.push(
        `[AuthFieldValidator] "${source}" has camelCase "${camelKey}" without snake_case "${snakeKey}". ` +
        `API transformer should convert to snake_case. Check apiClient response interceptor.`
      );
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[AuthFieldValidator] Found ${warnings.length} field naming issue(s) in "${source}":`,
      warnings
    );
  }

  return warnings;
}

/**
 * Validates that a property access uses the correct field name format.
 * Call this where you check user fields to ensure consistency.
 * @param {object} user - User object
 * @param {string} fieldName - The field being accessed
 * @param {string} source - Component/file name
 */
export function assertSnakeCaseField(user, fieldName, source = 'unknown') {
  if (!import.meta.env.DEV || !user) return;

  if (CAMEL_CASE_EQUIVALENTS[fieldName]) {
    console.error(
      `[AuthFieldValidator] "${source}" is accessing camelCase field "${fieldName}". ` +
      `Use "${CAMEL_CASE_EQUIVALENTS[fieldName]}" instead (API responses are snake_case).`
    );
  }
}
