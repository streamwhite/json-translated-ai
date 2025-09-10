import retry from 'retry';
import { API_CONFIG } from './config.js';

/**
 * Retry configuration for translation operations
 */
const RETRY_CONFIG = {
  retries: API_CONFIG.MAX_RETRIES || 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 10000,
  randomize: true,
};

/**
 * Simple retry with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {...any} args - Arguments to pass to the function
 * @returns {Promise<any>} - Result of the function
 */
export async function retryWithBackoff(fn, ...args) {
  const maxRetries = API_CONFIG.MAX_RETRIES || 3;
  const backoffMultiplier = API_CONFIG.BACKOFF_MULTIPLIER || 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(...args);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.pow(backoffMultiplier, attempt) * 1000;
      console.log(
        `  ⏳ Retry attempt ${attempt + 1} failed, retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Creates a retry operation for translation functions
 * @param {Function} operation - The translation function to retry
 * @param {string} operationType - Type of operation ('individual' or 'batch')
 * @returns {Promise} - Promise that resolves with the operation result
 */
export function createRetryOperation(operation, operationType = 'individual') {
  return new Promise((resolve, reject) => {
    const retryOperation = retry.operation(RETRY_CONFIG);
    const timeouts = retry.timeouts(RETRY_CONFIG);

    retryOperation.attempt(async (currentAttempt) => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        console.log(
          `  ❌ ${operationType} translation attempt ${currentAttempt} failed:`,
          error.message
        );

        if (retryOperation.retry(error)) {
          const delay = timeouts[currentAttempt - 1] || 1000;
          console.log(
            `  ⏳ Retrying ${operationType} translation in ${delay}ms... (attempt ${
              currentAttempt + 1
            }/${RETRY_CONFIG.retries + 1})`
          );
          return;
        }

        console.log(
          `  💀 All ${operationType} translation retry attempts failed`
        );
        reject(error);
      }
    });
  });
}

/**
 * Wraps individual translation with retry logic
 * @param {Function} translateFn - The translateText function
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language
 * @param {string} key - Translation key
 * @returns {Promise<string>} - Translated text or fallback
 */
export async function retryIndividualTranslation(
  translateFn,
  text,
  targetLanguage,
  key
) {
  try {
    return await createRetryOperation(
      () => translateFn(text, targetLanguage, key, 0),
      'individual'
    );
  } catch (error) {
    console.log(
      `  🔄 Individual translation failed after retries, falling back to English: "${text}"`
    );
    return text; // Fallback to English
  }
}

/**
 * Wraps batch translation with retry logic
 * @param {Function} translateBatchFn - The translateBatch function
 * @param {Array} texts - Array of texts to translate
 * @param {string} targetLanguage - Target language
 * @param {Array} keys - Array of translation keys
 * @returns {Promise<Array>} - Array of translated texts or fallbacks
 */
export async function retryBatchTranslation(
  translateBatchFn,
  texts,
  targetLanguage,
  keys
) {
  try {
    return await createRetryOperation(
      () => translateBatchFn(texts, targetLanguage, keys, 0),
      'batch'
    );
  } catch (error) {
    console.log(
      `  🔄 Batch translation failed after retries, falling back to individual translations`
    );
    // Fallback to individual translations
    const fallbackResults = [];
    for (let i = 0; i < texts.length; i++) {
      if (typeof texts[i] === 'string' && texts[i].trim() !== '') {
        try {
          const fallbackTranslation = await retryIndividualTranslation(
            translateBatchFn.constructor.name === 'AsyncFunction'
              ? translateBatchFn
              : translateBatchFn,
            texts[i],
            targetLanguage,
            keys[i]
          );
          fallbackResults[i] = fallbackTranslation;
        } catch (fallbackError) {
          console.log(
            `  ❌ Fallback failed for text ${i}:`,
            fallbackError.message
          );
          fallbackResults[i] = texts[i]; // Fallback to English
        }
      } else {
        fallbackResults[i] = texts[i];
      }
    }
    return fallbackResults;
  }
}
