/**
 * API Validation Utilities
 * Centralized validation functions for API services
 *
 * @module api/utils/validation
 */

/**
 * Validates that a userId is present and valid
 * @param {string} userId - The user ID to validate
 * @param {string} callerName - Name of the calling function for logging
 * @throws {Error} If userId is invalid
 */
export function validateUserId(userId, callerName = 'API call') {
  if (!userId) {
    console.error(`${callerName} called with invalid userId:`, userId, 'Type:', typeof userId);
    throw new Error(`Invalid user ID: userId is required for ${callerName}`);
  }

  if (userId === 'undefined' || userId === 'null') {
    console.error(`${callerName} called with string "${userId}" instead of actual value`);
    throw new Error(`Invalid user ID: "${userId}" is not a valid ID for ${callerName}`);
  }

  if (typeof userId !== 'string') {
    console.error(`${callerName} called with non-string userId:`, userId, 'Type:', typeof userId);
    throw new Error(`Invalid user ID: expected string, got ${typeof userId} for ${callerName}`);
  }
}

/**
 * Validates that a required ID parameter is present and valid
 * @param {string} id - The ID to validate
 * @param {string} paramName - Name of the parameter (e.g., 'chatId', 'responseId')
 * @param {string} callerName - Name of the calling function for logging
 * @throws {Error} If ID is invalid
 */
export function validateRequiredId(id, paramName, callerName = 'API call') {
  if (!id) {
    console.error(`${callerName} called with invalid ${paramName}:`, id);
    throw new Error(`Invalid ${paramName}: ${paramName} is required for ${callerName}`);
  }

  if (id === 'undefined' || id === 'null') {
    console.error(`${callerName} called with string "${id}" for ${paramName}`);
    throw new Error(`Invalid ${paramName}: "${id}" is not a valid ID for ${callerName}`);
  }
}

/**
 * Validates that data is a non-null object
 * @param {object} data - The data object to validate
 * @param {string} callerName - Name of the calling function for logging
 * @throws {Error} If data is not a valid object
 */
export function validateDataObject(data, callerName = 'API call') {
  if (typeof data !== 'object' || data === null) {
    console.error(`${callerName} called with invalid data:`, data, 'Type:', typeof data);
    throw new Error(`Invalid data: must be an object for ${callerName}`);
  }
}

/**
 * Validates multiple required parameters at once
 * @param {object} params - Object with parameter names as keys and values to validate
 * @param {string} callerName - Name of the calling function for logging
 * @throws {Error} If any parameter is invalid
 */
export function validateRequiredParams(params, callerName = 'API call') {
  for (const [paramName, value] of Object.entries(params)) {
    if (!value) {
      console.error(`${callerName} called with missing ${paramName}:`, value);
      throw new Error(`Missing required parameter: ${paramName} for ${callerName}`);
    }

    if (value === 'undefined' || value === 'null') {
      console.error(`${callerName} called with string "${value}" for ${paramName}`);
      throw new Error(`Invalid ${paramName}: "${value}" is not valid for ${callerName}`);
    }
  }
}
