import { OPTIMIZATION_CONFIG } from './config.js';
import { processLanguageFile } from './multi-file-language-processor.js';
import { updateLanguageProgress } from './progress-utils.js';

/**
 * Processes all files for a single language concurrently
 * @param {string} localesDir - Base locales directory
 * @param {string} langCode - Language code
 * @param {Array} files - Array of file information objects
 * @param {Object} templateStructure - Template structure
 * @param {string} model - AI model to use
 * @returns {Object} Processing results for the language
 */
export async function processLanguageFiles(
  localesDir,
  langCode,
  files,
  templateStructure,
  model
) {
  console.log(`\n🌍 Processing ${langCode} with ${files.length} files`);

  const results = {
    language: langCode,
    files: {},
    totalTranslatedKeys: 0,
    totalExtraKeys: 0,
    success: true,
    errors: [],
  };

  // Process files concurrently with semaphore control
  const semaphore = new Array(
    OPTIMIZATION_CONFIG.MAX_CONCURRENT_FILES || 3
  ).fill(null);

  const filePromises = files.map(async (fileInfo, index) => {
    const semaphoreIndex =
      index % (OPTIMIZATION_CONFIG.MAX_CONCURRENT_FILES || 3);

    if (semaphore[semaphoreIndex]) {
      await semaphore[semaphoreIndex];
    }

    const processingPromise = processLanguageFile(
      localesDir,
      langCode,
      fileInfo,
      templateStructure,
      model
    );

    semaphore[semaphoreIndex] = processingPromise;

    try {
      const result = await processingPromise;
      results.files[fileInfo.relativePath] = result;
      results.totalTranslatedKeys += result.translatedKeys;
      results.totalExtraKeys += result.extraKeys.length;

      if (!result.success) {
        results.success = false;
        results.errors.push(`${fileInfo.relativePath}: ${result.error}`);
      }

      updateLanguageProgress(
        Object.keys(results.files).length,
        `${langCode}/${fileInfo.relativePath}`,
        result.success ? 'Completed' : 'Failed'
      );

      console.log(
        `✅ Completed processing ${langCode}/${fileInfo.relativePath}`
      );
      return result;
    } catch (error) {
      console.error(
        `❌ Error processing ${langCode}/${fileInfo.relativePath}:`,
        error
      );
      results.files[fileInfo.relativePath] = {
        success: false,
        error: error.message,
        translatedKeys: 0,
        extraKeys: [],
      };
      results.success = false;
      results.errors.push(`${fileInfo.relativePath}: ${error.message}`);
      updateLanguageProgress(
        Object.keys(results.files).length,
        `${langCode}/${fileInfo.relativePath}`,
        'Failed'
      );
      throw error;
    } finally {
      semaphore[semaphoreIndex] = null;
    }
  });

  await Promise.allSettled(filePromises);

  console.log(`\n📊 ${langCode} Summary:`);
  console.log(`   Files processed: ${Object.keys(results.files).length}`);
  console.log(`   Total translated keys: ${results.totalTranslatedKeys}`);
  console.log(`   Total extra keys: ${results.totalExtraKeys}`);
  console.log(`   Success: ${results.success ? '✅' : '❌'}`);

  if (results.errors.length > 0) {
    console.log(`   Errors: ${results.errors.length}`);
  }

  return results;
}

/**
 * Processes all languages with their files using parallel processing
 * @param {Object} languageStructures - Language structures mapping
 * @param {Object} templateStructure - Template structure
 * @param {string} localesDir - Base locales directory
 * @param {string} model - AI model to use
 * @returns {Object} Processing results for all languages
 */
