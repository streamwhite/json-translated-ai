import { OPTIMIZATION_CONFIG } from './config.js';
import { processLanguageFileOptimized } from './language-processor.js';
import {
  stopTranslationSpinner,
  updateLanguageProgress,
} from './progress-utils.js';

export async function processLanguagesParallel(
  languages,
  localesDir,
  englishTemplate,
  progressBar,
  model
) {
  const results = {};
  const semaphore = new Array(
    OPTIMIZATION_CONFIG.MAX_CONCURRENT_LANGUAGES
  ).fill(null);

  const promises = languages.map(async (lang, index) => {
    const semaphoreIndex = index % OPTIMIZATION_CONFIG.MAX_CONCURRENT_LANGUAGES;
    if (semaphore[semaphoreIndex]) {
      await semaphore[semaphoreIndex];
    }

    const processingPromise = processLanguageFileOptimized(
      lang,
      localesDir,
      englishTemplate,
      model
    );
    semaphore[semaphoreIndex] = processingPromise;

    try {
      const result = await processingPromise;
      results[lang] = result;
      updateLanguageProgress(Object.keys(results).length, lang, 'Completed');
      return result;
    } catch (error) {
      console.error(`❌ Error processing ${lang}.json:`, error);
      results[lang] = { error: error.message };
      updateLanguageProgress(Object.keys(results).length, lang, 'Failed');
      throw error;
    } finally {
      semaphore[semaphoreIndex] = null;
    }
  });

  await Promise.allSettled(promises);

  // Ensure any remaining spinner is stopped
  stopTranslationSpinner(true, '');

  return results;
}

export async function processLanguagesSequential(
  languages,
  localesDir,
  englishTemplate,
  progressBar,
  model
) {
  const results = {};

  for (const lang of languages) {
    try {
      updateLanguageProgress(
        Object.keys(results).length,
        lang,
        'Processing...'
      );
      results[lang] = await processLanguageFileOptimized(
        lang,
        localesDir,
        englishTemplate,
        model
      );
      updateLanguageProgress(Object.keys(results).length, lang, 'Completed');
    } catch (error) {
      console.error(`❌ Error processing ${lang}.json:`, error);
      results[lang] = { error: error.message };
      updateLanguageProgress(Object.keys(results).length, lang, 'Failed');
    }
  }

  // Ensure any remaining spinner is stopped
  stopTranslationSpinner(true, '');

  return results;
}

export function shouldUseParallelProcessing(languageCount) {
  return languageCount > 1 && OPTIMIZATION_CONFIG.MAX_CONCURRENT_LANGUAGES > 1;
}

export async function processLanguagesWithStrategy(
  languages,
  localesDir,
  englishTemplate,
  progressBar,
  model
) {
  const useParallel = shouldUseParallelProcessing(languages.length);

  if (useParallel) {
    return await processLanguagesParallel(
      languages,
      localesDir,
      englishTemplate,
      progressBar,
      model
    );
  } else {
    return await processLanguagesSequential(
      languages,
      localesDir,
      englishTemplate,
      progressBar,
      model
    );
  }
}
