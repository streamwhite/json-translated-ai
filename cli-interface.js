import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_MODEL_NAME,
  SUPPORTED_MODELS,
  TEMPLATE_CONFIG,
} from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseArguments(args = process.argv.slice(2)) {
  // Default to CWD/locales to align with user expectation when running from project root
  let localesDir = path.join(process.cwd(), 'locales');
  let languageFile = null;
  let cacheFile = path.join(process.cwd(), 'translation-cache.json');
  let performancePreset = null;
  let model = DEFAULT_MODEL_NAME;
  let providerKey = null;
  let providerProxyUrl = null;
  let systemMessage = null;
  let templateLanguage = TEMPLATE_CONFIG.DEFAULT_TEMPLATE_LANGUAGE;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--folder' || arg === '-f') {
      if (i + 1 < args.length) {
        localesDir = path.resolve(args[i + 1]);
        i++;
      } else {
        console.error('❌ Error: --folder requires a path');
        process.exit(1);
      }
    } else if (arg === '--languages' || arg === '-l') {
      if (i + 1 < args.length) {
        languageFile = path.resolve(args[i + 1]);
        i++;
      } else {
        console.error('❌ Error: --languages requires a file path');
        process.exit(1);
      }
    } else if (arg === '--cache' || arg === '-c') {
      if (i + 1 < args.length) {
        cacheFile = path.resolve(args[i + 1]);
        i++;
      } else {
        console.error('❌ Error: --cache requires a file path');
        process.exit(1);
      }
    } else if (arg === '--preset' || arg === '-p') {
      if (i + 1 < args.length) {
        performancePreset = args[i + 1].toUpperCase();
        i++;
      } else {
        console.error('❌ Error: --preset requires a preset name');
        process.exit(1);
      }
    } else if (arg === '--model' || arg === '-m') {
      if (i + 1 < args.length) {
        model = args[i + 1];
        i++;
      } else {
        console.error('❌ Error: --model requires a model name');
        process.exit(1);
      }
    } else if (arg === '--key' || arg === '-k') {
      if (i + 1 < args.length) {
        providerKey = args[i + 1];
        i++;
      } else {
        console.error('❌ Error: --key requires an API key');
        process.exit(1);
      }
    } else if (arg === '--url' || arg === '-u') {
      if (i + 1 < args.length) {
        providerProxyUrl = args[i + 1];
        i++;
      } else {
        console.error('❌ Error: --url requires a proxy URL');
        process.exit(1);
      }
    } else if (arg === '--system' || arg === '-s') {
      if (i + 1 < args.length) {
        systemMessage = args[i + 1];
        i++;
      } else {
        console.error('❌ Error: --system requires a message');
        process.exit(1);
      }
    } else if (arg === '--template' || arg === '-t') {
      if (i + 1 < args.length) {
        templateLanguage = args[i + 1];
        i++;
      } else {
        console.error('❌ Error: --template requires a language code');
        process.exit(1);
      }
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      showVersion();
      process.exit(0);
    }
  }

  return {
    localesDir,
    languageFile,
    cacheFile,
    performancePreset,
    model,
    providerKey,
    providerProxyUrl,
    systemMessage,
    templateLanguage,
  };
}

export function showHelp() {
  console.log(`
🚀 JSON Translation AI (JTA)

Usage: jta [options]

Options:
  -f <path>     Locales folder (contains en.json + target files)
  -l <file>     Language list file (one code per line)
  -c <file>     Custom cache file path
  -p <preset>   Performance: CONSERVATIVE|BALANCED|FAST
  -m <model>    AI model (see models below)
  -k <key>      API key (overrides env)
  -u <url>      Proxy URL (overrides env)
  -s <message>  Custom system message for translation context
  -t <lang>     Template language code (2 or 4 letter, default: en)
  -h            Show this help
  -v            Show version

Presets:
  CONSERVATIVE  Safe (2 langs, 1 batch) - low limits
  BALANCED     Good speed/safety (5 langs, 4 batches)
  FAST         Aggressive (8 langs, 5 batches) - high limits

Models:
${Object.entries(SUPPORTED_MODELS)
  .map(([id, model]) => {
    const rec = model.recommended ? '⭐' : '';
    const cost =
      model.cost === 'low' ? '💰' : model.cost === 'medium' ? '💰💰' : '💰💰💰';
    return `  ${id.padEnd(30)} ${rec} ${cost} ${model.name}`;
  })
  .join('\n')}

Default: ${DEFAULT_MODEL_NAME} ⭐

Examples:
  jta                                # Default settings
  jta -f ./locales                   # Custom folder
  jta -m anthropic/claude-3-haiku    # Claude model
  jta -m google/gemini-2.5-flash     # Gemini model
  jta -p FAST                        # Fast preset
  jta -k your_key                    # Direct API key
  jta -u https://openrouter.ai/api/v1 # OpenRouter proxy URL
  jta -s "E-commerce website translations"  # Custom context
  jta -l languages.txt               # Specific languages
  jta -c /path/to/custom-cache.json  # Custom cache file
  jta -t es                          # Use Spanish as template language
  jta -t en-GB                       # Use British English as template

Environment Variables:
  PROVIDER_KEY         OpenRouter API key (required)
  PROVIDER_PROXY_URL   OpenRouter proxy URL (required)
`);
}

export function showVersion() {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
    );
    console.log(`jta v${packageJson.version}`);
  } catch (error) {
    console.log('jta v1.0.0');
  }
}

export function validateSettings(localesDir, languageFile) {
  if (!fs.existsSync(localesDir)) {
    throw new Error(`Locales directory not found: ${localesDir}`);
  }

  const enJsonPath = path.join(localesDir, 'en.json');
  if (!fs.existsSync(enJsonPath)) {
    throw new Error(`en.json not found in: ${localesDir}`);
  }

  if (languageFile && !fs.existsSync(languageFile)) {
    throw new Error(`Language file not found: ${languageFile}`);
  }
}

export function validateEnvironment() {
  const hasProviderKey = process.env.PROVIDER_KEY;
  const hasProxyUrl = process.env.PROVIDER_PROXY_URL;

  if (!hasProviderKey) {
    throw new Error(
      'PROVIDER_KEY not found in environment variables. Please set your OpenRouter API key.'
    );
  }

  if (!hasProxyUrl) {
    throw new Error(
      'PROVIDER_PROXY_URL not found in environment variables. Please set your OpenRouter proxy URL.'
    );
  }
}
