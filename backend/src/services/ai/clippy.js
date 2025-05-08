/**
 * Clippy AI Assistant service
 * Generates contextual suggestions based on user behavior and page context
 */

// Mock data for initial development - will be replaced with real LLM integration
const CONTEXT_RULES = [
  {
    // If user is on a DEX page
    condition: (context) => {
      const { pageUrl, pageTitle } = context;
      return (
        pageUrl?.includes('uniswap') || 
        pageUrl?.includes('pancakeswap') ||
        pageTitle?.toLowerCase().includes('swap') ||
        pageTitle?.toLowerCase().includes('exchange')
      );
    },
    suggestions: [
      { 
        command: 'price {token}', 
        description: 'Check current token price',
        requiresParam: true,
        paramSource: 'selectedText'
      },
      { 
        command: 'swap ETH {token}', 
        description: 'Swap ETH for selected token',
        requiresParam: true,
        paramSource: 'selectedText'
      }
    ]
  },
  {
    // If user is looking at wallet page
    condition: (context) => {
      const { pageUrl, pageTitle } = context;
      return (
        pageUrl?.includes('wallet') || 
        pageUrl?.includes('account') ||
        pageTitle?.toLowerCase().includes('wallet') ||
        pageTitle?.toLowerCase().includes('balance')
      );
    },
    suggestions: [
      { 
        command: 'send {token} {address}', 
        description: 'Send tokens to an address',
        requiresParam: false
      },
      { 
        command: 'chart {token}', 
        description: 'View price chart of a token',
        requiresParam: true,
        paramSource: 'selectedText'
      }
    ]
  }
];

/**
 * Generate Clippy suggestions based on context
 * 
 * @param {Object} context - Current user context
 * @param {string} context.pageUrl - Current page URL
 * @param {string} context.pageTitle - Current page title
 * @param {string} context.selectedText - Text selected by user
 * @param {Array} context.recentCommands - Recent commands used by user
 * @returns {Promise<Array>} Suggested actions
 */
const generateClippySuggestions = async (context) => {
  // For MVP: Rule-based suggestions
  // TODO: Implement actual LLM integration for more advanced contextual awareness
  
  const suggestions = [];
  
  // Apply each rule to see if it matches the current context
  CONTEXT_RULES.forEach(rule => {
    if (rule.condition(context)) {
      const ruleSuggestions = rule.suggestions.map(suggestion => {
        // If suggestion requires parameter and we have selected text, use it
        if (suggestion.requiresParam && 
            suggestion.paramSource === 'selectedText' && 
            context.selectedText) {
          
          const command = suggestion.command.replace(
            '{token}', 
            context.selectedText.trim().split(/\s+/)[0] // Use first word as token
          );
          
          return {
            ...suggestion,
            command
          };
        }
        
        return suggestion;
      });
      
      suggestions.push(...ruleSuggestions);
    }
  });
  
  // TODO: In future, use LLM to generate more contextual suggestions
  // This would involve using a similar architecture to the completion service
  // but with prompts designed for context awareness
  
  return suggestions;
};

module.exports = {
  generateClippySuggestions
};