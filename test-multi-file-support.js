#!/usr/bin/env node

import { loadLanguageStructures } from './file-processor.js';
import { validateLanguageStructures } from './folder-structure-utils.js';

const TEST_LOCALES_DIR = './test-multi-file';

async function testMultiFileSupport() {
  console.log('🧪 Testing Multi-File Translation Support\n');

  try {
    // Test 1: Discover language structures
    console.log('1️⃣ Testing language structure discovery...');
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
    console.log(`   en: ${templateStructure.files.length} files`);
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

    // Test 3: Test file processing (without actual translation)
    console.log('\n3️⃣ Testing file processing logic...');

    // Create empty target language files for testing
    const fs = await import('fs');
    const path = await import('path');

    for (const [langCode, langStructure] of Object.entries(
      languageStructures
    )) {
      if (langCode !== 'en') {
        console.log(`   Creating empty files for ${langCode}...`);

        for (const fileInfo of langStructure.files) {
          const targetDir = path.join(TEST_LOCALES_DIR, langCode);
          const targetPath = path.join(targetDir, fileInfo.relativePath);

          // Ensure target directory exists
          const targetDirPath = path.dirname(targetPath);
          if (!fs.existsSync(targetDirPath)) {
            fs.mkdirSync(targetDirPath, { recursive: true });
          }

          // Create empty JSON file
          fs.writeFileSync(targetPath, '{}', 'utf8');
          console.log(`     Created: ${langCode}/${fileInfo.relativePath}`);
        }
      }
    }

    console.log('\n✅ Multi-file support test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Template files: ${templateStructure.files.length}`);
    console.log(
      `   - Target languages: ${Object.keys(languageStructures).length - 1}`
    );
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
testMultiFileSupport().catch(console.error);
