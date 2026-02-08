/**
 * API Data Transformers
 * Handles camelCase/snake_case conversion and field aliases
 */

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Field aliases for backward compatibility
 * Maps backend field names to frontend expected names
 */
export const fieldAliases = {
  'created_at': 'created_date',
  'updated_at': 'updated_date',
  'last_active_at': 'last_active_date',
  'birth_date': 'date_of_birth',
};

/**
 * Recursively transform object keys from camelCase to snake_case
 * Also adds field aliases for backward compatibility
 */
export function transformKeysToSnakeCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnakeCase(item));
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const transformed = {};
    for (const key of Object.keys(obj)) {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = transformKeysToSnakeCase(obj[key]);

      // Add field aliases for backward compatibility
      if (fieldAliases[snakeKey]) {
        transformed[fieldAliases[snakeKey]] = transformed[snakeKey];
      }
    }
    return transformed;
  }

  return obj;
}

/**
 * Recursively transform object keys from snake_case to camelCase
 * Used for outgoing requests to match backend Prisma schema
 */
export function transformKeysToCamelCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamelCase(item));
  }

  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof FormData)) {
    const transformed = {};
    for (const key of Object.keys(obj)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = transformKeysToCamelCase(obj[key]);
    }
    return transformed;
  }

  return obj;
}
