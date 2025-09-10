import { LANGUAGE_NAMES } from './config.js';

export function getLanguageName(langCode) {
  return LANGUAGE_NAMES[langCode] || langCode;
}

export function getContextPrompt(key, targetLanguage) {
  const keyParts = key.split('.');
  const context = keyParts[0];

  const contextPrompts = {
    navigation: `Translate this UI navigation label to ${targetLanguage}. Keep it short and clear.`,
    hero: `Translate this marketing hero text to ${targetLanguage}. Maintain the marketing tone and impact.`,
    services: `Translate this service description to ${targetLanguage}. Keep it professional and clear.`,
    quote: `Translate this quote form text to ${targetLanguage}. Keep it user-friendly and clear.`,
    contact: `Translate this contact form text to ${targetLanguage}. Keep it professional and welcoming.`,
    footer: `Translate this footer text to ${targetLanguage}. Keep it concise and professional.`,
    errors: `Translate this error message to ${targetLanguage}. Keep it user-friendly and helpful.`,
    validation: `Translate this form validation message to ${targetLanguage}. Keep it clear and helpful.`,
    common: `Translate this common UI text to ${targetLanguage}. Keep it simple and clear.`,
    techCategories: `Translate this technology category label to ${targetLanguage}. Keep it clear and professional.`,
    frontendServices: `Translate this frontend service description to ${targetLanguage}. Keep it technical but accessible.`,
    backendServices: `Translate this backend service description to ${targetLanguage}. Keep it technical but accessible.`,
    aiServices: `Translate this AI service description to ${targetLanguage}. Keep it technical but accessible.`,
    structuredData: `Translate this structured data content to ${targetLanguage}. Keep it SEO-friendly and accurate.`,
  };

  return (
    contextPrompts[context] ||
    `Translate this text to ${targetLanguage}. Keep it natural and appropriate for the context.`
  );
}

export function validateLanguageCode(langCode) {
  const validatedLanguage = getLanguageName(langCode);
  if (validatedLanguage === langCode) {
    console.warn(`  ⚠️  Unknown language code: ${langCode}`);
  }
  return validatedLanguage;
}
