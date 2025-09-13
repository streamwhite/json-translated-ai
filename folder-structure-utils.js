import fs from 'fs';
import path from 'path';

const SUPPORTED_FILE_EXTENSIONS = ['.json'];

/**
 * Scans a directory recursively to find all JSON files
 * @param {string} dirPath - Directory to scan
 * @param {string} relativePath - Current relative path (for recursion)
 * @returns {Array} Array of file objects with path and relativePath
 */
export function scanDirectoryForJsonFiles(dirPath, relativePath = '') {
  const files = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const currentRelativePath = relativePath
        ? path.join(relativePath, entry.name)
        : entry.name;

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        files.push(...scanDirectoryForJsonFiles(fullPath, currentRelativePath));
      } else if (
        entry.isFile() &&
        SUPPORTED_FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
      ) {
        files.push({
          fullPath,
          relativePath: currentRelativePath,
          fileName: entry.name,
          baseName: path.parse(entry.name).name,
        });
      }
    }
  } catch (error) {
    console.warn(
      `Warning: Could not scan directory ${dirPath}:`,
      error.message
    );
  }

  return files;
}

/**
 * Discovers language folders and their file structures
 * @param {string} localesDir - Base locales directory
 * @param {string} templateLanguage - Template language code (default: 'en')
 * @returns {Object} Language structure mapping
 */
export function discoverLanguageStructures(
  localesDir,
  templateLanguage = 'en'
) {
  const languageStructures = {};

  try {
    const entries = fs.readdirSync(localesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const langCode = entry.name;
        const langDir = path.join(localesDir, langCode);
        const jsonFiles = scanDirectoryForJsonFiles(langDir);

        if (jsonFiles.length > 0) {
          languageStructures[langCode] = {
            directory: langDir,
            files: jsonFiles,
          };
        }
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Handle single file languages (legacy support)
        const langCode = path.parse(entry.name).name;
        if (langCode !== templateLanguage) {
          languageStructures[langCode] = {
            directory: localesDir,
            files: [
              {
                fullPath: path.join(localesDir, entry.name),
                relativePath: entry.name,
                fileName: entry.name,
                baseName: langCode,
              },
            ],
          };
        }
      }
    }
  } catch (error) {
    throw new Error(`Error discovering language structures: ${error.message}`);
  }

  return languageStructures;
}

/**
 * Gets the template language structure
 * @param {string} localesDir - Base locales directory
 * @param {string} templateLanguage - Template language code (default: 'en')
 * @returns {Object} Template structure
 */
export function getTemplateStructure(localesDir, templateLanguage = 'en') {
  // First try to find the specified template language
  const templateVariants = findTemplateVariants(localesDir, templateLanguage);

  if (templateVariants.length === 0) {
    throw new Error(
      `No ${templateLanguage} template language found in ${localesDir}. Expected: ${templateLanguage} or similar variants.`
    );
  }

  // Use the first template variant found
  const templateLang = templateVariants[0];
  const templateDir = path.join(localesDir, templateLang);

  // Check if template is a folder
  if (fs.existsSync(templateDir) && fs.statSync(templateDir).isDirectory()) {
    const files = scanDirectoryForJsonFiles(templateDir);
    return {
      directory: templateDir,
      files: files,
      languageCode: templateLang,
    };
  }

  // Fallback to single file
  const templateFile = path.join(localesDir, `${templateLang}.json`);
  if (fs.existsSync(templateFile)) {
    return {
      directory: localesDir,
      files: [
        {
          fullPath: templateFile,
          relativePath: `${templateLang}.json`,
          fileName: `${templateLang}.json`,
          baseName: templateLang,
        },
      ],
      languageCode: templateLang,
    };
  }

  throw new Error(
    `Template language (${templateLang}) not found in ${localesDir}`
  );
}

/**
 * Finds template language variants in the locales directory
 * @param {string} localesDir - Base locales directory
 * @param {string} templateLanguage - Template language code
 * @returns {Array} Array of template language codes found
 */
function findTemplateVariants(localesDir, templateLanguage) {
  const templateVariants = [];

  try {
    const entries = fs.readdirSync(localesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const langCode = entry.name;
        // Check if it's a template language variant
        if (
          langCode === templateLanguage ||
          langCode.startsWith(templateLanguage + '-')
        ) {
          templateVariants.push(langCode);
        }
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const langCode = path.parse(entry.name).name;
        // Check if it's a template language variant
        if (
          langCode === templateLanguage ||
          langCode.startsWith(templateLanguage + '-')
        ) {
          templateVariants.push(langCode);
        }
      }
    }
  } catch (error) {
    console.warn(
      `Warning: Could not scan directory ${localesDir}:`,
      error.message
    );
  }

  // Sort to prioritize exact match over variants
  return templateVariants.sort((a, b) => {
    if (a === templateLanguage) return -1;
    if (b === templateLanguage) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Finds English language variants in the locales directory (legacy)
 * @param {string} localesDir - Base locales directory
 * @returns {Array} Array of English language codes found
 */
function findEnglishVariants(localesDir) {
  return findTemplateVariants(localesDir, 'en');
}

/**
 * Finds corresponding template file for a target language file
 * @param {Object} targetFile - Target file object
 * @param {Object} templateStructure - Template structure
 * @returns {Object|null} Corresponding template file or null
 */
export function findCorrespondingTemplateFile(targetFile, templateStructure) {
  // For single file languages, use the main template
  if (templateStructure.files.length === 1) {
    return templateStructure.files[0];
  }

  // For multi-file languages, find matching file by relative path
  const templateFile = templateStructure.files.find(
    (file) => file.relativePath === targetFile.relativePath
  );

  return templateFile || null;
}

/**
 * Creates target file path maintaining folder structure
 * @param {string} localesDir - Base locales directory
 * @param {string} langCode - Target language code
 * @param {string} relativePath - Relative path from template
 * @returns {string} Full target file path
 */
export function createTargetFilePath(localesDir, langCode, relativePath) {
  const targetDir = path.join(localesDir, langCode);
  const targetPath = path.join(targetDir, relativePath);

  // Ensure target directory exists
  const targetDirPath = path.dirname(targetPath);
  if (!fs.existsSync(targetDirPath)) {
    fs.mkdirSync(targetDirPath, { recursive: true });
  }

  return targetPath;
}

/**
 * Validates that all target languages have corresponding template files
 * @param {Object} languageStructures - Language structures
 * @param {Object} templateStructure - Template structure
 * @returns {Object} Validation results
 */
export function validateLanguageStructures(
  languageStructures,
  templateStructure
) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const [langCode, langStructure] of Object.entries(languageStructures)) {
    for (const targetFile of langStructure.files) {
      const templateFile = findCorrespondingTemplateFile(
        targetFile,
        templateStructure
      );

      if (!templateFile) {
        validation.valid = false;
        validation.errors.push(
          `No template file found for ${langCode}/${targetFile.relativePath}`
        );
      }
    }
  }

  return validation;
}
