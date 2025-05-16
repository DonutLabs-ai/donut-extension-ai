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
  thought?: string;
}

interface McpQueryResult {
  success: boolean;
  message?: string;
  tool?: string;
  arguments?: Record<string, any>;
  confidence?: number;
  result?: any;
  steps?: Array<{
    thought?: string;
    action?: string;
    observation?: any;
  }>;
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
  "confidence": 0.8, // From 0 to 1, how confident you are this is the right tool
  "thought": "Your step-by-step reasoning about why you chose this tool and these parameters"
}

If no tool matches well (confidence < 0.5), respond with:
{
  "tool": null,
  "confidence": 0,
  "message": "No matching tool found. Please try a different query.",
  "thought": "Your reasoning about why no tool matches"
}`;
  },

  /**
   * Agent React system prompt for multi-step reasoning
   */
  agentReactSystem: `You are an AI assistant that helps users interact with a Solana-focused MCP server.
Your task is to analyze the user's natural language query and determine a sequence of MCP tool calls needed to answer their question.
You should think step by step, observe results of each tool call, and decide on next actions until you have a complete answer.

Always think about which tool is most appropriate and what parameters to provide.
For tools requiring token information, remember:
- SOL (Solana) token address is "So11111111111111111111111111111111111111112"
- For other tokens, you need to find their exact addresses

Respond with a JSON object in the specified format.`,

  /**
   * Agent React user prompt template
   * @param {string} query - User's natural language query
   * @param {Array} tools - Available MCP tools
   * @param {Array} previousSteps - Previous reasoning steps 
   * @returns {string} Formatted user prompt
   */
  agentReactUser: (query: string, tools: McpTool[], previousSteps: Array<{thought?: string; action?: string; observation?: any}> = []): string => {
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
    
    let previousStepsText = '';
    if (previousSteps.length > 0) {
      previousStepsText = 'Previous steps:\n\n' + previousSteps.map((step, index) => {
        return `Step ${index + 1}:
Thought: ${step.thought || 'No explicit thought'}
Action: ${step.action || 'No action taken'}
Observation: ${JSON.stringify(step.observation) || 'No observation'}
`;
      }).join('\n');
    }
    
    return `User Query: "${query}"

Available MCP Tools:
${toolDescriptions}

${previousStepsText}

Based on the user's query and previous steps (if any), determine your next action.
You may need to make multiple tool calls to fully answer the user's question.

Respond with a JSON object in this format:
{
  "tool": "name_of_tool_to_call",
  "arguments": {
    "param1": "value1", 
    "param2": "value2"
  },
  "confidence": 0.8, // From 0 to 1, how confident you are this is the right tool
  "thought": "Your detailed step-by-step reasoning about what you're trying to accomplish and why you chose this tool"
}

