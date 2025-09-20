import { translateBatch } from './batch-translator.js';
import { applyCachedTranslations } from './cache-applier.js';
import { OPTIMIZATION_CONFIG } from './config.js';
import {
  getAllKeys,
  getExtraKeys,
  getKeysToTranslate,
  getNestedValue,
  keyExists,
  loadLanguageFile,
  saveLanguageFile,
  setNestedValue,
} from './file-processor.js';
import {
  initializeBatchProgress,
  startTranslationSpinner,
  stopTranslationSpinner,
  updateBatchProgress,
} from './progress-utils.js';
import { translateText } from './translation-core.js';
import { translationFailureReporter } from './translation-failure-reporter.js';
import { getRandomDelay } from './translation-utils.js';

export async function processLanguageFileOptimized(
  lang,
  localesDir,
  englishTemplate,
  model
) {
  console.log(`\n=== Processing ${lang}.json (Optimized) ===`);

  let targetLang = loadLanguageFile(localesDir, lang);

  const appliedCount = await applyCachedTranslations(
    targetLang,
    englishTemplate,
    lang
  );
  if (appliedCount > 0) {
    console.log(
      `📊 Applied ${appliedCount} cached translations for ${lang}.json`
    );
  }

  const keysInfo = getKeysToTranslate(englishTemplate, targetLang);
  const extraKeys = getExtraKeys(englishTemplate, targetLang);

  console.log(
    `📊 Total keys in template: ${getAllKeys(englishTemplate).length}`
  );
  console.log(`📊 Missing keys to translate: ${keysInfo.missingKeys.length}`);
  console.log(`📊 Updated keys to translate: ${keysInfo.updatedKeys.length}`);
  console.log(`📊 Total keys to translate: ${keysInfo.totalKeys}`);
  console.log(`📊 Extra keys: ${extraKeys.length}`);

  if (appliedCount > 0) {
    saveLanguageFile(localesDir, lang, targetLang);
    console.log(
      `✅ Updated ${lang}.json with ${appliedCount} cached translations`
    );
  }

  if (keysInfo.totalKeys > 0) {
    console.log('🔍 Translating missing and updated keys');
    await processAllBatches(
      keysInfo.keysToTranslate,
      englishTemplate,
      targetLang,
      lang,
      model
    );

    saveLanguageFile(localesDir, lang, targetLang);
    console.log(
      `✅ Updated ${lang}.json with ${keysInfo.totalKeys} translated keys`
    );
  } else {
    console.log(`✅ ${lang}.json is complete`);
  }

  if (extraKeys.length > 0) {
    console.log('⚠️  Extra keys (not in English template):', extraKeys);
  }

  // Ensure any active spinner is stopped
  stopTranslationSpinner(true, '');

  return { translatedKeys: keysInfo.totalKeys, extraKeys };
}

async function processAllBatches(
  missingKeys,
  englishTemplate,
  targetLang,
  lang,
  model
) {
  const batches = createBatches(missingKeys, OPTIMIZATION_CONFIG.BATCH_SIZE);

  console.log(
    `📦 Processing ${batches.length} batches of up to ${OPTIMIZATION_CONFIG.BATCH_SIZE} keys each`
  );

  // Initialize batch progress bar
  const batchProgressBar = initializeBatchProgress(batches.length, lang);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    updateBatchProgress(
      batchIndex + 1,
      `Processing batch ${batchIndex + 1}/${batches.length}`
    );

    await processBatch(
      batch,
      batchIndex,
      batches.length,
      englishTemplate,
      targetLang,
      lang,
      model
    );

    // Add delay between batches to respect rate limits
    if (batchIndex < batches.length - 1) {
      const delay = getRandomDelay(
        OPTIMIZATION_CONFIG.MIN_DELAY_BETWEEN_BATCHES,
        OPTIMIZATION_CONFIG.MAX_DELAY_BETWEEN_BATCHES
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function createBatches(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

async function processBatch(
  batch,
  batchIndex,
  totalBatches,
  englishTemplate,
  targetLang,
  lang,
  model
) {
  console.log(
    `\n🔄 Processing batch ${batchIndex + 1}/${totalBatches} (${
      batch.length
    } keys)`
  );

  const englishValues = batch.map((key) =>
    getNestedValue(englishTemplate, key)
  );

  // Start translation spinner
  const spinner = startTranslationSpinner(
    `Translating batch ${batchIndex + 1}/${totalBatches} (${batch.length} keys)`
  );

  try {
    const translatedValues = await translateBatch(
      englishValues,
      lang,
      batch,
      model
    );

    batch.forEach((key, index) => {
      setNestedValue(targetLang, key, translatedValues[index]);
      const action = keyExists(targetLang, key) ? 'Updated' : 'Added';
      console.log(`✅ ${action}: ${key} = "${translatedValues[index]}"`);
    });

    // Stop spinner with success
    stopTranslationSpinner(
      true,
      `Batch ${batchIndex + 1} completed successfully`
    );
  } catch (error) {
    console.log(`❌ Batch translation failed:`, error.message);
    console.log(
      `🔄 Falling back to individual translations for batch ${batchIndex + 1}`
    );

    // Stop spinner with failure
    stopTranslationSpinner(
      false,
      `Batch ${batchIndex + 1} failed, using fallback`
    );

    await processBatchFallback(batch, englishValues, targetLang, lang, model);
  }
}

async function processBatchFallback(
  batch,
  englishValues,
  targetLang,
  lang,
  model
) {
  // Start spinner for fallback processing
  const fallbackSpinner = startTranslationSpinner(
    `Processing fallback translations for ${batch.length} keys`
  );

  for (let i = 0; i < batch.length; i++) {
    const key = batch[i];
    const englishValue = englishValues[i];

    // Update spinner text for current key
    updateTranslationSpinner(
      `Translating key ${i + 1}/${batch.length}: ${key}`
    );

    try {
      const translatedValue = await translateText(
        englishValue,
        lang,
        key,
        0,
        model
      );
      setNestedValue(targetLang, key, translatedValue);
      const action = keyExists(targetLang, key) ? 'Updated' : 'Added';
      console.log(`✅ ${action}: ${key} = "${translatedValue}"`);
    } catch (individualError) {
      console.log(`❌ Failed to translate ${key}:`, individualError.message);
      setNestedValue(targetLang, key, englishValue);
      // Record the failure
      const targetFile = `${lang}.json`;
      translationFailureReporter.recordFailure(targetFile, key, englishValue);
      console.log(
        `🔄 Fallback to English: ${key} = "${englishValue}" (failure recorded)`
      );
    }
  }

  // Stop fallback spinner
  stopTranslationSpinner(true, `Fallback processing completed`);
}
