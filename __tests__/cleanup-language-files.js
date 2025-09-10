/*
This script is used to clean up the language files by removing extra keys and fixing metrics type issues.
*/
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../../locales');
const englishTemplate = JSON.parse(
  fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8')
);

// Get all language files except English
const languageFiles = fs
  .readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json') && file !== 'en.json')
  .map((file) => file.replace('.json', ''));

// Function to recursively get all keys from an object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Function to get value from nested object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to set value in nested object using dot notation
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Function to delete value from nested object using dot notation
function deleteNestedValue(obj, path) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) return null;
    return current[key];
  }, obj);

  if (target && target.hasOwnProperty(lastKey)) {
    delete target[lastKey];
    return true;
  }
  return false;
}

// Function to load a language file
function loadLanguageFile(lang) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.log(`❌ Error reading ${lang}.json:`, error.message);
    return {};
  }
}

// Function to save a language file
function saveLanguageFile(lang, data) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.log(`❌ Error saving ${lang}.json:`, error.message);
    return false;
  }
}

// Function to get extra keys (keys in target but not in template)
function getExtraKeys(template, target) {
  const targetKeys = getAllKeys(target);
  const extraKeys = [];

  for (const key of targetKeys) {
    if (!getNestedValue(template, key)) {
      extraKeys.push(key);
    }
  }

  return extraKeys;
}

// Helper function to check if a key is a metrics key
function isMetricsKey(key) {
  return key.includes('metrics');
}

// Helper function to check if value is string instead of array
function isStringInsteadOfArray(templateValue, langValue) {
  return (
    langValue !== undefined &&
    Array.isArray(templateValue) &&
    typeof langValue === 'string'
  );
}

// Function to find metrics keys that are strings instead of arrays
function findMetricsTypeIssues(langData) {
  const templateKeys = getAllKeys(englishTemplate);
  const issues = [];

  for (const key of templateKeys) {
    if (isMetricsKey(key)) {
      const templateValue = getNestedValue(englishTemplate, key);
      const langValue = getNestedValue(langData, key);

      if (isStringInsteadOfArray(templateValue, langValue)) {
        issues.push({
          key,
          templateType: 'array',
          langType: 'string',
          langValue: langValue.substring(0, 100),
        });
      }
    }
  }

  return issues;
}

// Helper function to convert string to array based on delimiters
function convertStringToArray(langValue) {
  if (langValue.includes(',')) {
    return langValue.split(',').map((item) => item.trim());
  } else if (langValue.includes('|')) {
    return langValue.split('|').map((item) => item.trim());
  } else if (langValue.includes(';')) {
    return langValue.split(';').map((item) => item.trim());
  } else {
    // If no clear delimiter, treat as single item array
    return [langValue.trim()];
  }
}

// Function to fix metrics type issues
function fixMetricsTypeIssues(langData) {
  const templateKeys = getAllKeys(englishTemplate);
  const fixes = [];

  for (const key of templateKeys) {
    if (isMetricsKey(key)) {
      const templateValue = getNestedValue(englishTemplate, key);
      const langValue = getNestedValue(langData, key);

      if (isStringInsteadOfArray(templateValue, langValue)) {
        const arrayValue = convertStringToArray(langValue);
        setNestedValue(langData, key, arrayValue);
        fixes.push({
          key,
          oldValue: langValue,
          newValue: arrayValue,
        });
      }
    }
  }

  return fixes;
}

// Function to remove extra keys from language data
function removeExtraKeys(langData, changes) {
  const extraKeys = getExtraKeys(englishTemplate, langData);
  if (extraKeys.length > 0) {
    console.log(`  🗑️  Found ${extraKeys.length} extra keys to remove`);

    for (const key of extraKeys) {
      if (deleteNestedValue(langData, key)) {
        changes.extraKeysRemoved++;
        console.log(`    ✅ Removed: ${key}`);
      }
    }
  }
}

