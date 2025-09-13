# JSON Translation AI (JTA)

A CLI tool that automatically synchronizes and translates JSON translation files using multiple AI providers including OpenAI GPT, Anthropic Claude, and Google Gemini models. Perfect for maintaining consistent translations across multiple languages in your i18n projects.

## ✨ Features

### 🔒 Privacy & Security

- **100% Private**: Your content never stored except communication with AI providers.
- **Secure API Keys**: Your API keys are only used for translation requests, never stored. If you still worried, use a specific key and disable it.

### 💰 Cost-Effective AI Models

- **Smart Model Selection**: Choose from cost-effective models like Claude Haiku, GPT-4o Mini, and Gemini Flash.
- **Intelligent Caching**: Use cache first to avoid re-translating existing content to minimize API costs
- **Batch Processing**: Optimize API usage with efficient batch translations
- **Performance Presets**: Configure for your API limits and budget

### 🚀 Advanced Translation Features

- **Multi-File Structure Support**: Organize translations in folders with multiple JSON files per language
- **Flexible Key Structures**: Full support for both nested and flattened JSON key structures
- **Multi-Format Language Support**: Supports both 2-letter (ISO 639-1) and 4-letter (ISO 639-1 + ISO 3166-1) language codes
- **Locale-Specific Translations**: Handle regional variants like `en-US`, `zh-TW`, `es-MX`, `fr-CA` for precise localization
- **Smart Structure Detection**: Automatically detects single-file or multi-file structures
- **Folder Structure Preservation**: Maintains exact folder structure across all target languages
- **Concurrent File Processing**: Process multiple files per language simultaneously
- **Custom System Messages**: Provide specific context for better translation quality
- **Parallel Processing**: Multi-language processing with configurable concurrency
- **Fallback Strategy**: Automatic fallback to individual translations if batch processing fails
- **Progress Tracking**: Real-time progress bars and detailed logging for scheduling tasks
- **Comprehensive Reporting**: Detailed reports on translation success, failures, and missing keys

## 🚀 Quick Start

### 1. Installation

```bash
npm install -g json-translated-ai
```

### 2. Configure OpenRouter

Set your OpenRouter API key and proxy URL in your environment or `.env` file:

```bash
PROVIDER_KEY=your_openrouter_api_key_here
PROVIDER_PROXY_URL=https://openrouter.ai/api/v1
```

### 3. Run Translation

```bash

# Specify a custom folder, assume en.json in locales folder
jta --folder ./locales

# Specify a language file, language codes (2-letter or 4-letter) in each line
jta --languages languages.txt

# Use a specific AI model
jta --model anthropic/claude-3-haiku
jta --model google/gemini-2.5-flash

# Use performance preset
jta --preset FAST

# Specify API key and proxy URL directly
jta --key your_openrouter_key --url https://openrouter.ai/api/v1
```

## 📁 Multi-File Structure Support

The tool now supports organizing translations in multiple JSON files per language, making it perfect for large projects with organized translation structures.

### Single-File Structure (Legacy - Still Supported)

```
locales/
├── en.json
├── es.json
└── zh-TW.json
```

### Multi-File Structure (New Feature)

```
locales/
├── en/
│   ├── home.json
│   ├── products.json
│   ├── auth.json
│   └── common.json
├── es/
│   ├── home.json
│   ├── products.json
│   ├── auth.json
│   └── common.json
└── zh-TW/
    ├── home.json
    ├── products.json
    ├── auth.json
    └── common.json
```

### Nested Folder Structure

```
locales/
├── en/
│   ├── pages/
│   │   ├── home.json
│   │   └── products.json
│   ├── components/
│   │   ├── auth.json
│   │   └── common.json
│   └── admin/
│       └── dashboard.json
├── es/
│   ├── pages/
│   │   ├── home.json
│   │   └── products.json
│   ├── components/
│   │   ├── auth.json
│   │   └── common.json
│   └── admin/
│       └── dashboard.json
└── zh-TW/
    ├── pages/
    │   ├── home.json
    │   └── products.json
    ├── components/
    │   ├── auth.json
    │   └── common.json
    └── admin/
        └── dashboard.json
```

### Key Benefits

- **Better Organization**: Group related translations by feature or page
- **Easier Maintenance**: Smaller, focused files are easier to manage
- **Team Collaboration**: Multiple developers can work on different files simultaneously
- **Scalable Structure**: Easily add new files and folders as project grows
- **Automatic Detection**: No configuration needed - the system automatically detects your structure
- **Backward Compatibility**: Existing single-file projects continue to work unchanged

