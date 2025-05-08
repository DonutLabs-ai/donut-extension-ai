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
 * @returns {Array} Matched commands
 */
function fallbackCompletions(input) {
  return COMMON_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(input.toLowerCase())
  );
}

/**
 * Generate command completions based on user input and context
 * 
 * @async
 * @param {Object} params - Parameters object
 * @param {string} params.input - User's current input text
 * @param {Array} [params.history=[]] - Previous commands issued by user
 * @param {Object} [params.context={}] - Additional context from frontend
 * @param {Array} [params.context.recentTransactions] - Recent successful transactions
 * @param {Object} [params.context.walletBalances] - Token balances in user's wallet
 * @param {Array} [params.context.trendingTokens] - Currently trending tokens
 * @param {string} [params.context.currentPage] - Page user is currently on
 * @param {Array} [params.context.favoriteTokens] - User's saved favorite tokens
 * @returns {Promise<Array>} Suggested commands array with format [{command: string, description: string}]
 */
const generateCompletions = async ({ input, history = [], context = {} }) => {
  try {
    // Use the modular LLM service with prompts from the library
    return await callLLM({
      systemPrompt: commandCompletion.system,
      userPrompt: commandCompletion.user(input, history, context),
      options: {
        parseJson: true
      }
    });
  } catch (error) {
    console.error("LLM API error:", error);
    return fallbackCompletions(input);
  }
};

module.exports = {
  generateCompletions
};