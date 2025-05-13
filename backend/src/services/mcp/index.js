/**
 * MCP Client Service - Handles communication with Model Context Protocol servers
 * @module services/mcp
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');

// Cache for connected clients to avoid reconnecting for every request
const clientCache = new Map();

/**
 * Get or create an MCP client with a connection to the specified server
 * 
 * @async
 * @param {string} serverUrl - URL of the MCP server to connect to
 * @returns {Promise<Client>} Connected MCP client
 * @throws {Error} When connection fails
 */
const getClient = async (serverUrl) => {
  // If we already have a connected client for this URL, return it
  if (clientCache.has(serverUrl)) {
    return clientCache.get(serverUrl);
  }
  
  try {
    // Create a new client
    const client = new Client({
      name: 'donut-extension-client',
      version: '1.0.0',
    });
    
    // Create an SSE transport connected to the specified server
    const transport = new SSEClientTransport(new URL(serverUrl));
    
    // Connect the client to the server via the transport
    await client.connect(transport);
    
    // Store the client in the cache
    clientCache.set(serverUrl, client);
    
    console.log(`Connected to MCP server at ${serverUrl}`);
    return client;
  } catch (error) {
    console.error(`Failed to connect to MCP server at ${serverUrl}:`, error);
    throw new Error(`Failed to connect to MCP server: ${error.message}`);
  }
};

/**
 * List all available tools from the MCP server
 * 
 * @async
 * @param {string} serverUrl - URL of the MCP server
 * @returns {Promise<Array>} List of available tools
 */
const listTools = async (serverUrl) => {
  const client = await getClient(serverUrl);
  const tools = await client.listTools();
  return tools;
};

/**
 * Call a tool on the MCP server
 * 
 * @async
 * @param {string} serverUrl - URL of the MCP server
 * @param {string} toolName - Name of the tool to call
 * @param {Object} args - Arguments to pass to the tool
 * @returns {Promise<Object>} Result of the tool call
 */
const callTool = async (serverUrl, toolName, args) => {
  const client = await getClient(serverUrl);
  const result = await client.callTool({
    name: toolName,
    arguments: args
  });
  return result;
};

/**
 * List all available resources from the MCP server
 * 
 * @async
 * @param {string} serverUrl - URL of the MCP server
 * @returns {Promise<Array>} List of available resources
 */
const listResources = async (serverUrl) => {
  const client = await getClient(serverUrl);
  const resources = await client.listResources();
  return resources;
};

/**
 * Read a resource from the MCP server
 * 
 * @async
 * @param {string} serverUrl - URL of the MCP server
 * @param {string} uri - URI of the resource to read
 * @returns {Promise<Object>} Resource data
 */
const readResource = async (serverUrl, uri) => {
  const client = await getClient(serverUrl);
  const resource = await client.readResource({ uri });
  return resource;
};

/**
 * Close all MCP client connections
 * This should be called when shutting down the server
 */
const closeAllConnections = () => {
  for (const [url, client] of clientCache.entries()) {
    try {
      client.close();
      console.log(`Closed connection to MCP server at ${url}`);
    } catch (error) {
      console.error(`Error closing connection to MCP server at ${url}:`, error);
    }
  }
  clientCache.clear();
};

module.exports = {
  getClient,
  listTools,
  callTool,
  listResources,
  readResource,
  closeAllConnections
}; 