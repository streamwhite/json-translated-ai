#!/usr/bin/env node

import dotenv from 'dotenv';
import { checkAIHealth, validateModel } from './ai-client-manager.js';
import { cleanup, loadCache, setCacheFile } from './cache-manager.js';
import {
  parseArguments,
  validateEnvironment,
  validateSettings,
} from './cli-interface.js';
import {
  loadEnglishTemplate,
  loadLanguageStructures,
} from './file-processor.js';
import { validateLanguageStructures } from './folder-structure-utils.js';
import { loadTargetLanguages } from './language-loader.js';
import { processLanguagesWithStrategy as processMultiFileLanguagesWithStrategy } from './multi-file-parallel-processor.js';
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
      templateLanguage,
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

    // Check if multi-file structure is detected
    const { languageStructures, templateStructure } = loadLanguageStructures(
      localesDir,
      templateLanguage
    );
    const isMultiFileStructure = Object.values(languageStructures).some(
      (lang) => lang.files.length > 1 || lang.directory !== localesDir
    );

    let results;
    let languageFiles;
    let englishTemplate;

    if (isMultiFileStructure) {
      console.log('📁 Multi-file structure detected');

      // Validate language structures
      const validation = validateLanguageStructures(
        languageStructures,
        templateStructure
      );
      if (!validation.valid) {
        console.error('❌ Language structure validation failed:');
        validation.errors.forEach((error) => console.error(`   ${error}`));
        process.exit(1);
      }

      const languageCodes = Object.keys(languageStructures);
      console.log(`🌍 Processing languages: ${languageCodes.join(', ')}`);

      // Count total files for progress tracking
      const totalFiles = Object.values(languageStructures).reduce(
        (sum, lang) => sum + lang.files.length,
        0
      );

      // Initialize progress tracking
      initializeLanguageProgress(totalFiles);
      console.log('\n📊 Progress:');

      // Process languages with multi-file strategy
      results = await processMultiFileLanguagesWithStrategy(
        languageStructures,
        templateStructure,
        localesDir,
        model
      );
    } else {
      console.log('📄 Single-file structure detected');

      // Load target languages and English template (legacy mode)
      languageFiles = loadTargetLanguages(localesDir, languageFile);
      console.log(`🌍 Processing: ${languageFiles.join(', ')}`);

      englishTemplate = loadEnglishTemplate(localesDir, templateLanguage);

      // Initialize progress tracking
      const progressBar = initializeLanguageProgress(languageFiles.length);
      console.log('\n📊 Progress:');

      // Process languages with appropriate strategy
      results = await processLanguagesWithStrategy(
        languageFiles,
        localesDir,
        englishTemplate,
        progressBar,
        model
      );
    }

    // Generate reports and summaries
    if (isMultiFileStructure) {
      // For multi-file structure, generate summary based on results
      const languageCodes = Object.keys(languageStructures);
      generateFinalSummary(localesDir, languageCodes, templateStructure);
      showMissingKeyAnalysis(localesDir, languageCodes, templateStructure);
      generateProcessingReport(results);
    } else {
      // For single-file structure (legacy)
      generateFinalSummary(localesDir, languageFiles, englishTemplate);
      showMissingKeyAnalysis(localesDir, languageFiles, englishTemplate);
      generateProcessingReport(results);
    }

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
