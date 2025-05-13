// Simple MCP client test
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');

const serverUrl = 'https://solana-agent-mcp-server.charlesferrell.workers.dev/sse';

async function testMcpConnection() {
  console.log('Creating MCP client...');
  
  try {
    // Create a new client
    const client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });
    
    console.log('Creating SSE transport...');
    // Create an SSE transport connected to the specified server
    const transport = new SSEClientTransport(new URL(serverUrl));
    
    console.log('Connecting to server...');
    // Connect the client to the server via the transport
    await client.connect(transport);
    
    console.log('Successfully connected to MCP server');
    
    // List tools
    console.log('Listing tools...');
    const tools = await client.listTools();
    console.log('Available tools:', JSON.stringify(tools, null, 2));
    
    // Clean up
    client.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testMcpConnection(); 