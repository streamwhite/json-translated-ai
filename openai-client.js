import OpenAI from 'openai';
import { OPENAI_MODEL } from './config.js';

let openai = null;

export function initializeOpenAI() {
  if (!openai) {
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        defaultHeaders: {
          'HTTP-Referer': 'jta',
          'X-Title': 'jta',
        },
      });
    } catch (error) {
      console.log('⚠️  OpenAI client initialization failed:', error.message);
    }
  }
  return openai;
}

export async function checkOpenAIHealth() {
  const client = initializeOpenAI();
  if (!client) {
    throw new Error('OpenAI client not initialized - check OPENAI_API_KEY');
  }

  try {
    console.log('🔍 Checking OpenAI API health...');

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    if (completion.choices[0]?.message?.content) {
      console.log('✅ OpenAI API is working correctly');
      return true;
    } else {
      throw new Error('Invalid response from OpenAI API');
    }
  } catch (error) {
    console.error('❌ OpenAI API health check failed:', error.message);
    handleHealthCheckError(error);
    return false;
  }
}

function handleHealthCheckError(error) {
  if (error.message.includes('rate limit')) {
    console.error('💡 Rate limit exceeded. Please wait and try again.');
  } else if (error.message.includes('authentication')) {
    console.error('💡 Authentication failed. Please check your API key.');
  } else if (error.message.includes('network')) {
    console.error('💡 Network error. Please check your internet connection.');
  } else if (error.message.includes('baseURL')) {
    console.error(
      '💡 Base URL error. Please check your OPENAI_BASE_URL configuration.'
    );
  }
}

export function getOpenAIClient() {
  return initializeOpenAI();
}
