import { LANGUAGE_NAMES } from './config.js';

export function getLanguageName(langCode) {
  return LANGUAGE_NAMES[langCode] || langCode;
}

export function validateLanguageCode(langCode) {
  const validatedLanguage = getLanguageName(langCode);
  if (validatedLanguage === langCode) {
    console.warn(`  ⚠️  Unknown language code: ${langCode}`);
  }
  return validatedLanguage;
}
