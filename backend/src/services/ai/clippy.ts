/**
 * Clippy-inspired suggestion service
 * Generates contextual suggestions based on user activity
 * @module services/ai/clippy
 */

import { callLLM } from './llm/index.js';

export interface Suggestion {
  title: string;
  description: string;
  action?: string;
  confidence: number;
  type: string;
}

export interface ClippyContext {
  pageUrl?: string;
  pageTitle?: string;
  selectedText?: string;
  recentCommands?: string[];
}

/**
 * Default Clippy options
 */
const DEFAULT_CLIPPY_OPTIONS = {
  maxSuggestions: 3,
  minConfidence: 0.6,
  temperature: 0.3,
  maxTokens: 500
};

/**
 * Generate Clippy-style suggestions based on user context
 * 
 * @async
 * @param {ClippyContext} context - Information about current user context
 * @returns {Promise<Suggestion[]>} Array of suggestions
 */
export const generateClippySuggestions = async (
  context: ClippyContext
): Promise<Suggestion[]> => {
  // Create a system prompt that instructs the model
  const systemPrompt = `You are Clippy, a helpful assistant for Solana and crypto tasks.
Based on the user's current context, generate useful suggestions that could help them.
Focus on actions that relate to cryptocurrency, Solana blockchain, tokens, or trading.
Suggestions should be specific, actionable, and relevant to what the user is currently doing.
Return a JSON array of suggestions with the following format:
[
  {
    "title": "Brief suggestion title",
    "description": "1-2 sentence explanation of the suggestion",
    "action": "Specific action or command the user could take (optional)",
    "confidence": 0.95, // 0.0-1.0 indicating how relevant this suggestion is
    "type": "info|action|warning|tip" // The type of suggestion
  }
]
Each suggestion should be directly relevant to the context provided. 
Return empty array if nothing relevant can be suggested.`;

  // Build context string from available information
  let contextString = '';
  
  if (context.pageUrl) {
    contextString += `Currently viewing URL: ${context.pageUrl}\n`;
  }
  
  if (context.pageTitle) {
    contextString += `Page title: ${context.pageTitle}\n`;
  }
  
  if (context.selectedText) {
    contextString += `Selected text: ${context.selectedText}\n`;
  }
  
  if (context.recentCommands && context.recentCommands.length > 0) {
    contextString += `Recent commands or actions:\n${context.recentCommands.join('\n')}\n`;
  }
  
  if (!contextString) {
    // Not enough context to generate suggestions
    return [];
  }
  
  // User prompt is the context information
  const userPrompt = `Generate helpful crypto-related suggestions based on this context:\n${contextString}`;
  
  try {
    // Call the language model
    const result = await callLLM({
      systemPrompt,
      userPrompt,
      options: {
        parseJson: true,
        temperature: DEFAULT_CLIPPY_OPTIONS.temperature,
        maxTokens: DEFAULT_CLIPPY_OPTIONS.maxTokens
      }
    });
    
    // Validate and filter suggestions
    if (Array.isArray(result)) {
      // Filter out low-confidence suggestions
      const filteredSuggestions = (result as Suggestion[])
        .filter(s => s.confidence >= DEFAULT_CLIPPY_OPTIONS.minConfidence)
        .slice(0, DEFAULT_CLIPPY_OPTIONS.maxSuggestions);
      
      return filteredSuggestions;
    }
    
    // If result is not an array, return empty array
    return [];
  } catch (error) {
    console.error('Error generating Clippy suggestions:', error);
    // If parsing fails, return empty array
    return [];
  }
}; 