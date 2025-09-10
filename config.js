// AI model configuration
export const SUPPORTED_MODELS = {
  // OpenAI Models
  'gpt-4.1': {
    provider: 'openai',
    name: 'GPT-4.1',
    description: 'Latest GPT-4 model with improved performance',
    cost: 'medium',
    recommended: true,
  },
  'gpt-4o': {
    provider: 'openai',
    name: 'GPT-4o',
    description: 'Fast and efficient GPT-4 model',
    cost: 'medium',
    recommended: false,
  },
  'gpt-4o-mini': {
    provider: 'openai',
    name: 'GPT-4o Mini',
    description: 'Cost-effective GPT-4 model',
    cost: 'low',
    recommended: true,
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective model',
    cost: 'low',
    recommended: false,
  },

  // Anthropic Models
  'claude-3-5-sonnet-20241022': {
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    description: 'Latest Claude model with excellent performance',
    cost: 'medium',
    recommended: true,
  },
  'claude-3-haiku-20240307': {
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    description: 'Fast and cost-effective Claude model',
    cost: 'low',
    recommended: true,
  },
  'claude-3-opus-20240229': {
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    description: 'Most capable Claude model',
    cost: 'high',
    recommended: false,
  },

  // Google Models
  'gemini-2.5-flash': {
    provider: 'google',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient Gemini model',
    cost: 'low',
    recommended: true,
  },
  'gemini-2.0-flash-exp': {
    provider: 'google',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and efficient Gemini model',
    cost: 'low',
    recommended: false,
  },
  'gemini-1.5-flash': {
    provider: 'google',
    name: 'Gemini 1.5 Flash',
    description: 'Balanced Gemini model',
    cost: 'low',
    recommended: false,
  },
  'gemini-1.5-pro': {
    provider: 'google',
    name: 'Gemini 1.5 Pro',
    description: 'Capable Gemini model',
    cost: 'medium',
    recommended: false,
  },
};

// Default model configuration
const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_MODEL_NAME = DEFAULT_MODEL;

// Provider configuration
export const PROVIDER_CONFIG = {
  openai: {
    envKey: 'PROVIDER_KEY',
    envUrl: 'PROVIDER_PROXY_URL',
    defaultUrl: 'https://api.openai.com/v1',
    clientClass: 'OpenAI',
  },
  anthropic: {
    envKey: 'PROVIDER_KEY',
    envUrl: 'PROVIDER_PROXY_URL',
    defaultUrl: 'https://api.anthropic.com',
    clientClass: 'Anthropic',
  },
  google: {
    envKey: 'PROVIDER_KEY',
    envUrl: 'PROVIDER_PROXY_URL',
    defaultUrl: 'https://generativelanguage.googleapis.com',
    clientClass: 'GoogleGenerativeAI',
  },
};

export const OPTIMIZATION_CONFIG = {
  // 🚀 Batch Processing - Optimized for throughput
  BATCH_SIZE: 15, // Increased from 10 for better efficiency
  MAX_CONCURRENT_LANGUAGES: 5, // Increased from 3 for better parallelization
  MAX_CONCURRENT_BATCHES: 4, // Increased from 2 for better batch processing

  // ⚡ Rate Limiting - Optimized for speed while respecting limits
  MIN_DELAY_BETWEEN_BATCHES: 200, // Reduced from 500 for faster processing
  MAX_DELAY_BETWEEN_BATCHES: 1000, // Reduced from 2000 for better throughput

  // 🔧 Fallback Settings
  ENABLE_INDIVIDUAL_FALLBACK: true,
  ENABLE_PARALLEL_FALLBACK: true,

  // 📊 Performance Monitoring
  ENABLE_PERFORMANCE_LOGGING: true,
  LOG_TOKEN_USAGE: true,

  // 🎯 API Optimization
  MAX_TOKENS_PER_BATCH: 3000, // Increased for better batch efficiency
  BATCH_TIMEOUT: 45000, // Reduced from 60000 for faster failure detection
  INDIVIDUAL_TIMEOUT: 25000, // Reduced from 30000 for faster processing
};

export const CACHE_CONFIG = {
  SAVE_INTERVAL: 10,
  DEFAULT_CACHE_FILE: 'translation-cache.json',
};

export const API_CONFIG = {
  TIMEOUT: 30000,
  BATCH_TIMEOUT: 60000,
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2,
};

export const LANGUAGE_NAMES = {
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  lt: 'Lithuanian',
  uk: 'Ukrainian',
  sr: 'Serbian',
  el: 'Greek',
  he: 'Hebrew',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  hi: 'Hindi',
  bn: 'Bengali',
  ur: 'Urdu',
  fa: 'Persian',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  gu: 'Gujarati',
  pa: 'Punjabi',
  mr: 'Marathi',
  ne: 'Nepali',
  si: 'Sinhala',
  my: 'Burmese',
  km: 'Khmer',
  lo: 'Lao',
  mn: 'Mongolian',
  ka: 'Georgian',
  am: 'Amharic',
  sw: 'Swahili',
  yo: 'Yoruba',
  ig: 'Igbo',
  ha: 'Hausa',
  zu: 'Zulu',
  af: 'Afrikaans',
  is: 'Icelandic',
  mt: 'Maltese',
  cy: 'Welsh',
  ga: 'Irish',
  sq: 'Albanian',
  mk: 'Macedonian',
  bs: 'Bosnian',
  me: 'Montenegrin',
  ky: 'Kyrgyz',
  kk: 'Kazakh',
  uz: 'Uzbek',
  tg: 'Tajik',
  tk: 'Turkmen',
  az: 'Azerbaijani',
  hy: 'Armenian',
  bo: 'Tibetan',
  dz: 'Dzongkha',
  tl: 'Tagalog',
  ceb: 'Cebuano',
  jv: 'Javanese',
  su: 'Sundanese',
  ps: 'Pashto',
  sd: 'Sindhi',
};
