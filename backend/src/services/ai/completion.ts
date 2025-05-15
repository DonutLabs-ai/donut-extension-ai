/**
 * AI Command Completion Service
 * @module services/ai/completion
 */

import { callLLM } from './llm/index.js';

// Completion options type
interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Default completion options
const DEFAULT_COMPLETION_OPTIONS: CompletionOptions = {
  temperature: 0.2,
  maxTokens: 150,
  model: 'gpt-4.1-nano'
};

/**
 * Generate AI-powered command completions
 * 
 * @async
 * @param {string} input - User input to complete
 * @param {string[]} [history] - Previous commands for context
 * @param {object} [context] - Additional context (e.g., current directory)
 * @returns {Promise<string>} Generated command completion
 */
export const generateCompletions = async (
  input: string, 
  history?: string[], 
  context?: Record<string, any>, 
  options?: CompletionOptions
): Promise<string> => {
  // Merge default options with provided options
  const completionOptions = { ...DEFAULT_COMPLETION_OPTIONS, ...options };
  
  // Create a system prompt that instructs the model
  const systemPrompt = `You are an AI assistant that suggests command completions for a crypto extension.
Your task is to generate executable slash commands that users can run in the extension.

All commands must follow these rules:
1. Always start with a slash (/) character
2. Be fully executable without vague parameters
3. Be concise and direct (e.g., "/swap 1 eth to sol")
4. Use specific values, not placeholders
5. Avoid explanations or additional text
6. Only return the command itself, nothing else

Example valid completions:
- "/swap 0.5 sol to usdc"
- "/balance"
- "/price sol"
- "/send 0.1 sol to wallet123"
- "/history 7d"`;

  // Create a user prompt that includes input and context
  let userPrompt = `Input: ${input}\n`;
  
  // Add history context if available
  if (history && history.length > 0) {
    userPrompt += `\nRecent command history:\n${history.join('\n')}\n`;
  }
  
  // Add additional context if available
  if (context) {
    userPrompt += '\nAdditional context:\n';
    for (const [key, value] of Object.entries(context)) {
      userPrompt += `${key}: ${value}\n`;
    }
  }
  
  userPrompt += '\nComplete the command (must start with /):';
  
  // Call the language model
  const result = await callLLM({
    systemPrompt,
    userPrompt,
    options: {
      temperature: completionOptions.temperature,
      maxTokens: completionOptions.maxTokens,
      model: completionOptions.model
    }
  });
  
  let command = result as string;
  
  // Ensure the command starts with a slash
  if (!command.startsWith('/')) {
    command = '/' + command.trim();
  }
  
  return command;
}; 