import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import {
  DEFAULT_MODEL_NAME,
  PROVIDER_CONFIG,
  SUPPORTED_MODELS,
} from './config.js';

let clients = {};

export function initializeAIClient(model = DEFAULT_MODEL_NAME) {
  if (!SUPPORTED_MODELS[model]) {
    throw new Error(
      `Unsupported model: ${model}. Use --help to see supported models.`
    );
  }

  const modelConfig = SUPPORTED_MODELS[model];
  const provider = modelConfig.provider;
  const providerConfig = PROVIDER_CONFIG[provider];

  if (clients[provider]) {
    return clients[provider];
  }

  try {
    let client;

    switch (provider) {
      case 'openai':
        client = new OpenAI({
          apiKey: process.env.PROVIDER_KEY || process.env.OPENAI_API_KEY,
          baseURL:
            process.env.PROVIDER_PROXY_URL ||
            process.env.OPENAI_BASE_URL ||
            providerConfig.defaultUrl,
          defaultHeaders: {
            'HTTP-Referer': 'jta',
            'X-Title': 'jta',
          },
        });
        break;

      case 'anthropic':
        client = new Anthropic({
          apiKey: process.env.PROVIDER_KEY || process.env.OPENAI_API_KEY,
          baseURL:
            process.env.PROVIDER_PROXY_URL ||
            process.env.OPENAI_BASE_URL ||
            providerConfig.defaultUrl,
        });
        break;

      case 'google':
        client = new GoogleGenerativeAI(
          process.env.PROVIDER_KEY || process.env.OPENAI_API_KEY
        );
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    clients[provider] = client;
    return client;
  } catch (error) {
    console.log(
      `⚠️  ${providerConfig.clientClass} client initialization failed:`,
      error.message
    );
    throw error;
  }
}

export async function checkAIHealth(model = DEFAULT_MODEL_NAME) {
  const client = initializeAIClient(model);
  if (!client) {
    throw new Error(
      'AI client not initialized - check PROVIDER_KEY or OPENAI_API_KEY'
    );
  }

  try {
    const modelConfig = SUPPORTED_MODELS[model];
    console.log(`🔍 Checking ${modelConfig.name} API health...`);

    if (modelConfig.provider === 'openai') {
      const completion = await client.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });

      if (completion.choices[0]?.message?.content) {
        console.log(`✅ ${modelConfig.name} API is working correctly`);
        return true;
      } else {
        throw new Error(`Invalid response from ${modelConfig.name} API`);
      }
    } else if (modelConfig.provider === 'anthropic') {
      const message = await client.messages.create({
        model: model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      if (message.content[0]?.text) {
        console.log(`✅ ${modelConfig.name} API is working correctly`);
        return true;
      } else {
        throw new Error(`Invalid response from ${modelConfig.name} API`);
      }
    } else if (modelConfig.provider === 'google') {
      const genModel = client.getGenerativeModel({ model: model });
      const result = await genModel.generateContent('Hello');
      const response = await result.response;

      if (response.text()) {
        console.log(`✅ ${modelConfig.name} API is working correctly`);
        return true;
      } else {
        throw new Error(`Invalid response from ${modelConfig.name} API`);
      }
    } else {
      console.log(
        `⚠️  Health check not implemented for ${modelConfig.provider} provider`
      );
      return true;
    }
  } catch (error) {
    console.error(
      `❌ ${SUPPORTED_MODELS[model].name} API health check failed:`,
      error.message
    );
    handleHealthCheckError(error, model);
    return false;
  }
}

function handleHealthCheckError(error, model) {
  const modelConfig = SUPPORTED_MODELS[model];

  if (error.message.includes('rate limit')) {
    console.error('💡 Rate limit exceeded. Please wait and try again.');
  } else if (error.message.includes('authentication')) {
    console.error('💡 Authentication failed. Please check your API key.');
  } else if (error.message.includes('network')) {
    console.error('💡 Network error. Please check your internet connection.');
  } else if (
    error.message.includes('baseURL') ||
    error.message.includes('proxy')
  ) {
    console.error(
      '💡 Proxy URL error. Please check your PROVIDER_PROXY_URL or OPENAI_BASE_URL configuration.'
    );
  } else if (error.message.includes('not yet implemented')) {
    console.error(
      `💡 ${modelConfig.name} support is coming soon. Please use OpenAI models for now.`
    );
  }
}

export function getAIClient(model = DEFAULT_MODEL_NAME) {
  return initializeAIClient(model);
}

export function getModelProvider(model = DEFAULT_MODEL_NAME) {
  if (!SUPPORTED_MODELS[model]) {
    throw new Error(`Unsupported model: ${model}`);
  }
  return SUPPORTED_MODELS[model].provider;
}

export function validateModel(model) {
  if (!SUPPORTED_MODELS[model]) {
    throw new Error(`Unsupported model: ${model}`);
  }
  return true;
}
