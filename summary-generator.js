import {
  getAllKeys,
  getMissingKeys,
  loadLanguageFile,
} from './file-processor.js';

export function generateFinalSummary(
  localesDir,
  languageFiles,
  englishTemplate
) {
  console.log('\n=== Final Summary ===');
  const templateKeys = getAllKeys(englishTemplate);

  for (const lang of languageFiles) {
    const langFile = loadLanguageFile(localesDir, lang);
    const langKeys = getAllKeys(langFile);

    if (langKeys.length < templateKeys.length) {
      console.log(
        `⚠️  ${lang}.json: ${langKeys.length}/${templateKeys.length} keys (${
          templateKeys.length - langKeys.length
        } missing)`
      );
    } else {
      console.log(
        `✅ ${lang}.json: ${langKeys.length}/${templateKeys.length} keys (complete)`
      );
    }
  }
}

export function showMissingKeyAnalysis(
  localesDir,
  languageFiles,
  englishTemplate
) {
  console.log('\n=== Detailed Missing Key Analysis ===');

  for (const lang of languageFiles) {
    const missingKeys = getMissingKeys(
      englishTemplate,
      loadLanguageFile(localesDir, lang)
    );
    if (missingKeys.length > 0) {
      missingKeys.forEach((key) => console.log(`  - ${key}`));
    }
  }
}

export function generateProcessingReport(results) {
  console.log('\n=== Processing Report ===');

  let totalTranslated = 0;
  let totalErrors = 0;

  for (const [lang, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${lang}: ${result.error}`);
      totalErrors++;
    } else {
      console.log(
        `✅ ${lang}: ${result.translatedKeys} keys translated, ${result.extraKeys.length} extra keys`
      );
      totalTranslated += result.translatedKeys;
    }
  }

  console.log(
    `\n📊 Summary: ${totalTranslated} total keys translated, ${totalErrors} errors`
  );
  return { totalTranslated, totalErrors };
}
