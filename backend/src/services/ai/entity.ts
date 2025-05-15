/**
 * Crypto Entity Recognition Service
 * Uses AI to identify crypto-related entities in text
 * @module services/ai/entity
 */

import { callLLM } from './llm/index.js';

export interface Entity {
  type: string;
  name: string;
  value: string;
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Recognize crypto-related entities in text
 * 
 * @async
 * @param {string} text - Text to analyze for entities
 * @returns {Promise<Entity[]>} Array of recognized entities
 */
export const recognizeEntities = async (text: string): Promise<Entity[]> => {
  // System prompt that instructs the model how to identify entities
  const systemPrompt = `You are an AI specialized in recognizing crypto-related entities in text.
Identify any tokens, addresses, protocols, or other crypto entities mentioned in the user's input.
Return a JSON array of entities with the following structure:
[
  {
    "type": "token|address|protocol|exchange|wallet|other",
    "name": "recognized name",
    "value": "exact text match",
    "confidence": 0.95,
    "metadata": {} // Optional additional information
  }
]
Ensure high precision - only return entities you're confident about.
The confidence score should reflect your certainty about the entity (0.0-1.0).`;
  
  // User prompt is simply the text to analyze
  const userPrompt = `Text to analyze for crypto entities: ${text}`;
  
  try {
    // Call the language model
    const result = await callLLM({
      systemPrompt,
      userPrompt,
      options: {
        parseJson: true,
        temperature: 0.1,
        maxTokens: 500,
        model: 'gpt-4.1-nano'
      }
    });
    
    // Validate and return the result
    if (Array.isArray(result)) {
      return result as Entity[];
    }
    
    // If result is not an array, return empty array
    return [];
  } catch (error) {
    console.error('Error recognizing entities:', error);
    // If parsing fails, return empty array
    return [];
  }
}; 