### Usage

Simply run the tool with your multi-file structure:

```bash
# Multi-file structure - automatically detected
jta --folder ./locales

# Single-file structure - still works as before
jta --folder ./locales
```

The system will:

- ✅ Automatically detect whether you're using single-file or multi-file structure
- ✅ Process all JSON files in each language folder
- ✅ Maintain the exact folder structure in target languages
- ✅ Handle both 2-letter and 4-letter language codes
- ✅ Process multiple files concurrently for better performance

## 🔄 Updated Keys Feature

The tool supports marking keys as updated in template files using `__updated_keys__` arrays. When a key is marked as updated, it will be re-translated in all target language files, even if it already exists.

### Usage

Add `__updated_keys__` arrays to your template objects to mark keys that need re-translation:

```json
{
  "hero": {
    "title": "Welcome to Our Platform",
    "subtitle": "The best solution for your needs",
    "cta": "Get Started",
    "__updated_keys__": ["title"]
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success!",
    "__updated_keys__": ["error", "success"]
  }
}
```

### Key Benefits

- **Selective Updates**: Only re-translate keys that have been updated
- **Cost Efficiency**: Avoid re-translating unchanged content
- **Precise Control**: Mark exactly which keys need updates
- **Nested Support**: Works with deeply nested object structures
- **Metadata Ignored**: `__updated_keys__` fields are automatically ignored in missing key detection

### How It Works

1. **Mark Updated Keys**: Add `__updated_keys__` arrays to objects containing updated keys
2. **Automatic Detection**: The system automatically finds and processes updated keys
3. **Combined Processing**: Updated keys are combined with missing keys for translation
4. **Re-translation**: Marked keys are re-translated even if they exist in target files

### Best Practices

- Add `__updated_keys__` only to objects where updates occur
- Use the same path pattern as regular keys (e.g., `hero.title`)
- Remove `__updated_keys__` arrays after translation is complete
- Keep `__updated_keys__` arrays minimal for better performance

## 🌐 Custom Template Language Support

The tool supports using any language as the template language, not just English. This is useful when your primary language is not English or when you want to use a specific regional variant.

### Usage

Specify a custom template language using the `--template` or `-t` option:

```bash
# Use Spanish as template language
jta --template es

# Use British English as template
jta --template en-GB

# Use French (France) as template
jta --template fr-FR

# Use German as template
jta --template de
```

### Supported Template Languages

The tool supports both 2-letter and 4-letter language codes:

- **2-letter codes**: `en`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `ru`, `ja`, `ko`, `zh`, `ar`, etc.
- **4-letter codes**: `en-US`, `en-GB`, `es-ES`, `es-MX`, `fr-FR`, `fr-CA`, `de-DE`, `de-AT`, etc.

### How It Works

1. **Template Detection**: The system looks for the specified template language in your locales directory
2. **Variant Support**: If the exact language code isn't found, it looks for variants (e.g., `es` will find `es-ES`, `es-MX`, etc.)
3. **File Structure**: Works with both single-file and multi-file structures
4. **Fallback**: If no template language is found, it falls back to English (`en`)

### Examples

```bash
# Single-file structure with Spanish template
locales/
├── es.json          # Template (Spanish)
├── en.json          # Target language
└── fr.json          # Target language

jta --template es

# Multi-file structure with French template
locales/
├── fr-FR/           # Template (French France)
│   ├── home.json
│   └── products.json
├── en/              # Target language
│   ├── home.json
│   └── products.json
└── de/              # Target language
    ├── home.json
    └── products.json

jta --template fr-FR
```

## 🤖 Supported AI Models

We select the most Cost-effective or capable models for translation.

### OpenAI Models

- **openai/gpt-4o-mini** ⭐💰 - Cost-effective GPT-4 model (default)
- **openai/gpt-4.1** 💰💰 - Latest GPT-4 model with improved performance
- **openai/gpt-4o** 💰💰 - Fast and efficient GPT-4 model

### Anthropic Models

- **anthropic/claude-3.5-sonnet** ⭐💰💰 - Claude model with excellent performance
- **anthropic/claude-3-haiku** ⭐💰 - Fast and cost-effective Claude model

### Google Models

- **google/gemini-2.5-flash** ⭐💰 - Fast and efficient Gemini model

## 🎯 Usage Examples

```bash
jta -h
```

