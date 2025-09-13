#!/usr/bin/env node

import { loadLanguageStructures } from './file-processor.js';
import { validateLanguageStructures } from './folder-structure-utils.js';

const TEST_LOCALES_DIR = './test-mixed';

async function testMixedSupport() {
  console.log('🧪 Testing Mixed 2-Letter and 4-Letter Language Code Support\n');

  try {
    // Test 1: Discover language structures with mixed codes
    console.log('1️⃣ Testing mixed language structure discovery...');
    const { languageStructures, templateStructure } =
      loadLanguageStructures(TEST_LOCALES_DIR);

    console.log('📁 Discovered language structures:');
    Object.entries(languageStructures).forEach(([lang, structure]) => {
      console.log(`   ${lang}: ${structure.files.length} files`);
      structure.files.forEach((file) => {
        console.log(`     - ${file.relativePath}`);
      });
    });

    console.log('\n📄 Template structure:');
    console.log(
      `   ${
        templateStructure.languageCode ||
        templateStructure.files[0]?.baseName ||
        'en'
      }: ${templateStructure.files.length} files`
    );
    templateStructure.files.forEach((file) => {
      console.log(`     - ${file.relativePath}`);
    });

    // Test 2: Validate structures
    console.log('\n2️⃣ Testing structure validation...');
    const validation = validateLanguageStructures(
      languageStructures,
      templateStructure
    );

    if (validation.valid) {
      console.log('✅ Language structure validation passed');
    } else {
      console.log('❌ Language structure validation failed:');
      validation.errors.forEach((error) => console.log(`   ${error}`));
      return;
    }

    // Test 3: Verify mixed codes are properly detected
    console.log('\n3️⃣ Testing mixed language code detection...');
    const detectedLanguages = Object.keys(languageStructures);
    const twoLetterCodes = detectedLanguages.filter(
      (lang) => !lang.includes('-')
    );
    const fourLetterCodes = detectedLanguages.filter((lang) =>
      lang.includes('-')
    );

    console.log(`   Detected languages: ${detectedLanguages.join(', ')}`);
    console.log(`   2-letter codes: ${twoLetterCodes.join(', ')}`);
    console.log(`   4-letter codes: ${fourLetterCodes.join(', ')}`);

    // Test 4: Verify template priority (en should be preferred over en-GB)
    console.log('\n4️⃣ Testing template language priority...');
    const templateLang =
      templateStructure.languageCode ||
      templateStructure.files[0]?.baseName ||
      'unknown';
    console.log(`   Selected template: ${templateLang}`);

    if (templateLang === 'en') {
      console.log('✅ Correctly prioritized "en" over "en-GB"');
    } else if (templateLang === 'en-GB') {
      console.log('⚠️  Using "en-GB" as template (no "en" found)');
    } else {
      console.log(`ℹ️  Using "${templateLang}" as template`);
    }

    console.log(
      '\n✅ Mixed language code support test completed successfully!'
    );
    console.log('\n📋 Summary:');
    console.log(`   - Template files: ${templateStructure.files.length}`);
    console.log(
      `   - Target languages: ${Object.keys(languageStructures).length - 1}`
    );
    console.log(`   - 2-letter codes: ${twoLetterCodes.length}`);
    console.log(`   - 4-letter codes: ${fourLetterCodes.length}`);
    console.log(
      `   - Total files to process: ${
        Object.values(languageStructures).reduce(
          (sum, lang) => sum + lang.files.length,
          0
        ) - templateStructure.files.length
      }`
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testMixedSupport().catch(console.error);
