import {
  getAllKeys,
  getNestedValue,
  setNestedValue,
} from './file-processor.js';

export async function applyCachedTranslations(targetLang, templateLang, lang) {
  let appliedCount = 0;
  let missingCount = 0;

  console.log(`  🔍 Applying cached translations for ${lang}...`);

  // Get all keys from template language file
  const templateKeys = getAllKeys(templateLang);

  for (const key of templateKeys) {
    // Get the value from template (original text)
    const originalValue = getNestedValue(templateLang, key);

    if (typeof originalValue === 'string') {
      // Check if translation exists in cache for this value
      const cachedTranslation = await getCachedTranslation(originalValue, lang);

      if (cachedTranslation) {
        // Apply cached translation to target language file
        setNestedValue(targetLang, key, cachedTranslation);
        appliedCount++;
      } else {
        // Mark as missing translation (could be logged or tracked)
        missingCount++;
      }
    }
  }

  if (appliedCount > 0) {
    console.log(`  ✅ Applied ${appliedCount} cached translations for ${lang}`);
  }

  if (missingCount > 0) {
    console.log(`  ⏭️  ${missingCount} keys need new translation for ${lang}`);
  }

  return appliedCount;
}

async function getCachedTranslation(originalValue, lang) {
  // Import cache manager dynamically to avoid circular dependencies
  const { getTranslationCache } = await import('./cache-manager.js');
  const translationCache = getTranslationCache();

  // Create cache key: originalValue_lang (case-insensitive)
  const cacheKey = `${originalValue.toLowerCase()}_${lang}`;

  // Check if translation exists in cache
  return translationCache[cacheKey] || null;
}
