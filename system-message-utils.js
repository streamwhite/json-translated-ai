/**
 * Centralized system message utilities for translation
 */

/**
 * Creates a system prompt for AI translation
 * @param {string} validatedLanguage - The validated language code
 * @param {string} targetLanguage - The target language code
 * @param {boolean} isBatch - Whether this is for batch translation (affects text vs texts)
 * @returns {string} The formatted system prompt
 */
export function createSystemPrompt(
  validatedLanguage,
  targetLanguage,
  isBatch = false
) {
  const customSystemMessage = process.env.CUSTOM_SYSTEM_MESSAGE;
  const textWord = isBatch ? 'texts' : 'text';
  const returnInstruction = isBatch
    ? 'Return only the translated texts, numbered exactly as provided'
    : 'Return only the translated text, no explanations';

  if (customSystemMessage) {
    return `You are a professional translator. ${customSystemMessage}

Translate the given ${textWord} to ${validatedLanguage || targetLanguage}.

Important guidelines:
- Keep technical terms in English when appropriate (React, Next.js, TypeScript, etc.)
- Preserve any HTML tags or placeholders like {variable}
- Keep the translation natural and fluent
- ${returnInstruction}
- Do not include explanations or additional text`;
  }

  return `You are a professional translator. Translate the given ${textWord} to ${
    validatedLanguage || targetLanguage
  }.

Important guidelines:
- Keep technical terms in English when appropriate (React, Next.js, TypeScript, etc.)
- Preserve any HTML tags or placeholders like {variable}
- Keep the translation natural and fluent
- ${returnInstruction}
- Do not include explanations or additional text`;
}
