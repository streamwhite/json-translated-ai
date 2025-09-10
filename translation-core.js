import { getAIClient } from './ai-client-manager.js';
import {
  getCachedTranslation,
  setCachedTranslation,
  updateTokenUsage,
} from './cache-manager.js';
import { API_CONFIG } from './config.js';
import { validateLanguageCode } from './language-utils.js';
import { retryWithBackoff } from './retry-utils.js';
import { createSystemPrompt } from './system-message-utils.js';
import { translationFailureReporter } from './translation-failure-reporter.js';

export async function translateText(
  text,
  targetLanguage,
  key,
  retryCount = 0,
  model
) {
  if (typeof text !== 'string' && !Array.isArray(text)) {
    return text;
  }

  if (Array.isArray(text)) {
    return await translateArray(text, targetLanguage, key, retryCount, model);
  }

  const sanitizedText = sanitizeText(text);
  const cachedTranslation = getCachedTranslation(sanitizedText, targetLanguage);

  if (cachedTranslation) {
    console.log(`  📋 Cache hit for "${text}" → "${cachedTranslation}"`);
    return cachedTranslation;
  }

  if (text.trim() === '') {
    return text;
  }

  try {
    const client = getAIClient(model);
    if (!client) {
      throw new Error(
        'AI client not initialized - check PROVIDER_KEY or OPENAI_API_KEY'
      );
    }

    console.log(`  🤖 Translating: "${text}"`);

    const prompt = `Translate this text to ${targetLanguage}. Keep it natural and appropriate for the context.`;
    const validatedLanguage = validateLanguageCode(targetLanguage);

    const completion = await client.chat.completions.create(
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: createSystemPrompt(
              validatedLanguage,
              targetLanguage,
              false // isBatch = false for individual translation
            ),
          },
          {
            role: 'user',
            content: `${prompt}\n\nText to translate: "${sanitizedText}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: API_CONFIG.MAX_TOKENS || 1000,
      },
      {
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    const translatedText = validateAndCleanResponse(completion);
    console.log(`  ✅ Translated: "${text}" → "${translatedText}"`);

    updateTokenUsage(completion);
    setCachedTranslation(sanitizedText, targetLanguage, translatedText);

    await applyRateLimiting(completion);
    return translatedText;
  } catch (error) {
    return await handleTranslationError(
      error,
      text,
      targetLanguage,
      key,
      retryCount,
      model
    );
  }
}

async function translateArray(
  textArray,
  targetLanguage,
  key,
  retryCount,
  model
) {
  const translatedArray = [];
  for (let i = 0; i < textArray.length; i++) {
    const element = textArray[i];
    if (typeof element === 'string') {
      const elementKey = `${key}[${i}]`;
      translatedArray.push(
        await translateText(
          element,
          targetLanguage,
          elementKey,
          retryCount,
          model
        )
      );
    } else {
      translatedArray.push(element);
    }
  }
  return translatedArray;
}

function sanitizeText(text) {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// System prompt creation is now handled by the centralized utility

function validateAndCleanResponse(completion) {
  if (!completion?.choices?.[0]?.message?.content) {
    throw new Error('Invalid response structure from OpenAI API');
  }

  const translatedText = completion.choices[0].message.content.trim();
  if (!translatedText || translatedText.length === 0) {
    throw new Error('Empty response from OpenAI API');
  }

  return translatedText.replace(/^["']|["']$/g, '');
}

async function applyRateLimiting(completion) {
  const responseTime = Date.now() - (completion.usage?.created || Date.now());
  const delay = Math.min(1000 + responseTime / 10, 3000);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function handleTranslationError(
  error,
  text,
  targetLanguage,
  key,
  retryCount,
  model
) {
  console.log(`  ❌ Translation error for "${text}":`, error.message);

  // Try retry with the retry package first
  if (retryCount === 0) {
    try {
      console.log(`  🔄 Attempting retry with retry package for "${text}"`);
      return await retryWithBackoff(
        translateText,
        text,
        targetLanguage,
        key,
        model
      );
    } catch (retryError) {
      console.log(
        `  ❌ Retry package also failed for "${text}":`,
        retryError.message
      );
    }
  }

  // Fallback to old retry logic if retry package failed
  if (isRateLimitError(error) && retryCount < API_CONFIG.MAX_RETRIES) {
    return await handleRateLimitRetry(
      text,
      targetLanguage,
      key,
      retryCount,
      model
    );
  }

  if (isTimeoutError(error) && retryCount < 2) {
    return await handleTimeoutRetry(
      text,
      targetLanguage,
      key,
      retryCount,
      model
    );
  }

  // Record the failure and return fallback
  const targetFile = `${targetLanguage}.json`;
  translationFailureReporter.recordFailure(targetFile, key, text);
  console.log(`  🔄 Falling back to English: "${text}" (failure recorded)`);
  return text;
}

function isRateLimitError(error) {
  return error.message.includes('rate limit') || error.status === 429;
}

function isTimeoutError(error) {
  return error.message.includes('timeout') || error.code === 'ECONNABORTED';
}

async function handleRateLimitRetry(
  text,
  targetLanguage,
  key,
  retryCount,
  model
) {
  const backoffDelay =
    Math.pow(API_CONFIG.BACKOFF_MULTIPLIER, retryCount) * 1000;
  console.log(`  ⏳ Rate limited, retrying in ${backoffDelay}ms...`);
  await new Promise((resolve) => setTimeout(resolve, backoffDelay));
  return translateText(text, targetLanguage, key, retryCount + 1, model);
}

async function handleTimeoutRetry(
  text,
  targetLanguage,
  key,
  retryCount,
  model
) {
  console.log(`  ⏳ Request timeout, retrying...`);
  return translateText(text, targetLanguage, key, retryCount + 1, model);
}
