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
 * @param {object} [context] - Additional context (wallet address, trending tokens, balance)
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
  const systemPrompt = `You are an AI assistant for a crypto extension that helps users complete slash commands.
Your task is to generate executable slash commands based on user input.

Available commands:
- /swap [amount] [from-token] [to-token] - Swap tokens (e.g., "/swap 1 sol to usdc")
- /price [token] - Check token price (e.g., "/price sol")
- /balance - View wallet balances
- /send [amount] [token] [to-address] - Send tokens (e.g., "/send 0.1 sol to address")
- /history [period] - View transaction history (e.g., "/history 7d")

Your completion must:
1. Always start with a slash (/)
2. Be fully executable with specific values
3. Be concise and direct
4. Consider user context (wallet balance, trending tokens)
5. Only include the command itself, no explanations

If the user provides partial input, complete it intelligently based on context.`;

  // Create a user prompt that includes input and context
  let userPrompt = `Input: ${input}\n`;
  
  // Add history context if available
  if (history && history.length > 0) {
    userPrompt += `\nRecent command history:\n${history.slice(0, 5).join('\n')}\n`;
  }
  
  // Add additional context if available
  if (context) {
    // Add wallet address if available
    if (context.address) {
      userPrompt += `\nWallet address: ${context.address}`;
    }
    
    // Add user's token balances if available
    if (context.balance && Array.isArray(context.balance)) {
      userPrompt += `\n\nUser balances:`;
      context.balance.forEach((item: any) => {
        // Convert price from string to number for formatting or handle it as string
        const priceDisplay = item.price && item.price !== "0" ? 
          `$${parseFloat(item.price).toFixed(2)}` : 'price unknown';
        userPrompt += `\n- ${item.symbol}: ${item.uiBalance} (${priceDisplay})`;
      });
    }
    
    // Add trending tokens if available
    if (context.trending && Array.isArray(context.trending)) {
      userPrompt += `\n\nTrending tokens:`;
      context.trending.forEach((item: any) => {
        // Convert price from string to number for formatting or handle it as string
        const priceDisplay = item.price && item.price !== "0" ? 
          ` ($${parseFloat(item.price).toFixed(2)})` : '';
        userPrompt += `\n- ${item.symbol}${priceDisplay}`;
      });
    }
  }
  
  userPrompt += '\n\nComplete the command:';
  
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