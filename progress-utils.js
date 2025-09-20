import cliProgress from 'cli-progress';
import ora from 'ora';

// Create a multi-bar container for showing multiple progress bars
const multibar = new cliProgress.MultiBar({
  clearOnComplete: false,
  hideCursor: true,
  format: ' {bar} | {percentage}% | {value}/{total} | {language} | {status}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  stopOnComplete: true,
});

// Progress bar for overall language processing
let languageProgressBar = null;

// Progress bar for batch processing within each language
let batchProgressBar = null;

// Spinner for individual translation operations
let translationSpinner = null;

export function initializeLanguageProgress(totalLanguages) {
  languageProgressBar = multibar.create(totalLanguages, 0, {
    language: 'Overall',
    status: 'Starting...',
  });
  return languageProgressBar;
}

export function updateLanguageProgress(current, language, status) {
  if (languageProgressBar) {
    languageProgressBar.update(current, {
      language: language,
      status: status,
    });
  }
}

export function initializeBatchProgress(totalBatches, language) {
  batchProgressBar = multibar.create(totalBatches, 0, {
    language: language,
    status: 'Processing batches...',
  });
  return batchProgressBar;
}

export function updateBatchProgress(current, status) {
  if (batchProgressBar) {
    batchProgressBar.update(current, {
      status: status,
    });
  }
}

export function startTranslationSpinner(text = 'Translating...') {
  // Stop any existing spinner before starting a new one
  if (translationSpinner) {
    translationSpinner.stop();
    translationSpinner = null;
  }
  translationSpinner = ora(text).start();
  return translationSpinner;
}

export function updateTranslationSpinner(text) {
  if (translationSpinner) {
    translationSpinner.text = text;
  }
}

export function stopTranslationSpinner(success = true, text = '') {
  if (translationSpinner) {
    try {
      if (success) {
        translationSpinner.succeed(text || 'Translation completed');
      } else {
        translationSpinner.fail(text || 'Translation failed');
      }
    } catch (error) {
      // If there's an error stopping the spinner, just stop it silently
      try {
        translationSpinner.stop();
      } catch (stopError) {
        // Ignore stop errors
      }
    }
    translationSpinner = null;
  }
}

export function stopAllProgress() {
  try {
    if (languageProgressBar) {
      languageProgressBar.stop();
      languageProgressBar = null;
    }
  } catch (error) {
    // Ignore errors stopping language progress bar
  }

  try {
    if (batchProgressBar) {
      batchProgressBar.stop();
      batchProgressBar = null;
    }
  } catch (error) {
    // Ignore errors stopping batch progress bar
  }

  try {
    if (translationSpinner) {
      translationSpinner.stop();
      translationSpinner = null;
    }
  } catch (error) {
    // Ignore errors stopping translation spinner
  }

  try {
    multibar.stop();
  } catch (error) {
    // Ignore errors stopping multibar
  }
}

export function createSimpleProgressBar(total, description = 'Progress') {
  return multibar.create(total, 0, {
    language: description,
    status: 'Starting...',
  });
}
