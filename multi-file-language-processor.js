import { translateBatch } from './batch-translator.js';
import { applyCachedTranslations } from './cache-applier.js';
import { OPTIMIZATION_CONFIG } from './config.js';
import {
  getAllKeys,
  getExtraKeys,
  getKeysToTranslate,
  getNestedValue,
  keyExists,
  loadLanguageFileWithTemplate,
  saveLanguageFileWithPath,
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

/**
 * Processes a single language file with its template
 * @param {string} localesDir - Base locales directory
 * @param {string} langCode - Language code
 * @param {Object} fileInfo - File information object
 * @param {Object} templateStructure - Template structure
 * @param {string} model - AI model to use
 * @returns {Object} Processing result
 */
export async function processLanguageFile(
  localesDir,
  langCode,
  fileInfo,
  templateStructure,
  model
) {
  const fileName = fileInfo.relativePath;
  console.log(`\n=== Processing ${langCode}/${fileName} ===`);

  try {
    const { languageData, templateData, targetFilePath } =
      loadLanguageFileWithTemplate(
        localesDir,
        langCode,
        fileInfo,
        templateStructure
      );

    const appliedCount = await applyCachedTranslations(
      languageData,
      templateData,
      langCode
    );

    if (appliedCount > 0) {
      console.log(
        `📊 Applied ${appliedCount} cached translations for ${langCode}/${fileName}`
      );
    }

    const keysInfo = getKeysToTranslate(templateData, languageData);
    const extraKeys = getExtraKeys(templateData, languageData);

    console.log(
      `📊 Total keys in template: ${getAllKeys(templateData).length}`
    );
    console.log(`📊 Missing keys to translate: ${keysInfo.missingKeys.length}`);
    console.log(`📊 Updated keys to translate: ${keysInfo.updatedKeys.length}`);
    console.log(`📊 Total keys to translate: ${keysInfo.totalKeys}`);
    console.log(`📊 Extra keys: ${extraKeys.length}`);

    if (appliedCount > 0) {
      saveLanguageFileWithPath(localesDir, langCode, languageData, fileInfo);
      console.log(
        `✅ Updated ${langCode}/${fileName} with ${appliedCount} cached translations`
      );
    }

    if (keysInfo.totalKeys > 0) {
      console.log('🔍 Translating missing and updated keys');
      await processAllBatches(
        keysInfo.keysToTranslate,
        templateData,
        languageData,
        langCode,
        fileName,
        model
      );

      saveLanguageFileWithPath(localesDir, langCode, languageData, fileInfo);
      console.log(
        `✅ Updated ${langCode}/${fileName} with ${keysInfo.totalKeys} translated keys`
      );
    } else {
      console.log(`✅ ${langCode}/${fileName} is complete`);
    }

    if (extraKeys.length > 0) {
      console.log('⚠️  Extra keys (not in template):', extraKeys);
    }

    return {
      translatedKeys: keysInfo.totalKeys,
      extraKeys,
      fileName,
      success: true,
    };
  } catch (error) {
    console.error(
      `❌ Error processing ${langCode}/${fileName}:`,
      error.message
    );
    return {
      translatedKeys: 0,
      extraKeys: [],
      fileName,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Processes all batches for a language file
 * @param {Array} missingKeys - Keys that need translation
 * @param {Object} templateData - Template data
 * @param {Object} languageData - Target language data
 * @param {string} langCode - Language code
 * @param {string} fileName - File name
 * @param {string} model - AI model to use
 */
async function processAllBatches(
  missingKeys,
  templateData,
  languageData,
  langCode,
  fileName,
  model
) {
  const batches = createBatches(missingKeys, OPTIMIZATION_CONFIG.BATCH_SIZE);

  console.log(
    `📦 Processing ${batches.length} batches of up to ${OPTIMIZATION_CONFIG.BATCH_SIZE} keys each`
  );

  // Initialize batch progress bar
  const batchProgressBar = initializeBatchProgress(
    batches.length,
    `${langCode}/${fileName}`
  );

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
      templateData,
      languageData,
      langCode,
      fileName,
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

/**
 * Creates batches from an array
 * @param {Array} array - Array to batch
 * @param {number} batchSize - Size of each batch
 * @returns {Array} Array of batches
 */
function createBatches(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Processes a single batch
 * @param {Array} batch - Batch of keys to translate
 * @param {number} batchIndex - Current batch index
 * @param {number} totalBatches - Total number of batches
 * @param {Object} templateData - Template data
 * @param {Object} languageData - Target language data
 * @param {string} langCode - Language code
 * @param {string} fileName - File name
 * @param {string} model - AI model to use
 */
async function processBatch(
  batch,
  batchIndex,
  totalBatches,
  templateData,
  languageData,
  langCode,
  fileName,
  model
) {
  console.log(
    `\n🔄 Processing batch ${batchIndex + 1}/${totalBatches} (${
      batch.length
    } keys)`
  );

  const englishValues = batch.map((key) => getNestedValue(templateData, key));

  // Start translation spinner
  const spinner = startTranslationSpinner(
    `Translating batch ${batchIndex + 1}/${totalBatches} (${batch.length} keys)`
  );

  try {
    const translatedValues = await translateBatch(
      englishValues,
      langCode,
      batch,
      model
    );

    batch.forEach((key, index) => {
      setNestedValue(languageData, key, translatedValues[index]);
      const action = keyExists(languageData, key) ? 'Updated' : 'Added';
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

    await processBatchFallback(
      batch,
      englishValues,
      languageData,
      langCode,
      fileName,
      model
    );
  }
}

/**
 * Processes batch fallback with individual translations
 * @param {Array} batch - Batch of keys to translate
 * @param {Array} englishValues - English values for the keys
 * @param {Object} languageData - Target language data
 * @param {string} langCode - Language code
 * @param {string} fileName - File name
 * @param {string} model - AI model to use
 */
async function processBatchFallback(
  batch,
  englishValues,
  languageData,
  langCode,
  fileName,
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
    updateBatchProgress(
      i + 1,
      `Translating key ${i + 1}/${batch.length}: ${key}`
    );

    try {
      const translatedValue = await translateText(
        englishValue,
        langCode,
        key,
        0,
        model
      );
      setNestedValue(languageData, key, translatedValue);
      const action = keyExists(languageData, key) ? 'Updated' : 'Added';
      console.log(`✅ ${action}: ${key} = "${translatedValue}"`);
    } catch (individualError) {
      console.log(`❌ Failed to translate ${key}:`, individualError.message);
      setNestedValue(languageData, key, englishValue);
      // Record the failure
      const targetFile = `${langCode}/${fileName}`;
      translationFailureReporter.recordFailure(targetFile, key, englishValue);
      console.log(
        `🔄 Fallback to English: ${key} = "${englishValue}" (failure recorded)`
      );
    }
  }

  // Stop fallback spinner
  stopTranslationSpinner(true, `Fallback processing completed`);
}