If you believe you have enough information to provide a final answer, or no tool matches well:
{
  "tool": null,
  "confidence": 0,
  "message": "Final answer or explanation to the user's query",
  "thought": "Your reasoning for why you've completed the task or cannot proceed further"
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
    console.log(`Processing query: "${query}"`);
    
    // Get available tools from the MCP server
    const toolsResponse = await mcpService.listTools(serverUrl);
    console.log('Tools response:', JSON.stringify(toolsResponse, null, 2));
    
    // Extract tools array from the result, handling different response structures
    let tools: McpTool[] = [];
    if (toolsResponse && typeof toolsResponse === 'object' && 'tools' in toolsResponse) {
      // Response is in the form { tools: [...] }
      tools = (toolsResponse as { tools: McpTool[] }).tools;
    } else if (Array.isArray(toolsResponse)) {
      // Response is already an array
      tools = toolsResponse;
    } else if (toolsResponse) {
      // Single tool response, wrap in array
      tools = [toolsResponse as McpTool];
    }
    
    console.log(`Found ${tools.length} MCP tools`);
    
    // Use LLM to determine which tool to call
    console.log('Calling LLM to determine tool selection...');
    const llmResponse = await callLLM({
      systemPrompt: mcpPrompts.system,
      userPrompt: mcpPrompts.user(query, tools),
      options: {
        parseJson: true,
        temperature: 0.2,
        maxTokens: 500,
        model: 'gpt-4.1'
      }
    });
    
    console.log('LLM response:', JSON.stringify(llmResponse, null, 2));
    
    const result = llmResponse as McpToolSelection;
    
    // If no tool was selected or confidence is low
    if (!result.tool || result.confidence < 0.5) {
      console.log('No suitable tool found or confidence too low:', result);
      return {
        success: false,
        message: result.message || 'Unable to determine which command to execute. Please try being more specific.'
      };
    }
    
    console.log(`Selected tool: ${result.tool} with confidence: ${result.confidence}`);
    console.log('Tool arguments:', JSON.stringify(result.arguments || {}, null, 2));
    
    // Special case handling for FETCH_PRICE tool to ensure required parameters
    if (result.tool === 'FETCH_PRICE' && (!result.arguments || !result.arguments.tokenAddress)) {
      // Default to SOL token address if querying for SOL price
      if (query.toLowerCase().includes('sol') || query.toLowerCase().includes('solana')) {
        console.log('Detected SOL price query, adding SOL token address');
        result.arguments = {
          ...(result.arguments || {}),
          tokenAddress: 'So11111111111111111111111111111111111111112' // SOL token address
        };
      } else {
        console.log('FETCH_PRICE tool requires tokenAddress parameter');
        return {
          success: false,
          message: 'To fetch a token price, please specify which token you want information about.'
        };
      }
    }
    
    // Call the selected tool with the determined arguments
    console.log(`Calling MCP tool "${result.tool}" with arguments:`, result.arguments);
    const toolResult = await mcpService.callTool(serverUrl, result.tool, result.arguments || {});
    console.log('Tool result:', JSON.stringify(toolResult, null, 2));
    
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

/**
 * Process a query using Agent React methodology (multi-step reasoning)
 * 
 * @async
 * @param {string} query - User's natural language query
 * @param {string} serverUrl - URL of the MCP server
 * @param {number} maxSteps - Maximum number of steps to perform (default: 5)
 * @returns {Promise<McpQueryResult>} Final result with steps taken
 */
export const processQueryWithAgentReact = async (
  query: string, 
  serverUrl: string, 
  maxSteps: number = 5
): Promise<McpQueryResult> => {
  try {
    console.log(`Processing query with Agent React: "${query}"`);
    
    // Get available tools from the MCP server
    const toolsResponse = await mcpService.listTools(serverUrl);
    console.log('Tools response:', JSON.stringify(toolsResponse, null, 2));
    
    // Extract tools array from the result, handling different response structures
    let tools: McpTool[] = [];
    if (toolsResponse && typeof toolsResponse === 'object' && 'tools' in toolsResponse) {
      tools = (toolsResponse as { tools: McpTool[] }).tools;
    } else if (Array.isArray(toolsResponse)) {
      tools = toolsResponse;
    } else if (toolsResponse) {
      tools = [toolsResponse as McpTool];
    }
    
    console.log(`Found ${tools.length} MCP tools`);
    
    // Record reasoning steps
    const steps: Array<{thought?: string; action?: string; observation?: any}> = [];
    let finalResult: McpQueryResult = {
      success: false,
      message: 'No actions were taken.'
    };
    
    // Execute agent loop - Think, Act, Observe
    for (let step = 0; step < maxSteps; step++) {
      console.log(`\n--- Agent React Step ${step + 1} ---`);
      
      // Call LLM to determine next action
      console.log('Calling LLM to determine next action...');
      const llmResponse = await callLLM({
        systemPrompt: mcpPrompts.agentReactSystem,
        userPrompt: mcpPrompts.agentReactUser(query, tools, steps),
        options: {
          parseJson: true,
          temperature: 0.2,
          maxTokens: 1000,
          model: 'gpt-4.1'
        }
      });
      
      console.log('LLM response:', JSON.stringify(llmResponse, null, 2));
      
      const decision = llmResponse as McpToolSelection;
      
      // Record the thought
      const currentStep: {thought?: string; action?: string; observation?: any} = {
        thought: decision.thought
      };
      
      // If AI decides we're done or can't proceed
      if (!decision.tool || decision.confidence < 0.5) {
        console.log('Agent has finished reasoning or cannot proceed further');
        currentStep.action = 'FINISH';
        currentStep.observation = 'Task complete or cannot proceed further';
        steps.push(currentStep);
        
        finalResult = {
          success: true,
          message: decision.message || 'Task complete.',
          steps: steps
        };
        break;
      }
      
      // Prepare to execute the chosen tool
      console.log(`Agent selected tool: ${decision.tool} with confidence: ${decision.confidence}`);
      currentStep.action = `Call tool: ${decision.tool} with args: ${JSON.stringify(decision.arguments || {})}`;
      
      // Special case handling for FETCH_PRICE tool
      if (decision.tool === 'FETCH_PRICE' && (!decision.arguments || !decision.arguments.tokenAddress)) {
        if (query.toLowerCase().includes('sol') || query.toLowerCase().includes('solana')) {
          console.log('Detected SOL price query, adding SOL token address');
          decision.arguments = {
            ...(decision.arguments || {}),
            tokenAddress: 'So11111111111111111111111111111111111111112' // SOL token address
          };
        } else {
          console.log('FETCH_PRICE tool requires tokenAddress parameter');
          currentStep.observation = 'Error: FETCH_PRICE tool requires tokenAddress parameter';
          steps.push(currentStep);
          continue;
        }
      }
      
      try {
        // Execute the chosen tool
        console.log(`Calling MCP tool "${decision.tool}" with arguments:`, decision.arguments);
        const toolResult = await mcpService.callTool(serverUrl, decision.tool, decision.arguments || {});
        console.log('Tool result:', JSON.stringify(toolResult, null, 2));
        
        // Record the observation
        currentStep.observation = toolResult;
        
        // If this is the last step, prepare the final result
        if (step === maxSteps - 1) {
          finalResult = {
            success: true,
            tool: decision.tool,
            arguments: decision.arguments,
            result: toolResult,
            steps: [...steps, currentStep],
            message: 'Reached maximum number of steps. Here is the latest result.'
          };
        }
      } catch (error) {
        console.error(`Error executing tool ${decision.tool}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        currentStep.observation = `Error: ${errorMessage}`;
        
        // If we encounter an error, we still continue the loop to give the agent a chance to recover
      }
      
      // Add this step to our history
      steps.push(currentStep);
    }
    
    // If we didn't assign finalResult during the loop
    if (!finalResult.steps) {
      finalResult.steps = steps;
    }
    
    return finalResult;
    
  } catch (error) {
    console.error('Error in Agent React process:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      message: `Error processing your request: ${errorMessage}`
    };
  }
}; 