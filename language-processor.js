import { translateBatch } from './batch-translator.js';
import { applyCachedTranslations } from './cache-applier.js';
import { OPTIMIZATION_CONFIG } from './config.js';
import {
  getExtraKeys,
  getKeysToTranslate,
  getNestedValue,
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
  let targetLang = loadLanguageFile(localesDir, lang);

  const appliedCount = await applyCachedTranslations(
    targetLang,
    englishTemplate,
    lang
  );
  const keysInfo = getKeysToTranslate(englishTemplate, targetLang);
  const extraKeys = getExtraKeys(englishTemplate, targetLang);

  if (appliedCount > 0) {
    saveLanguageFile(localesDir, lang, targetLang);
  }

  if (keysInfo.totalKeys > 0) {
    await processAllBatches(
      keysInfo.keysToTranslate,
      englishTemplate,
      targetLang,
      lang,
      model
    );

    saveLanguageFile(localesDir, lang, targetLang);
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
    });

    // Stop spinner with success
    stopTranslationSpinner(
      true,
      `Batch ${batchIndex + 1} completed successfully`
    );
  } catch (error) {
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
    } catch (individualError) {
      setNestedValue(targetLang, key, englishValue);
      // Record the failure
      const targetFile = `${lang}.json`;
      translationFailureReporter.recordFailure(targetFile, key, englishValue);
    }
  }

  // Stop fallback spinner
  stopTranslationSpinner(true, `Fallback processing completed`);
}
