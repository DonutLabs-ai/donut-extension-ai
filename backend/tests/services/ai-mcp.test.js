/**
 * AI-powered MCP Service Tests
 */
const { processQuery } = require('../../src/services/ai/mcp');
const mcpService = require('../../src/services/mcp');
const { callLLM } = require('../../src/services/ai/llm');

// Mock the MCP service
jest.mock('../../src/services/mcp', () => ({
  listTools: jest.fn().mockResolvedValue([
    {
      name: 'GET_TOKEN_DATA',
      description: 'Get token data from either a token address or ticker symbol',
      parameters: {
        address: { required: false, description: 'Token address' },
        ticker: { required: false, description: 'Token ticker' }
      }
    },
    {
      name: 'FETCH_PRICE',
      description: 'Fetch the current price of a Solana token in USDC',
      parameters: {
        tokenAddress: { required: true, description: 'The mint address of the token' }
      }
    }
  ]),
  callTool: jest.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Mock tool response' }]
  })
}));

// Mock the LLM service
jest.mock('../../src/services/ai/llm', () => ({
  callLLM: jest.fn()
}));

describe('AI MCP Service', () => {
  const testServerUrl = 'https://test.mcp.server/sse';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('processQuery returns success response when tool is found and executed', async () => {
    // Configure the LLM mock to return a tool selection
    callLLM.mockResolvedValue({
      tool: 'GET_TOKEN_DATA',
      arguments: { ticker: 'SOL' },
      confidence: 0.9
    });
    
    const query = 'What is the current data for Solana?';
    const result = await processQuery(query, testServerUrl);
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.tool).toBe('GET_TOKEN_DATA');
    expect(result.arguments).toEqual({ ticker: 'SOL' });
    expect(mcpService.listTools).toHaveBeenCalledWith(testServerUrl);
    expect(mcpService.callTool).toHaveBeenCalledWith(testServerUrl, 'GET_TOKEN_DATA', { ticker: 'SOL' });
  });
  
  test('processQuery returns error when no appropriate tool is found', async () => {
    // Configure the LLM mock to return no tool selection
    callLLM.mockResolvedValue({
      tool: null,
      confidence: 0.2,
      message: 'No matching tool found'
    });
    
    const query = 'An unrelated query that does not match any tool';
    const result = await processQuery(query, testServerUrl);
    
    // Verify the result
    expect(result.success).toBe(false);
    expect(result.message).toBe('No matching tool found');
    expect(mcpService.listTools).toHaveBeenCalledWith(testServerUrl);
    expect(mcpService.callTool).not.toHaveBeenCalled();
  });
  
  test('processQuery handles errors gracefully', async () => {
    // Configure the LLM mock to throw an error
    callLLM.mockRejectedValue(new Error('Test error'));
    
    const query = 'What is the price of Bitcoin?';
    const result = await processQuery(query, testServerUrl);
    
    // Verify the result
    expect(result.success).toBe(false);
    expect(result.message).toContain('Test error');
    expect(mcpService.listTools).toHaveBeenCalledWith(testServerUrl);
  });
}); 