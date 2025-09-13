#!/usr/bin/env node

import { loadLanguageStructures } from './file-processor.js';
import { validateLanguageStructures } from './folder-structure-utils.js';

const TEST_LOCALES_DIR = './test-4letter';

async function test4LetterSupport() {
  console.log('🧪 Testing 4-Letter Language Code Support\n');

  try {
    // Test 1: Discover language structures with 4-letter codes
    console.log('1️⃣ Testing 4-letter language structure discovery...');
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
      `   ${templateStructure.files[0]?.baseName || 'en-GB'}: ${
        templateStructure.files.length
      } files`
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

    // Test 3: Verify 4-letter codes are properly detected
    console.log('\n3️⃣ Testing 4-letter language code detection...');
    const detectedLanguages = Object.keys(languageStructures);
    const fourLetterCodes = detectedLanguages.filter((lang) =>
      lang.includes('-')
    );

    console.log(`   Detected languages: ${detectedLanguages.join(', ')}`);
    console.log(`   4-letter codes: ${fourLetterCodes.join(', ')}`);

    if (fourLetterCodes.length > 0) {
      console.log('✅ 4-letter language codes detected successfully');
    } else {
      console.log('⚠️  No 4-letter language codes detected');
    }

    console.log(
      '\n✅ 4-letter language code support test completed successfully!'
    );
    console.log('\n📋 Summary:');
    console.log(`   - Template files: ${templateStructure.files.length}`);
    console.log(
      `   - Target languages: ${Object.keys(languageStructures).length - 1}`
    );
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
test4LetterSupport().catch(console.error);
