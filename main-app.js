#!/usr/bin/env node

import dotenv from 'dotenv';
import { checkAIHealth, validateModel } from './ai-client-manager.js';
import { cleanup, loadCache, setCacheFile } from './cache-manager.js';
import {
  parseArguments,
  validateEnvironment,
  validateSettings,
} from './cli-interface.js';
import { loadEnglishTemplate } from './file-processor.js';
import { loadTargetLanguages } from './language-loader.js';
import { processLanguagesWithStrategy } from './parallel-processor.js';
import { applyPreset } from './performance-config.js';
import {
  initializeLanguageProgress,
  stopAllProgress,
} from './progress-utils.js';
import {
  generateFinalSummary,
  generateProcessingReport,
  showMissingKeyAnalysis,
} from './summary-generator.js';
import { translationFailureReporter } from './translation-failure-reporter.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Parse and validate command line arguments
    const {
      localesDir,
      languageFile,
      cacheFile,
      performancePreset,
      model,
      providerKey,
      providerProxyUrl,
      systemMessage,
    } = parseArguments();

    // Set environment variables from command line if provided
    if (providerKey) {
      process.env.PROVIDER_KEY = providerKey;
    }
    if (providerProxyUrl) {
      process.env.PROVIDER_PROXY_URL = providerProxyUrl;
    }
    if (systemMessage) {
      process.env.CUSTOM_SYSTEM_MESSAGE = systemMessage;
      console.log(`📝 Using custom system message: "${systemMessage}"`);
    }

    // Validate model
    validateModel(model);
    const modelConfig = (await import('./config.js')).SUPPORTED_MODELS[model];
    console.log(`🤖 Using: ${modelConfig.name}`);

    // Apply performance preset if specified
    if (performancePreset) {
      try {
        applyPreset(performancePreset);
        console.log(`⚡ Preset: ${performancePreset}`);
      } catch (error) {
        console.error(
          `❌ Error applying preset ${performancePreset}:`,
          error.message
        );
        process.exit(1);
      }
    }

    // Set up cache file
    setCacheFile(cacheFile);
    loadCache();

    // Validate settings and environment
    validateSettings(localesDir, languageFile);
    validateEnvironment();
    await checkAIHealth(model);

    // Load target languages and English template
    const languageFiles = loadTargetLanguages(localesDir, languageFile);
    console.log(`🌍 Processing: ${languageFiles.join(', ')}`);

    const englishTemplate = loadEnglishTemplate(localesDir);

    // Initialize progress tracking
    const progressBar = initializeLanguageProgress(languageFiles.length);
    console.log('\n📊 Progress:');

    // Process languages with appropriate strategy
    const results = await processLanguagesWithStrategy(
      languageFiles,
      localesDir,
      englishTemplate,
      progressBar,
      model
    );

    // Generate reports and summaries
    generateFinalSummary(localesDir, languageFiles, englishTemplate);
    showMissingKeyAnalysis(localesDir, languageFiles, englishTemplate);
    generateProcessingReport(results);

    // Generate translation failures report
    const failuresReportPath = translationFailureReporter.generateReport();
    if (failuresReportPath) {
      console.log(`📊 Failures report: ${failuresReportPath}`);
    }

    console.log('\n🎉 Translation completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    stopAllProgress();
    cleanup();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted by user');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Process terminated');
  cleanup();
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  cleanup();
  process.exit(1);
});
