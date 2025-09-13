import fs from 'fs';
import path from 'path';
import {
  createTargetFilePath,
  discoverLanguageStructures,
  findCorrespondingTemplateFile,
  getTemplateStructure,
} from './folder-structure-utils.js';

export function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    // Skip __updated_keys__ arrays as they are metadata, not actual content keys
    if (key === '__updated_keys__') {
      continue;
    }

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

/**
 * Gets all keys that need translation (missing + updated keys)
 * @param {Object} template - Template object
 * @param {Object} target - Target language object
 * @returns {Object} Object containing missingKeys, updatedKeys, and keysToTranslate
 */
export function getKeysToTranslate(template, target) {
  const missingKeys = getMissingKeys(template, target);
  const updatedKeys = getUpdatedKeys(template);

  // Combine missing and updated keys, removing duplicates
  const keysToTranslate = [...new Set([...missingKeys, ...updatedKeys])];

  return {
    missingKeys,
    updatedKeys,
    keysToTranslate,
    totalKeys: keysToTranslate.length,
  };
}

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

export function loadLanguageFile(localesDir, lang, filePath = null) {
  const targetPath = filePath || path.join(localesDir, `${lang}.json`);
  try {
    return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  } catch (error) {
    console.log(`Error reading ${targetPath}:`, error.message);
    return {};
  }
}

export function saveLanguageFile(localesDir, lang, data, filePath = null) {
  const targetPath = filePath || path.join(localesDir, `${lang}.json`);
  try {
    // Ensure locales directory exists before writing
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.log(`Error writing ${targetPath}:`, error.message);
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

export function loadEnglishTemplate(localesDir, templateLanguage = 'en') {
  const templateJsonPath = path.join(localesDir, `${templateLanguage}.json`);
  try {
    return JSON.parse(fs.readFileSync(templateJsonPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Failed to load ${templateLanguage} template: ${error.message}`
    );
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

/**
 * Loads all language structures from the locales directory
 * @param {string} localesDir - Base locales directory
 * @returns {Object} Language structures and template structure
 */
export function loadLanguageStructures(localesDir, templateLanguage = 'en') {
  const languageStructures = discoverLanguageStructures(
    localesDir,
    templateLanguage
  );
  const templateStructure = getTemplateStructure(localesDir, templateLanguage);

  return {
    languageStructures,
    templateStructure,
  };
}

/**
 * Loads a specific language file with its template
 * @param {string} localesDir - Base locales directory
 * @param {string} langCode - Language code
 * @param {Object} fileInfo - File information object
 * @param {Object} templateStructure - Template structure
 * @returns {Object} Language data and template data
 */
export function loadLanguageFileWithTemplate(
  localesDir,
  langCode,
  fileInfo,
  templateStructure
) {
  const templateFile = findCorrespondingTemplateFile(
    fileInfo,
    templateStructure
  );

  if (!templateFile) {
    throw new Error(
      `No template file found for ${langCode}/${fileInfo.relativePath}`
    );
  }

  const targetFilePath = createTargetFilePath(
    localesDir,
    langCode,
    fileInfo.relativePath
  );
  const languageData = loadLanguageFile(localesDir, langCode, targetFilePath);
  const templateData = loadLanguageFile(
    localesDir,
    'en',
    templateFile.fullPath
  );

  return {
    languageData,
    templateData,
    targetFilePath,
    templateFilePath: templateFile.fullPath,
  };
}

/**
 * Saves language file data to the correct path
 * @param {string} localesDir - Base locales directory
 * @param {string} langCode - Language code
 * @param {Object} data - Language data to save
 * @param {Object} fileInfo - File information object
 * @returns {boolean} Success status
 */
export function saveLanguageFileWithPath(localesDir, langCode, data, fileInfo) {
  const targetFilePath = createTargetFilePath(
    localesDir,
    langCode,
    fileInfo.relativePath
  );
  return saveLanguageFile(localesDir, langCode, data, targetFilePath);
}
