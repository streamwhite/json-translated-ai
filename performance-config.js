// Performance Configuration for Translation Sync
// Adjust these settings based on your OpenAI API limits and requirements

// Helper function to create batch processing settings
function createBatchSettings() {
  return {
    SIZE: 8, // Number of texts to translate in a single API call
    MAX_TOKENS: 2000, // Maximum tokens per batch request
    TIMEOUT: 60000, // Timeout for batch requests (ms)
  };
}

// Helper function to create parallel processing settings
function createParallelSettings() {
  return {
    MAX_CONCURRENT_LANGUAGES: 3, // Maximum languages to process simultaneously
    MAX_CONCURRENT_BATCHES: 2, // Maximum batches per language simultaneously
    ENABLED: true, // Enable parallel processing
  };
}

// Helper function to create rate limiting settings
function createRateLimitSettings() {
  return {
    // Individual requests
    MIN_DELAY_INDIVIDUAL: 1000, // Minimum delay between individual requests (ms)
    MAX_DELAY_INDIVIDUAL: 3000, // Maximum delay between individual requests (ms)

    // Batch requests
    MIN_DELAY_BATCH: 500, // Minimum delay between batch requests (ms)
    MAX_DELAY_BATCH: 2000, // Maximum delay between batch requests (ms)

    // Retry settings
    MAX_RETRIES: 3, // Maximum retry attempts for rate limits
    BACKOFF_MULTIPLIER: 2, // Exponential backoff multiplier
  };
}

// Helper function to create caching settings
function createCacheSettings() {
  return {
    SAVE_INTERVAL: 10, // Save cache every N requests
    ENABLED: true, // Enable caching
    CLEAR_ON_START: false, // Clear cache on startup
  };
}

// Helper function to create fallback settings
function createFallbackSettings() {
  return {
    ENABLE_INDIVIDUAL: true, // Fallback to individual translations if batch fails
    ENABLE_SEQUENTIAL: true, // Fallback to sequential processing if parallel fails
    KEEP_ORIGINAL: true, // Keep original text if translation fails
  };
}

// Helper function to create monitoring settings
function createMonitoringSettings() {
  return {
    LOG_TOKEN_USAGE: true, // Log token usage for each request
    LOG_PERFORMANCE: true, // Log performance metrics
    LOG_RATE_LIMITS: true, // Log rate limit events
  };
}

// Helper function to create API settings
function createAPISettings() {
  return {
    MODEL: 'gpt-3.5-turbo', // OpenAI model to use
    TEMPERATURE: 0.3, // Temperature for translation consistency
    MAX_TOKENS: 500, // Maximum tokens for individual requests
    TIMEOUT: 30000, // Timeout for individual requests (ms)
  };
}

export const PERFORMANCE_CONFIG = {
  // 🚀 Batch Processing Settings
  BATCH: createBatchSettings(),

  // ⚡ Parallel Processing Settings
  PARALLEL: createParallelSettings(),

  // 🐌 Rate Limiting Settings
  RATE_LIMIT: createRateLimitSettings(),

  // 💾 Caching Settings
  CACHE: createCacheSettings(),

  // 🔧 Fallback Settings
  FALLBACK: createFallbackSettings(),

  // 📊 Monitoring Settings
  MONITORING: createMonitoringSettings(),

  // 🎯 API Settings
  API: createAPISettings(),
};

// Helper function to create fast preset
function createFastPreset() {
  return {
    BATCH: { SIZE: 20, MAX_TOKENS: 4000 },
    PARALLEL: { MAX_CONCURRENT_LANGUAGES: 8, MAX_CONCURRENT_BATCHES: 5 },
    RATE_LIMIT: { MIN_DELAY_BATCH: 150, MAX_DELAY_BATCH: 800 },
  };
}

// Helper function to create conservative preset
function createConservativePreset() {
  return {
    BATCH: { SIZE: 8, MAX_TOKENS: 2000 },
    PARALLEL: { MAX_CONCURRENT_LANGUAGES: 2, MAX_CONCURRENT_BATCHES: 1 },
    RATE_LIMIT: { MIN_DELAY_BATCH: 800, MAX_DELAY_BATCH: 2500 },
  };
}

