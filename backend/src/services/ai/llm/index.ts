/**
 * LLM Service - Central module for AI model interactions
 * @module services/ai/llm
 */

import OpenAI from 'openai';

interface LLMCallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  parseJson?: boolean;
  responseProcessor?: (content: string) => any;
}

interface LLMCallParams {
  systemPrompt: string;
  userPrompt: string;
  options?: LLMCallOptions;
}

// 检查API密钥并提供友好错误信息
if (!process.env.OPENAI_API_KEY) {
  console.warn('警告: OPENAI_API_KEY环境变量未设置。请在.env文件中添加您的API密钥。');
}

/**
 * OpenAI client configuration
 * @private
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-initialization',
  baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
});

/**
 * Call LLM with customizable prompts
 * 
 * @async
 * @param {Object} params - Parameters for the LLM call
 * @param {string} params.systemPrompt - Instructions for the AI model
 * @param {string} params.userPrompt - User query or input
 * @param {Object} [params.options={}] - Additional options
 * @param {string} [params.options.model="gpt-4.1-nano"] - Model to use
 * @param {number} [params.options.temperature=0.3] - Randomness of the output (0-1)
 * @param {number} [params.options.maxTokens=250] - Maximum tokens in response
 * @param {boolean} [params.options.parseJson=false] - Whether to parse response as JSON
 * @param {function} [params.options.responseProcessor] - Custom function to process the raw response
 * @returns {Promise<any>} The processed response from the LLM
 * @throws {Error} When API call fails or response processing fails
 */
export async function callLLM({ 
  systemPrompt, 
  userPrompt, 
  options = {} 
}: LLMCallParams): Promise<any> {
  // 在调用时重新检查API密钥
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-initialization') {
    throw new Error('OPENAI_API_KEY未设置。请在.env文件中配置有效的API密钥。');
  }

  const {
    model = "gpt-4.1-nano",
    temperature = 0.3,
    maxTokens = 250,
    parseJson = false,
    responseProcessor = null
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0].message.content?.trim() || '';
    
    // Process the response based on options
    if (responseProcessor && typeof responseProcessor === 'function') {
      return responseProcessor(content);
    } else if (parseJson) {
      return JSON.parse(content);
    } else {
      return content;
    }
  } catch (error) {
    if (error instanceof SyntaxError && parseJson) {
      // JSON parsing error
      throw new Error(`Failed to parse LLM response as JSON: ${error.message}`);
    }
    // Re-throw other errors
    throw error;
  }
} 