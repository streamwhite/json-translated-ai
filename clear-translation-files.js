/*
This script is used to clear the translation files by replacing the content with an empty JSON object.
*/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to locales directory
const LOCALES_DIR = path.join(__dirname, '../../locales');

// Get all language files except English
const languageFiles = fs
  .readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json') && file !== 'en.json')
  .map((file) => file.replace('.json', ''))
  .sort();

console.log('🗑️  Clear Translation Files Tool');
console.log('================================\n');

// Function to clear a language file
function clearLanguageFile(lang) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);

  try {
    // Create empty JSON object
    const emptyData = {};

    // Write empty JSON to file
    fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2), 'utf8');

    console.log(`✅ Cleared ${lang}.json`);
    return true;
  } catch (error) {
    console.log(`❌ Error clearing ${lang}.json:`, error.message);
    return false;
  }
}

// Main clearing process
console.log('📊 Starting file clearing process...');
console.log(`📁 Processing ${languageFiles.length} language files\n`);

const results = {
  totalFiles: languageFiles.length,
  filesCleared: 0,
  errors: [],
};

for (const lang of languageFiles) {
  try {
    const success = clearLanguageFile(lang);
    if (success) {
      results.filesCleared++;
    } else {
      results.errors.push({ lang, error: 'Failed to clear file' });
    }
  } catch (error) {
    console.log(`❌ Error processing ${lang}.json:`, error.message);
    results.errors.push({ lang, error: error.message });
  }
}

// Summary
console.log('\n📈 Clearing Summary');
console.log('==================');
console.log(`📁 Total files processed: ${results.totalFiles}`);
console.log(`✅ Files cleared: ${results.filesCleared}`);
console.log(`❌ Errors: ${results.errors.length}`);

if (results.errors.length > 0) {
  console.log('\n❌ Errors encountered:');
  results.errors.forEach((error) => {
    console.log(`  - ${error.lang}: ${error.error}`);
  });
}

// Verify English file is untouched
const englishPath = path.join(LOCALES_DIR, 'en.json');
if (fs.existsSync(englishPath)) {
  const englishContent = fs.readFileSync(englishPath, 'utf8');
  const englishData = JSON.parse(englishContent);
  const englishKeys = Object.keys(englishData).length;
  console.log(
    `\n✅ English file (en.json) preserved with ${englishKeys} top-level keys`
  );
} else {
  console.log('\n⚠️  English file (en.json) not found');
}

// Generate clearing report
const report = {
  timestamp: new Date().toISOString(),
  summary: results,
  details: {
    filesProcessed: languageFiles,
    errors: results.errors,
  },
};

const reportPath = path.join(__dirname, 'clearing-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\n📄 Clearing report saved to: ${reportPath}`);

console.log('\n🎉 Translation files clearing completed!');
console.log('📝 All translation files now contain empty JSON objects {}');
console.log('🔧 Ready for fresh translation process');
