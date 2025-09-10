// Utility functions for translation insertion
// These are the same functions from check-and-fix-translations.js but without ES module dependencies

// Function to recursively get all keys(path) from an object
export function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(obj[key])) {
      // Handle arrays - add keys for each element using bracket notation
      for (let i = 0; i < obj[key].length; i++) {
        const elementKey = `${fullKey}[${i}]`;
        const element = obj[key][i];

        if (Array.isArray(element)) {
          // Handle nested arrays - recursively process with bracket notation
          // For nested arrays, we need to process each element with bracket notation
          for (let j = 0; j < element.length; j++) {
            const nestedElementKey = `${elementKey}[${j}]`;
            const nestedElement = element[j];

            if (Array.isArray(nestedElement)) {
              // Handle deeply nested arrays
              keys.push(...getAllKeys(nestedElement, nestedElementKey));
            } else if (
              typeof nestedElement === 'object' &&
              nestedElement !== null
            ) {
              // Handle objects within nested arrays
              keys.push(...getAllKeys(nestedElement, nestedElementKey));
            } else {
              // Add individual nested array element keys
              keys.push(nestedElementKey);
            }
          }
        } else if (typeof element === 'object' && element !== null) {
          // Recursively process nested objects within arrays
          keys.push(...getAllKeys(element, elementKey));
        } else {
          // Add individual array element keys
          keys.push(elementKey);
        }
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Handle nested objects
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      // Handle primitive values
      keys.push(fullKey);
    }
  }
  return keys;
}

// Function to get value from nested object using dot notation and bracket notation for arrays
export function getNestedValue(obj, path) {
  // Parse the path to handle both dot notation and bracket notation
  const keys = [];
  let currentPath = path;

  while (currentPath.length > 0) {
    const bracketMatch = currentPath.match(/^([^[.]+)\[(\d+)\]/);
    if (bracketMatch) {
      // Found bracket notation like "array[0]"
      keys.push(bracketMatch[1]); // array name
      keys.push(bracketMatch[2]); // index
      currentPath = currentPath.substring(bracketMatch[0].length);
      if (currentPath.startsWith('.')) {
        currentPath = currentPath.substring(1); // Remove leading dot
      }
    } else if (currentPath.startsWith('[')) {
      // Handle consecutive bracket notation like "[1]" after "array[0]"
      const bracketIndexMatch = currentPath.match(/^\[(\d+)\]/);
      if (bracketIndexMatch) {
        keys.push(bracketIndexMatch[1]); // index
        currentPath = currentPath.substring(bracketIndexMatch[0].length);
        if (currentPath.startsWith('.')) {
          currentPath = currentPath.substring(1); // Remove leading dot
        }
      } else {
        // Invalid bracket syntax, treat as regular key
        keys.push(currentPath);
        break;
      }
    } else {
      // Handle dot notation
      const dotIndex = currentPath.indexOf('.');
      if (dotIndex === -1) {
        keys.push(currentPath);
        break;
      } else {
        keys.push(currentPath.substring(0, dotIndex));
        currentPath = currentPath.substring(dotIndex + 1);
      }
    }
  }

  return keys.reduce((current, key) => {
    // Check if this is a numeric key (array index)
    const isNumericKey = /^\d+$/.test(key);

    if (isNumericKey && Array.isArray(current)) {
      // Handle array indices like "0", "1", etc.
      const index = parseInt(key);
      return current?.[index];
    }
    return current?.[key];
  }, obj);
}

// Function to set value in nested object using dot notation and bracket notation for arrays
export function setNestedValue(obj, path, value) {
  // Parse the path to handle both dot notation and bracket notation
  const keys = [];
  let currentPath = path;

  while (currentPath.length > 0) {
    const bracketMatch = currentPath.match(/^([^[.]+)\[(\d+)\]/);
    if (bracketMatch) {
      // Found bracket notation like "array[0]"
      keys.push(bracketMatch[1]); // array name
      keys.push(bracketMatch[2]); // index
      currentPath = currentPath.substring(bracketMatch[0].length);
      if (currentPath.startsWith('.')) {
        currentPath = currentPath.substring(1); // Remove leading dot
      }
    } else {
      // Handle dot notation
      const dotIndex = currentPath.indexOf('.');
      if (dotIndex === -1) {
        keys.push(currentPath);
        break;
      } else {
        keys.push(currentPath.substring(0, dotIndex));
        currentPath = currentPath.substring(dotIndex + 1);
      }
    }
  }

  let current = obj;
  let parents = [];
  let parentKeys = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const isNumericKey = /^\d+$/.test(key);
    const nextKey = keys[i + 1];
    const isNextNumeric = /^\d+$/.test(nextKey);

    // Track parent and key for possible array conversion
    if (i > 0) {
      parents[i] = current;
      parentKeys[i] = keys[i - 1];
    }

    if (i === keys.length - 1) {
      // Last key, set the value
      if (isNumericKey) {
        if (!Array.isArray(current)) {
          // Convert parent property to array
          if (i === 0) {
            // At root
            obj = [];
            current = obj;
          } else {
            parents[i][parentKeys[i]] = [];
            current = parents[i][parentKeys[i]];
          }
        }
        current[key] = value;
      } else {
        current[key] = value;
      }
    } else {
      // Not last key, prepare the next level
      if (isNumericKey) {
        if (!Array.isArray(current[key])) {
          current[key] = [];
        }
        current = current[key];
      } else {
        if (current[key] === undefined) {
          current[key] = isNextNumeric ? [] : {};
        }
        current = current[key];
      }
    }
  }
}

// Function to check if a key exists in the target object
export function keyExists(obj, path) {
  return getNestedValue(obj, path) !== undefined;
}

// Function to get missing keys
export function getMissingKeys(template, target) {
  const templateKeys = getAllKeys(template);
  const missingKeys = [];

  for (const key of templateKeys) {
    if (!keyExists(target, key)) {
      missingKeys.push(key);
    }
  }

  return missingKeys;
}

// Function to get extra keys (keys in target but not in template)
export function getExtraKeys(template, target) {
  const targetKeys = getAllKeys(target);
  const extraKeys = [];

  for (const key of targetKeys) {
    if (!keyExists(template, key)) {
      extraKeys.push(key);
    }
  }

  return extraKeys;
}

// Function to generate a random delay between min and max values
export function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
