import fs from 'fs';
import path from 'path';

/**
 * Tracks translation failures and generates reports
 */
class TranslationFailureReporter {
  constructor() {
    this.failures = new Map(); // Map<targetFile, Array<{flattenedKey, fallbackTranslation}>>
  }

  /**
   * Records a translation failure
   * @param {string} targetFile - The target language file (e.g., 'es.json')
   * @param {string} flattenedKey - The flattened translation key
   * @param {string} fallbackTranslation - The fallback translation (usually English)
   */
  recordFailure(targetFile, flattenedKey, fallbackTranslation) {
    if (!this.failures.has(targetFile)) {
      this.failures.set(targetFile, []);
    }

    this.failures.get(targetFile).push({
      flattenedKey,
      fallbackTranslation,
    });
  }

  /**
   * Gets all recorded failures
   * @returns {Array} Array of failure objects sorted by targetFile
   */
  getAllFailures() {
    const allFailures = [];

    // Sort target files alphabetically
    const sortedTargetFiles = Array.from(this.failures.keys()).sort();

    for (const targetFile of sortedTargetFiles) {
      const failures = this.failures.get(targetFile);
      for (const failure of failures) {
        allFailures.push({
          ...failure,
          targetFile,
        });
      }
    }

    return allFailures;
  }

  /**
   * Generates a JSON report file
   * @param {string} outputPath - Path where to save the report
   * @returns {string} Path to the generated report
   */
  generateReport(outputPath = './translation-failures-report.json') {
    const failures = this.getAllFailures();

    if (failures.length === 0) {
      console.log('✅ No translation failures to report');
      return null;
    }

    const report = {
      summary: {
        totalFailures: failures.length,
        targetFiles: Array.from(this.failures.keys()).sort(),
        generatedAt: new Date().toISOString(),
      },
      failures: failures,
    };

    try {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write report
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

      console.log(`📊 Translation failures report generated: ${outputPath}`);
      console.log(`   Total failures: ${failures.length}`);
      console.log(
        `   Target files affected: ${report.summary.targetFiles.join(', ')}`
      );

      return outputPath;
    } catch (error) {
      console.error(
        '❌ Error generating translation failures report:',
        error.message
      );
      return null;
    }
  }

  /**
   * Clears all recorded failures
   */
  clearFailures() {
    this.failures.clear();
  }

  /**
   * Gets failure count for a specific target file
   * @param {string} targetFile - The target language file
   * @returns {number} Number of failures for the target file
   */
  getFailureCount(targetFile) {
    return this.failures.has(targetFile)
      ? this.failures.get(targetFile).length
      : 0;
  }

  /**
   * Gets total failure count across all target files
   * @returns {number} Total number of failures
   */
  getTotalFailureCount() {
    let total = 0;
    for (const failures of this.failures.values()) {
      total += failures.length;
    }
    return total;
  }
}

// Export singleton instance
export const translationFailureReporter = new TranslationFailureReporter();

// Also export the class for testing purposes
export { TranslationFailureReporter };