// Helper function to create balanced preset
function createBalancedPreset() {
  return {
    BATCH: { SIZE: 15, MAX_TOKENS: 3000 },
    PARALLEL: { MAX_CONCURRENT_LANGUAGES: 5, MAX_CONCURRENT_BATCHES: 4 },
    RATE_LIMIT: { MIN_DELAY_BATCH: 200, MAX_DELAY_BATCH: 1000 },
  };
}

// Preset configurations for different scenarios
export const PRESET_CONFIGS = {
  // 🚀 Fast Mode - Aggressive optimization (use with high API limits)
  FAST: createFastPreset(),

  // 🐌 Conservative Mode - Safe for low API limits
  CONSERVATIVE: createConservativePreset(),

  // ⚖️ Balanced Mode - Good balance of speed and safety
  BALANCED: createBalancedPreset(),
};

// Helper function to validate preset exists
function validatePresetExists(presetName) {
  const preset = PRESET_CONFIGS[presetName.toUpperCase()];
  if (!preset) {
    const availablePresets = Object.keys(PRESET_CONFIGS).join(', ');
    throw new Error(
      `Unknown preset: ${presetName}. Available presets: ${availablePresets}`
    );
  }
  return preset;
}

// Helper function to merge preset category
function mergePresetCategory(config, preset, category) {
  Object.keys(preset[category]).forEach((key) => {
    config[category][key] = preset[category][key];
  });
}

// Helper function to deep merge preset with base config
function deepMergePreset(preset) {
  Object.keys(preset).forEach((category) => {
    mergePresetCategory(PERFORMANCE_CONFIG, preset, category);
  });
}

// Function to apply a preset configuration
export function applyPreset(presetName) {
  const preset = validatePresetExists(presetName);
  deepMergePreset(preset);

  console.log(`✅ Applied ${presetName} preset configuration`);
  return PERFORMANCE_CONFIG;
}

// Helper function to validate batch settings
function validateBatchSettings(config, errors) {
  if (config.BATCH.SIZE < 1 || config.BATCH.SIZE > 20) {
    errors.push('BATCH.SIZE should be between 1 and 20');
  }
}

// Helper function to validate parallel settings
function validateParallelSettings(config, errors) {
  if (config.PARALLEL.MAX_CONCURRENT_LANGUAGES < 1) {
    errors.push('PARALLEL.MAX_CONCURRENT_LANGUAGES should be at least 1');
  }
}

// Helper function to validate rate limiting settings
function validateRateLimitSettings(config, errors) {
  if (config.RATE_LIMIT.MIN_DELAY_BATCH > config.RATE_LIMIT.MAX_DELAY_BATCH) {
    errors.push('MIN_DELAY_BATCH cannot be greater than MAX_DELAY_BATCH');
  }
}

// Helper function to create validation error message
function createValidationErrorMessage(errors) {
  return `Configuration validation failed:\n${errors.join('\n')}`;
}

// Function to validate configuration
export function validateConfig(config = PERFORMANCE_CONFIG) {
  const errors = [];

  validateBatchSettings(config, errors);
  validateParallelSettings(config, errors);
  validateRateLimitSettings(config, errors);

  if (errors.length > 0) {
    throw new Error(createValidationErrorMessage(errors));
  }

  return true;
}

// Helper function to check if API limits support fast mode
function supportsFastMode(apiLimits) {
  const { rpm, tpm } = apiLimits;
  return rpm >= 3000 && tpm >= 300000;
}

// Helper function to check if API limits support balanced mode
function supportsBalancedMode(apiLimits) {
  const { rpm, tpm } = apiLimits;
  return rpm >= 1000 && tpm >= 100000;
}

// Function to get recommended settings based on API limits
export function getRecommendedConfig(apiLimits) {
  if (supportsFastMode(apiLimits)) {
    return applyPreset('FAST');
  } else if (supportsBalancedMode(apiLimits)) {
    return applyPreset('BALANCED');
  } else {
    return applyPreset('CONSERVATIVE');
  }
}

// Export default configuration
export default PERFORMANCE_CONFIG;
