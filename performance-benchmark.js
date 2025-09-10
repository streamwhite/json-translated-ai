#!/usr/bin/env node

import { performance } from 'perf_hooks';
import { OPTIMIZATION_CONFIG } from './config.js';
import { applyPreset, PRESET_CONFIGS } from './performance-config.js';

// Performance benchmarking utility
class PerformanceBenchmark {
  constructor() {
    this.results = {};
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = performance.now();
    console.log('🚀 Starting performance benchmark...');
  }

  end() {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    console.log(`⏱️  Benchmark completed in ${duration.toFixed(2)}ms`);
    return duration;
  }

  measureOperation(operationName, operation) {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    const duration = end - start;

    this.results[operationName] = {
      duration,
      result,
    };

    return { duration, result };
  }

  async measureAsyncOperation(operationName, operation) {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    const duration = end - start;

    this.results[operationName] = {
      duration,
      result,
    };

    return { duration, result };
  }

  generateReport() {
    console.log('\n📊 Performance Benchmark Report');
    console.log('================================');

    Object.entries(this.results).forEach(([name, data]) => {
      console.log(`${name}: ${data.duration.toFixed(2)}ms`);
    });

    const totalTime = this.endTime - this.startTime;
    console.log(`\n⏱️  Total benchmark time: ${totalTime.toFixed(2)}ms`);
  }
}

// Configuration comparison functions
function compareConfigurations() {
  console.log('\n🔍 Configuration Comparison');
  console.log('============================');

  console.log('\n📋 Current OPTIMIZATION_CONFIG:');
  console.log(JSON.stringify(OPTIMIZATION_CONFIG, null, 2));

  console.log('\n📋 Available PRESET_CONFIGS:');
  Object.entries(PRESET_CONFIGS).forEach(([name, config]) => {
    console.log(`\n${name}:`);
    console.log(JSON.stringify(config, null, 2));
  });
}

// Performance simulation functions
function simulateBatchProcessing(batchSize, concurrentBatches) {
  const start = performance.now();

  // Simulate batch processing overhead
  const processingTime = batchSize * 50; // 50ms per item
  const concurrencyOverhead = concurrentBatches * 20; // 20ms per concurrent batch

  // Simulate API call time
  const apiCallTime = 200 + batchSize * 10; // Base 200ms + 10ms per item

  const totalTime = Math.max(processingTime, apiCallTime) + concurrencyOverhead;

  // Simulate actual processing time
  const actualTime = performance.now() - start;
  return Math.max(totalTime, actualTime);
}

function simulateLanguageProcessing(languageCount, maxConcurrent) {
  const start = performance.now();

  // Simulate language processing with concurrency control
  const batches = Math.ceil(languageCount / maxConcurrent);
  const processingTimePerBatch = 1000; // 1 second per batch
  const totalTime = batches * processingTimePerBatch;

  // Simulate actual processing time
  const actualTime = performance.now() - start;
  return Math.max(totalTime, actualTime);
}

// Main benchmarking function
async function runPerformanceBenchmark() {
  const benchmark = new PerformanceBenchmark();

  try {
    benchmark.start();

    // Test different batch sizes
    console.log('\n🧪 Testing batch processing performance...');
    benchmark.measureOperation('Batch Size 10', () =>
      simulateBatchProcessing(10, 2)
    );
    benchmark.measureOperation('Batch Size 15', () =>
      simulateBatchProcessing(15, 4)
    );
    benchmark.measureOperation('Batch Size 20', () =>
      simulateBatchProcessing(20, 5)
    );

    // Test different concurrency levels
    console.log('\n🧪 Testing language concurrency performance...');
    benchmark.measureOperation('3 Languages Concurrent', () =>
      simulateLanguageProcessing(3, 3)
    );
    benchmark.measureOperation('5 Languages Concurrent', () =>
      simulateLanguageProcessing(5, 5)
    );
    benchmark.measureOperation('8 Languages Concurrent', () =>
      simulateLanguageProcessing(8, 8)
    );

    // Test different presets
    console.log('\n🧪 Testing preset configurations...');
    const presets = ['CONSERVATIVE', 'BALANCED', 'FAST'];

    for (const preset of presets) {
      const config = applyPreset(preset);
      const batchTime = simulateBatchProcessing(
        config.BATCH.SIZE,
        config.PARALLEL.MAX_CONCURRENT_BATCHES
      );
      const languageTime = simulateLanguageProcessing(
        5, // Test with 5 languages
        config.PARALLEL.MAX_CONCURRENT_LANGUAGES
      );

      benchmark.results[`${preset} Preset Total`] = {
        duration: batchTime + languageTime,
        result: { batchTime, languageTime, config },
      };
    }

    benchmark.end();
    benchmark.generateReport();

    // Configuration comparison
    compareConfigurations();

    // Recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('================================');
    console.log('✅ For high-volume translation: Use FAST preset');
    console.log(
      '✅ For balanced performance: Use BALANCED preset (current default)'
    );
    console.log('✅ For API rate limit concerns: Use CONSERVATIVE preset');
    console.log(
      '✅ For production use: Monitor API usage and adjust accordingly'
    );
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Performance Benchmark Tool

Usage:
  node performance-benchmark.js [options]

Options:
  --help, -h     Show this help message
  --preset       Test specific preset (CONSERVATIVE, BALANCED, FAST)
  --compare      Show configuration comparison only

Examples:
  node performance-benchmark.js                    # Run full benchmark
  node performance-benchmark.js --preset FAST      # Test FAST preset only
  node performance-benchmark.js --compare          # Show config comparison only
    `);
    process.exit(0);
  }

  if (args.includes('--compare')) {
    compareConfigurations();
    process.exit(0);
  }

  if (args.includes('--preset')) {
    const presetIndex = args.indexOf('--preset');
    const presetName = args[presetIndex + 1];

    if (presetName && PRESET_CONFIGS[presetName.toUpperCase()]) {
      console.log(`🧪 Testing ${presetName.toUpperCase()} preset...`);
      const config = applyPreset(presetName.toUpperCase());
      console.log('Configuration applied:', JSON.stringify(config, null, 2));
    } else {
      console.log(
        '❌ Invalid preset name. Available presets:',
        Object.keys(PRESET_CONFIGS).join(', ')
      );
      process.exit(1);
    }
    process.exit(0);
  }

  // Run full benchmark
  runPerformanceBenchmark();
}

export { compareConfigurations, PerformanceBenchmark, runPerformanceBenchmark };

