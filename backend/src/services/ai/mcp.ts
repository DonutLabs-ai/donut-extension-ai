/**
 * AI-powered MCP command service
 * Processes natural language input to find and execute appropriate MCP commands
 * @module services/ai/mcp
 */

import { callLLM } from './llm/index.js';
import * as mcpService from '../mcp/index.js';

interface McpTool {
  name: string;
  description?: string;
  parameters?: {
    [key: string]: {
      description?: string;
      required?: boolean;
      [key: string]: any;
    };
  };
}

interface McpToolSelection {
  tool: string | null;
  arguments?: Record<string, any>;
  confidence: number;
  message?: string;
}

interface McpQueryResult {
  success: boolean;
  message?: string;
  tool?: string;
  arguments?: Record<string, any>;
  confidence?: number;
  result?: any;
}

/**
 * Prompt templates for MCP command processing
 * @private
 */
const mcpPrompts = {
  /**
   * System prompt for MCP command selection
   */
  system: `You are an AI assistant that helps users interact with a Solana-focused MCP server.
Your task is to analyze the user's natural language query and determine which MCP tool should be called,
along with the appropriate arguments.

You will be provided with a list of available tools and their parameters.
Respond with a JSON object that specifies which tool to call and what arguments to provide.
Only respond with valid JSON, without any explanation or markdown formatting.`,

  /**
   * User prompt template for MCP command selection
   * @param {string} query - User's natural language query
   * @param {Array} tools - Available MCP tools
   * @returns {string} Formatted user prompt
   */
  user: (query: string, tools: McpTool[]): string => {
    const toolDescriptions = tools.map(tool => {
      const params = tool.parameters || {};
      const paramDescriptions = Object.keys(params).map(param => {
        const details = params[param];
        return `  - ${param}${details.required ? ' (required)' : ''}: ${details.description || 'No description'}`;
      }).join('\n');
      
      return `Tool Name: ${tool.name}
Description: ${tool.description || 'No description'}
Parameters:
${paramDescriptions || '  None'}`;
    }).join('\n\n');
    
    return `User Query: "${query}"

Available MCP Tools:
${toolDescriptions}

Based on the user's natural language query, determine which MCP tool should be called and what arguments to provide.
If the user's query doesn't clearly match any tool, select the most appropriate one or indicate no matching tool was found.

Respond with a JSON object in this format:
{
  "tool": "name_of_tool_to_call",
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  },
  "confidence": 0.8 // From 0 to 1, how confident you are this is the right tool
}

If no tool matches well (confidence < 0.5), respond with:
{
  "tool": null,
  "confidence": 0,
  "message": "No matching tool found. Please try a different query."
}`;
  }
};

/**
 * Process a natural language query and execute the appropriate MCP command
 * 
 * @async
 * @param {string} query - User's natural language query
 * @param {string} serverUrl - URL of the MCP server
 * @returns {Promise<Object>} Result of the MCP command or an error message
 */
export const processQuery = async (query: string, serverUrl: string): Promise<McpQueryResult> => {
  try {
    // Get available tools from the MCP server
    const tools = await mcpService.listTools(serverUrl);
    
    // Use LLM to determine which tool to call
    const result = await callLLM({
      systemPrompt: mcpPrompts.system,
      userPrompt: mcpPrompts.user(query, tools),
      options: {
        parseJson: true,
        temperature: 0.2,
        maxTokens: 500
      }
    }) as McpToolSelection;
    
    // If no tool was selected or confidence is low
    if (!result.tool || result.confidence < 0.5) {
      return {
        success: false,
        message: result.message || 'Unable to determine which command to execute. Please try being more specific.'
      };
    }
    
    // Call the selected tool with the determined arguments
    const toolResult = await mcpService.callTool(serverUrl, result.tool, result.arguments || {});
    
    return {
      success: true,
      tool: result.tool,
      arguments: result.arguments,
      confidence: result.confidence,
      result: toolResult
    };
    
  } catch (error) {
    console.error('Error processing MCP query:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      message: `Error processing your request: ${errorMessage}`
    };
  }
}; 