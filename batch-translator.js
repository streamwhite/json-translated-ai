import { getAIClient } from './ai-client-manager.js';
import {
  getCachedTranslation,
  setCachedTranslation,
  shouldSaveCache,
  updateTokenUsage,
} from './cache-manager.js';
import { OPTIMIZATION_CONFIG } from './config.js';
import { validateLanguageCode } from './language-utils.js';
import { createSystemPrompt } from './system-message-utils.js';
import { translateText } from './translation-core.js';
import { translationFailureReporter } from './translation-failure-reporter.js';

export async function translateBatch(
  texts,
  targetLanguage,
  keys,
  model,
  retryCount = 0
) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const { validTexts, validKeys, cacheKeys } = prepareBatchData(
    texts,
    keys,
    targetLanguage
  );

  if (validTexts.length === 0) {
    return texts;
  }

  const { cachedResults, uncachedTexts, uncachedIndices } =
    checkCacheAndSeparate(validTexts, validKeys);

  if (uncachedTexts.length === 0) {
    console.log(`  📋 Batch cache hit for ${validTexts.length} texts`);
    return createFinalResults(texts, cacheKeys);
  }

  if (uncachedTexts.length > 0) {
    console.log(
      `  🤖 Batch translating ${uncachedTexts.length} texts (${cachedResults.length} cached)`
    );

    // Note: Spinner management is handled by the calling processBatch function

    try {
      const client = getAIClient(model);
      if (!client) {
        throw new Error(
          'AI client not initialized - check PROVIDER_KEY or OPENAI_API_KEY'
        );
      }

      const validatedLanguage = validateLanguageCode(targetLanguage);
      const batchPrompt = createBatchPrompt(uncachedTexts);
      const systemPrompt = createSystemPrompt(
        validatedLanguage,
        targetLanguage,
        true // isBatch = true for batch translation
      );
      const userPrompt = `Translate these texts to ${
        validatedLanguage || targetLanguage
      }:\n\n${batchPrompt}`;

      const completion = await client.chat.completions.create(
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          max_tokens: OPTIMIZATION_CONFIG.MAX_TOKENS_PER_BATCH,
          temperature: 0.3,
        },
        {
          timeout: OPTIMIZATION_CONFIG.BATCH_TIMEOUT,
        }
      );

      if (!completion?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      const translatedBatch = completion.choices[0].message.content.trim();
      const translations = parseBatchResponse(translatedBatch);

      if (translations.length !== uncachedTexts.length) {
        throw new Error(
          `Expected ${uncachedTexts.length} translations, got ${translations.length}`
        );
      }

      updateTokenUsage(completion);
      cacheTranslations(
        translations,
        uncachedIndices,
        cacheKeys,
        targetLanguage
      );

      if (shouldSaveCache()) {
        const { saveCache } = await import('./cache-manager.js');
        saveCache();
      }

      await applyBatchRateLimiting(completion);
      const results = combineResults(texts, translations, uncachedIndices);
      console.log(`  ✅ Batch translated ${uncachedTexts.length} texts`);

      return results;
    } catch (error) {
      return await handleBatchError(
        error,
        texts,
        keys,
        targetLanguage,
        model,
        retryCount
      );
    }
  }

  return texts;
}

function prepareBatchData(texts, keys, targetLanguage) {
  const validTexts = texts.filter(
    (text) => typeof text === 'string' && text.trim() !== ''
  );
  const validKeys = keys.filter(
    (_, index) => typeof texts[index] === 'string' && texts[index].trim() !== ''
  );
  const cacheKeys = validTexts.map(
    (text) =>
      `${text
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .toLowerCase()}_${targetLanguage}`
  );

  return { validTexts, validKeys, cacheKeys };
}

function checkCacheAndSeparate(validTexts, validKeys) {
  const cachedResults = [];
  const uncachedTexts = [];
  const uncachedIndices = [];

  validTexts.forEach((text, index) => {
    if (getCachedTranslation(text, validKeys[index])) {
      cachedResults[index] = getCachedTranslation(text, validKeys[index]);
    } else {
      uncachedTexts.push(text);
      uncachedIndices.push(index);
    }
  });

  return { cachedResults, uncachedTexts, uncachedIndices };
}

