/**
 * Prompt Library - Collection of prompts for different AI use cases
 * @module services/ai/prompts
 */

/**
 * Command completion prompts
 */
const commandCompletion = {
  /**
   * System prompt for command suggestions
   */
  system: `You are an AI assistant that completes crypto commands based on user input and context.
Generate ONE complete, executable command based on the input and context provided. 
The command should be a full instruction that can be executed without further input.
Only respond with a valid JSON array containing a single object with 'command' and 'description' fields.
Do not provide explanations or markdown formatting, just the JSON array.`,

  /**
   * User prompt template for command suggestions
   * @param {string} input - User's command input
   * @param {Array} history - Command history
   * @param {Object} context - Contextual data
   * @returns {string} Formatted user prompt
   */
  user: (input, history, context) => `Complete this command: "${input}"
        
Context information:
${context.recentTransactions ? `Recent transactions: ${JSON.stringify(context.recentTransactions)}` : ''}
${context.walletBalances ? `Wallet balances: ${JSON.stringify(context.walletBalances)}` : ''}
${context.trendingTokens ? `Trending tokens: ${JSON.stringify(context.trendingTokens)}` : ''}
${context.currentPage ? `Current page: ${context.currentPage}` : ''}
${context.favoriteTokens ? `Favorite tokens: ${JSON.stringify(context.favoriteTokens)}` : ''}

Recent command history: ${JSON.stringify(history)}

I need ONE complete command that the user can run based on the partial input and context provided.
For example, if input is "/swap" and user has ETH and USDC in wallet, you might suggest: "swap 0.1 ETH USDC".
Respond only with an array containing a single command suggestion in JSON format.`
};

/**
 * Entity extraction prompts
 */
const entityExtraction = {
  /**
   * System prompt for entity extraction
   */
  system: `You are an AI assistant that extracts entities from crypto-related text.
Your task is to identify tokens, addresses, amounts, and actions mentioned in the input.
Return your analysis as a JSON object with the identified entities. Only respond with valid JSON.`,

  /**
   * User prompt template for entity extraction
   * @param {string} text - Text to analyze
   * @returns {string} Formatted user prompt
   */
  user: (text) => `Extract all crypto entities from this text: "${text}"

Return a JSON object with these fields:
- tokens: Array of cryptocurrency tokens mentioned (e.g., "ETH", "USDC")
- addresses: Array of blockchain addresses mentioned
- amounts: Array of numerical amounts mentioned with their associated tokens
- actions: Array of actions to perform (swap, send, buy, etc.)

If an entity type is not present in the text, include an empty array for that field.`
};

/**
 * Clippy assistant prompts
 */
const clippyAssistant = {
  /**
   * System prompt for Clippy-style assistant
   */
  system: `You are Crypto Clippy, a helpful assistant for crypto users.
You provide concise, helpful explanations and tips about crypto operations.
Keep your responses brief, friendly, and informative. Focus on being helpful without being annoying.`,

  /**
   * User prompt template for Clippy responses
   * @param {string} userAction - The action user is attempting
   * @param {Object} context - Additional context
   * @returns {string} Formatted user prompt
   */
  user: (userAction, context) => `The user is trying to: ${userAction}

Additional context:
${context.currentPage ? `Current page: ${context.currentPage}` : ''}
${context.walletConnected ? `Wallet connected: ${context.walletConnected}` : ''}
${context.previousActions ? `Recent actions: ${JSON.stringify(context.previousActions)}` : ''}

Provide a short, helpful tip or explanation that would be useful for their current action.
Limit your response to 1-2 sentences unless explaining a complex concept.`
};

module.exports = {
  commandCompletion,
  entityExtraction,
  clippyAssistant
}; 