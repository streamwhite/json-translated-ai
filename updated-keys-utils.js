/**
 * Utility functions for handling updated keys in translation templates
 */

/**
 * Extracts updated keys from a template object recursively
 * @param {Object} obj - Template object to search
 * @param {string} prefix - Current path prefix
 * @returns {Array} Array of updated key paths
 */
export function getUpdatedKeys(obj, prefix = '') {
  const updatedKeys = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    // Check if this object has __updated_keys__ array
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (value.__updated_keys__ && Array.isArray(value.__updated_keys__)) {
        // Add updated keys with proper path composition
        for (const updatedKey of value.__updated_keys__) {
          const fullPath = `${currentPath}.${updatedKey}`;
          updatedKeys.push(fullPath);
        }
      }

      // Recursively search nested objects
      updatedKeys.push(...getUpdatedKeys(value, currentPath));
    }
  }

  return updatedKeys;
}

/**
 * Validates that __updated_keys__ arrays contain valid key names
 * @param {Object} obj - Template object to validate
 * @param {string} prefix - Current path prefix
 * @returns {Array} Array of validation errors
 */
export function validateUpdatedKeys(obj, prefix = '') {
  const errors = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (value.__updated_keys__ && Array.isArray(value.__updated_keys__)) {
        // Validate that all __updated_keys__ exist as actual keys in the object
        for (const updatedKey of value.__updated_keys__) {
          if (!(updatedKey in value)) {
            errors.push(
              `Invalid __updated_keys__ "${updatedKey}" in object at path "${currentPath}" - key does not exist`
            );
          }
        }
      }

      // Recursively validate nested objects
      errors.push(...validateUpdatedKeys(value, currentPath));
    }
  }

  return errors;
}

/**
 * Removes __updated_keys__ arrays from template object (for clean output)
 * @param {Object} obj - Template object to clean
 * @returns {Object} Cleaned template object
 */
export function removeUpdatedKeysArrays(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === '__updated_keys__') {
      // Skip __updated_keys__ arrays
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      cleaned[key] = removeUpdatedKeysArrays(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
