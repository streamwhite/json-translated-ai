import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to locales directory (relative to project root)
const LOCALES_DIR = path.join(__dirname, '../../locales');

// Load English template
const englishTemplate = JSON.parse(
  fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8')
);

// Get all language files
const languageFiles = fs
  .readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
  .sort();

console.log('🔍 Language Key Analysis Tool');
console.log('============================\n');

// Function to recursively get all keys from an object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(obj[key])) {
      // Handle arrays - add keys for each element
      for (let i = 0; i < obj[key].length; i++) {
        const elementKey = `${fullKey}[${i}]`;
        const element = obj[key][i];

        if (typeof element === 'object' && element !== null) {
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

// Function to get value from nested object using dot notation and array indices
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    if (key.includes('[') && key.includes(']')) {
      // Handle array indices like "metrics[0]"
      const arrayKey = key.substring(0, key.indexOf('['));
      const index = parseInt(
        key.substring(key.indexOf('[') + 1, key.indexOf(']'))
      );
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

// Function to check if a key exists in the target object
function keyExists(obj, path) {
  return getNestedValue(obj, path) !== undefined;
}

// Function to get missing keys
function getMissingKeys(template, target) {
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
function getExtraKeys(template, target) {
  const targetKeys = getAllKeys(target);
  const extraKeys = [];

  for (const key of targetKeys) {
    if (!keyExists(template, key)) {
      extraKeys.push(key);
    }
  }

  return extraKeys;
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

// Function to analyze a single language file
function analyzeLanguageFile(lang) {
  const langData = loadLanguageFile(lang);
  const templateKeys = getAllKeys(englishTemplate);
  const langKeys = getAllKeys(langData);

  const missingKeys = getMissingKeys(englishTemplate, langData);
  const extraKeys = getExtraKeys(englishTemplate, langData);

  const completionRate = (
    ((templateKeys.length - missingKeys.length) / templateKeys.length) *
    100
  ).toFixed(1);

  return {
    lang,
    totalKeys: langKeys.length,
    templateKeys: templateKeys.length,
    missingKeys,
    extraKeys,
    completionRate: parseFloat(completionRate),
    isComplete: missingKeys.length === 0,
    hasExtras: extraKeys.length > 0,
  };
}

// Function to check for data type inconsistencies
function checkDataTypes(lang, langData) {
  const templateKeys = getAllKeys(englishTemplate);
  const inconsistencies = [];

  for (const key of templateKeys) {
    const templateValue = getNestedValue(englishTemplate, key);
    const langValue = getNestedValue(langData, key);

    if (langValue !== undefined) {
      const templateType = typeof templateValue;
      const langType = typeof langValue;

      if (templateType !== langType) {
        inconsistencies.push({
          key,
          templateType,
          langType,
          templateValue: String(templateValue).substring(0, 50),
          langValue: String(langValue).substring(0, 50),
        });
      }
    }
  }

  return inconsistencies;
}

// Function to check for empty values
function checkEmptyValues(langData) {
  const keys = getAllKeys(langData);
  const emptyKeys = [];

  for (const key of keys) {
    const value = getNestedValue(langData, key);
    if (value === '' || value === null || value === undefined) {
      emptyKeys.push(key);
    }
  }

  return emptyKeys;
}

// Main analysis
console.log('📊 Overall Statistics');
console.log('===================');
console.log(`📁 Total language files: ${languageFiles.length}`);
console.log(`📋 English template keys: ${getAllKeys(englishTemplate).length}`);
console.log(`🌍 Languages: ${languageFiles.join(', ')}\n`);

// Analyze each language file
const analysis = [];
const summary = {
  complete: [],
  incomplete: [],
  withExtras: [],
  dataTypeIssues: [],
  emptyValues: [],
};

for (const lang of languageFiles) {
  const result = analyzeLanguageFile(lang);
  analysis.push(result);

  if (result.isComplete) {
    summary.complete.push(lang);
  } else {
    summary.incomplete.push(lang);
  }

  if (result.hasExtras) {
    summary.withExtras.push(lang);
  }
}

// Sort by completion rate
analysis.sort((a, b) => b.completionRate - a.completionRate);

// Display summary
console.log('📈 Completion Summary');
console.log('====================');
console.log(
  `✅ Complete languages: ${summary.complete.length}/${languageFiles.length}`
);
console.log(
  `⚠️  Incomplete languages: ${summary.incomplete.length}/${languageFiles.length}`
);
console.log(
  `🔧 Languages with extra keys: ${summary.withExtras.length}/${languageFiles.length}\n`
);

// Display detailed analysis
console.log('📋 Detailed Analysis');
console.log('===================');

for (const result of analysis) {
  const status = result.isComplete ? '✅' : '⚠️';
  const extraStatus = result.hasExtras ? '🔧' : '';

  console.log(
    `${status} ${result.lang}.json (${result.completionRate}% complete)`
  );
  console.log(
    `   📊 Keys: ${result.totalKeys}/${result.templateKeys} (${result.missingKeys.length} missing, ${result.extraKeys.length} extra)`
  );

  if (result.missingKeys.length > 0) {
    console.log(`   ❌ Missing keys: ${result.missingKeys.length}`);
    if (result.missingKeys.length <= 10) {
      result.missingKeys.forEach((key) => console.log(`      - ${key}`));
    } else {
      console.log(`      (showing first 10 of ${result.missingKeys.length})`);
      result.missingKeys
        .slice(0, 10)
        .forEach((key) => console.log(`      - ${key}`));
    }
  }

  if (result.extraKeys.length > 0) {
    console.log(`   🔧 Extra keys: ${result.extraKeys.length}`);
    if (result.extraKeys.length <= 5) {
      result.extraKeys.forEach((key) => console.log(`      + ${key}`));
    } else {
      console.log(`      (showing first 5 of ${result.extraKeys.length})`);
      result.extraKeys
        .slice(0, 5)
        .forEach((key) => console.log(`      + ${key}`));
    }
  }

  // Check for data type inconsistencies
  const langData = loadLanguageFile(result.lang);
  const dataTypeIssues = checkDataTypes(result.lang, langData);
  if (dataTypeIssues.length > 0) {
    console.log(`   🔄 Data type issues: ${dataTypeIssues.length}`);
    dataTypeIssues.slice(0, 3).forEach((issue) => {
      console.log(
        `      ${issue.key}: ${issue.templateType} vs ${issue.langType}`
      );
    });
    summary.dataTypeIssues.push(result.lang);
  }

  // Check for empty values
  const emptyValues = checkEmptyValues(langData);
  if (emptyValues.length > 0) {
    console.log(`   🚫 Empty values: ${emptyValues.length}`);
    emptyValues.slice(0, 3).forEach((key) => console.log(`      - ${key}`));
    summary.emptyValues.push(result.lang);
  }

  console.log('');
}

// Generate recommendations
console.log('💡 Recommendations');
console.log('==================');

if (summary.incomplete.length > 0) {
  console.log(
    `🔧 Run translation sync for incomplete languages: ${summary.incomplete.join(
      ', '
    )}`
  );
}

if (summary.withExtras.length > 0) {
  console.log(`🧹 Clean up extra keys in: ${summary.withExtras.join(', ')}`);
}

if (summary.dataTypeIssues.length > 0) {
  console.log(
    `🔄 Fix data type inconsistencies in: ${summary.dataTypeIssues.join(', ')}`
  );
}

if (summary.emptyValues.length > 0) {
  console.log(`🚫 Fix empty values in: ${summary.emptyValues.join(', ')}`);
}

// Export detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalLanguages: languageFiles.length,
    completeLanguages: summary.complete.length,
    incompleteLanguages: summary.incomplete.length,
    languagesWithExtras: summary.withExtras.length,
    languagesWithDataTypeIssues: summary.dataTypeIssues.length,
    languagesWithEmptyValues: summary.emptyValues.length,
  },
  analysis: analysis.map((result) => ({
    lang: result.lang,
    completionRate: result.completionRate,
    totalKeys: result.totalKeys,
    templateKeys: result.templateKeys,
    missingKeys: result.missingKeys,
    extraKeys: result.extraKeys,
    isComplete: result.isComplete,
    hasExtras: result.hasExtras,
  })),
  recommendations: {
    incompleteLanguages: summary.incomplete,
    languagesWithExtras: summary.withExtras,
    languagesWithDataTypeIssues: summary.dataTypeIssues,
    languagesWithEmptyValues: summary.emptyValues,
  },
};

const reportPath = path.join(__dirname, 'language-analysis-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

console.log('\n🎉 Language key analysis completed!');
