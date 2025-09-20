import fs from 'fs';
import path from 'path';
import { CACHE_CONFIG } from './config.js';

let CACHE_FILE = path.join(process.cwd(), CACHE_CONFIG.DEFAULT_CACHE_FILE);
let translationCache = {};
let totalTokensUsed = 0;
let totalRequests = 0;

export function setCacheFile(cacheFilePath) {
  CACHE_FILE = cacheFilePath;
}

export function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      translationCache = cacheData.translations || {};
      totalTokensUsed = cacheData.totalTokensUsed || 0;
      totalRequests = cacheData.totalRequests || 0;
    } else {
      // Ensure directory exists and create an empty cache file
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const initialData = {
        translations: {},
        totalTokensUsed: 0,
        totalRequests: 0,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(
        CACHE_FILE,
        JSON.stringify(initialData, null, 2),
        'utf8'
      );
      translationCache = {};
      totalTokensUsed = 0;
      totalRequests = 0;
    }
  } catch (error) {
    console.log('⚠️  Could not load translation cache, starting fresh');
  }
}

export function saveCache() {
  try {
    const cacheData = {
      translations: translationCache,
      totalTokensUsed,
      totalRequests,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (error) {
    console.log('⚠️  Could not save translation cache:', error.message);
  }
}

export function updateTokenUsage(completion) {
  if (completion?.usage) {
    const { total_tokens } = completion.usage;
    totalTokensUsed += total_tokens;
    totalRequests += 1;
  }
}

export function getCachedTranslation(text, targetLanguage) {
  const cacheKey = `${text
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .toLowerCase()}_${targetLanguage}`;
  return translationCache[cacheKey];
}

export function setCachedTranslation(text, targetLanguage, translation) {
  const cacheKey = `${text
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .toLowerCase()}_${targetLanguage}`;
  translationCache[cacheKey] = translation;
}

export function shouldSaveCache() {
  return (
    Object.keys(translationCache).length % CACHE_CONFIG.SAVE_INTERVAL === 0
  );
}

export function cleanup() {
  saveCache();
}

export function getCacheStats() {
  return {
    entries: Object.keys(translationCache).length,
    totalTokensUsed,
    totalRequests,
  };
}

export function getTranslationCache() {
  return translationCache;
}
