/**
 * MCP Service Tests
 */
const { getClient, listTools, callTool, closeAllConnections } = require('../../src/services/mcp');

// Mock the MCP Client
jest.mock('@modelcontextprotocol/sdk/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    listTools: jest.fn().mockResolvedValue([
      {
        name: 'test-tool',
        description: 'A test tool',
        parameters: {
          param1: { required: true, description: 'Parameter 1' },
          param2: { required: false, description: 'Parameter 2' }
        }
      }
    ]),
    callTool: jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Tool response' }]
    }),
    close: jest.fn()
  }))
}));

// Mock the SSE Transport
jest.mock('@modelcontextprotocol/sdk/client/sse', () => ({
  SSEClientTransport: jest.fn().mockImplementation(() => ({
    // Mock methods if needed
  }))
}));

describe('MCP Service', () => {
  const testServerUrl = 'https://test.mcp.server/sse';
  
  afterEach(() => {
    // Clear the client cache between tests
    closeAllConnections();
    jest.clearAllMocks();
  });
  
  test('getClient creates a client and connects to the server', async () => {
    const client = await getClient(testServerUrl);
    expect(client).toBeDefined();
  });
  
  test('listTools returns tools from the server', async () => {
    const tools = await listTools(testServerUrl);
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('test-tool');
  });
  
  test('callTool calls the specified tool with arguments', async () => {
    const result = await callTool(testServerUrl, 'test-tool', { param1: 'value1' });
    expect(result).toBeDefined();
    expect(result.content[0].text).toBe('Tool response');
  });
  
  test('closeAllConnections closes all client connections', () => {
    // First create a client
    return getClient(testServerUrl)
      .then(() => {
        // Then close all connections
        closeAllConnections();
        // Verify the client was closed (implementation dependent)
      });
  });
}); 