### Combine options

```bash


# Combine options
jta --folder ./locales --languages languages.txt --model anthropic/claude-3-haiku --preset FAST --system "E-commerce website translations" --cache /path/to/custom-cache.json

```

short options is supported.

## ⚙️ Configuration

### Performance Presets

| Preset         | Concurrent Languages | Batch Size | Use Case                                 |
| -------------- | -------------------- | ---------- | ---------------------------------------- |
| `CONSERVATIVE` | 2                    | 1          | Low API limits, safe processing          |
| `BALANCED`     | 5                    | 4          | Good balance of speed and safety         |
| `FAST`         | 8                    | 5          | High API limits, aggressive optimization |

## 📊 Output

The tool provides comprehensive output including:

- **Progress Tracking**: Real-time progress bars for languages and batches
- **Translation Logs**: Detailed logs of each translation operation
- **Success Reports**: Summary of completed translations
- **Failure Reports**: Detailed report of failed translations
- **Cache Statistics**: Information about cache hits and misses

## 🔧 Advanced Features

### Notes

- The tool automatically handles arrays with dot notation indexing.
- Supports both 2-letter language codes (like `en.json`) and 4-letter locale codes (like `en-US.json`)
- Full backward compatibility with existing 2-letter language codes

### Language-Specific Processing

Each language code on a line for languages.txt. Supports both 2-letter and 4-letter codes:

```bash
# Process specific languages (2-letter codes)
echo "es\nfr\nde" > languages.txt

# Process specific languages (4-letter locale codes)
echo "en-US\nzh-TW\nes-MX" > languages.txt

# Mix both formats
echo "es\nen-US\nzh-TW\nfr-CA" > languages.txt

jta --languages languages.txt
```

#### Supported Language Code Formats

**2-letter codes (ISO 639-1):**

- `es` - Spanish
- `fr` - French
- `de` - German
- `zh` - Chinese
- `ja` - Japanese

**4-letter codes (ISO 639-1 + ISO 3166-1):**

- `en-US` - American English
- `en-GB` - British English
- `zh-TW` - Traditional Chinese (Taiwan)
- `zh-CN` - Simplified Chinese (China)
- `es-MX` - Mexican Spanish
- `es-ES` - European Spanish
- `fr-CA` - Canadian French
- `fr-FR` - French (France)
- `de-DE` - German (Germany)
- `de-AT` - Austrian German

The system automatically recognizes the appropriate language name for translation context.

### Custom System Messages

You can provide custom context for better translation quality:

```bash
# Mobile app UI translations
jta --system "Translate for mobile app UI with friendly, casual tone"

# E-commerce website
jta --system "E-commerce website translations, professional and trustworthy tone"

# Gaming application
jta --system "Gaming app translations, exciting and engaging tone"

# Technical documentation
jta --system "Technical documentation, precise and clear terminology"
```

The system message is prepended to the default translation instructions, allowing you to specify:

- Target audience (users, developers, customers)
- Tone and style (casual, professional, friendly, technical)
- Context (mobile app, website, documentation, gaming)
- Special requirements (brand voice, industry terminology)

## 🚨 Troubleshooting

### Common Issues

1. **API Key Not Found**

   - Ensure `PROVIDER_KEY` is set in environment or `.env` file
   - Ensure `PROVIDER_PROXY_URL` is set to your OpenRouter proxy URL

2. **Rate Limiting**

   - Use `CONSERVATIVE` preset for lower API limits
   - Reduce concurrent processing in performance config

3. **Model Not Supported**

   - Check available models with `jta --help`
   - Ensure you're using a supported model ID

4. **OpenRouter Connection Issues**

   - Verify `PROVIDER_PROXY_URL` is set to `https://openrouter.ai/api/v1`
   - Check network connectivity to OpenRouter endpoint
   - Ensure your OpenRouter API key is valid and has sufficient credits

5. **Language Code Issues**
   - Use 2-letter codes (e.g., `es`, `fr`) for general language support
   - Use 4-letter codes (e.g., `en-US`, `zh-TW`) for locale-specific translations
   - Mix both formats in your `languages.txt` file as needed
   - Unknown language codes will show a warning but still be processed

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0.

## 💼 Support & Hiring

If this project is helpful to you, please help by sharing this tool or hiring me(I need a job) or using our services. [Learn more about me](https://me.orangeredcurve.com/). I, just like you are, need to support a family.

## 🙏 Acknowledgments

- The open-source community for various dependencies