// Function to fix metrics type issues in language data
function fixMetricsIssues(langData, changes) {
  const metricsIssues = findMetricsTypeIssues(langData);
  if (metricsIssues.length > 0) {
    console.log(
      `  🔄 Found ${metricsIssues.length} metrics type issues to fix`
    );

    const fixes = fixMetricsTypeIssues(langData);
    changes.metricsFixed = fixes.length;

    for (const fix of fixes) {
      console.log(`    ✅ Fixed: ${fix.key} (string → array)`);
    }
  }
}

// Function to save changes if any were made
function saveChangesIfNeeded(lang, langData, changes) {
  changes.totalChanges = changes.extraKeysRemoved + changes.metricsFixed;

  if (changes.totalChanges > 0) {
    if (saveLanguageFile(lang, langData)) {
      console.log(
        `  💾 Saved ${lang}.json with ${changes.totalChanges} changes`
      );
    } else {
      console.log(`  ❌ Failed to save ${lang}.json`);
      return null;
    }
  } else {
    console.log(`  ✅ ${lang}.json is already clean`);
  }

  return changes;
}

// Function to clean up a single language file
function cleanupLanguageFile(lang) {
  console.log(`\n🔧 Cleaning up ${lang}.json...`);

  const langData = loadLanguageFile(lang);
  const originalData = JSON.parse(JSON.stringify(langData)); // Deep copy for comparison

  let changes = {
    extraKeysRemoved: 0,
    metricsFixed: 0,
    totalChanges: 0,
  };

  removeExtraKeys(langData, changes);
  fixMetricsIssues(langData, changes);

  return saveChangesIfNeeded(lang, langData, changes);
}

// Helper function to initialize results object
function initializeResults() {
  return {
    totalFiles: languageFiles.length,
    filesCleaned: 0,
    totalExtraKeysRemoved: 0,
    totalMetricsFixed: 0,
    totalChanges: 0,
    errors: [],
  };
}

// Helper function to process a single language file
function processLanguageFile(lang, results) {
  try {
    const changes = cleanupLanguageFile(lang);
    if (changes) {
      results.filesCleaned++;
      results.totalExtraKeysRemoved += changes.extraKeysRemoved;
      results.totalMetricsFixed += changes.metricsFixed;
      results.totalChanges += changes.totalChanges;
    }
  } catch (error) {
    console.log(`❌ Error processing ${lang}.json:`, error.message);
    results.errors.push({ lang, error: error.message });
  }
}

// Helper function to display summary
function displaySummary(results) {
  console.log('\n📈 Cleanup Summary');
  console.log('==================');
  console.log(`📁 Total files processed: ${results.totalFiles}`);
  console.log(`✅ Files cleaned: ${results.filesCleaned}`);
  console.log(`🗑️  Extra keys removed: ${results.totalExtraKeysRemoved}`);
  console.log(`🔄 Metrics type issues fixed: ${results.totalMetricsFixed}`);
  console.log(`📊 Total changes made: ${results.totalChanges}`);

  if (results.errors.length > 0) {
    console.log(`❌ Errors encountered: ${results.errors.length}`);
    results.errors.forEach((error) => {
      console.log(`  - ${error.lang}: ${error.error}`);
    });
  }
}

// Helper function to generate cleanup report
function generateCleanupReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: results,
    details: {
      extraKeysRemoved: results.totalExtraKeysRemoved,
      metricsFixed: results.totalMetricsFixed,
      filesProcessed: languageFiles,
      errors: results.errors,
    },
  };

  const reportPath = path.join(__dirname, 'cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Cleanup report saved to: ${reportPath}`);
}

// Helper function to run post-cleanup analysis
function runPostCleanupAnalysis() {
  console.log('\n🔍 Running post-cleanup analysis...');
  const { execSync } = require('child_process');
  try {
    execSync('node i18n-scripts/sync-translation/check-language-keys.js', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.log('⚠️  Post-cleanup analysis failed:', error.message);
  }
}

// Main cleanup process
console.log('📊 Starting cleanup process...');
console.log(`📁 Processing ${languageFiles.length} language files\n`);

const results = initializeResults();

for (const lang of languageFiles) {
  processLanguageFile(lang, results);
}

displaySummary(results);
generateCleanupReport(results);

console.log('\n🎉 Language files cleanup completed!');

runPostCleanupAnalysis();
