/**
 * AI-powered command completion service
 * Provides command suggestions based on user input and context
 * @module services/ai/completion
 */

const { callLLM } = require('./llm');
const { commandCompletion } = require('./prompts');

/**
 * Fallback commands when AI is unavailable
 * @private
 */
const COMMON_COMMANDS = [
  { command: 'swap ETH USDC', description: 'Swap ETH for USDC' },
  { command: 'swap USDC ETH', description: 'Swap USDC for ETH' },
  { command: 'price ETH', description: 'Get ETH price' },
  { command: 'price BTC', description: 'Get BTC price' },
  { command: 'chart ETH', description: 'Show ETH price chart' },
  { command: 'send 0.1 ETH 0x123...', description: 'Send 0.1 ETH to address' },
  { command: 'rug check 0x123...', description: 'Check token for rug pull risk' }
];

/**
 * Fallback method using simple pattern matching when AI is unavailable
 * 
 * @private
 * @param {string} input - User input
 * @returns {string} Most relevant command
 */
function fallbackCompletions(input) {
  const matches = COMMON_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(input.toLowerCase())
  );
  
  // Return the first matching command or a default message
  return matches.length > 0 ? matches[0].command : `${input} [command incomplete]`;
}

/**
 * Generate a complete command based on user input and context
 * 
 * @async
 * @param {string} input - User's current input text
 * @param {Array} [history=[]] - Previous commands issued by user
 * @param {Object} [context={}] - Additional context from frontend
 * @param {Array} [context.recentTransactions] - Recent successful transactions
 * @param {Object} [context.walletBalances] - Token balances in user's wallet
 * @param {Array} [context.trendingTokens] - Currently trending tokens
 * @param {string} [context.currentPage] - Page user is currently on
 * @param {Array} [context.favoriteTokens] - User's saved favorite tokens
 * @returns {Promise<string>} A complete command string based on the user's input and context
 */
const generateCompletions = async (input, history = [], context = {}) => {
  try {
    // Use the modular LLM service with prompts from the library
    const result = await callLLM({
      systemPrompt: commandCompletion.system,
      userPrompt: commandCompletion.user(input, history, context),
      options: {
        parseJson: true
      }
    });
    
    // Return just the command string from the first suggestion
    if (Array.isArray(result) && result.length > 0) {
      return result[0].command;
    } else {
      return fallbackCompletions(input);
    }
  } catch (error) {
    console.error("LLM API error:", error);
    return fallbackCompletions(input);
  }
};

module.exports = {
  generateCompletions
};