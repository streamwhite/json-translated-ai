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

- **Flexible Key Structures**: Full support for both nested and flattened JSON key structures
- **Custom System Messages**: Provide specific context for better translation quality
- **Parallel Processing**: Multi-language processing with configurable concurrency
- **Fallback Strategy**: Automatic fallback to individual translations if batch processing fails
- **Progress Tracking**: Real-time progress bars and detailed logging for scheduling tasks.
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

# Specify a language file, a lang code(two code) in each line
jta --languages languages.txt

# Use a specific AI model
jta --model anthropic/claude-3-haiku
jta --model google/gemini-2.5-flash

# Use performance preset
jta --preset FAST

# Specify API key and proxy URL directly
jta --key your_openrouter_key --url https://openrouter.ai/api/v1
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
- current two-language-code file(like en.json) is supported.

### Language-Specific Processing

Each lang code a line for languages.txt

```bash
# Process only specific languages
echo "es\nfr" > languages.txt
jta --languages languages.txt
```

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0.

## 💼 Support & Hiring

If this project is helpful to you, please help by sharing this tool or hiring me or using our service. [Learn more about me](https://me.orangeredcurve.com/). I, just like you are, need to support a family.

## 🙏 Acknowledgments

- The open-source community for various dependencies
