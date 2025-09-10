import fs from 'fs';
import path from 'path';

export function loadTargetLanguages(localesDir, languageFile) {
  if (languageFile) {
    return loadFromLanguageFile(languageFile);
  } else {
    return loadFromLocalesDirectory(localesDir);
  }
}

function loadFromLanguageFile(languageFile) {
  try {
    const content = fs.readFileSync(languageFile, 'utf8');
    const languages = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(' ')[0]);

    console.log(
      `📄 Loaded ${languages.length} target languages from: ${languageFile}`
    );
    return languages;
  } catch (error) {
    throw new Error(`Error reading language file: ${error.message}`);
  }
}

function loadFromLocalesDirectory(localesDir) {
  try {
    const files = fs.readdirSync(localesDir);
    const languages = files
      .filter((file) => file.endsWith('.json') && file !== 'en.json')
      .map((file) => file.replace('.json', ''));

    console.log(
      `📁 Found ${languages.length} language files in: ${localesDir}`
    );
    return languages;
  } catch (error) {
    throw new Error(`Error reading locales directory: ${error.message}`);
  }
}

export function validateLanguageFiles(localesDir, languages) {
  const missingFiles = [];

  for (const lang of languages) {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(lang);
    }
  }

  if (missingFiles.length > 0) {
    console.warn(`⚠️  Missing language files: ${missingFiles.join(', ')}`);
  }

  return missingFiles;
}
