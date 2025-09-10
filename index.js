// Core translation functions
export { translateBatch } from './batch-translator.js';
export { translateText } from './translation-core.js';

// AI client management
export {
  checkAIHealth,
  getAIClient,
  getModelProvider,
  initializeAIClient,
  validateModel,
} from './ai-client-manager.js';

// Language processing
export { processLanguageFileOptimized } from './language-processor.js';
export { processLanguagesWithStrategy } from './parallel-processor.js';

// Cache management
export {
  getCachedTranslation,
  loadCache,
  saveCache,
  setCachedTranslation,
} from './cache-manager.js';

// File processing
export { loadEnglishTemplate, loadTargetLanguages } from './file-processor.js';

// CLI interface
export {
  parseArguments,
  showHelp,
  validateEnvironment,
  validateSettings,
} from './cli-interface.js';

// Configuration
export {
  API_CONFIG,
  CACHE_CONFIG,
  DEFAULT_MODEL_NAME,
  LANGUAGE_NAMES,
  OPTIMIZATION_CONFIG,
  PROVIDER_CONFIG,
  SUPPORTED_MODELS,
} from './config.js';

// Progress utilities
export {
  initializeLanguageProgress,
  updateLanguageProgress,
} from './progress-utils.js';

// Summary generation
export {
  generateFinalSummary,
  generateProcessingReport,
} from './summary-generator.js';
