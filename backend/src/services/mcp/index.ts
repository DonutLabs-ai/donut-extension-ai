/**
 * MCP Client Service - Handles communication with Model Context Protocol servers
 * @module services/mcp
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { McpToolRequest, McpClient } from '../../types/index.js';

// Cache for connected clients to avoid reconnecting for every request
const clientCache = new Map<string, Client>();

/**
 * Get or create an MCP client with a connection to the specified server
 * 
 * @async
 * @param {string} serverUrl - URL of the MCP server to connect to
 * @returns {Promise<Client>} Connected MCP client
 * @throws {Error} When connection fails
 */
export const getClient = async (serverUrl: string): Promise<Client> => {
  // If we already have a connected client for this URL, return it
  if (clientCache.has(serverUrl)) {
    return clientCache.get(serverUrl) as Client;
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to connect to MCP server at ${serverUrl}:`, error);
    throw new Error(`Failed to connect to MCP server: ${errorMessage}`);
  }
};

/**
 * List all available tools from the MCP server
 * 
 * @async
 * @param {string} serverUrl - URL of the MCP server
 * @returns {Promise<Array>} List of available tools
 */
export const listTools = async (serverUrl: string): Promise<any[]> => {
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
export const callTool = async (serverUrl: string, toolName: string, args: Record<string, any>): Promise<any> => {
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
export const listResources = async (serverUrl: string): Promise<any[]> => {
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
export const readResource = async (serverUrl: string, uri: string): Promise<any> => {
  const client = await getClient(serverUrl);
  const resource = await client.readResource({ uri });
  return resource;
};

/**
 * Close all MCP client connections
 * This should be called when shutting down the server
 */
export const closeAllConnections = (): void => {
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