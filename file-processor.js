import fs from 'fs';
import path from 'path';

export function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(obj[key])) {
      for (let i = 0; i < obj[key].length; i++) {
        const elementKey = `${fullKey}.${i}`;
        const element = obj[key][i];

        if (typeof element === 'object' && element !== null) {
          keys.push(...getAllKeys(element, elementKey));
        } else {
          keys.push(elementKey);
        }
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

export function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    if (key.includes('[') && key.includes(']')) {
      const arrayKey = key.substring(0, key.indexOf('['));
      const index = parseInt(
        key.substring(key.indexOf('[') + 1, key.indexOf(']'))
      );
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();

  const target = keys.reduce((current, key) => {
    if (key.includes('[') && key.includes(']')) {
      const arrayKey = key.substring(0, key.indexOf('['));
      const index = parseInt(
        key.substring(key.indexOf('[') + 1, key.indexOf(']'))
      );

      if (!current[arrayKey]) current[arrayKey] = [];
      if (!current[arrayKey][index]) {
        current[arrayKey][index] = {};
      }
      return current[arrayKey][index];
    } else {
      if (!current[key]) current[key] = {};
      return current[key];
    }
  }, obj);

  if (lastKey.includes('[') && lastKey.includes(']')) {
    const arrayKey = lastKey.substring(0, lastKey.indexOf('['));
    const index = parseInt(
      lastKey.substring(lastKey.indexOf('[') + 1, lastKey.indexOf(']'))
    );

    if (!target[arrayKey]) target[arrayKey] = [];
    target[arrayKey][index] = value;
  } else {
    target[lastKey] = value;
  }
}

export function keyExists(obj, path) {
  return getNestedValue(obj, path) !== undefined;
}

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

export function loadLanguageFile(localesDir, lang) {
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.log(`Error reading ${lang}.json:`, error.message);
    return {};
  }
}

export function saveLanguageFile(localesDir, lang, data) {
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.log(`Error writing ${lang}.json:`, error.message);
    return false;
  }
}

export function validateLocalesDirectory(localesDir) {
  if (!fs.existsSync(localesDir)) {
    throw new Error(`Locales directory not found: ${localesDir}`);
  }

  const enJsonPath = path.join(localesDir, 'en.json');
  if (!fs.existsSync(enJsonPath)) {
    throw new Error(`en.json not found in: ${localesDir}`);
  }

  return true;
}

export function loadEnglishTemplate(localesDir) {
  const enJsonPath = path.join(localesDir, 'en.json');
  try {
    return JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to load English template: ${error.message}`);
  }
}

export function findKeysWithValue(obj, targetValue, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...findKeysWithValue(value, targetValue, currentKey));
    } else if (typeof value === 'string') {
      if (value.toLowerCase() === targetValue.toLowerCase()) {
        keys.push(currentKey);
      }
    }
  }

  return keys;
}