function createFinalResults(texts, cacheKeys) {
  return texts.map((text, index) => {
    if (typeof text === 'string' && text.trim() !== '') {
      return getCachedTranslation(text, cacheKeys[index]);
    }
    return text;
  });
}

function createBatchPrompt(uncachedTexts) {
  return uncachedTexts
    .map((text, index) => `${index + 1}. "${text}"`)
    .join('\n');
}

// System prompt creation is now handled by the centralized utility

function parseBatchResponse(translatedBatch) {
  return translatedBatch
    .split('\n')
    .filter((line) => line.trim() && /^\d+\./.test(line))
    .map((line) =>
      line
        .replace(/^\d+\.\s*/, '')
        .replace(/^["']|["']$/g, '')
        .trim()
    )
    .filter((text) => text.length > 0);
}

function cacheTranslations(
  translations,
  uncachedIndices,
  cacheKeys,
  targetLanguage
) {
  translations.forEach((translation, index) => {
    const originalIndex = uncachedIndices[index];
    const originalText = cacheKeys[originalIndex].replace(
      `_${targetLanguage}`,
      ''
    );
    setCachedTranslation(originalText, targetLanguage, translation);
  });
}

async function applyBatchRateLimiting(completion) {
  const responseTime = Date.now() - (completion.usage?.created || Date.now());
  const delay = Math.min(500 + responseTime / 20, 2000);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function combineResults(texts, translations, uncachedIndices) {
  const results = [...texts];
  translations.forEach((translation, index) => {
    const originalIndex = uncachedIndices[index];
    results[originalIndex] = translation;
  });
  return results;
}

async function handleBatchError(
  error,
  texts,
  keys,
  targetLanguage,
  model,
  retryCount = 0
) {
  console.log(`  ❌ Batch translation error:`, error.message);

  // Check if this is a timeout or rate limit error that might be retryable
  const isRetryableError =
    error.message.includes('timeout') ||
    error.message.includes('rate limit') ||
    error.status === 429 ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT';

  // Only retry once for retryable errors to avoid infinite loops
  if (isRetryableError && retryCount < 1) {
    console.log(`  🔄 Attempting retry for batch (attempt ${retryCount + 1})`);
    try {
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Retry the batch translation with incremented retry count
      return await translateBatch(
        texts,
        targetLanguage,
        keys,
        model,
        retryCount + 1
      );
    } catch (retryError) {
      console.log(`  ❌ Retry also failed for batch:`, retryError.message);
    }
  }

  // Fallback to individual translations
  if (OPTIMIZATION_CONFIG.ENABLE_INDIVIDUAL_FALLBACK) {
    console.log(`  🔄 Falling back to individual translations`);
    return await fallbackToIndividualTranslations(
      texts,
      keys,
      targetLanguage,
      model
    );
  }

  throw error;
}

async function fallbackToIndividualTranslations(
  texts,
  keys,
  targetLanguage,
  model
) {
  // Note: Spinner management is handled by the calling processBatch function

  const fallbackResults = [];
  for (let i = 0; i < texts.length; i++) {
    if (typeof texts[i] === 'string' && texts[i].trim() !== '') {
      try {
        const fallbackTranslation = await translateText(
          texts[i],
          targetLanguage,
          keys[i],
          0,
          model
        );
        fallbackResults[i] = fallbackTranslation;
      } catch (fallbackError) {
        console.log(
          `  ❌ Fallback failed for text ${i}:`,
          fallbackError.message
        );
        // Record the failure
        const targetFile = `${targetLanguage}.json`;
        translationFailureReporter.recordFailure(targetFile, keys[i], texts[i]);
        fallbackResults[i] = texts[i];
      }
    } else {
      fallbackResults[i] = texts[i];
    }
  }

  // Note: Spinner management is handled by the calling processBatch function

  return fallbackResults;
}