export async function processAllLanguagesParallel(
  languageStructures,
  templateStructure,
  localesDir,
  model
) {
  console.log(
    `🚀 Starting parallel processing with max ${OPTIMIZATION_CONFIG.MAX_CONCURRENT_LANGUAGES} concurrent languages`
  );

  const results = {};
  const semaphore = new Array(
    OPTIMIZATION_CONFIG.MAX_CONCURRENT_LANGUAGES
  ).fill(null);

  const languagePromises = Object.entries(languageStructures).map(
    async ([langCode, langStructure], index) => {
      const semaphoreIndex =
        index % OPTIMIZATION_CONFIG.MAX_CONCURRENT_LANGUAGES;

      if (semaphore[semaphoreIndex]) {
        await semaphore[semaphoreIndex];
      }

      const processingPromise = processLanguageFiles(
        localesDir,
        langCode,
        langStructure.files,
        templateStructure,
        model
      );

      semaphore[semaphoreIndex] = processingPromise;

      try {
        const result = await processingPromise;
        results[langCode] = result;
        console.log(`✅ Completed processing language ${langCode}`);
        return result;
      } catch (error) {
        console.error(`❌ Error processing language ${langCode}:`, error);
        results[langCode] = {
          language: langCode,
          success: false,
          error: error.message,
          files: {},
          totalTranslatedKeys: 0,
          totalExtraKeys: 0,
          errors: [error.message],
        };
        throw error;
      } finally {
        semaphore[semaphoreIndex] = null;
      }
    }
  );

  await Promise.allSettled(languagePromises);
  return results;
}

/**
 * Processes all languages with their files using sequential processing
 * @param {Object} languageStructures - Language structures mapping
 * @param {Object} templateStructure - Template structure
 * @param {string} localesDir - Base locales directory
 * @param {string} model - AI model to use
 * @returns {Object} Processing results for all languages
 */
export async function processAllLanguagesSequential(
  languageStructures,
  templateStructure,
  localesDir,
  model
) {
  console.log(
    `🚀 Starting sequential processing for ${
      Object.keys(languageStructures).length
    } languages`
  );

  const results = {};

  for (const [langCode, langStructure] of Object.entries(languageStructures)) {
    try {
      updateLanguageProgress(
        Object.keys(results).length,
        langCode,
        'Processing...'
      );

      results[langCode] = await processLanguageFiles(
        localesDir,
        langCode,
        langStructure.files,
        templateStructure,
        model
      );

      updateLanguageProgress(
        Object.keys(results).length,
        langCode,
        'Completed'
      );
      console.log(`✅ Completed processing language ${langCode}`);
    } catch (error) {
      console.error(`❌ Error processing language ${langCode}:`, error);
      results[langCode] = {
        language: langCode,
        success: false,
        error: error.message,
        files: {},
        totalTranslatedKeys: 0,
        totalExtraKeys: 0,
        errors: [error.message],
      };
      updateLanguageProgress(Object.keys(results).length, langCode, 'Failed');
    }
  }

  return results;
}

/**
 * Determines if parallel processing should be used
 * @param {number} languageCount - Number of languages to process
 * @returns {boolean} Whether to use parallel processing
 */
export function shouldUseParallelProcessing(languageCount) {
  return languageCount > 1 && OPTIMIZATION_CONFIG.MAX_CONCURRENT_LANGUAGES > 1;
}

/**
 * Processes all languages with appropriate strategy
 * @param {Object} languageStructures - Language structures mapping
 * @param {Object} templateStructure - Template structure
 * @param {string} localesDir - Base locales directory
 * @param {string} model - AI model to use
 * @returns {Object} Processing results for all languages
 */
export async function processLanguagesWithStrategy(
  languageStructures,
  templateStructure,
  localesDir,
  model
) {
  const languageCount = Object.keys(languageStructures).length;
  const useParallel = shouldUseParallelProcessing(languageCount);

  if (useParallel) {
    console.log(`⚡ Using parallel processing for ${languageCount} languages`);
    return await processAllLanguagesParallel(
      languageStructures,
      templateStructure,
      localesDir,
      model
    );
  } else {
    console.log(
      `🔄 Using sequential processing for ${languageCount} languages`
    );
    return await processAllLanguagesSequential(
      languageStructures,
      templateStructure,
      localesDir,
      model
    );
  }
}
