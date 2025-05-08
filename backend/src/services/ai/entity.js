/**
 * Crypto entity recognition service
 * Identifies cryptocurrency tokens, addresses, and related terms in text
 */

// Mock data for initial development - will be replaced with real entity recognition
const COMMON_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'MATIC', name: 'Polygon' }
];

/**
 * Recognize crypto entities in text
 * 
 * @param {string} text - Text to analyze for crypto entities
 * @returns {Promise<Array>} Recognized entities with type and position
 */
const recognizeEntities = async (text) => {
  // For MVP: Simple regex pattern matching
  // TODO: Implement more advanced NLP or custom-trained entity recognition
  
  const entities = [];
  
  // Find token symbols in text
  // Look for token symbols as standalone words
  COMMON_TOKENS.forEach(token => {
    const symbolRegex = new RegExp(`\\b${token.symbol}\\b`, 'gi');
    const nameRegex = new RegExp(`\\b${token.name}\\b`, 'gi');
    
    // Find all symbol matches
    let match;
    while ((match = symbolRegex.exec(text)) !== null) {
      entities.push({
        type: 'token',
        subtype: 'symbol',
        value: token.symbol,
        name: token.name,
        position: {
          start: match.index,
          end: match.index + token.symbol.length
        }
      });
    }
    
    // Find all name matches
    while ((match = nameRegex.exec(text)) !== null) {
      entities.push({
        type: 'token',
        subtype: 'name',
        value: token.symbol,
        name: token.name,
        position: {
          start: match.index,
          end: match.index + token.name.length
        }
      });
    }
  });
  
  // Find Ethereum addresses
  const ethAddressRegex = /\b0x[a-fA-F0-9]{40}\b/g;
  
  let addressMatch;
  while ((addressMatch = ethAddressRegex.exec(text)) !== null) {
    entities.push({
      type: 'address',
      subtype: 'ethereum',
      value: addressMatch[0],
      position: {
        start: addressMatch.index,
        end: addressMatch.index + addressMatch[0].length
      }
    });
  }
  
  return entities;
};

module.exports = {
  recognizeEntities
};